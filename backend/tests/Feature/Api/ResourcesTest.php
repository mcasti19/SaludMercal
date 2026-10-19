<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\MedicalLeave;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ResourcesTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_crud_normalizes_national_id(): void
    {
        $this->actingAsRole(UserRole::Receptionist);
        $department = Department::factory()->create();

        $this->postJson('/api/v1/patients', [
            'national_id' => 'v12345678',
            'first_name' => 'Ana',
            'last_name' => 'Pérez',
            'birth_date' => '1990-05-10',
            'department_id' => $department->id,
        ])->assertCreated()->assertJsonPath('data.national_id', 'V-12345678');

        $this->postJson('/api/v1/patients', [
            'national_id' => 'V-12345678', 'first_name' => 'X', 'last_name' => 'Y', 'birth_date' => '1990-01-01',
        ])->assertUnprocessable()->assertJsonValidationErrors('national_id');
    }

    public function test_employees_cannot_list_patients_or_manage_doctors(): void
    {
        $this->actingAsRole(UserRole::Employee);

        $this->getJson('/api/v1/patients')->assertForbidden();
        $this->postJson('/api/v1/doctors', [])->assertForbidden();
        $this->getJson('/api/v1/doctors')->assertOk();
    }

    public function test_admin_creates_doctor_with_schedules(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $specialty = Specialty::factory()->create();

        $this->postJson('/api/v1/doctors', [
            'specialty_id' => $specialty->id,
            'first_name' => 'Carlos',
            'last_name' => 'Rodríguez',
            'schedules' => [
                ['day_of_week' => 1, 'start_time' => '08:00', 'end_time' => '12:00'],
                ['day_of_week' => 3, 'start_time' => '08:00', 'end_time' => '12:00'],
            ],
        ])->assertCreated()->assertJsonCount(2, 'data.schedules');
    }

    public function test_catalog_in_use_cannot_be_deleted(): void
    {
        $this->actingAsRole(UserRole::SuperAdmin);
        $specialty = Specialty::factory()->create();
        Doctor::factory()->create(['specialty_id' => $specialty->id]);

        $this->deleteJson("/api/v1/specialties/{$specialty->id}")->assertStatus(409);
    }

    public function test_only_admin_manages_users_and_deactivation_revokes_tokens(): void
    {
        $this->actingAsRole(UserRole::Receptionist);
        $this->getJson('/api/v1/users')->assertForbidden();

        $admin = $this->actingAsRole(UserRole::Admin);
        $target = User::factory()->create(['location_id' => $admin->location_id]);
        $target->createToken('spa-token');

        $this->patchJson("/api/v1/users/{$target->id}", ['is_active' => false])->assertOk();
        $this->assertSame(0, $target->tokens()->count());

        $this->deleteJson("/api/v1/users/{$admin->id}")->assertForbidden();
    }

    public function test_user_resource_never_exposes_password(): void
    {
        $this->actingAsRole(UserRole::Admin);

        $response = $this->getJson('/api/v1/users')->assertOk();

        $this->assertStringNotContainsString('"password"', json_encode($response->json()));
    }

    public function test_changes_are_audited_without_secrets(): void
    {
        $this->actingAsRole(UserRole::Admin);

        $this->postJson('/api/v1/users', [
            'name' => 'New User', 'username' => 'newuser', 'email' => 'new@mercal.gob.ve',
            'role' => 'nurse', 'password' => 'Password123*',
        ])->assertCreated();

        $log = AuditLog::where('auditable_type', User::class)->where('event', 'created')->latest('id')->first();

        $this->assertNotNull($log);
        $this->assertArrayNotHasKey('password', $log->new_values);
        $this->getJson('/api/v1/audit-logs')->assertOk();
    }

    public function test_medical_leave_flow(): void
    {
        Storage::fake('local');
        $employee = $this->actingAsRole(UserRole::Employee);
        Patient::factory()->create(['user_id' => $employee->id]);

        $id = $this->post('/api/v1/medical-leaves', [
            'type' => 'illness',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-05',
            'diagnosis' => 'Flu',
            'attachment' => UploadedFile::fake()->create('note.pdf', 100, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.days', 5)
            ->json('data.id');

        // Employees cannot review their own request.
        $this->postJson("/api/v1/medical-leaves/{$id}/review", ['status' => 'approved'])->assertForbidden();

        $this->actingAsRole(UserRole::Doctor);
        $this->postJson("/api/v1/medical-leaves/{$id}/review", ['status' => 'approved', 'review_notes' => 'OK'])
            ->assertOk()->assertJsonPath('data.status', 'approved');
        $this->postJson("/api/v1/medical-leaves/{$id}/review", ['status' => 'rejected'])->assertStatus(409);
    }

    public function test_employee_cannot_see_other_leaves(): void
    {
        $this->actingAsRole(UserRole::Employee);
        $leave = MedicalLeave::factory()->create();

        $this->getJson("/api/v1/medical-leaves/{$leave->id}")->assertForbidden();
        $this->getJson('/api/v1/medical-leaves')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_report_summary_for_staff_only(): void
    {
        $this->actingAsRole(UserRole::Employee);
        $this->getJson('/api/v1/reports/summary')->assertForbidden();

        $this->actingAsRole(UserRole::Admin);
        $this->getJson('/api/v1/reports/summary')->assertOk()->assertJsonStructure(['data' => ['appointments' => ['total', 'by_status'], 'patients']]);
    }

    public function test_unknown_resource_returns_clean_404(): void
    {
        $this->actingAsRole(UserRole::Admin);

        $this->getJson('/api/v1/patients/999')->assertNotFound()->assertExactJson(['message' => 'Resource not found.']);
    }

    public function test_patient_show_returns_appointments_and_medical_leaves_history(): void
    {
        $this->actingAsRole(UserRole::Receptionist);
        $patient = Patient::factory()->create();

        $response = $this->getJson("/api/v1/patients/{$patient->id}");
        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'national_id',
                    'first_name',
                    'last_name',
                    'appointments',
                    'medical_leaves',
                ],
            ]);
    }

    public function test_locations_catalog_supports_national_states_and_headquarters(): void
    {
        $this->actingAsRole(UserRole::SuperAdmin);

        $response = $this->postJson('/api/v1/locations', [
            'name' => 'Sede Central Mercal',
            'code' => 'HQ-TEST',
            'state' => 'Distrito Capital',
            'is_headquarters' => true,
            'phone' => '0212-1234567',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.is_headquarters', true)
            ->assertJsonPath('data.state', 'Distrito Capital');
    }
}

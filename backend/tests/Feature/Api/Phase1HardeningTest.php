<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Doctor;
use App\Models\Location;
use App\Models\MedicalLeave;
use App\Models\Patient;
use App\Models\PatientBeneficiary;
use App\Models\Specialty;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Regression tests for the territorial-isolation and reporting fixes (diagnosis phase 1). */
class Phase1HardeningTest extends TestCase
{
    use RefreshDatabase;

    private function staff(UserRole $role, ?Location $location): User
    {
        $user = User::factory()->role($role)->create(['location_id' => $location?->id]);
        Sanctum::actingAs($user, [$role->value]);

        return $user;
    }

    public function test_sede_admin_cannot_write_national_catalogs(): void
    {
        $sedeA = Location::factory()->create();
        $sedeB = Location::factory()->create();
        $specialty = Specialty::factory()->create();

        $this->staff(UserRole::Admin, $sedeA);

        $this->deleteJson("/api/v1/locations/{$sedeB->id}")->assertForbidden();
        $this->putJson("/api/v1/specialties/{$specialty->id}", ['name' => 'Hacked'])->assertForbidden();
        $this->getJson('/api/v1/locations')->assertOk();
    }

    public function test_audit_logs_are_scoped_by_sede_and_open_to_logical_security_for_iam_only(): void
    {
        $sedeA = Location::factory()->create();
        $sedeB = Location::factory()->create();
        $patientA = Patient::factory()->create(['location_id' => $sedeA->id]);
        $patientB = Patient::factory()->create(['location_id' => $sedeB->id]);

        $this->staff(UserRole::Admin, $sedeA);
        $ids = collect($this->getJson('/api/v1/audit-logs?per_page=100')->assertOk()->json('data'))
            ->where('auditable_type', 'Patient')->pluck('auditable_id');

        $this->assertTrue($ids->contains($patientA->id));
        $this->assertFalse($ids->contains($patientB->id));

        $this->staff(UserRole::LogicalSecurity, null);
        $types = collect($this->getJson('/api/v1/audit-logs?per_page=100')->assertOk()->json('data'))
            ->pluck('auditable_type')->unique()->values()->all();

        $this->assertSame(['User'], $types);
        $this->assertGreaterThan(0, AuditLog::where('auditable_type', Patient::class)->count());
    }

    public function test_staff_without_sede_sees_nothing_and_cannot_manage_records(): void
    {
        $sede = Location::factory()->create();
        $patient = Patient::factory()->create(['location_id' => $sede->id]);

        $this->staff(UserRole::Admin, null);

        $this->getJson('/api/v1/patients')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/patients/{$patient->id}")->assertNotFound();
        $this->getJson('/api/v1/users')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_territorial_staff_users_require_a_sede(): void
    {
        $this->staff(UserRole::SuperAdmin, null);

        $payload = ['name' => 'Rec', 'username' => 'rec.test', 'email' => 'rec@mercal.gob.ve', 'role' => 'receptionist', 'password' => 'Password123*'];

        $this->postJson('/api/v1/users', $payload)->assertUnprocessable()->assertJsonValidationErrors('location_id');
        $this->postJson('/api/v1/users', $payload + ['location_id' => Location::factory()->create()->id])->assertCreated();
    }

    public function test_employee_cannot_book_with_another_patients_beneficiary(): void
    {
        $doctor = Doctor::factory()->withWeekdaySchedule()->create();
        $employee = User::factory()->create();
        $own = Patient::factory()->create(['user_id' => $employee->id]);
        $other = Patient::factory()->create();
        $foreign = PatientBeneficiary::create(['patient_id' => $other->id, 'first_name' => 'Ajeno', 'last_name' => 'X', 'relationship' => 'hijo']);
        $mine = PatientBeneficiary::create(['patient_id' => $own->id, 'first_name' => 'Propio', 'last_name' => 'Y', 'relationship' => 'hijo']);
        Sanctum::actingAs($employee, ['employee']);

        $base = ['doctor_id' => $doctor->id, 'scheduled_date' => $this->nextMonday()->toDateString(), 'reason' => 'Control'];

        $this->postJson('/api/v1/appointments', $base + ['start_time' => '09:00', 'beneficiary_id' => $foreign->id])
            ->assertUnprocessable()->assertJsonValidationErrors('beneficiary_id');

        $this->postJson('/api/v1/appointments', $base + ['start_time' => '09:00', 'beneficiary_id' => $mine->id])
            ->assertCreated()->assertJsonPath('data.beneficiary.first_name', 'Propio');
    }

    public function test_employee_booking_keeps_the_sedes_of_the_doctor(): void
    {
        $caracas = Location::factory()->create();
        $zulia = Location::factory()->create();
        $doctor = Doctor::factory()->withWeekdaySchedule()->create(['location_id' => $caracas->id]);
        $employee = User::factory()->create(['location_id' => $zulia->id]);
        Patient::factory()->create(['user_id' => $employee->id, 'location_id' => $zulia->id]);
        Sanctum::actingAs($employee, ['employee']);

        $this->postJson('/api/v1/appointments', [
            'doctor_id' => $doctor->id, 'scheduled_date' => $this->nextMonday()->toDateString(),
            'start_time' => '09:00', 'reason' => 'Control',
        ])->assertCreated()->assertJsonPath('data.location_id', $caracas->id);

        $this->staff(UserRole::Receptionist, $caracas);
        $this->getJson('/api/v1/appointments')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_application_timezone_is_caracas(): void
    {
        $this->assertSame('America/Caracas', config('app.timezone'));
    }

    public function test_csv_export_works_and_neutralises_formulas(): void
    {
        $sede = Location::factory()->create();
        $admin = $this->staff(UserRole::Admin, $sede);
        $doctor = Doctor::factory()->create(['location_id' => $sede->id]);
        $patient = Patient::factory()->create(['location_id' => $sede->id]);
        $date = CarbonImmutable::today();

        Appointment::factory()->create([
            'doctor_id' => $doctor->id, 'patient_id' => $patient->id, 'specialty_id' => $doctor->specialty_id,
            'location_id' => $sede->id, 'scheduled_date' => $date, 'reason' => '=HYPERLINK("http://x")',
        ]);
        MedicalLeave::factory()->create(['patient_id' => $patient->id, 'location_id' => $sede->id, 'start_date' => $date, 'end_date' => $date, 'diagnosis' => '+cmd']);

        $csv = $this->get('/api/v1/reports/export?format=csv&date_from='.$date->toDateString().'&date_to='.$date->toDateString())
            ->assertOk()->streamedContent();

        $this->assertStringContainsString("'=HYPERLINK", $csv);
        $this->assertStringContainsString("'+cmd", $csv);
        $this->assertStringContainsString($patient->national_id, $csv);
        $this->assertNotNull($admin);
    }
}

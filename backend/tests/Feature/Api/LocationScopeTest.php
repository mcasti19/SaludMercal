<?php

namespace Tests\Feature\Api;

use App\Enums\Gender;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Location;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LocationScopeTest extends TestCase
{
    use RefreshDatabase;

    private Location $hqLocation;
    private Location $zuliaLocation;
    private Department $department;
    private Specialty $specialty;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hqLocation = Location::factory()->create([
            'name' => 'Sede Central (Torre Caracas)',
            'code' => 'HQ-CARACAS',
            'state' => 'Distrito Capital',
            'is_headquarters' => true,
        ]);

        $this->zuliaLocation = Location::factory()->create([
            'name' => 'Sede Regional Zulia',
            'code' => 'MED-ZUL',
            'state' => 'Zulia',
            'is_headquarters' => false,
        ]);

        $this->department = Department::factory()->create();
        $this->specialty = Specialty::factory()->create();
    }

    public function test_staff_at_sede_central_only_sees_sede_central_patients(): void
    {
        $patientHq = Patient::factory()->create([
            'first_name' => 'Caracas',
            'last_name' => 'Paciente',
            'location_id' => $this->hqLocation->id,
            'department_id' => $this->department->id,
        ]);

        $patientZulia = Patient::factory()->create([
            'first_name' => 'Maracaibo',
            'last_name' => 'Paciente',
            'location_id' => $this->zuliaLocation->id,
            'department_id' => $this->department->id,
        ]);

        // 1. Receptionist at Sede Central
        $hqReceptionist = User::factory()->create([
            'role' => UserRole::Receptionist,
            'location_id' => $this->hqLocation->id,
        ]);
        Sanctum::actingAs($hqReceptionist, [UserRole::Receptionist->value]);

        $response = $this->getJson('/api/v1/patients');
        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $patientHq->id);

        // Cannot view detail of patient from Zulia
        $this->getJson("/api/v1/patients/{$patientZulia->id}")->assertNotFound();
    }

    public function test_staff_cannot_update_or_delete_patient_from_another_location(): void
    {
        $patientZulia = Patient::factory()->create([
            'location_id' => $this->zuliaLocation->id,
            'department_id' => $this->department->id,
        ]);

        $hqAdmin = User::factory()->create([
            'role' => UserRole::Admin,
            'location_id' => $this->hqLocation->id,
        ]);
        Sanctum::actingAs($hqAdmin, [UserRole::Admin->value]);

        // Attempting to update a patient of another location is blocked
        $this->putJson("/api/v1/patients/{$patientZulia->id}", [
            'first_name' => 'Hacked',
            'last_name' => 'Name',
            'national_id' => $patientZulia->national_id,
            'birth_date' => '1990-01-01',
        ])->assertNotFound();

        // Attempting to delete a patient of another location is blocked
        $this->deleteJson("/api/v1/patients/{$patientZulia->id}")->assertNotFound();
    }

    public function test_superadmin_has_national_visibility_across_all_sedes(): void
    {
        $patientHq = Patient::factory()->create([
            'location_id' => $this->hqLocation->id,
            'department_id' => $this->department->id,
        ]);

        $patientZulia = Patient::factory()->create([
            'location_id' => $this->zuliaLocation->id,
            'department_id' => $this->department->id,
        ]);

        $superAdmin = User::factory()->create([
            'role' => UserRole::SuperAdmin,
            'location_id' => $this->hqLocation->id,
        ]);
        Sanctum::actingAs($superAdmin, [UserRole::SuperAdmin->value]);

        $response = $this->getJson('/api/v1/patients');
        $response->assertOk()->assertJsonCount(2, 'data');

        // Can access individual patients across all states
        $this->getJson("/api/v1/patients/{$patientHq->id}")->assertOk();
        $this->getJson("/api/v1/patients/{$patientZulia->id}")->assertOk();
    }

    public function test_new_record_created_by_staff_enforces_user_location(): void
    {
        $zuliaReceptionist = User::factory()->create([
            'role' => UserRole::Receptionist,
            'location_id' => $this->zuliaLocation->id,
        ]);
        Sanctum::actingAs($zuliaReceptionist, [UserRole::Receptionist->value]);

        // Even if payload attempts to specify HQ location, system forces user's location
        $response = $this->postJson('/api/v1/patients', [
            'national_id' => 'V-25123456',
            'first_name' => 'Ana',
            'last_name' => 'Urdaneta',
            'birth_date' => '1995-04-10',
            'department_id' => $this->department->id,
            'location_id' => $this->hqLocation->id,
        ]);

        $response->assertCreated();
        $createdId = $response->json('data.id');

        $createdPatient = Patient::withoutGlobalScopes()->find($createdId);
        $this->assertEquals($this->zuliaLocation->id, $createdPatient->location_id);
    }

    public function test_appointments_are_strictly_isolated_between_sedes(): void
    {
        $docHq = Doctor::factory()->create([
            'location_id' => $this->hqLocation->id,
            'specialty_id' => $this->specialty->id,
        ]);
        $docZulia = Doctor::factory()->create([
            'location_id' => $this->zuliaLocation->id,
            'specialty_id' => $this->specialty->id,
        ]);

        $patHq = Patient::factory()->create(['location_id' => $this->hqLocation->id]);
        $patZulia = Patient::factory()->create(['location_id' => $this->zuliaLocation->id]);

        $aptHq = Appointment::factory()->create([
            'doctor_id' => $docHq->id,
            'patient_id' => $patHq->id,
            'specialty_id' => $this->specialty->id,
            'location_id' => $this->hqLocation->id,
        ]);

        $aptZulia = Appointment::factory()->create([
            'doctor_id' => $docZulia->id,
            'patient_id' => $patZulia->id,
            'specialty_id' => $this->specialty->id,
            'location_id' => $this->zuliaLocation->id,
        ]);

        // Receptionist at Sede Central
        $hqStaff = User::factory()->create([
            'role' => UserRole::Receptionist,
            'location_id' => $this->hqLocation->id,
        ]);
        Sanctum::actingAs($hqStaff, [UserRole::Receptionist->value]);

        $response = $this->getJson('/api/v1/appointments');
        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $aptHq->id);

        // Cannot view Zulia appointment
        $this->getJson("/api/v1/appointments/{$aptZulia->id}")->assertNotFound();
    }
}

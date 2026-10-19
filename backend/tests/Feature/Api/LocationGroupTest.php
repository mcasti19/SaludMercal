<?php

namespace Tests\Feature\Api;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Location;
use App\Models\MedicalLeave;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Sede groups (Sede Central + Capital + Vargas) and service commissions (comisión de servicio). */
class LocationGroupTest extends TestCase
{
    use RefreshDatabase;

    private Location $central;

    private Location $capital;

    private Location $vargas;

    private Location $zulia;

    private Location $lara;

    protected function setUp(): void
    {
        parent::setUp();

        $this->central = Location::factory()->create(['location_group' => 'caracas']);
        $this->capital = Location::factory()->create(['location_group' => 'caracas']);
        $this->vargas = Location::factory()->create(['location_group' => 'caracas']);
        $this->zulia = Location::factory()->create();
        $this->lara = Location::factory()->create();
    }

    private function actAs(UserRole $role, Location $location): User
    {
        $user = User::factory()->role($role)->create(['location_id' => $location->id]);
        Sanctum::actingAs($user, [$role->value]);

        return $user;
    }

    private function ids(string $uri): array
    {
        return collect($this->getJson($uri)->assertOk()->json('data'))->pluck('id')->all();
    }

    public function test_group_sedes_share_patients_doctors_and_staff_but_other_states_do_not(): void
    {
        $central = Patient::factory()->create(['location_id' => $this->central->id]);
        $vargas = Patient::factory()->create(['location_id' => $this->vargas->id]);
        $zulia = Patient::factory()->create(['location_id' => $this->zulia->id]);
        $doctor = Doctor::factory()->create(['location_id' => $this->central->id]);

        $this->actAs(UserRole::Receptionist, $this->capital);

        $ids = $this->ids('/api/v1/patients');
        $this->assertEqualsCanonicalizing([$central->id, $vargas->id], $ids);
        $this->assertNotContains($zulia->id, $ids);
        $this->assertContains($doctor->id, $this->ids('/api/v1/doctors'));
        $this->getJson("/api/v1/patients/{$zulia->id}")->assertNotFound();

        $this->getJson("/api/v1/patients/{$central->id}")->assertOk()->assertJsonPath('data.is_visiting', false);
    }

    public function test_group_admin_manages_users_of_the_group_only(): void
    {
        $admin = $this->actAs(UserRole::Admin, $this->central);
        $capitalUser = User::factory()->role(UserRole::Nurse)->create(['location_id' => $this->capital->id]);
        $zuliaUser = User::factory()->role(UserRole::Nurse)->create(['location_id' => $this->zulia->id]);

        $ids = $this->ids('/api/v1/users?per_page=100');
        $this->assertContains($capitalUser->id, $ids);
        $this->assertNotContains($zuliaUser->id, $ids);

        $this->patchJson("/api/v1/users/{$capitalUser->id}", ['is_active' => false])->assertOk();
        $this->patchJson("/api/v1/users/{$zuliaUser->id}", ['is_active' => false])->assertForbidden();
        $this->assertNotNull($admin);
    }

    public function test_employee_of_one_group_sede_books_in_another_and_both_sedes_see_it(): void
    {
        $doctor = Doctor::factory()->withWeekdaySchedule()->create(['location_id' => $this->capital->id]);
        $employee = User::factory()->create(['location_id' => $this->central->id]);
        $patient = Patient::factory()->create(['user_id' => $employee->id, 'location_id' => $this->central->id]);
        Sanctum::actingAs($employee, ['employee']);

        $this->postJson('/api/v1/appointments', [
            'doctor_id' => $doctor->id, 'scheduled_date' => $this->nextMonday()->toDateString(),
            'start_time' => '09:00', 'reason' => 'Control',
        ])->assertCreated()->assertJsonPath('data.location_id', $this->capital->id);

        foreach ([$this->capital, $this->central, $this->vargas] as $sede) {
            $this->actAs(UserRole::Receptionist, $sede);
            $this->assertCount(1, $this->ids('/api/v1/appointments'), "sede {$sede->id}");
        }

        $this->actAs(UserRole::Receptionist, $this->zulia);
        $this->assertCount(0, $this->ids('/api/v1/appointments'));
        $this->assertNotNull($patient);
    }

    public function test_commission_is_registered_by_destination_reception_and_gives_basic_access(): void
    {
        $patient = Patient::factory()->create(['location_id' => $this->central->id]);
        MedicalLeave::factory()->create(['patient_id' => $patient->id, 'location_id' => $this->central->id]);

        $this->actAs(UserRole::Receptionist, $this->zulia);
        $this->getJson("/api/v1/patients/{$patient->id}")->assertNotFound();

        $this->postJson('/api/v1/service-commissions', ['national_id' => $patient->national_id, 'reason' => 'Inspección de almacenes'])
            ->assertCreated()
            ->assertJsonPath('data.origin_location.id', $this->central->id)
            ->assertJsonPath('data.destination_location.id', $this->zulia->id);

        // Basic data only: visible, flagged as visiting, no origin clinical records, not editable
        $this->getJson("/api/v1/patients/{$patient->id}")->assertOk()
            ->assertJsonPath('data.is_visiting', true)
            ->assertJsonPath('data.location_id', $this->central->id)
            ->assertJsonCount(0, 'data.medical_leaves');
        $this->putJson("/api/v1/patients/{$patient->id}", ['first_name' => 'Cambiado'])->assertForbidden();
        $this->assertCount(0, $this->ids('/api/v1/medical-leaves'));

        // ...but they can be attended (booked) in the destination sede
        $doctor = Doctor::factory()->withWeekdaySchedule()->create(['location_id' => $this->zulia->id]);
        $this->postJson('/api/v1/appointments', [
            'patient_id' => $patient->id, 'doctor_id' => $doctor->id,
            'scheduled_date' => $this->nextMonday()->toDateString(), 'start_time' => '09:00', 'reason' => 'Consulta en comisión',
        ])->assertCreated();
    }

    public function test_origin_sede_sees_what_happened_elsewhere_and_destination_counts_it_as_other_sede(): void
    {
        $patient = Patient::factory()->create(['location_id' => $this->central->id]);
        $doctor = Doctor::factory()->create(['location_id' => $this->zulia->id]);
        $apt = Appointment::factory()->create([
            'patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'specialty_id' => $doctor->specialty_id,
            'location_id' => $this->zulia->id, 'status' => AppointmentStatus::Completed, 'scheduled_date' => today(),
        ]);

        $this->actAs(UserRole::Receptionist, $this->capital); // same group as the origin
        $this->assertContains($apt->id, $this->ids('/api/v1/appointments'));

        $this->actAs(UserRole::Admin, $this->zulia);
        $summary = $this->getJson('/api/v1/reports/summary')->assertOk()->json('data');
        $this->assertSame(1, $summary['appointments']['from_other_sedes']['total']);
        $this->assertSame($this->central->id, $summary['appointments']['from_other_sedes']['by_origin'][0]['id']);
        $this->assertSame(0, $summary['patients']['total']); // visiting patients are not "own" patients

        // The destination sees the patient (basic data) through the appointment even without a commission
        $this->getJson("/api/v1/patients/{$patient->id}")->assertOk()->assertJsonPath('data.is_visiting', true);
    }

    public function test_commission_rules_and_ending(): void
    {
        $patient = Patient::factory()->create(['location_id' => $this->central->id]);

        $this->actAs(UserRole::Doctor, $this->zulia);
        $this->postJson('/api/v1/service-commissions', ['national_id' => $patient->national_id])->assertForbidden();

        $this->actAs(UserRole::Receptionist, $this->capital);
        $this->postJson('/api/v1/service-commissions', ['national_id' => $patient->national_id])->assertUnprocessable();

        $this->actAs(UserRole::Receptionist, $this->zulia);
        $this->postJson('/api/v1/service-commissions', ['national_id' => 'V-99999999'])->assertNotFound();
        $id = $this->postJson('/api/v1/service-commissions', ['national_id' => strtolower(str_replace('-', '', $patient->national_id))])
            ->assertCreated()->json('data.id');
        $this->postJson('/api/v1/service-commissions', ['national_id' => $patient->national_id])->assertOk()->assertJsonPath('data.id', $id);

        // A different, unrelated sede cannot close it
        $this->actAs(UserRole::Receptionist, $this->lara);
        $this->postJson("/api/v1/service-commissions/{$id}/end")->assertNotFound();

        $this->actAs(UserRole::Receptionist, $this->zulia);
        $this->postJson("/api/v1/service-commissions/{$id}/end")->assertOk();
        $this->getJson("/api/v1/patients/{$patient->id}")->assertNotFound();
    }
}

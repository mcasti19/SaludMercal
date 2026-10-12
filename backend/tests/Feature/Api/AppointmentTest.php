<?php

namespace Tests\Feature\Api;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\DoctorTimeOff;
use App\Models\Patient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    private function payload(Doctor $doctor, ?Patient $patient = null, string $time = '09:00'): array
    {
        return array_filter([
            'patient_id' => $patient?->id,
            'doctor_id' => $doctor->id,
            'scheduled_date' => $this->nextMonday()->toDateString(),
            'start_time' => $time,
            'reason' => 'General checkup',
        ]);
    }

    public function test_receptionist_can_book_and_history_is_recorded(): void
    {
        $this->actingAsRole(UserRole::Receptionist);
        $doctor = Doctor::factory()->withWeekdaySchedule()->create();
        $patient = Patient::factory()->create();

        $this->postJson('/api/v1/appointments', $this->payload($doctor, $patient))
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.start_time', '09:00')
            ->assertJsonPath('data.end_time', '09:30')
            ->assertJsonCount(1, 'data.history');

        $this->assertDatabaseHas('appointments', ['doctor_id' => $doctor->id, 'specialty_id' => $doctor->specialty_id]);
    }

    public function test_double_booking_the_same_slot_is_rejected(): void
    {
        $this->actingAsRole(UserRole::Receptionist);
        $doctor = Doctor::factory()->withWeekdaySchedule()->create();
        [$a, $b] = Patient::factory(2)->create();

        $this->postJson('/api/v1/appointments', $this->payload($doctor, $a))->assertCreated();
        $this->postJson('/api/v1/appointments', $this->payload($doctor, $b))->assertStatus(409);

        $this->assertDatabaseCount('appointments', 1);
    }

    public function test_cancelled_slot_can_be_booked_again(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $doctor = Doctor::factory()->withWeekdaySchedule()->create();
        [$a, $b] = Patient::factory(2)->create();

        $id = $this->postJson('/api/v1/appointments', $this->payload($doctor, $a))->json('data.id');
        $this->postJson("/api/v1/appointments/{$id}/status", ['status' => 'cancelled', 'comment' => 'Patient asked'])->assertOk();

        $this->postJson('/api/v1/appointments', $this->payload($doctor, $b))->assertCreated();
    }

    public function test_cannot_book_outside_schedule_or_during_time_off(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $doctor = Doctor::factory()->withWeekdaySchedule('08:00', '12:00')->create();
        $patient = Patient::factory()->create();

        $this->postJson('/api/v1/appointments', $this->payload($doctor, $patient, '15:00'))->assertStatus(409);

        DoctorTimeOff::create([
            'doctor_id' => $doctor->id,
            'start_date' => $this->nextMonday()->toDateString(),
            'end_date' => $this->nextMonday()->toDateString(),
        ]);

        $this->postJson('/api/v1/appointments', $this->payload($doctor, $patient))->assertStatus(409);
    }

    public function test_availability_excludes_booked_slots(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $doctor = Doctor::factory()->withWeekdaySchedule('08:00', '10:00')->create();
        $patient = Patient::factory()->create();
        $this->postJson('/api/v1/appointments', $this->payload($doctor, $patient, '08:30'))->assertCreated();

        $this->getJson("/api/v1/doctors/{$doctor->id}/availability?date={$this->nextMonday()->toDateString()}")
            ->assertOk()
            ->assertJsonPath('slots', ['08:00', '09:00', '09:30']);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $appointment = Appointment::factory()->for(Doctor::factory()->withWeekdaySchedule())->create();

        $this->postJson("/api/v1/appointments/{$appointment->id}/status", ['status' => 'completed'])
            ->assertStatus(422);
    }

    public function test_cancellation_requires_a_reason(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $appointment = Appointment::factory()->for(Doctor::factory()->withWeekdaySchedule())->create();

        $this->postJson("/api/v1/appointments/{$appointment->id}/status", ['status' => 'cancelled'])
            ->assertUnprocessable()->assertJsonValidationErrors('comment');
    }

    public function test_full_lifecycle(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $appointment = Appointment::factory()->for(Doctor::factory()->withWeekdaySchedule())->create();

        foreach (['confirmed', 'in_progress', 'completed'] as $status) {
            $this->postJson("/api/v1/appointments/{$appointment->id}/status", ['status' => $status])
                ->assertOk()->assertJsonPath('data.status', $status);
        }

        $this->assertSame(AppointmentStatus::Completed, $appointment->fresh()->status);
        $this->assertDatabaseCount('appointment_status_histories', 3);
    }

    public function test_reschedule_moves_the_appointment(): void
    {
        $this->actingAsRole(UserRole::Receptionist);
        $doctor = Doctor::factory()->withWeekdaySchedule()->create();
        $patient = Patient::factory()->create();
        $id = $this->postJson('/api/v1/appointments', $this->payload($doctor, $patient))->json('data.id');

        $this->patchJson("/api/v1/appointments/{$id}/reschedule", [
            'scheduled_date' => $this->nextMonday()->toDateString(),
            'start_time' => '10:30',
        ])->assertOk()->assertJsonPath('data.start_time', '10:30');
    }

    public function test_employee_books_only_for_self_and_sees_only_own(): void
    {
        $employee = $this->actingAsRole(UserRole::Employee);
        $doctor = Doctor::factory()->withWeekdaySchedule()->create();
        $me = Patient::factory()->create(['user_id' => $employee->id]);
        $other = Patient::factory()->create();
        Appointment::factory()->create(['patient_id' => $other->id, 'doctor_id' => $doctor->id, 'start_time' => '10:00', 'end_time' => '10:30']);

        // patient_id from the client is ignored for employees.
        $this->postJson('/api/v1/appointments', $this->payload($doctor, $other))
            ->assertCreated()->assertJsonPath('data.patient_id', $me->id);

        $this->getJson('/api/v1/appointments')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_employee_cannot_confirm_but_can_cancel_own_appointment(): void
    {
        $employee = $this->actingAsRole(UserRole::Employee);
        $me = Patient::factory()->create(['user_id' => $employee->id]);
        $appointment = Appointment::factory()->for(Doctor::factory()->withWeekdaySchedule())->create(['patient_id' => $me->id]);

        $this->postJson("/api/v1/appointments/{$appointment->id}/status", ['status' => 'confirmed'])->assertForbidden();
        $this->postJson("/api/v1/appointments/{$appointment->id}/status", ['status' => 'cancelled', 'comment' => 'Cannot attend'])->assertOk();
    }

    public function test_employee_cannot_view_someone_elses_appointment(): void
    {
        $this->actingAsRole(UserRole::Employee);
        $appointment = Appointment::factory()->for(Doctor::factory()->withWeekdaySchedule())->create();

        $this->getJson("/api/v1/appointments/{$appointment->id}")->assertForbidden();
    }

    public function test_doctor_only_works_own_appointments(): void
    {
        $user = $this->actingAsRole(UserRole::Doctor);
        $mine = Doctor::factory()->withWeekdaySchedule()->create(['user_id' => $user->id]);
        $theirs = Doctor::factory()->withWeekdaySchedule()->create();

        $own = Appointment::factory()->create(['doctor_id' => $mine->id, 'status' => AppointmentStatus::Confirmed]);
        $foreign = Appointment::factory()->create(['doctor_id' => $theirs->id, 'status' => AppointmentStatus::Confirmed]);

        $this->getJson('/api/v1/appointments')->assertOk()->assertJsonCount(1, 'data');
        $this->postJson("/api/v1/appointments/{$own->id}/status", ['status' => 'in_progress'])->assertOk();
        $this->postJson("/api/v1/appointments/{$foreign->id}/status", ['status' => 'in_progress'])->assertForbidden();
    }

    public function test_cannot_book_in_the_past(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $doctor = Doctor::factory()->withWeekdaySchedule()->create();
        $patient = Patient::factory()->create();

        $this->postJson('/api/v1/appointments', [
            ...$this->payload($doctor, $patient),
            'scheduled_date' => now()->subDay()->toDateString(),
        ])->assertUnprocessable()->assertJsonValidationErrors('scheduled_date');
    }
}

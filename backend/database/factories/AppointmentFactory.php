<?php

namespace Database\Factories;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'location_id' => fn () => \Database\Factories\LocationFactory::defaultId(),
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'specialty_id' => fn (array $attrs) => Doctor::find($attrs['doctor_id'])->specialty_id,
            'scheduled_date' => now()->addDay()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '09:30',
            'status' => AppointmentStatus::Pending,
            'reason' => fake()->sentence(4),
        ];
    }

    public function status(AppointmentStatus $status): static
    {
        return $this->state(['status' => $status]);
    }
}

<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'specialty_id' => Specialty::factory(),
            'national_id' => 'V-'.fake()->unique()->numberBetween(5_000_000, 35_000_000),
            'license_number' => 'MPPS-'.fake()->unique()->numerify('######'),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'phone' => '0424-'.fake()->numerify('#######'),
            'email' => fake()->unique()->safeEmail(),
            'office' => fake()->numerify('0#'),
            'slot_duration_minutes' => 30,
            'is_active' => true,
        ];
    }

    /**
     * Weekday schedule (Mon–Fri) between the given hours.
     */
    public function withWeekdaySchedule(string $start = '08:00', string $end = '12:00'): static
    {
        return $this->afterCreating(function (Doctor $doctor) use ($start, $end) {
            foreach (range(1, 5) as $day) {
                DoctorSchedule::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $day,
                    'start_time' => $start,
                    'end_time' => $end,
                ]);
            }
        });
    }
}

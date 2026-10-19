<?php

namespace Database\Factories;

use App\Enums\MedicalLeaveStatus;
use App\Enums\MedicalLeaveType;
use App\Models\MedicalLeave;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MedicalLeave>
 */
class MedicalLeaveFactory extends Factory
{
    public function definition(): array
    {
        $days = fake()->numberBetween(1, 10);
        $start = now()->subDays(fake()->numberBetween(0, 5));

        return [
            'location_id' => fn () => \Database\Factories\LocationFactory::defaultId(),
            'patient_id' => Patient::factory(),
            'type' => fake()->randomElement(MedicalLeaveType::cases()),
            'start_date' => $start->toDateString(),
            'end_date' => $start->copy()->addDays($days - 1)->toDateString(),
            'days' => $days,
            'diagnosis' => fake()->sentence(),
            'status' => MedicalLeaveStatus::Pending,
        ];
    }
}

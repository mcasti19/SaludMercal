<?php

namespace Database\Factories;

use App\Enums\Gender;
use App\Models\Department;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Patient>
 */
class PatientFactory extends Factory
{
    public function definition(): array
    {
        return [
            'national_id' => 'V-'.fake()->unique()->numberBetween(5_000_000, 35_000_000),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'birth_date' => fake()->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
            'gender' => fake()->randomElement(Gender::cases()),
            'phone' => '0414-'.fake()->numerify('#######'),
            'email' => fake()->unique()->safeEmail(),
            'department_id' => Department::factory(),
            'is_active' => true,
        ];
    }
}

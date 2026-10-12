<?php

namespace Database\Factories;

use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Location>
 */
class LocationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company(),
            'code' => strtoupper(fake()->unique()->lexify('???')),
            'state' => fake()->state(),
            'city' => fake()->city(),
            'address' => fake()->streetAddress(),
            'is_active' => true,
        ];
    }
}

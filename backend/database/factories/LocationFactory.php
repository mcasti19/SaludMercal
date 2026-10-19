<?php

namespace Database\Factories;

use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Location>
 */
class LocationFactory extends Factory
{
    /** Id of the shared test sede, created on first use. Keeps factory data in one territory by default. */
    public static function defaultId(): int
    {
        return Location::query()->orderBy('id')->value('id') ?? Location::factory()->create()->id;
    }

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

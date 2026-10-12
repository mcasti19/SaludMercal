<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'role' => UserRole::Employee,
            'is_active' => true,
            'must_change_password' => false,
            'email_verified_at' => now(),
            'password' => static::$password ??= 'Password123*',
            'remember_token' => Str::random(10),
        ];
    }

    public function role(UserRole $role): static
    {
        return $this->state(['role' => $role]);
    }

    public function admin(): static
    {
        return $this->role(UserRole::Admin);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}

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
            'password_expiration_months' => 3,
            'password_changed_at' => now(),
            'password_expires_at' => now()->addMonths(3),
            'session_timeout_minutes' => 30,
            'email_verified_at' => now(),
            'password' => static::$password ??= 'Password123*',
            'remember_token' => Str::random(10),
        ];
    }

    public function role(UserRole $role): static
    {
        // Territorial staff must belong to a sede (the scope fails closed otherwise).
        return $this->state(fn () => [
            'role' => $role,
            'location_id' => $role->isStaff() && $role !== UserRole::SuperAdmin && $role !== UserRole::Employee
                ? LocationFactory::defaultId()
                : null,
        ]);
    }

    public function admin(): static
    {
        return $this->role(UserRole::Admin);
    }

    public function logicalSecurity(): static
    {
        return $this->role(UserRole::LogicalSecurity);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}

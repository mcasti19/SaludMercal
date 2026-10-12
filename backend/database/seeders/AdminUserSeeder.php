<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Creates the initial administrator. The password comes from the environment
 * (SEED_ADMIN_PASSWORD) and is mandatory in production.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('SEED_ADMIN_PASSWORD');

        if (! $password) {
            if (app()->isProduction()) {
                throw new RuntimeException('SEED_ADMIN_PASSWORD must be set to seed the admin user in production.');
            }

            $password = 'Password123*';
        }

        $email = env('SEED_ADMIN_EMAIL', 'moicastillo@mercal.gob.ve');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Moisés Castillo',
                'username' => env('SEED_ADMIN_USERNAME', 'moicastillo'),
                'role' => UserRole::Admin,
                'is_active' => true,
                'must_change_password' => app()->isProduction(),
                'password' => $password,
            ]
        );

        $this->command?->info("Administrator ready: {$email}");
    }
}

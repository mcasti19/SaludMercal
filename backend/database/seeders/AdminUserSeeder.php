<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Creates the initial institutional super administrator and the developer (support) account.
 * Passwords come from the environment (SEED_ADMIN_PASSWORD / SEED_DEVELOPER_PASSWORD) and are
 * mandatory in production, where the developer account is created disabled: logical security
 * enables it only for the duration of a support task.
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
                'role' => UserRole::SuperAdmin,
                'is_active' => true,
                'must_change_password' => app()->isProduction(),
                'password' => $password,
            ]
        );

        $this->command?->info("Administrator ready: {$email}");

        $this->seedDeveloper();
    }

    private function seedDeveloper(): void
    {
        $password = env('SEED_DEVELOPER_PASSWORD');

        if (! $password) {
            if (app()->isProduction()) {
                throw new RuntimeException('SEED_DEVELOPER_PASSWORD must be set to seed the developer user in production.');
            }

            $password = 'Password123*';
        }

        User::updateOrCreate(
            ['email' => env('SEED_DEVELOPER_EMAIL', 'desarrollador@mercal.gob.ve')],
            [
                'name' => 'Desarrollador (Soporte)',
                'username' => env('SEED_DEVELOPER_USERNAME', 'desarrollador'),
                'role' => UserRole::Developer,
                'location_id' => null,
                'is_active' => ! app()->isProduction(),
                'must_change_password' => app()->isProduction(),
                'session_timeout_minutes' => 30,
                'password' => $password,
            ]
        );
    }
}

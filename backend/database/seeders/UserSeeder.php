<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds base administrative and staff accounts for SaludMercal.
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $defaultPassword = env('SEED_DEFAULT_PASSWORD', 'Password123*');

        $centralLocation = \App\Models\Location::where('is_headquarters', true)->first();
        $centralLocationId = $centralLocation?->id;

        // 1. Primary National SuperAdmin (Moisés Castillo)
        $adminEmail = env('SEED_ADMIN_EMAIL', 'moicastillo@mercal.gob.ve');
        $adminUsername = env('SEED_ADMIN_USERNAME', 'moicastillo');
        $adminPassword = env('SEED_ADMIN_PASSWORD', $defaultPassword);

        User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'Moisés Castillo',
                'username' => $adminUsername,
                'role' => UserRole::SuperAdmin,
                'location_id' => $centralLocationId,
                'is_active' => true,
                'must_change_password' => false,
                'password' => $adminPassword,
            ]
        );

        // 2. Sede Central Admin (admin@mercal.gob.ve / admin)
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrador Sede Central',
                'email' => 'admin@mercal.gob.ve',
                'role' => UserRole::Admin,
                'location_id' => $centralLocationId,
                'is_active' => true,
                'must_change_password' => false,
                'password' => $defaultPassword,
            ]
        );

        // 3. Receptionist (recepcion@mercal.gob.ve / recepcion)
        User::updateOrCreate(
            ['username' => 'recepcion'],
            [
                'name' => 'Recepción y Triage Central',
                'email' => 'recepcion@mercal.gob.ve',
                'role' => UserRole::Receptionist,
                'location_id' => $centralLocationId,
                'is_active' => true,
                'must_change_password' => false,
                'password' => $defaultPassword,
            ]
        );

        // 4. Nurse (enfermeria@mercal.gob.ve / enfermeria)
        User::updateOrCreate(
            ['username' => 'enfermeria'],
            [
                'name' => 'Lic. Mariana Gómez',
                'email' => 'enfermeria@mercal.gob.ve',
                'role' => UserRole::Nurse,
                'location_id' => $centralLocationId,
                'is_active' => true,
                'must_change_password' => false,
                'password' => $defaultPassword,
            ]
        );

        // 5. Regional Staff (Zulia) for multi-sede segregation testing
        $zuliaLocation = \App\Models\Location::where('code', 'MED-ZUL')->first();
        if ($zuliaLocation) {
            User::updateOrCreate(
                ['username' => 'admin.zulia'],
                [
                    'name' => 'Coordinador Médico Zulia',
                    'email' => 'admin.zulia@mercal.gob.ve',
                    'role' => UserRole::Admin,
                    'location_id' => $zuliaLocation->id,
                    'is_active' => true,
                    'must_change_password' => false,
                    'password' => $defaultPassword,
                ]
            );

            User::updateOrCreate(
                ['username' => 'recepcion.zulia'],
                [
                    'name' => 'Recepción Sede Zulia',
                    'email' => 'recepcion.zulia@mercal.gob.ve',
                    'role' => UserRole::Receptionist,
                    'location_id' => $zuliaLocation->id,
                    'is_active' => true,
                    'must_change_password' => false,
                    'password' => $defaultPassword,
                ]
            );
        }
    }
}

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

        // 1. Primary Administrator (Moises Castillo)
        $adminEmail = env('SEED_ADMIN_EMAIL', 'moicastillo@mercal.gob.ve');
        $adminUsername = env('SEED_ADMIN_USERNAME', 'moicastillo');
        $adminPassword = env('SEED_ADMIN_PASSWORD', $defaultPassword);

        User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'Moisés Castillo',
                'username' => $adminUsername,
                'role' => UserRole::Admin,
                'location_id' => $centralLocationId,
                'is_active' => true,
                'must_change_password' => false,
                'password' => $adminPassword,
            ]
        );

        // 2. Generic System Admin (admin@mercal.gob.ve / admin)
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrador del Sistema',
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
    }
}

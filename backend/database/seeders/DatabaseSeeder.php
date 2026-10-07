<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Usuario administrador principal — SaludMercal
        User::updateOrCreate(
            ['email' => 'moicastillo@mercal.gob.ve'],
            [
                'name'     => 'Moisés Castillo',
                'username' => 'moicastillo',
                'email'    => 'moicastillo@mercal.gob.ve',
                'role'     => 'ADMIN',
                'password' => Hash::make('Password123*'),
            ]
        );

        $this->command->info('✅ Usuario administrador creado: moicastillo@mercal.gob.ve');
        $this->command->info('   Username: moicastillo | Role: ADMIN');
    }
}

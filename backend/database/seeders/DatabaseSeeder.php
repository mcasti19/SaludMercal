<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Production only gets the catalogs and the initial super administrator
        // (SEED_ADMIN_PASSWORD is mandatory); demo accounts share a well-known password.
        if (app()->isProduction()) {
            $this->call([
                CatalogSeeder::class,
                AdminUserSeeder::class,
            ]);

            return;
        }

        $this->call([
            CatalogSeeder::class,
            UserSeeder::class,
            DoctorSeeder::class,
            PatientSeeder::class,
            AppointmentSeeder::class,
            MedicalLeaveSeeder::class,
            MedicalExamSeeder::class,
        ]);
    }
}

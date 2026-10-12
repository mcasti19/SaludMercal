<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Specialty;
use Illuminate\Database\Seeder;

/**
 * Reference data required for the system to be usable. Idempotent.
 */
class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $specialties = [
            'Medicina General' => 'Consulta general y preventiva',
            'Cardiología' => 'Enfermedades del corazón y sistema cardiovascular',
            'Pediatría' => 'Medicina infantil',
            'Ginecología' => 'Salud femenina y reproductiva',
            'Traumatología' => 'Lesiones del sistema musculoesquelético',
            'Odontología' => 'Salud bucal y dental',
            'Nutrición' => 'Orientación nutricional y dietética',
        ];

        foreach ($specialties as $name => $description) {
            Specialty::updateOrCreate(['name' => $name], ['description' => $description]);
        }

        $departments = [
            'Administración', 'Almacén', 'Distribución', 'Finanzas', 'Logística',
            'Recursos Humanos', 'Recepción', 'Tecnología',
        ];

        foreach ($departments as $name) {
            Department::updateOrCreate(['name' => $name]);
        }
    }
}

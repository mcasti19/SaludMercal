<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Sample corporate-directory rows for the `local` driver (development only). */
class DirectoryEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['V-20111222', 'Luisa', 'Fernández', '1988-03-14', 'female', '0414-1112233', 'luisa.fernandez@mercal.gob.ve', 'Analista de Nómina', 'Recursos Humanos', 'Sede Central', true],
            ['V-18222333', 'Pedro', 'Ramírez', '1985-07-02', 'male', '0412-2223344', null, 'Chofer', 'Distribución y Transporte', 'Capital', true],
            ['V-22333444', 'Carmen', 'Díaz', '1992-11-23', 'female', '0424-3334455', null, 'Asistente Administrativo', 'Administración General', 'Vargas', true],
            ['V-16444555', 'Jesús', 'Morales', '1980-01-30', 'male', '0416-4445566', null, 'Supervisor de Almacén', 'Almacén Central', 'Zulia', true],
            ['V-24555666', 'Andrea', 'Rojas', '1995-09-09', 'female', '0426-5556677', null, 'Analista de Calidad', 'Control de Calidad', 'Lara', true],
            ['V-14666777', 'Héctor', 'Salas', '1978-05-18', 'male', '0414-6667788', null, 'Operador de Montacargas', 'Logística y Operaciones', 'Zulia', false],
            ['E-81777888', 'Marta', 'Quintero', '1990-12-01', 'female', '0412-7778899', null, 'Contadora', 'Finanzas y Contabilidad', 'Región Desconocida', true],
        ];

        foreach ($rows as [$nid, $first, $last, $birth, $gender, $phone, $email, $job, $dept, $sede, $active]) {
            DB::table('directory_employees')->updateOrInsert(['national_id' => $nid], [
                'first_name' => $first, 'last_name' => $last, 'birth_date' => $birth, 'gender' => $gender,
                'phone' => $phone, 'email' => $email, 'job_title' => $job, 'department' => $dept,
                'sede' => $sede, 'is_active' => $active,
            ]);
        }
    }
}

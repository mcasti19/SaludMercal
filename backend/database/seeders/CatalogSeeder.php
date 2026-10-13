<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Location;
use App\Models\Specialty;
use Illuminate\Database\Seeder;

/**
 * Reference data required for the system to be usable. Idempotent.
 * Covers all 24 Venezuelan federal entities and distinguishes the Caracas Sede Central.
 */
class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $specialties = [
            'Medicina General' => 'Consulta general y preventiva para los trabajadores de Mercal',
            'Cardiología' => 'Enfermedades del corazón y sistema cardiovascular',
            'Pediatría' => 'Atención médica integral infantil para hijos de trabajadores',
            'Ginecología' => 'Salud femenina, reproductiva y control prenatal',
            'Traumatología' => 'Lesiones del sistema musculoesquelético y salud ocupacional',
            'Odontología' => 'Salud bucal, profilaxis y odontología preventiva',
            'Nutrición' => 'Orientación nutricional, dietética y control metabólico',
        ];

        foreach ($specialties as $name => $description) {
            Specialty::updateOrCreate(
                ['name' => $name],
                ['description' => $description, 'is_active' => true]
            );
        }

        $departments = [
            ['name' => 'Administración General', 'code' => 'ADM'],
            ['name' => 'Almacén Central', 'code' => 'ALM'],
            ['name' => 'Distribución y Transporte', 'code' => 'DIS'],
            ['name' => 'Finanzas y Contabilidad', 'code' => 'FIN'],
            ['name' => 'Logística y Operaciones', 'code' => 'LOG'],
            ['name' => 'Recursos Humanos', 'code' => 'RRHH'],
            ['name' => 'Recepción y Atención al Ciudadano', 'code' => 'REC'],
            ['name' => 'Tecnología e Informática', 'code' => 'TIC'],
            ['name' => 'Seguridad Integral', 'code' => 'SEG'],
            ['name' => 'Control de Calidad', 'code' => 'CAL'],
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(
                ['name' => $dept['name']],
                ['code' => $dept['code'], 'is_active' => true]
            );
        }

        // Sedes de Mercal a nivel nacional: Sede Central (Caracas) + 23 Estados + Centros Clave
        $locations = [
            // ── SEDE CENTRAL (Torre Principal Mercal en Caracas) ──────────────
            [
                'name' => 'Sede Central',
                'code' => 'HQ-CARACAS',
                'state' => 'Distrito Capital',
                'city' => 'Caracas',
                'address' => 'Av. Andrés Bello, Torre Mercal, Piso 2, Servicio Médico',
                'phone' => '0212-5051111',
                'is_headquarters' => true,
            ],
            [
                'name' => 'Centro de Distribución La Yaguara',
                'code' => 'CD-YAGUARA',
                'state' => 'Distrito Capital',
                'city' => 'Caracas',
                'address' => 'Zona Industrial La Yaguara, Calle 3, Galpón Mercal',
                'phone' => '0212-4421098',
                'is_headquarters' => false,
            ],
            // ── SEDES REGIONALES (23 ESTADOS DE VENEZUELA) ────────────────────
            [
                'name' => 'Sede Mercal Amazonas',
                'code' => 'MED-AMZ',
                'state' => 'Amazonas',
                'city' => 'Puerto Ayacucho',
                'address' => 'Av. 23 de Enero, Sector El Escondido',
                'phone' => '0248-5214001',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Anzoátegui',
                'code' => 'MED-ANZ',
                'state' => 'Anzoátegui',
                'city' => 'Barcelona',
                'address' => 'Av. Intercomunal Jorge Rodríguez, Sector Las Garzas',
                'phone' => '0281-2861234',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Apure',
                'code' => 'MED-APU',
                'state' => 'Apure',
                'city' => 'San Fernando de Apure',
                'address' => 'Paseo Libertador, Edif. Mercal Apure',
                'phone' => '0247-3425678',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Aragua',
                'code' => 'MED-ARA',
                'state' => 'Aragua',
                'city' => 'Maracay',
                'address' => 'Av. Constitución, Sector San Jacinto, Galpón 2',
                'phone' => '0243-2345678',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Barinas',
                'code' => 'MED-BAR',
                'state' => 'Barinas',
                'city' => 'Barinas',
                'address' => 'Av. Industrial, Zona Industrial de Barinas',
                'phone' => '0273-5321098',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Bolívar',
                'code' => 'MED-BOL',
                'state' => 'Bolívar',
                'city' => 'Ciudad Bolívar',
                'address' => 'Paseo Meneses, Centro Cívico Mercal',
                'phone' => '0285-6324567',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Carabobo',
                'code' => 'MED-CAR',
                'state' => 'Carabobo',
                'city' => 'Valencia',
                'address' => 'Zona Industrial Municipal Norte, Calle Bolívar',
                'phone' => '0241-8329876',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Cojedes',
                'code' => 'MED-COJ',
                'state' => 'Cojedes',
                'city' => 'San Carlos',
                'address' => 'Av. Universidad, Sector Los Silos',
                'phone' => '0258-4331209',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Delta Amacuro',
                'code' => 'MED-DEL',
                'state' => 'Delta Amacuro',
                'city' => 'Tucupita',
                'address' => 'Calle Manamo, Edificio Regional Mercal',
                'phone' => '0287-7213456',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Falcón',
                'code' => 'MED-FAL',
                'state' => 'Falcón',
                'city' => 'Coro',
                'address' => 'Av. Independencia, Sector Los Tres Platos',
                'phone' => '0268-2519876',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Guárico',
                'code' => 'MED-GUA',
                'state' => 'Guárico',
                'city' => 'San Juan de los Morros',
                'address' => 'Av. Los Llanos, Frente a la Redoma',
                'phone' => '0246-4318765',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal La Guaira',
                'code' => 'MED-LAG',
                'state' => 'La Guaira',
                'city' => 'La Guaira',
                'address' => 'Av. Soublette, Sector Maiquetía, Muelle Pesquero',
                'phone' => '0212-3314567',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Lara',
                'code' => 'MED-LAR',
                'state' => 'Lara',
                'city' => 'Barquisimeto',
                'address' => 'Carrera 19 con Calle 40, Centro de Atención Mercal',
                'phone' => '0251-2318765',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Mérida',
                'code' => 'MED-MER',
                'state' => 'Mérida',
                'city' => 'Mérida',
                'address' => 'Av. Las Américas, Sector Humboldt',
                'phone' => '0274-2665432',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Miranda',
                'code' => 'MED-MIR',
                'state' => 'Miranda',
                'city' => 'Los Teques',
                'address' => 'Av. Bicentenario, Sector El Tambor',
                'phone' => '0212-3221098',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Monagas',
                'code' => 'MED-MON',
                'state' => 'Monagas',
                'city' => 'Maturín',
                'address' => 'Av. Alirio Ugarte Pelayo, Sector Tipuro',
                'phone' => '0291-6432109',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Nueva Esparta',
                'code' => 'MED-NUE',
                'state' => 'Nueva Esparta',
                'city' => 'Porlamar',
                'address' => 'Av. 4 de Mayo, Edif. Mercal Insular',
                'phone' => '0295-2634567',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Portuguesa',
                'code' => 'MED-POR',
                'state' => 'Portuguesa',
                'city' => 'Guanare',
                'address' => 'Av. Simón Bolívar, Sector Centro',
                'phone' => '0257-2516789',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Sucre',
                'code' => 'MED-SUC',
                'state' => 'Sucre',
                'city' => 'Cumaná',
                'address' => 'Av. Perimetral, Sector El Salado',
                'phone' => '0293-4318765',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Táchira',
                'code' => 'MED-TAC',
                'state' => 'Táchira',
                'city' => 'San Cristóbal',
                'address' => 'Av. 19 de Abril, Edificio Mercal Andino',
                'phone' => '0276-3445678',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Trujillo',
                'code' => 'MED-TRU',
                'state' => 'Trujillo',
                'city' => 'Valera',
                'address' => 'Av. Bolívar, Sector Las Acacias',
                'phone' => '0271-2214567',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Yaracuy',
                'code' => 'MED-YAR',
                'state' => 'Yaracuy',
                'city' => 'San Felipe',
                'address' => 'Av. La Patria, Zona Industrial',
                'phone' => '0254-2319876',
                'is_headquarters' => false,
            ],
            [
                'name' => 'Sede Mercal Zulia',
                'code' => 'MED-ZUL',
                'state' => 'Zulia',
                'city' => 'Maracaibo',
                'address' => 'Av. 5 de Julio con Calle 72, Edif. Mercal Occidente',
                'phone' => '0261-7981234',
                'is_headquarters' => false,
            ],
        ];

        foreach ($locations as $loc) {
            Location::updateOrCreate(
                ['code' => $loc['code']],
                [
                    'name' => $loc['name'],
                    'state' => $loc['state'],
                    'city' => $loc['city'],
                    'address' => $loc['address'],
                    'phone' => $loc['phone'] ?? null,
                    'is_headquarters' => $loc['is_headquarters'],
                    'is_active' => true,
                ]
            );
        }
    }
}

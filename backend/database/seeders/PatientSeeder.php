<?php

namespace Database\Seeders;

use App\Enums\Gender;
use App\Enums\UserRole;
use App\Models\Department;
use App\Models\Location;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds Mercal employee patient records and portal accounts.
 */
class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $defaultPassword = env('SEED_DEFAULT_PASSWORD', 'Password123*');
        $centralLocation = Location::where('is_headquarters', true)->first() ?? Location::first();
        $yaguaraLocation = Location::where('code', 'CD-YAGUARA')->first() ?? $centralLocation;

        $logisticsDept = Department::where('code', 'LOG')->first() ?? Department::first();
        $hrDept = Department::where('code', 'RRHH')->first() ?? Department::first();
        $warehouseDept = Department::where('code', 'ALM')->first() ?? Department::first();
        $transportDept = Department::where('code', 'DIS')->first() ?? Department::first();
        $financeDept = Department::where('code', 'FIN')->first() ?? Department::first();
        $securityDept = Department::where('code', 'SEG')->first() ?? Department::first();
        $qualityDept = Department::where('code', 'CAL')->first() ?? Department::first();
        $techDept = Department::where('code', 'TIC')->first() ?? Department::first();

        // 1. Primary Test Employee: Juan Carlos Pérez (empleado / empleado@mercal.gob.ve)
        $empUser1 = User::updateOrCreate(
            ['username' => 'empleado'],
            [
                'name' => 'Juan Carlos Pérez',
                'email' => 'empleado@mercal.gob.ve',
                'role' => UserRole::Employee,
                'is_active' => true,
                'must_change_password' => false,
                'password' => $defaultPassword,
            ]
        );

        $patient1 = Patient::updateOrCreate(
            ['national_id' => 'V-18765432'],
            [
                'user_id' => $empUser1->id,
                'first_name' => 'Juan Carlos',
                'last_name' => 'Pérez Gómez',
                'birth_date' => '1988-06-14',
                'gender' => Gender::Male,
                'phone' => '0414-2345678',
                'email' => 'empleado@mercal.gob.ve',
                'department_id' => $logisticsDept?->id,
                'location_id' => $centralLocation?->id,
                'job_title' => 'Analista de Despacho y Logística',
                'blood_type' => 'O+',
                'allergies' => 'Penicilina, polen',
                'emergency_contact_name' => 'Carmen Gómez (Madre)',
                'emergency_contact_phone' => '0412-9988776',
                'is_active' => true,
            ]
        );

        // Beneficiarios de Juan Carlos Pérez (Padres, Hijos, Cónyuge)
        $patient1->beneficiaries()->delete();
        $patient1->beneficiaries()->createMany([
            [
                'first_name' => 'Elena María',
                'last_name' => 'Gómez de Pérez',
                'relationship' => 'conyuge',
                'national_id' => 'V-20123456',
                'birth_date' => '1990-04-12',
                'gender' => 'F',
                'phone' => '0414-9988112',
                'is_active' => true,
            ],
            [
                'first_name' => 'Lucas Andrés',
                'last_name' => 'Pérez Gómez',
                'relationship' => 'hijo',
                'national_id' => null,
                'birth_date' => '2018-09-05',
                'gender' => 'M',
                'phone' => null,
                'is_active' => true,
            ],
            [
                'first_name' => 'Carmen Rosa',
                'last_name' => 'Gómez',
                'relationship' => 'madre',
                'national_id' => 'V-6543210',
                'birth_date' => '1962-02-18',
                'gender' => 'F',
                'phone' => '0412-9988776',
                'is_active' => true,
            ],
        ]);

        // 2. Secondary Test Employee: María González (maria.gonzalez / maria.gonzalez@mercal.gob.ve)
        $empUser2 = User::updateOrCreate(
            ['username' => 'maria.gonzalez'],
            [
                'name' => 'María Auxiliadora González',
                'email' => 'maria.gonzalez@mercal.gob.ve',
                'role' => UserRole::Employee,
                'is_active' => true,
                'must_change_password' => false,
                'password' => $defaultPassword,
            ]
        );

        Patient::updateOrCreate(
            ['national_id' => 'V-19876543'],
            [
                'user_id' => $empUser2->id,
                'first_name' => 'María Auxiliadora',
                'last_name' => 'González Rivas',
                'birth_date' => '1992-09-22',
                'gender' => Gender::Female,
                'phone' => '0412-3456789',
                'email' => 'maria.gonzalez@mercal.gob.ve',
                'department_id' => $hrDept?->id,
                'location_id' => $centralLocation?->id,
                'job_title' => 'Especialista de Talento Humano',
                'blood_type' => 'A+',
                'allergies' => 'Ninguna conocida',
                'emergency_contact_name' => 'Pedro González (Esposo)',
                'emergency_contact_phone' => '0416-1122334',
                'is_active' => true,
            ]
        );

        // 3. Other Mercal employees as patients
        $patientsList = [
            [
                'national_id' => 'V-15432198',
                'first_name' => 'Pedro José',
                'last_name' => 'Castillo Blanco',
                'birth_date' => '1982-03-10',
                'gender' => Gender::Male,
                'phone' => '0414-9876543',
                'email' => 'pedro.castillo@mercal.gob.ve',
                'department_id' => $warehouseDept?->id,
                'location_id' => $yaguaraLocation?->id,
                'job_title' => 'Supervisor de Almacén',
                'blood_type' => 'O+',
                'allergies' => 'Polvo y ácaros',
                'contact' => 'Ana Blanco (Esposa)',
                'contact_phone' => '0414-1112233',
            ],
            [
                'national_id' => 'V-16890123',
                'first_name' => 'Yelitza Coromoto',
                'last_name' => 'Flores Márquez',
                'birth_date' => '1985-11-28',
                'gender' => Gender::Female,
                'phone' => '0424-8765432',
                'email' => 'yelitza.flores@mercal.gob.ve',
                'department_id' => $financeDept?->id,
                'location_id' => $centralLocation?->id,
                'job_title' => 'Contadora Pública Senior',
                'blood_type' => 'B+',
                'allergies' => 'Ibuprofeno',
                'contact' => 'Luis Flores (Hermano)',
                'contact_phone' => '0424-2223344',
            ],
            [
                'national_id' => 'V-20123456',
                'first_name' => 'José Gregorio',
                'last_name' => 'Hernández Bello',
                'birth_date' => '1994-05-18',
                'gender' => Gender::Male,
                'phone' => '0416-7654321',
                'email' => 'jose.hernandez@mercal.gob.ve',
                'department_id' => $transportDept?->id,
                'location_id' => $yaguaraLocation?->id,
                'job_title' => 'Chofer de Carga Pesada',
                'blood_type' => 'A-',
                'allergies' => 'Mariscos',
                'contact' => 'Rosa Bello (Madre)',
                'contact_phone' => '0416-3334455',
            ],
            [
                'national_id' => 'V-21456789',
                'first_name' => 'Daniela Carolina',
                'last_name' => 'Suárez Peña',
                'birth_date' => '1996-08-04',
                'gender' => Gender::Female,
                'phone' => '0412-6543210',
                'email' => 'daniela.suarez@mercal.gob.ve',
                'department_id' => $qualityDept?->id,
                'location_id' => $centralLocation?->id,
                'job_title' => 'Inspectora de Control de Calidad',
                'blood_type' => 'O-',
                'allergies' => 'Ninguna',
                'contact' => 'Carlos Suárez (Padre)',
                'contact_phone' => '0412-4445566',
            ],
            [
                'national_id' => 'V-17890123',
                'first_name' => 'Franklin Antonio',
                'last_name' => 'Quintero Ruiz',
                'birth_date' => '1987-01-25',
                'gender' => Gender::Male,
                'phone' => '0414-5432109',
                'email' => 'franklin.quintero@mercal.gob.ve',
                'department_id' => $securityDept?->id,
                'location_id' => $centralLocation?->id,
                'job_title' => 'Oficial de Seguridad Integral',
                'blood_type' => 'AB+',
                'allergies' => 'Sulfas',
                'contact' => 'Elena Ruiz (Esposa)',
                'contact_phone' => '0414-5556677',
            ],
            [
                'national_id' => 'V-22987654',
                'first_name' => 'Ricardo Alfonso',
                'last_name' => 'Torres Colmenares',
                'birth_date' => '1998-12-11',
                'gender' => Gender::Male,
                'phone' => '0424-4321098',
                'email' => 'ricardo.torres@mercal.gob.ve',
                'department_id' => $techDept?->id,
                'location_id' => $centralLocation?->id,
                'job_title' => 'Desarrollador de Sistemas',
                'blood_type' => 'O+',
                'allergies' => 'Ninguna',
                'contact' => 'Maritza Colmenares (Madre)',
                'contact_phone' => '0424-6667788',
            ],
            [
                'national_id' => 'V-14789012',
                'first_name' => 'Carmen Teresa',
                'last_name' => 'Alvarado Padrón',
                'birth_date' => '1980-07-30',
                'gender' => Gender::Female,
                'phone' => '0416-3210987',
                'email' => 'carmen.alvarado@mercal.gob.ve',
                'department_id' => $warehouseDept?->id,
                'location_id' => $yaguaraLocation?->id,
                'job_title' => 'Operadora de Montacargas',
                'blood_type' => 'A+',
                'allergies' => 'Látex',
                'contact' => 'Julio Padrón (Hijo)',
                'contact_phone' => '0416-7778899',
            ],
            [
                'national_id' => 'V-23456780',
                'first_name' => 'Alejandro Rafael',
                'last_name' => 'Medina Zambrano',
                'birth_date' => '1999-04-15',
                'gender' => Gender::Male,
                'phone' => '0412-2109876',
                'email' => 'alejandro.medina@mercal.gob.ve',
                'department_id' => $logisticsDept?->id,
                'location_id' => $centralLocation?->id,
                'job_title' => 'Asistente de Inventario',
                'blood_type' => 'O+',
                'allergies' => 'Aspirina',
                'contact' => 'Verónica Zambrano (Madre)',
                'contact_phone' => '0412-8889900',
            ],
            [
                'national_id' => 'V-22334455',
                'first_name' => 'Marcos Vinicio',
                'last_name' => 'Urdaneta Pirela',
                'birth_date' => '1995-10-12',
                'gender' => Gender::Male,
                'phone' => '0414-6123456',
                'email' => 'marcos.urdaneta@mercal.gob.ve',
                'department_id' => $logisticsDept?->id,
                'location_id' => Location::where('code', 'MED-ZUL')->first()?->id ?? $centralLocation?->id,
                'job_title' => 'Supervisor de Almacén Maracaibo',
                'blood_type' => 'O+',
                'allergies' => 'Ninguna',
                'contact' => 'Doris Pirela (Madre)',
                'contact_phone' => '0414-6001122',
            ],
        ];

        foreach ($patientsList as $pData) {
            Patient::updateOrCreate(
                ['national_id' => $pData['national_id']],
                [
                    'first_name' => $pData['first_name'],
                    'last_name' => $pData['last_name'],
                    'birth_date' => $pData['birth_date'],
                    'gender' => $pData['gender'],
                    'phone' => $pData['phone'],
                    'email' => $pData['email'],
                    'department_id' => $pData['department_id'],
                    'location_id' => $pData['location_id'],
                    'job_title' => $pData['job_title'],
                    'blood_type' => $pData['blood_type'],
                    'allergies' => $pData['allergies'],
                    'emergency_contact_name' => $pData['contact'],
                    'emergency_contact_phone' => $pData['contact_phone'],
                    'is_active' => true,
                ]
            );
        }
    }
}

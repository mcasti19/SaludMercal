<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\Location;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds clinic doctors with linked user accounts, specialties, and weekly schedules.
 */
class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        $defaultPassword = env('SEED_DEFAULT_PASSWORD', 'Password123*');
        $centralLocation = Location::where('is_headquarters', true)->first() ?? Location::first();

        $doctorsData = [
            [
                'specialty' => 'Medicina General',
                'first_name' => 'Carlos',
                'last_name' => 'Mendoza',
                'national_id' => 'V-11234567',
                'license_number' => 'MPPS-48291',
                'phone' => '0414-3214567',
                'email' => 'carlos.mendoza@mercal.gob.ve',
                'username' => 'carlos.mendoza',
                'office' => 'Consultorio 1',
                'shift_start' => '08:00',
                'shift_end' => '13:00',
                'days' => [1, 2, 3, 4, 5], // Lun - Vie
            ],
            [
                'specialty' => 'Cardiología',
                'first_name' => 'Elena',
                'last_name' => 'Salazar',
                'national_id' => 'V-13456789',
                'license_number' => 'MPPS-52104',
                'phone' => '0412-8765432',
                'email' => 'elena.salazar@mercal.gob.ve',
                'username' => 'elena.salazar',
                'office' => 'Consultorio 2',
                'shift_start' => '08:30',
                'shift_end' => '13:30',
                'days' => [1, 2, 3, 4], // Lun - Jue
            ],
            [
                'specialty' => 'Traumatología',
                'first_name' => 'Roberto',
                'last_name' => 'García',
                'national_id' => 'V-12987654',
                'license_number' => 'MPPS-39182',
                'phone' => '0424-6543210',
                'email' => 'roberto.garcia@mercal.gob.ve',
                'username' => 'roberto.garcia',
                'office' => 'Consultorio 3',
                'shift_start' => '13:00',
                'shift_end' => '18:00',
                'days' => [1, 2, 3, 4, 5], // Lun - Vie
            ],
            [
                'specialty' => 'Odontología',
                'first_name' => 'Valentina',
                'last_name' => 'Morales',
                'national_id' => 'V-15678901',
                'license_number' => 'MPPS-60312',
                'phone' => '0416-5432109',
                'email' => 'valentina.morales@mercal.gob.ve',
                'username' => 'valentina.morales',
                'office' => 'Consultorio 4',
                'shift_start' => '08:00',
                'shift_end' => '13:00',
                'days' => [2, 3, 4, 5, 6], // Mar - Sab
            ],
            [
                'specialty' => 'Nutrición',
                'first_name' => 'Andrés',
                'last_name' => 'Silva',
                'national_id' => 'V-16789012',
                'license_number' => 'MPPS-64219',
                'phone' => '0414-4321098',
                'email' => 'andres.silva@mercal.gob.ve',
                'username' => 'andres.silva',
                'office' => 'Consultorio 5',
                'shift_start' => '09:00',
                'shift_end' => '14:00',
                'days' => [1, 2, 3, 4, 5], // Lun - Vie
            ],
            [
                'specialty' => 'Pediatría',
                'first_name' => 'Sofía',
                'last_name' => 'Ramírez',
                'national_id' => 'V-14567890',
                'license_number' => 'MPPS-55401',
                'phone' => '0412-3210987',
                'email' => 'sofia.ramirez@mercal.gob.ve',
                'username' => 'sofia.ramirez',
                'office' => 'Consultorio 6',
                'shift_start' => '08:00',
                'shift_end' => '13:00',
                'days' => [1, 2, 3, 4, 5], // Lun - Vie
            ],
            [
                'specialty' => 'Ginecología',
                'first_name' => 'Carmen',
                'last_name' => 'Rivas',
                'national_id' => 'V-12345670',
                'license_number' => 'MPPS-41290',
                'phone' => '0424-2109876',
                'email' => 'carmen.rivas@mercal.gob.ve',
                'username' => 'carmen.rivas',
                'office' => 'Consultorio 7',
                'shift_start' => '09:00',
                'shift_end' => '14:00',
                'days' => [1, 2, 3, 4], // Lun - Jue
            ],
        ];

        foreach ($doctorsData as $doc) {
            $specialty = Specialty::where('name', $doc['specialty'])->first()
                ?? Specialty::first();

            // 1. Create or update doctor User account
            $user = User::updateOrCreate(
                ['email' => $doc['email']],
                [
                    'name' => "Dr. {$doc['first_name']} {$doc['last_name']}",
                    'username' => $doc['username'],
                    'role' => UserRole::Doctor,
                    'location_id' => $centralLocation?->id,
                    'is_active' => true,
                    'must_change_password' => false,
                    'password' => $defaultPassword,
                ]
            );

            // 2. Create or update Doctor record
            $doctor = Doctor::updateOrCreate(
                ['national_id' => $doc['national_id']],
                [
                    'user_id' => $user->id,
                    'specialty_id' => $specialty->id,
                    'location_id' => $centralLocation?->id,
                    'license_number' => $doc['license_number'],
                    'first_name' => $doc['first_name'],
                    'last_name' => $doc['last_name'],
                    'phone' => $doc['phone'],
                    'email' => $doc['email'],
                    'office' => $doc['office'],
                    'slot_duration_minutes' => 30,
                    'is_active' => true,
                ]
            );

            // 3. Create weekly schedules
            foreach ($doc['days'] as $day) {
                DoctorSchedule::updateOrCreate(
                    [
                        'doctor_id' => $doctor->id,
                        'day_of_week' => $day,
                        'start_time' => $doc['shift_start'],
                    ],
                    [
                        'end_time' => $doc['shift_end'],
                    ]
                );
            }
        }
    }
}

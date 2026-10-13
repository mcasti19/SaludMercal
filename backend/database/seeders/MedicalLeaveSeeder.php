<?php

namespace Database\Seeders;

use App\Enums\MedicalLeaveStatus;
use App\Enums\MedicalLeaveType;
use App\Models\Doctor;
use App\Models\MedicalLeave;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/**
 * Seeds medical leaves with approved, pending, and rejected statuses.
 */
class MedicalLeaveSeeder extends Seeder
{
    public function run(): void
    {
        $adminUser = User::where('role', 'admin')->first();
        $patients = Patient::all();
        $doctors = Doctor::with('specialty')->get();

        if ($patients->isEmpty()) {
            return;
        }

        $primaryEmployee = Patient::where('national_id', 'V-18765432')->first() ?? $patients->first();
        $traumaDoctor = $doctors->firstWhere('specialty.name', 'Traumatología') ?? $doctors->first();
        $generalDoctor = $doctors->firstWhere('specialty.name', 'Medicina General') ?? $doctors->first();

        $today = Carbon::today();

        // 1. Primary Employee Approved Leave (immediate PDF certificate download test)
        MedicalLeave::updateOrCreate(
            [
                'patient_id' => $primaryEmployee->id,
                'start_date' => $today->copy()->subDays(5)->toDateString(),
            ],
            [
                'doctor_id' => $traumaDoctor?->id,
                'location_id' => $primaryEmployee->location_id,
                'type' => MedicalLeaveType::Occupational,
                'end_date' => $today->copy()->subDays(3)->toDateString(),
                'days' => 3,
                'diagnosis' => 'Lumbalgia mecánica aguda moderada secundaria a sobreesfuerzo físico en área de despacho.',
                'status' => MedicalLeaveStatus::Approved,
                'reviewed_by' => $adminUser?->id,
                'reviewed_at' => $today->copy()->subDays(5)->addHours(2),
                'review_notes' => 'Convalidado conforme por el Servicio Médico Ocupacional Mercal. Empleado debe reincorporarse con limitación de carga por 5 días.',
            ]
        );

        // 2. Primary Employee Pending Leave (for testing review modal)
        MedicalLeave::updateOrCreate(
            [
                'patient_id' => $primaryEmployee->id,
                'start_date' => $today->toDateString(),
            ],
            [
                'doctor_id' => $generalDoctor?->id,
                'location_id' => $primaryEmployee->location_id,
                'type' => MedicalLeaveType::Illness,
                'end_date' => $today->copy()->addDays(3)->toDateString(),
                'days' => 4,
                'diagnosis' => 'Faringoamigdalitis pultácea aguda con síndrome febril de 38.5°C y adenopatías cervicales.',
                'status' => MedicalLeaveStatus::Pending,
                'reviewed_by' => null,
                'reviewed_at' => null,
                'review_notes' => null,
            ]
        );

        // 3. Additional Leaves for other workers (diverse statuses)
        $extraLeaves = [
            [
                'patient' => $patients->get(2) ?? $primaryEmployee,
                'doctor' => $traumaDoctor,
                'type' => MedicalLeaveType::Accident,
                'days_ago' => 8,
                'duration' => 5,
                'diagnosis' => 'Traumatismo contuso en muñeca derecha con esguince ligamentario grado I.',
                'status' => MedicalLeaveStatus::Approved,
                'notes' => 'Aprobado. Reposo médico validado con informe de emergencia de hospital adscrito.',
            ],
            [
                'patient' => $patients->get(3) ?? $primaryEmployee,
                'doctor' => null,
                'type' => MedicalLeaveType::Illness,
                'days_ago' => 12,
                'duration' => 2,
                'diagnosis' => 'Gastroenteritis aguda por intoxicación alimentaria presunta.',
                'status' => MedicalLeaveStatus::Rejected,
                'notes' => 'Rechazado: Comprobante médico sin firma ni sello húmedo del centro emisor, consignado fuera del plazo reglamentario de 48 horas.',
            ],
            [
                'patient' => $patients->get(4) ?? $primaryEmployee,
                'doctor' => $generalDoctor,
                'type' => MedicalLeaveType::Illness,
                'days_ago' => 1,
                'duration' => 7,
                'diagnosis' => 'Bronquitis aguda con tos productiva persistente y dificultad respiratoria leve.',
                'status' => MedicalLeaveStatus::Pending,
                'notes' => null,
            ],
            [
                'patient' => $patients->get(5) ?? $primaryEmployee,
                'doctor' => null,
                'type' => MedicalLeaveType::Occupational,
                'days_ago' => 15,
                'duration' => 10,
                'diagnosis' => 'Epicondilitis lateral crónica (codo de tenista) por movimientos repetitivos de embalaje.',
                'status' => MedicalLeaveStatus::Approved,
                'notes' => 'Convalidado por medicina del trabajo. Se solicita evaluación de ergonomía en puesto laboral.',
            ],
        ];

        foreach ($extraLeaves as $leave) {
            $startDate = $today->copy()->subDays($leave['days_ago'])->toDateString();
            $endDate = $today->copy()->subDays($leave['days_ago'])->addDays($leave['duration'] - 1)->toDateString();

            MedicalLeave::updateOrCreate(
                [
                    'patient_id' => $leave['patient']->id,
                    'start_date' => $startDate,
                ],
                [
                    'doctor_id' => $leave['doctor']?->id,
                    'location_id' => $leave['patient']->location_id,
                    'type' => $leave['type'],
                    'end_date' => $endDate,
                    'days' => $leave['duration'],
                    'diagnosis' => $leave['diagnosis'],
                    'status' => $leave['status'],
                    'reviewed_by' => $leave['status'] !== MedicalLeaveStatus::Pending ? $adminUser?->id : null,
                    'reviewed_at' => $leave['status'] !== MedicalLeaveStatus::Pending ? now()->subDays($leave['days_ago']) : null,
                    'review_notes' => $leave['notes'],
                ]
            );
        }
    }
}

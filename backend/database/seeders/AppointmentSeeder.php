<?php

namespace Database\Seeders;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\AppointmentStatusHistory;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/**
 * Seeds realistic clinic appointments across past, present, and future dates.
 */
class AppointmentSeeder extends Seeder
{
    public function run(): void
    {
        $adminUser = User::where('role', 'admin')->first();
        $doctors = Doctor::with('specialty')->get();
        $patients = Patient::all();

        if ($doctors->isEmpty() || $patients->isEmpty()) {
            return;
        }

        $primaryEmployee = Patient::where('national_id', 'V-18765432')->first() ?? $patients->first();
        $secondaryEmployee = Patient::where('national_id', 'V-19876543')->first() ?? $patients->get(1);

        $generalDoc = $doctors->firstWhere('specialty.name', 'Medicina General') ?? $doctors->first();
        $cardioDoc = $doctors->firstWhere('specialty.name', 'Cardiología') ?? $doctors->get(1 % $doctors->count());
        $traumaDoc = $doctors->firstWhere('specialty.name', 'Traumatología') ?? $doctors->get(2 % $doctors->count());
        $dentalDoc = $doctors->firstWhere('specialty.name', 'Odontología') ?? $doctors->get(3 % $doctors->count());
        $nutritionDoc = $doctors->firstWhere('specialty.name', 'Nutrición') ?? $doctors->get(4 % $doctors->count());

        $today = Carbon::today();

        // ── 1. HISTORICAL COMPLETED APPOINTMENTS (Last 14 days) ──────────────
        $historyData = [
            [
                'patient' => $primaryEmployee,
                'doctor' => $generalDoc,
                'days_ago' => 7,
                'time' => '08:30',
                'reason' => 'Chequeo médico preventivo y control de tensión arterial',
                'notes' => "Presión Arterial: 120/80 mmHg. Frecuencia Cardíaca: 72 lpm.\nPaciente en buenas condiciones generales.\nIndicaciones:\n1. Dieta balanceada y reducción en consumo de sodio.\n2. Exámenes de laboratorio: Perfil 20 y Hematología Completa.\n3. Control en 6 meses.",
            ],
            [
                'patient' => $primaryEmployee,
                'doctor' => $traumaDoc,
                'days_ago' => 3,
                'time' => '13:30',
                'reason' => 'Dolor lumbar agudo tras levantamiento de carga en almacén',
                'notes' => "Diagnóstico: Lumbalgia mecánica aguda con espasmo paravertebral moderado.\nTratamiento prescrito:\n1. Reposo médico domiciliario por tres (3) días.\n2. Diclofenac sódico 50 mg vía oral cada 8 horas por 5 días con las comidas.\n3. Complejo B una ampolla IM interdiaria por 3 dosis.\n4. Aplicar compresas tibias en zona lumbar 15 minutos 2 veces al día.",
            ],
            [
                'patient' => $secondaryEmployee,
                'doctor' => $cardioDoc,
                'days_ago' => 10,
                'time' => '09:00',
                'reason' => 'Evaluación cardiovascular por fatiga y palpitaciones ocasionales',
                'notes' => "Electrocardiograma en ritmo sinusal, eje normal, sin alteraciones del segmento ST.\nDiagnóstico: Taquicardia sinusal leve asociada a estrés laboral.\nIndicaciones:\n1. Disminución de consumo de cafeína y bebidas energizantes.\n2. Ejercicio aeróbico ligero 30 min diarios.\n3. Reevaluación en 3 meses con Holter de 24 horas si persisten síntomas.",
            ],
            [
                'patient' => $patients->get(2) ?? $primaryEmployee,
                'doctor' => $dentalDoc,
                'days_ago' => 5,
                'time' => '09:30',
                'reason' => 'Limpieza dental semestral y evaluación general',
                'notes' => "Profilaxis dental completa ultrasónica realizada exitosamente. Se aplicó flúor tópico.\nSin presencia de caries activas. Próximo control en 6 meses.",
            ],
            [
                'patient' => $patients->get(3) ?? $primaryEmployee,
                'doctor' => $nutritionDoc,
                'days_ago' => 4,
                'time' => '10:00',
                'reason' => 'Plan de nutrición y asesoría dietética laboral',
                'notes' => "Peso: 78 kg. Talla: 1.72 m. IMC: 26.3 (Sobrepeso leve).\nSe estructuró plan hipocalórico de 1800 kcal con aumento de ingesta proteica y vegetales.\nControl antropométrico en 30 días.",
            ],
            [
                'patient' => $patients->get(4) ?? $primaryEmployee,
                'doctor' => $generalDoc,
                'days_ago' => 2,
                'time' => '09:00',
                'reason' => 'Control de glicemia y síndrome metabólico',
                'notes' => "Glicemia basal en 98 mg/dl. Parámetros estables con medicación actual.\nContinuar Metformina 850 mg con el almuerzo.",
            ],
        ];

        foreach ($historyData as $idx => $item) {
            $date = $today->copy()->subDays($item['days_ago'])->toDateString();
            $startTime = $item['time'];
            $endTime = Carbon::parse($startTime)->addMinutes(30)->format('H:i');

            $apt = Appointment::updateOrCreate(
                [
                    'doctor_id' => $item['doctor']->id,
                    'scheduled_date' => $date,
                    'start_time' => $startTime,
                ],
                [
                    'patient_id' => $item['patient']->id,
                    'specialty_id' => $item['doctor']->specialty_id,
                    'location_id' => $item['doctor']->location_id,
                    'end_time' => $endTime,
                    'status' => AppointmentStatus::Completed,
                    'reason' => $item['reason'],
                    'notes' => $item['notes'],
                    'created_by' => $adminUser?->id,
                    'confirmed_at' => Carbon::parse("{$date} {$startTime}")->subHour(),
                    'started_at' => Carbon::parse("{$date} {$startTime}"),
                    'completed_at' => Carbon::parse("{$date} {$endTime}"),
                ]
            );

            AppointmentStatusHistory::firstOrCreate(
                ['appointment_id' => $apt->id, 'to_status' => 'completed'],
                [
                    'from_status' => 'in_progress',
                    'changed_by' => $adminUser?->id,
                    'comment' => 'Consulta médica completada e indicaciones prescritas.',
                    'created_at' => $apt->completed_at ?? now(),
                ]
            );
        }

        // ── 2. TODAY'S APPOINTMENTS ──────────────────────────────────────────
        $todayDate = $today->toDateString();

        $todayAppointments = [
            [
                'patient' => $patients->get(5) ?? $primaryEmployee,
                'doctor' => $generalDoc,
                'start' => '08:00',
                'status' => AppointmentStatus::Completed,
                'reason' => 'Cefalea tensional recurrente',
                'notes' => "Cefalea tensional por contractura cervical.\nSe indica reposo de jornada laboral e Ibuprofeno 400 mg.",
            ],
            [
                'patient' => $primaryEmployee,
                'doctor' => $generalDoc,
                'start' => '09:00',
                'status' => AppointmentStatus::InProgress,
                'reason' => 'Revisión y reevaluación de evolución clínica',
                'notes' => null,
            ],
            [
                'patient' => $secondaryEmployee,
                'doctor' => $cardioDoc,
                'start' => '10:00',
                'status' => AppointmentStatus::Confirmed,
                'reason' => 'Entrega de resultados de ecocardiograma',
                'notes' => null,
            ],
            [
                'patient' => $patients->get(6) ?? $primaryEmployee,
                'doctor' => $traumaDoc,
                'start' => '14:00',
                'status' => AppointmentStatus::Pending,
                'reason' => 'Molestia en articulación del hombro derecho',
                'notes' => null,
            ],
        ];

        foreach ($todayAppointments as $item) {
            $start = $item['start'];
            $end = Carbon::parse($start)->addMinutes(30)->format('H:i');

            $apt = Appointment::updateOrCreate(
                [
                    'doctor_id' => $item['doctor']->id,
                    'scheduled_date' => $todayDate,
                    'start_time' => $start,
                ],
                [
                    'patient_id' => $item['patient']->id,
                    'specialty_id' => $item['doctor']->specialty_id,
                    'location_id' => $item['doctor']->location_id,
                    'end_time' => $end,
                    'status' => $item['status'],
                    'reason' => $item['reason'],
                    'notes' => $item['notes'],
                    'created_by' => $adminUser?->id,
                    'confirmed_at' => in_array($item['status'], [AppointmentStatus::Confirmed, AppointmentStatus::InProgress, AppointmentStatus::Completed])
                        ? now()->subMinutes(45) : null,
                    'started_at' => in_array($item['status'], [AppointmentStatus::InProgress, AppointmentStatus::Completed])
                        ? now()->subMinutes(15) : null,
                    'completed_at' => $item['status'] === AppointmentStatus::Completed ? now() : null,
                ]
            );

            AppointmentStatusHistory::firstOrCreate(
                ['appointment_id' => $apt->id, 'to_status' => $item['status']->value],
                [
                    'from_status' => null,
                    'changed_by' => $adminUser?->id,
                    'comment' => "Estado inicial asignado: {$item['status']->value}",
                ]
            );
        }

        // ── 3. FUTURE APPOINTMENTS (Next 7 days) ──────────────────────────────
        $futureDays = [1, 2, 3, 4];
        foreach ($futureDays as $offset) {
            $futureDate = $today->copy()->addDays($offset);
            // Skip weekends
            if ($futureDate->isWeekend()) {
                continue;
            }

            $dateStr = $futureDate->toDateString();
            $doc = $doctors->get($offset % $doctors->count());
            $patient = $patients->get(($offset + 2) % $patients->count());

            Appointment::updateOrCreate(
                [
                    'doctor_id' => $doc->id,
                    'scheduled_date' => $dateStr,
                    'start_time' => '10:00',
                ],
                [
                    'patient_id' => $patient->id,
                    'specialty_id' => $doc->specialty_id,
                    'location_id' => $doc->location_id,
                    'end_time' => '10:30',
                    'status' => $offset % 2 === 0 ? AppointmentStatus::Confirmed : AppointmentStatus::Pending,
                    'reason' => 'Consulta preventiva programada con especialista',
                    'created_by' => $adminUser?->id,
                ]
            );
        }

        // ── 4. CANCELLED APPOINTMENT ──────────────────────────────────────────
        $yesterday = $today->copy()->subDay()->toDateString();
        Appointment::updateOrCreate(
            [
                'doctor_id' => $generalDoc->id,
                'scheduled_date' => $yesterday,
                'start_time' => '11:00',
            ],
            [
                'patient_id' => $patients->last()->id,
                'specialty_id' => $generalDoc->specialty_id,
                'location_id' => $generalDoc->location_id,
                'end_time' => '11:30',
                'status' => AppointmentStatus::Cancelled,
                'reason' => 'Evaluación de dolor cervical',
                'cancellation_reason' => 'Paciente notifica imposibilidad de traslado por guardia operativa.',
                'cancelled_at' => now()->subDay(),
                'cancelled_by' => $adminUser?->id,
            ]
        );
    }
}

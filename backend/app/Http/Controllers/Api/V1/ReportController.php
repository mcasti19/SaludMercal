<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AppointmentStatus;
use App\Enums\MedicalLeaveStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\MedicalLeave;
use App\Models\Patient;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Aggregated figures for the dashboard and reports screens.
 */
class ReportController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        abort_unless($request->user()->role->isStaff(), 403);

        $filters = $request->validate([
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        $from = $filters['date_from'] ?? now()->startOfMonth()->toDateString();
        $to = $filters['date_to'] ?? now()->endOfMonth()->toDateString();

        $range = fn () => Appointment::query()
            ->visibleTo($request->user())
            ->whereDate('scheduled_date', '>=', $from)
            ->whereDate('scheduled_date', '<=', $to);

        $byStatus = $range()->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');
        $total = (int) $byStatus->sum();
        $completed = (int) ($byStatus[AppointmentStatus::Completed->value] ?? 0);

        return response()->json(['data' => [
            'range' => ['from' => $from, 'to' => $to],
            'appointments' => [
                'total' => $total,
                'completion_rate' => $total > 0 ? round($completed / $total * 100, 1) : 0.0,
                'by_status' => collect(AppointmentStatus::values())->mapWithKeys(fn ($s) => [$s => (int) ($byStatus[$s] ?? 0)]),
                'today' => Appointment::query()->visibleTo($request->user())->whereDate('scheduled_date', now()->toDateString())->count(),
                'by_specialty' => $range()
                    ->join('specialties', 'specialties.id', '=', 'appointments.specialty_id')
                    ->selectRaw('specialties.id, specialties.name, COUNT(*) as total')
                    ->groupBy('specialties.id', 'specialties.name')->orderByDesc('total')->get(),
                'by_doctor' => $range()
                    ->join('doctors', 'doctors.id', '=', 'appointments.doctor_id')
                    ->selectRaw('doctors.id, doctors.first_name, doctors.last_name, COUNT(*) as total')
                    ->groupBy('doctors.id', 'doctors.first_name', 'doctors.last_name')->orderByDesc('total')->get(),
            ],
            'patients' => ['total' => Patient::count(), 'active' => Patient::where('is_active', true)->count()],
            'medical_leaves' => [
                'pending' => MedicalLeave::where('status', MedicalLeaveStatus::Pending)->count(),
                'approved_in_range' => MedicalLeave::where('status', MedicalLeaveStatus::Approved)
                    ->whereDate('start_date', '>=', $from)->whereDate('start_date', '<=', $to)->count(),
            ],
        ]]);
    }

    /** Neutralises spreadsheet formula injection (=, +, -, @, tab, CR) in user-provided text. */
    private static function csvCell(?string $value): string
    {
        $value ??= '';

        return $value !== '' && str_contains("=+-@\t\r", $value[0]) ? "'".$value : $value;
    }

    public function export(Request $request): Response|StreamedResponse
    {
        abort_unless($request->user()->role->isStaff(), 403);

        $validated = $request->validate([
            'format' => ['nullable', 'in:csv,pdf'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        $format = $validated['format'] ?? 'csv';
        $from = $validated['date_from'] ?? now()->startOfMonth()->toDateString();
        $to = $validated['date_to'] ?? now()->endOfMonth()->toDateString();

        if ($format === 'pdf') {
            $range = fn () => Appointment::query()
                ->visibleTo($request->user())
                ->whereDate('scheduled_date', '>=', $from)
                ->whereDate('scheduled_date', '<=', $to);

            $byStatus = $range()->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');
            $total = (int) $byStatus->sum();
            $completed = (int) ($byStatus[AppointmentStatus::Completed->value] ?? 0);

            $bySpecialty = $range()
                ->join('specialties', 'specialties.id', '=', 'appointments.specialty_id')
                ->selectRaw('specialties.id, specialties.name, COUNT(*) as total')
                ->groupBy('specialties.id', 'specialties.name')
                ->orderByDesc('total')
                ->get();

            $byDoctor = $range()
                ->join('doctors', 'doctors.id', '=', 'appointments.doctor_id')
                ->selectRaw('doctors.id, doctors.first_name, doctors.last_name, COUNT(*) as total')
                ->groupBy('doctors.id', 'doctors.first_name', 'doctors.last_name')
                ->orderByDesc('total')
                ->get();

            $leavesByDept = MedicalLeave::query()
                ->where('status', MedicalLeaveStatus::Approved)
                ->whereDate('start_date', '>=', $from)
                ->whereDate('start_date', '<=', $to)
                ->join('patients', 'patients.id', '=', 'medical_leaves.patient_id')
                ->leftJoin('departments', 'departments.id', '=', 'patients.department_id')
                ->selectRaw("COALESCE(departments.name, 'Sin Departamento') as name, COUNT(medical_leaves.id) as total_leaves, SUM(medical_leaves.days) as total_days")
                ->groupBy('name')
                ->orderByDesc('total_days')
                ->get();

            $pdf = Pdf::loadView('pdf.report_summary', [
                'from' => $from,
                'to' => $to,
                'totalAppointments' => $total,
                'completedAppointments' => $completed,
                'completionRate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
                'totalLeavesApproved' => (int) $leavesByDept->sum('total_leaves'),
                'byStatus' => $byStatus,
                'bySpecialty' => $bySpecialty,
                'byDoctor' => $byDoctor,
                'leavesByDept' => $leavesByDept,
                'generatedAt' => now(),
            ]);

            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "attachment; filename=\"reporte_ejecutivo_{$from}_{$to}.pdf\"",
            ]);
        }

        // CSV Export
        $filename = "reporte_saludmercal_{$from}_{$to}.csv";

        $appointments = Appointment::query()
            ->visibleTo($request->user())
            ->whereDate('scheduled_date', '>=', $from)
            ->whereDate('scheduled_date', '<=', $to)
            ->with(['patient.department', 'doctor', 'specialty'])
            ->orderBy('scheduled_date')
            ->orderBy('start_time')
            ->get();

        $leaves = MedicalLeave::query()
            ->visibleTo($request->user())
            ->whereDate('start_date', '>=', $from)
            ->whereDate('start_date', '<=', $to)
            ->with(['patient.department', 'doctor'])
            ->orderBy('start_date')
            ->get();

        $cell = self::csvCell(...);

        return response()->streamDownload(function () use ($appointments, $leaves, $from, $to, $cell) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM so Excel opens it with proper encoding
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, ['MERCADOS DE ALIMENTOS, C.A. (MERCAL) - REPORTE DE GESTIÓN DE SALUD']);
            fputcsv($handle, ["Período: {$from} al {$to}"]);
            fputcsv($handle, ['Generado:', now()->toDateTimeString()]);
            fputcsv($handle, []);

            // 1. Citas
            fputcsv($handle, ['--- CITAS MÉDICAS ---']);
            fputcsv($handle, ['ID', 'Fecha', 'Hora', 'Paciente', 'Cédula', 'Departamento', 'Médico', 'Especialidad', 'Estado', 'Motivo']);

            foreach ($appointments as $a) {
                fputcsv($handle, [
                    $a->id,
                    $a->scheduled_date->toDateString(),
                    substr($a->start_time, 0, 5),
                    $cell($a->patient ? "{$a->patient->first_name} {$a->patient->last_name}" : 'N/A'),
                    $cell($a->patient?->national_id ?? 'N/A'),
                    $cell($a->patient?->department?->name ?? 'General'),
                    $cell($a->doctor ? "Dr. {$a->doctor->first_name} {$a->doctor->last_name}" : 'N/A'),
                    $cell($a->specialty?->name ?? 'N/A'),
                    strtoupper($a->status->value),
                    $cell($a->reason),
                ]);
            }

            fputcsv($handle, []);
            // 2. Reposos
            fputcsv($handle, ['--- REPOSOS MÉDICOS ---']);
            fputcsv($handle, ['ID', 'Empleado', 'Cédula', 'Departamento', 'Tipo', 'Días', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Diagnóstico']);

            foreach ($leaves as $l) {
                fputcsv($handle, [
                    $l->id,
                    $cell($l->patient ? "{$l->patient->first_name} {$l->patient->last_name}" : 'N/A'),
                    $cell($l->patient?->national_id ?? 'N/A'),
                    $cell($l->patient?->department?->name ?? 'General'),
                    strtoupper($l->type->value),
                    $l->days,
                    $l->start_date->toDateString(),
                    $l->end_date->toDateString(),
                    strtoupper($l->status->value),
                    $cell($l->diagnosis),
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}

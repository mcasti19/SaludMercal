<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AppointmentStatus;
use App\Enums\MedicalLeaveStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\MedicalLeave;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}

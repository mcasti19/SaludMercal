<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use App\Models\ServiceCommission;
use App\Services\PatientDirectoryService;
use App\Support\NationalId;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Comisiones de servicio: employees of other sedes temporarily attended in the user's sede. */
class ServiceCommissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ServiceCommission::class);

        $commissions = ServiceCommission::query()
            ->with(['patient.location', 'location', 'registrar'])
            ->active()
            ->latest('id')
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => $commissions->getCollection()->map(fn (ServiceCommission $c) => $this->payload($c))->values(),
            'meta' => ['current_page' => $commissions->currentPage(), 'last_page' => $commissions->lastPage(), 'total' => $commissions->total()],
        ]);
    }

    /** The patient is looked up by national ID: reception cannot list other sedes' patients. */
    public function store(Request $request, PatientDirectoryService $directory): JsonResponse
    {
        $this->authorize('create', ServiceCommission::class);

        $request->merge(['national_id' => NationalId::normalise($request->input('national_id'))]);
        $data = $request->validate([
            'national_id' => ['required', 'string', 'regex:'.NationalId::REGEX],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        // Employees who are not patients yet are opened from the corporate directory with their origin sede.
        $patient = Patient::withoutGlobalScopes()->where('national_id', $data['national_id'])->first()
            ?? $directory->importForCommission($data['national_id']);

        if ($request->user()->canAccessLocation($patient->location_id)) {
            return response()->json(['message' => 'The employee already belongs to your sede or group.'], 422);
        }

        $existing = ServiceCommission::query()->active()->where('patient_id', $patient->id)->where('location_id', $request->user()->location_id)->first();
        $commission = $existing ?? ServiceCommission::create([
            'patient_id' => $patient->id,
            'registered_by' => $request->user()->id,
            'reason' => $data['reason'] ?? null,
        ]);

        return response()->json(['data' => $this->payload($commission->load(['patient.location', 'location', 'registrar']))], $existing ? 200 : 201);
    }

    public function end(ServiceCommission $serviceCommission): JsonResponse
    {
        $this->authorize('end', $serviceCommission);

        $serviceCommission->update(['ended_at' => now()]);

        return response()->json(['data' => $this->payload($serviceCommission->load(['patient.location', 'location', 'registrar']))]);
    }

    /** @return array<string, mixed> */
    private function payload(ServiceCommission $c): array
    {
        return [
            'id' => $c->id,
            'reason' => $c->reason,
            'ended_at' => $c->ended_at?->toIso8601String(),
            'created_at' => $c->created_at?->toIso8601String(),
            'patient' => new PatientResource($c->patient),
            'origin_location' => ['id' => $c->patient->location?->id, 'name' => $c->patient->location?->name],
            'destination_location' => ['id' => $c->location?->id, 'name' => $c->location?->name],
            'registered_by' => $c->registrar?->name,
        ];
    }
}

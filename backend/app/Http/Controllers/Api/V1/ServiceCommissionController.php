<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use App\Models\ServiceCommission;
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
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', ServiceCommission::class);

        $request->merge(['national_id' => self::normalizeId($request->input('national_id'))]);
        $data = $request->validate([
            'national_id' => ['required', 'string', 'regex:'.self::NATIONAL_ID_REGEX],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $patient = Patient::withoutGlobalScopes()->where('national_id', $data['national_id'])->first();
        abort_unless($patient, 404, 'No employee was found with that national ID.');

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

    private const NATIONAL_ID_REGEX = '/^[VE]-\d{5,9}$/';

    private static function normalizeId(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $clean = strtoupper(preg_replace('/[\s.\-]/', '', $value));

        return preg_match('/^([VE])(\d+)$/', $clean, $m) ? $m[1].'-'.$m[2] : $value;
    }
}

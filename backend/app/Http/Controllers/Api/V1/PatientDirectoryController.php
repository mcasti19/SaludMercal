<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use App\Services\PatientDirectoryService;
use App\Support\NationalId;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Opens patient expedientes from the corporate employee directory ("Buscar empleado por cédula"). */
class PatientDirectoryController extends Controller
{
    public function __construct(private readonly PatientDirectoryService $directory) {}

    public function lookup(Request $request): JsonResponse
    {
        $this->authorize('create', Patient::class);

        $nationalId = $this->nationalId($request);
        $result = $this->directory->lookup($request->user(), $nationalId);

        if ($result['status'] === PatientDirectoryService::NOT_FOUND) {
            return response()->json(['message' => $this->directory->message($result['status']), 'status' => $result['status']], 404);
        }

        $record = $result['record'] ?? null;

        return response()->json(['data' => [
            'status' => $result['status'],
            'message' => $this->directory->message($result['status']),
            'patient' => isset($result['patient']) ? new PatientResource($result['patient']) : null,
            'origin_sede' => $result['origin'] ?? null,
            'employee' => $record ? [
                'national_id' => $record->nationalId,
                'first_name' => $record->firstName,
                'last_name' => $record->lastName,
                'birth_date' => $record->birthDate,
                'job_title' => $record->jobTitle,
                'department' => $record->department,
                'sede' => $result['location']->name ?? $record->sede,
                'is_active' => $record->isActive,
            ] : null,
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Patient::class);

        $patient = $this->directory->create($request->user(), $this->nationalId($request));

        return (new PatientResource($patient->refresh()->load(['department', 'location', 'beneficiaries'])))
            ->response()->setStatusCode(201);
    }

    public function sync(Patient $patient): PatientResource|JsonResponse
    {
        $this->authorize('update', $patient);

        if (! $this->directory->sync($patient)) {
            return response()->json(['message' => 'The employee could not be refreshed from the corporate directory.'], 422);
        }

        return new PatientResource($patient->refresh()->load(['department', 'location', 'beneficiaries']));
    }

    private function nationalId(Request $request): string
    {
        $request->merge(['national_id' => NationalId::normalise($request->input('national_id'))]);

        return $request->validate(['national_id' => ['required', 'string', 'regex:'.NationalId::REGEX]])['national_id'];
    }
}

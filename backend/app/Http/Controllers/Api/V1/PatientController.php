<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class PatientController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Patient::class);

        $patients = Patient::query()
            ->with(['department', 'location'])
            ->visibleTo($request->user())
            ->search($request->query('search'))
            ->when($request->filled('department_id'), fn ($q) => $q->where('department_id', $request->integer('department_id')))
            ->when($request->filled('location_id'), fn ($q) => $q->where('location_id', $request->integer('location_id')))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('last_name')->orderBy('first_name')
            ->paginate($this->perPage($request));

        return PatientResource::collection($patients);
    }

    public function show(Patient $patient): PatientResource
    {
        $this->authorize('view', $patient);

        return new PatientResource($patient->load(['department', 'location']));
    }

    /** The patient record linked to the authenticated user (employee portal). */
    public function me(Request $request): PatientResource
    {
        $patient = $request->user()->patient()->with(['department', 'location'])->firstOrFail();

        return new PatientResource($patient);
    }

    public function store(PatientRequest $request): JsonResponse
    {
        $this->authorize('create', Patient::class);

        $patient = Patient::create($request->validated());

        return (new PatientResource($patient->refresh()->load(['department', 'location'])))
            ->response()->setStatusCode(201);
    }

    public function update(PatientRequest $request, Patient $patient): PatientResource
    {
        $this->authorize('update', $patient);

        $patient->update($request->validated());

        return new PatientResource($patient->load(['department', 'location']));
    }

    public function destroy(Patient $patient): Response|JsonResponse
    {
        $this->authorize('delete', $patient);

        if ($patient->appointments()->occupyingSlot()->exists()) {
            return response()->json(['message' => 'The patient has active appointments.'], 409);
        }

        $patient->delete();

        return response()->noContent();
    }
}

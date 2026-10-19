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
            ->with(['department', 'location', 'beneficiaries'])
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

        return new PatientResource(
            $patient->load([
                'department',
                'location',
                'beneficiaries' => fn ($q) => $q->orderBy('id'),
                'appointments' => fn ($q) => $q->orderByDesc('scheduled_date')->orderByDesc('start_time'),
                'appointments.doctor.specialty',
                'appointments.location',
                'appointments.beneficiary',
                'medicalLeaves' => fn ($q) => $q->orderByDesc('start_date'),
                'medicalLeaves.doctor',
                'medicalLeaves.reviewer',
            ])
        );
    }

    /** The patient record linked to the authenticated user (employee portal). */
    public function me(Request $request): PatientResource
    {
        $patient = $request->user()->patient()->with(['department', 'location', 'beneficiaries'])->firstOrFail();

        return new PatientResource($patient);
    }

    public function store(PatientRequest $request): JsonResponse
    {
        $this->authorize('create', Patient::class);

        $data = $request->validated();
        $beneficiariesData = $data['beneficiaries'] ?? null;
        unset($data['beneficiaries']);

        $patient = \Illuminate\Support\Facades\DB::transaction(function () use ($data, $beneficiariesData) {
            $patient = Patient::create($data);

            if (is_array($beneficiariesData)) {
                foreach ($beneficiariesData as $bData) {
                    if (empty($bData['_delete'])) {
                        unset($bData['_delete'], $bData['id']);
                        $patient->beneficiaries()->create($bData);
                    }
                }
            }

            return $patient;
        });

        return (new PatientResource($patient->refresh()->load(['department', 'location', 'beneficiaries'])))
            ->response()->setStatusCode(201);
    }

    public function update(PatientRequest $request, Patient $patient): PatientResource
    {
        $this->authorize('update', $patient);

        $data = $request->validated();
        $beneficiariesData = $data['beneficiaries'] ?? null;
        unset($data['beneficiaries']);

        \Illuminate\Support\Facades\DB::transaction(function () use ($patient, $data, $beneficiariesData) {
            $patient->update($data);

            if (is_array($beneficiariesData)) {
                foreach ($beneficiariesData as $bData) {
                    if (! empty($bData['_delete']) && ! empty($bData['id'])) {
                        $patient->beneficiaries()->where('id', $bData['id'])->delete();
                        continue;
                    }

                    unset($bData['_delete']);

                    if (! empty($bData['id'])) {
                        $beneficiary = $patient->beneficiaries()->where('id', $bData['id'])->first();
                        if ($beneficiary) {
                            $beneficiary->update($bData);
                        }
                    } else {
                        unset($bData['id']);
                        $patient->beneficiaries()->create($bData);
                    }
                }
            }
        });

        return new PatientResource($patient->load(['department', 'location', 'beneficiaries']));
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

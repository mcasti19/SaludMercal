<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\DoctorRequest;
use App\Http\Requests\DoctorTimeOffRequest;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use App\Models\DoctorTimeOff;
use App\Services\AppointmentService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class DoctorController extends Controller
{
    private const RELATIONS = ['specialty', 'specialties', 'location', 'schedules'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Doctor::class);

        $doctors = Doctor::query()
            ->with(self::RELATIONS)
            ->search($request->query('search'))
            ->when($request->filled('specialty_id'), fn ($q) => $q->whereHas('specialties', fn ($s) => $s->whereKey($request->integer('specialty_id'))))
            ->when($request->filled('location_id'), fn ($q) => $q->where('location_id', $request->integer('location_id')))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('last_name')->orderBy('first_name')
            ->paginate($this->perPage($request));

        return DoctorResource::collection($doctors);
    }

    public function show(Doctor $doctor): DoctorResource
    {
        $this->authorize('view', $doctor);

        return new DoctorResource($doctor->load([...self::RELATIONS, 'timeOffs']));
    }

    public function store(DoctorRequest $request): JsonResponse
    {
        $this->authorize('create', Doctor::class);

        $doctor = DB::transaction(function () use ($request) {
            $doctor = Doctor::create($request->safe()->except('schedules', 'specialty_ids', 'specialty_id') + [
                'specialty_id' => $request->specialtyIds()[0],
            ]);
            $doctor->assignSpecialties($request->specialtyIds(), $request->primarySpecialtyId());
            $doctor->schedules()->createMany($request->validated('schedules', []));

            return $doctor;
        });

        return (new DoctorResource($doctor->refresh()->load(self::RELATIONS)))
            ->response()->setStatusCode(201);
    }

    public function update(DoctorRequest $request, Doctor $doctor): DoctorResource
    {
        $this->authorize('update', $doctor);

        DB::transaction(function () use ($request, $doctor) {
            $doctor->update($request->safe()->except('schedules', 'specialty_ids', 'specialty_id'));

            if ($request->specialtyIds() !== null) {
                $doctor->assignSpecialties($request->specialtyIds(), $request->primarySpecialtyId());
            }

            if ($request->has('schedules')) {
                $doctor->schedules()->delete();
                $doctor->schedules()->createMany($request->validated('schedules'));
            }
        });

        return new DoctorResource($doctor->fresh([...self::RELATIONS, 'timeOffs']));
    }

    public function destroy(Doctor $doctor): Response|JsonResponse
    {
        $this->authorize('delete', $doctor);

        if ($doctor->appointments()->occupyingSlot()->exists()) {
            return response()->json(['message' => 'The doctor has active appointments. Deactivate the doctor instead.'], 409);
        }

        $doctor->delete();

        return response()->noContent();
    }

    /** Free time slots of a doctor for a given date. */
    public function availability(Request $request, Doctor $doctor, AppointmentService $appointments): JsonResponse
    {
        $this->authorize('view', $doctor);

        $validated = $request->validate(['date' => ['required', 'date_format:Y-m-d']]);
        $date = CarbonImmutable::parse($validated['date']);

        return response()->json([
            'doctor_id' => $doctor->id,
            'date' => $date->toDateString(),
            'slots' => $appointments->availableSlots($doctor, $date),
        ]);
    }

    public function storeTimeOff(DoctorTimeOffRequest $request, Doctor $doctor): JsonResponse
    {
        $this->authorize('update', $doctor);

        $timeOff = $doctor->timeOffs()->create($request->validated());

        return response()->json(['data' => [
            'id' => $timeOff->id,
            'start_date' => $timeOff->start_date->toDateString(),
            'end_date' => $timeOff->end_date->toDateString(),
            'reason' => $timeOff->reason,
        ]], 201);
    }

    public function destroyTimeOff(Doctor $doctor, DoctorTimeOff $timeOff): Response
    {
        $this->authorize('update', $doctor);
        abort_unless($timeOff->doctor_id === $doctor->id, 404);

        $timeOff->delete();

        return response()->noContent();
    }
}

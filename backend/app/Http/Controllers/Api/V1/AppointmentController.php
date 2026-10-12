<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Concerns\ResolvesPatientId;
use App\Http\Controllers\Controller;
use App\Http\Requests\RescheduleAppointmentRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\TransitionAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    use ResolvesPatientId;

    private const RELATIONS = ['patient', 'doctor.specialty', 'specialty'];

    public function __construct(private readonly AppointmentService $appointments) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Appointment::class);

        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(AppointmentStatus::class)],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'doctor_id' => ['nullable', 'integer'],
            'patient_id' => ['nullable', 'integer'],
            'specialty_id' => ['nullable', 'integer'],
            'sort' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $appointments = Appointment::query()
            ->with(self::RELATIONS)
            ->visibleTo($request->user())
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['date'] ?? null, fn ($q, $v) => $q->whereDate('scheduled_date', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('scheduled_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('scheduled_date', '<=', $v))
            ->when($filters['doctor_id'] ?? null, fn ($q, $v) => $q->where('doctor_id', $v))
            ->when($filters['patient_id'] ?? null, fn ($q, $v) => $q->where('patient_id', $v))
            ->when($filters['specialty_id'] ?? null, fn ($q, $v) => $q->where('specialty_id', $v))
            ->when($request->filled('search'), fn ($q) => $q->where(fn ($q) => $q
                ->where('code', 'like', '%'.strtoupper($request->string('search')->toString()).'%')
                ->orWhereHas('patient', fn ($p) => $p->search($request->string('search')->toString()))))
            ->orderBy('scheduled_date', $filters['sort'] ?? 'asc')
            ->orderBy('start_time', $filters['sort'] ?? 'asc')
            ->paginate($this->perPage($request));

        return AppointmentResource::collection($appointments);
    }

    public function show(Appointment $appointment): AppointmentResource
    {
        $this->authorize('view', $appointment);

        return new AppointmentResource($appointment->load([...self::RELATIONS, 'statusHistory']));
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $this->authorize('create', Appointment::class);

        $data = $request->validated();
        $data['patient_id'] = $this->resolvePatientId($request->user(), $data['patient_id'] ?? null);

        $appointment = $this->appointments->book($data, $request->user());

        return (new AppointmentResource($appointment->load([...self::RELATIONS, 'statusHistory'])))
            ->response()->setStatusCode(201);
    }

    public function reschedule(RescheduleAppointmentRequest $request, Appointment $appointment): AppointmentResource
    {
        $this->authorize('reschedule', $appointment);

        $appointment = $this->appointments->reschedule(
            $appointment,
            $request->validated('scheduled_date'),
            $request->validated('start_time'),
            $request->user(),
        );

        return new AppointmentResource($appointment->load([...self::RELATIONS, 'statusHistory']));
    }

    public function transition(TransitionAppointmentRequest $request, Appointment $appointment): AppointmentResource
    {
        $target = AppointmentStatus::from($request->validated('status'));

        $this->authorize('transition', [$appointment, $target]);

        $appointment = $this->appointments->transition($appointment, $target, $request->user(), $request->validated('comment'));

        return new AppointmentResource($appointment->load([...self::RELATIONS, 'statusHistory']));
    }

    public function destroy(Appointment $appointment): Response
    {
        $this->authorize('delete', $appointment);

        $appointment->delete();

        return response()->noContent();
    }
}

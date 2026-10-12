<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MedicalLeaveStatus;
use App\Http\Controllers\Concerns\ResolvesPatientId;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewMedicalLeaveRequest;
use App\Http\Requests\StoreMedicalLeaveRequest;
use App\Http\Resources\MedicalLeaveResource;
use App\Models\MedicalLeave;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MedicalLeaveController extends Controller
{
    use ResolvesPatientId;

    private const RELATIONS = ['patient', 'doctor'];

    private const DISK = 'local';

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', MedicalLeave::class);

        $leaves = MedicalLeave::query()
            ->with(self::RELATIONS)
            ->visibleTo($request->user())
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
            ->when($request->filled('patient_id'), fn ($q) => $q->where('patient_id', $request->integer('patient_id')))
            ->latest('start_date')->latest('id')
            ->paginate($this->perPage($request));

        return MedicalLeaveResource::collection($leaves);
    }

    public function show(MedicalLeave $medicalLeave): MedicalLeaveResource
    {
        $this->authorize('view', $medicalLeave);

        return new MedicalLeaveResource($medicalLeave->load(self::RELATIONS));
    }

    public function store(StoreMedicalLeaveRequest $request): JsonResponse
    {
        $this->authorize('create', MedicalLeave::class);

        $data = $request->safe()->except('attachment');
        $data['patient_id'] = $this->resolvePatientId($request->user(), $data['patient_id'] ?? null);
        $data['days'] = CarbonImmutable::parse($data['start_date'])->diffInDays(CarbonImmutable::parse($data['end_date'])) + 1;

        if ($request->hasFile('attachment')) {
            $data['attachment_path'] = $request->file('attachment')->store('medical-leaves', self::DISK);
        }

        $leave = MedicalLeave::create($data);

        return (new MedicalLeaveResource($leave->refresh()->load(self::RELATIONS)))
            ->response()->setStatusCode(201);
    }

    public function review(ReviewMedicalLeaveRequest $request, MedicalLeave $medicalLeave): MedicalLeaveResource
    {
        $this->authorize('review', $medicalLeave);

        abort_unless($medicalLeave->status === MedicalLeaveStatus::Pending, 409, 'This request was already reviewed.');

        $medicalLeave->update([
            'status' => $request->validated('status'),
            'review_notes' => $request->validated('review_notes'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return new MedicalLeaveResource($medicalLeave->load(self::RELATIONS));
    }

    public function attachment(MedicalLeave $medicalLeave): StreamedResponse
    {
        $this->authorize('view', $medicalLeave);
        abort_unless($medicalLeave->attachment_path && Storage::disk(self::DISK)->exists($medicalLeave->attachment_path), 404, 'Attachment not found.');

        return Storage::disk(self::DISK)->download($medicalLeave->attachment_path);
    }

    public function destroy(MedicalLeave $medicalLeave): Response
    {
        $this->authorize('delete', $medicalLeave);

        $medicalLeave->delete();

        return response()->noContent();
    }
}

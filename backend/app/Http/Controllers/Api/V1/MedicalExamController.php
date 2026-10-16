<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMedicalExamRequest;
use App\Http\Resources\MedicalExamResource;
use App\Models\MedicalExam;
use App\Models\Patient;
use App\Services\MedicalExamStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MedicalExamController extends Controller
{
    private const RELATIONS = ['specialty', 'files', 'uploader'];

    public function __construct(private readonly MedicalExamStorage $storage) {}

    public function index(Request $request, Patient $patient): AnonymousResourceCollection
    {
        $this->authorize('viewAny', MedicalExam::class);
        $this->authorize('view', $patient);

        $exams = MedicalExam::query()
            ->with(self::RELATIONS)
            ->visibleTo($request->user())
            ->where('patient_id', $patient->id)
            ->when($request->filled('specialty_id'), fn ($q) => $q->where('specialty_id', $request->integer('specialty_id')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('exam_date', '>=', $request->string('from')->toString()))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('exam_date', '<=', $request->string('to')->toString()))
            ->orderByDesc('exam_date')->orderByDesc('id')
            ->get();

        return MedicalExamResource::collection($exams);
    }

    public function store(StoreMedicalExamRequest $request, Patient $patient): JsonResponse
    {
        $this->authorize('create', MedicalExam::class);
        $this->authorize('view', $patient);

        $exam = DB::transaction(function () use ($request, $patient) {
            $exam = MedicalExam::create([
                ...$request->safe()->except('files'),
                'patient_id' => $patient->id,
                'location_id' => $patient->location_id,
                'uploaded_by' => $request->user()->id,
            ]);

            $this->storage->attach($exam, $request->file('files'));

            return $exam;
        });

        return (new MedicalExamResource($exam->refresh()->load(self::RELATIONS)))
            ->response()->setStatusCode(201);
    }

    public function show(MedicalExam $medicalExam): MedicalExamResource
    {
        $this->authorize('view', $medicalExam);

        $medicalExam->recordAudit('viewed');

        return new MedicalExamResource($medicalExam->load(self::RELATIONS));
    }

    /** Streams one file; `?download=1` forces a download instead of inline preview. */
    public function file(Request $request, MedicalExam $medicalExam, int $file): StreamedResponse
    {
        $this->authorize('view', $medicalExam);

        $examFile = $medicalExam->files()->findOrFail($file);
        $inline = ! $request->boolean('download');

        $medicalExam->recordAudit($inline ? 'viewed' : 'downloaded', [
            'file_id' => $examFile->id,
            'file_name' => $examFile->original_name,
        ]);

        return $this->storage->respond($examFile, $inline);
    }

    public function destroy(MedicalExam $medicalExam): Response
    {
        $this->authorize('delete', $medicalExam);

        $medicalExam->delete();

        return response()->noContent();
    }
}


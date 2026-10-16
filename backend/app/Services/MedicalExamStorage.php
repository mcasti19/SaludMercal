<?php

namespace App\Services;

use App\Models\MedicalExam;
use App\Models\MedicalExamFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Persists and serves the private files attached to a medical exam. */
class MedicalExamStorage
{
    private const DISK = 'local';

    private const DIRECTORY = 'medical-exams';

    /** @param  list<UploadedFile>  $files */
    public function attach(MedicalExam $exam, array $files): void
    {
        foreach ($files as $file) {
            $exam->files()->create([
                'path' => $file->store(self::DIRECTORY.'/'.$exam->patient_id, self::DISK),
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType() ?? $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);
        }
    }

    public function respond(MedicalExamFile $file, bool $inline): StreamedResponse
    {
        abort_unless(Storage::disk(self::DISK)->exists($file->path), 404, 'File not found.');

        $disposition = $inline ? 'inline' : 'attachment';

        return Storage::disk(self::DISK)->response($file->path, $file->original_name, [
            'Content-Type' => $file->mime_type,
            'Content-Disposition' => "{$disposition}; filename=\"".addslashes($file->original_name).'"',
        ]);
    }
}


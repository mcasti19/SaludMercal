<?php

namespace App\Http\Resources;

use App\Models\MedicalExam;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MedicalExam */
class MedicalExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'specialty_id' => $this->specialty_id,
            'specialty' => new CatalogResource($this->whenLoaded('specialty')),
            'appointment_id' => $this->appointment_id,
            'title' => $this->title,
            'exam_date' => $this->exam_date->toDateString(),
            'notes' => $this->notes,
            'uploaded_by' => $this->uploaded_by,
            'uploader_name' => $this->whenLoaded('uploader', fn () => $this->uploader?->name),
            'files' => $this->whenLoaded('files', fn () => $this->files->map(fn ($file) => [
                'id' => $file->id,
                'original_name' => $file->original_name,
                'mime_type' => $file->mime_type,
                'size' => $file->size,
            ])->values()),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}


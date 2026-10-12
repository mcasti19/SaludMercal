<?php

namespace App\Http\Resources;

use App\Models\MedicalLeave;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MedicalLeave */
class MedicalLeaveResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'doctor_id' => $this->doctor_id,
            'patient' => new PatientResource($this->whenLoaded('patient')),
            'doctor' => new DoctorResource($this->whenLoaded('doctor')),
            'type' => $this->type->value,
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'days' => $this->days,
            'diagnosis' => $this->diagnosis,
            'status' => $this->status->value,
            'has_attachment' => $this->attachment_path !== null,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'review_notes' => $this->review_notes,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

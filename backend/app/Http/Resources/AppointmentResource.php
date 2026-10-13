<?php

namespace App\Http\Resources;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Appointment */
class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'patient_id' => $this->patient_id,
            'doctor_id' => $this->doctor_id,
            'specialty_id' => $this->specialty_id,
            'location_id' => $this->location_id,
            'patient' => new PatientResource($this->whenLoaded('patient')),
            'doctor' => new DoctorResource($this->whenLoaded('doctor')),
            'specialty' => new CatalogResource($this->whenLoaded('specialty')),
            'location' => new CatalogResource($this->whenLoaded('location')),
            'scheduled_date' => $this->scheduled_date->toDateString(),
            'start_time' => substr($this->start_time, 0, 5),
            'end_time' => substr($this->end_time, 0, 5),
            'status' => $this->status->value,
            'reason' => $this->reason,
            'notes' => $this->notes,
            'cancellation_reason' => $this->cancellation_reason,
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'history' => $this->whenLoaded('statusHistory', fn () => $this->statusHistory->map(fn ($h) => [
                'from_status' => $h->from_status?->value,
                'to_status' => $h->to_status->value,
                'comment' => $h->comment,
                'changed_by' => $h->changed_by,
                'created_at' => $h->created_at?->toIso8601String(),
            ])->values()),
        ];
    }
}

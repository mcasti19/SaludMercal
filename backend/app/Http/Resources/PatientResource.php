<?php

namespace App\Http\Resources;

use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Patient */
class PatientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'national_id' => $this->national_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'birth_date' => $this->birth_date?->toDateString(),
            'gender' => $this->gender?->value,
            'phone' => $this->phone,
            'email' => $this->email,
            'department_id' => $this->department_id,
            'location_id' => $this->location_id,
            'department' => new CatalogResource($this->whenLoaded('department')),
            'location' => new CatalogResource($this->whenLoaded('location')),
            'appointments' => AppointmentResource::collection($this->whenLoaded('appointments')),
            'medical_leaves' => MedicalLeaveResource::collection($this->whenLoaded('medicalLeaves')),
            'job_title' => $this->job_title,
            'blood_type' => $this->blood_type,
            'allergies' => $this->allergies,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

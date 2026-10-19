<?php

namespace App\Http\Resources;

use App\Models\PatientBeneficiary;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PatientBeneficiary */
class PatientBeneficiaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'relationship' => $this->relationship,
            'relationship_label' => $this->relationship_label,
            'national_id' => $this->national_id,
            'birth_date' => $this->birth_date?->toDateString(),
            'gender' => $this->gender,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Doctor */
class DoctorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'specialty_id' => $this->specialty_id,
            'specialty' => new CatalogResource($this->whenLoaded('specialty')),
            'specialty_ids' => $this->whenLoaded('specialties', fn () => $this->specialties->pluck('id')->values()),
            'specialties' => CatalogResource::collection($this->whenLoaded('specialties')),
            'location_id' => $this->location_id,
            'location' => new CatalogResource($this->whenLoaded('location')),
            'national_id' => $this->national_id,
            'license_number' => $this->license_number,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'office' => $this->office,
            'photo_path' => $this->photo_path,
            'slot_duration_minutes' => $this->slot_duration_minutes,
            'is_active' => $this->is_active,
            'schedules' => $this->whenLoaded('schedules', fn () => $this->schedules->map(fn ($s) => [
                'day_of_week' => $s->day_of_week,
                'start_time' => substr($s->start_time, 0, 5),
                'end_time' => substr($s->end_time, 0, 5),
            ])->values()),
            'time_offs' => $this->whenLoaded('timeOffs', fn () => $this->timeOffs->map(fn ($t) => [
                'id' => $t->id,
                'start_date' => $t->start_date->toDateString(),
                'end_date' => $t->end_date->toDateString(),
                'reason' => $t->reason,
            ])->values()),
        ];
    }
}

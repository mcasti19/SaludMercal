<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'role' => $this->role->value,
            'is_active' => $this->is_active,
            'must_change_password' => $this->must_change_password,
            'password_expiration_months' => $this->password_expiration_months,
            'password_expires_at' => $this->password_expires_at?->toIso8601String(),
            'is_password_expired' => $this->isPasswordExpired(),
            'session_timeout_minutes' => $this->session_timeout_minutes,
            'national_id' => $this->patient?->national_id,
            'department' => $this->patient?->department?->name,
            'patient_id' => $this->patient?->id,
            'location_id' => $this->location_id,
            'location' => $this->location ? new CatalogResource($this->location) : null,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

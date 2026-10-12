<?php

namespace App\Http\Controllers\Concerns;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Validation\ValidationException;

trait ResolvesPatientId
{
    /**
     * Employees can only act for themselves; staff must say who the patient is.
     */
    protected function resolvePatientId(User $user, ?int $requested): int
    {
        if ($user->hasRole(UserRole::Employee)) {
            $own = $user->patient()->value('id');

            if (! $own) {
                throw ValidationException::withMessages(['patient_id' => ['Your account is not linked to a patient record.']]);
            }

            return $own;
        }

        if (! $requested) {
            throw ValidationException::withMessages(['patient_id' => ['The patient is required.']]);
        }

        return $requested;
    }
}

<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Patient;
use App\Models\User;

class PatientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->isStaff() || ($user->isDeveloper() && $user->hasClinicalAccess());
    }

    public function view(User $user, Patient $patient): bool
    {
        if ($user->hasNationalScope()) {
            return true;
        }

        if ($user->isDeveloper()) {
            return $user->hasClinicalAccess();
        }

        if ($user->role === UserRole::Employee) {
            return $patient->user_id === $user->id;
        }

        return $user->role->isStaff() && $user->canAccessLocation($patient->location_id);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::SuperAdmin, UserRole::Admin, UserRole::Receptionist);
    }

    public function update(User $user, Patient $patient): bool
    {
        if ($user->hasNationalScope()) {
            return true;
        }

        return $user->hasRole(UserRole::Admin, UserRole::Receptionist)
            && $user->canAccessLocation($patient->location_id);
    }

    public function delete(User $user, Patient $patient): bool
    {
        if ($user->hasNationalScope()) {
            return true;
        }

        return $user->isAdmin()
            && $user->canAccessLocation($patient->location_id);
    }
}

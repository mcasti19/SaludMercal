<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Patient;
use App\Models\User;

class PatientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->isStaff();
    }

    public function view(User $user, Patient $patient): bool
    {
        return $user->role->isStaff() || $patient->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Admin, UserRole::Receptionist);
    }

    public function update(User $user, Patient $patient): bool
    {
        return $user->hasRole(UserRole::Admin, UserRole::Receptionist);
    }

    public function delete(User $user, Patient $patient): bool
    {
        return $user->isAdmin();
    }
}

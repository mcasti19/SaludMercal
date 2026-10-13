<?php

namespace App\Policies;

use App\Models\Doctor;
use App\Models\User;

class DoctorPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Doctor $doctor): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Doctor $doctor): bool
    {
        if ($user->hasNationalScope()) {
            return true;
        }

        return $user->isAdmin()
            && (is_null($user->location_id) || $user->location_id === $doctor->location_id);
    }

    public function delete(User $user, Doctor $doctor): bool
    {
        if ($user->hasNationalScope()) {
            return true;
        }

        return $user->isAdmin()
            && (is_null($user->location_id) || $user->location_id === $doctor->location_id);
    }
}

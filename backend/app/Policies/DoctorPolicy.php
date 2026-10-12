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
        return $user->isAdmin();
    }

    public function delete(User $user, Doctor $doctor): bool
    {
        return $user->isAdmin();
    }
}

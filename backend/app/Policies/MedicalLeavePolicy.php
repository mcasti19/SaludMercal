<?php

namespace App\Policies;

use App\Enums\MedicalLeaveStatus;
use App\Enums\UserRole;
use App\Models\MedicalLeave;
use App\Models\Patient;
use App\Models\User;

class MedicalLeavePolicy
{
    public function viewAny(User $user): bool
    {
        return true; // results are always narrowed with MedicalLeave::visibleTo()
    }

    public function view(User $user, MedicalLeave $leave): bool
    {
        return MedicalLeave::query()->visibleTo($user)->whereKey($leave->getKey())->exists();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function review(User $user, MedicalLeave $leave): bool
    {
        return $user->hasRole(UserRole::Admin, UserRole::Doctor);
    }

    public function delete(User $user, MedicalLeave $leave): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $leave->status === MedicalLeaveStatus::Pending
            && Patient::query()->whereKey($leave->patient_id)->where('user_id', $user->id)->exists();
    }
}

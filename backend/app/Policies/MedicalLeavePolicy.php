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
        if ($user->isLogicalSecurity()) {
            return false;
        }

        return true; // results are always narrowed with MedicalLeave::visibleTo()
    }

    public function view(User $user, MedicalLeave $leave): bool
    {
        if ($user->isLogicalSecurity()) {
            return false;
        }

        return MedicalLeave::query()->visibleTo($user)->whereKey($leave->getKey())->exists();
    }

    public function create(User $user): bool
    {
        if ($user->isLogicalSecurity()) {
            return false;
        }

        return true;
    }

    public function review(User $user, MedicalLeave $leave): bool
    {
        if ($user->hasNationalScope()) {
            return true;
        }

        return $user->hasRole(UserRole::Admin, UserRole::Doctor)
            && $user->canAccessLocation($leave->location_id);
    }

    public function delete(User $user, MedicalLeave $leave): bool
    {
        if ($user->hasNationalScope()) {
            return true;
        }

        if ($user->isAdmin() && $user->canAccessLocation($leave->location_id)) {
            return true;
        }

        return $leave->status === MedicalLeaveStatus::Pending
            && Patient::query()->whereKey($leave->patient_id)->where('user_id', $user->id)->exists();
    }
}

<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\MedicalExam;
use App\Models\User;

class MedicalExamPolicy
{
    public function viewAny(User $user): bool
    {
        return ! $user->isLogicalSecurity();
    }

    public function view(User $user, MedicalExam $exam): bool
    {
        if ($user->isLogicalSecurity()) {
            return false;
        }

        return MedicalExam::query()->visibleTo($user)->whereKey($exam->getKey())->exists();
    }

    /** Clinical and administrative staff upload exams; employees only consult their own. */
    public function create(User $user): bool
    {
        return $user->hasRole(
            UserRole::SuperAdmin,
            UserRole::Admin,
            UserRole::Doctor,
            UserRole::Nurse,
            UserRole::Receptionist,
        );
    }

    public function delete(User $user, MedicalExam $exam): bool
    {
        if ($user->hasNationalScope()) {
            return true;
        }

        return $user->isAdmin()
            && (is_null($user->location_id) || $user->location_id === $exam->location_id);
    }
}


<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\ServiceCommission;
use App\Models\User;

class ServiceCommissionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->isStaff();
    }

    /** Reception (or the sede admin) of the destination sede registers the commission. */
    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Receptionist, UserRole::Admin) && $user->location_id !== null;
    }

    /** Closed by the destination's reception/admin or by the admin of the patient's origin sede. */
    public function end(User $user, ServiceCommission $commission): bool
    {
        if (! $user->hasRole(UserRole::Receptionist, UserRole::Admin)) {
            return false;
        }

        return $user->canAccessLocation($commission->location_id)
            || ($user->isAdmin() && $user->canAccessLocation($commission->patient->location_id));
    }
}

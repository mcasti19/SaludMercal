<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canManageUsers();
    }

    public function view(User $user, User $target): bool
    {
        if (! $user->canManageUsers()) {
            return false;
        }

        // Only the SuperAdmin can view their own SuperAdmin account; nobody else can view SuperAdmins.
        if ($target->isSuperAdmin()) {
            return $user->is($target);
        }

        if ($user->hasNationalUserScope()) {
            return true;
        }

        return is_null($user->location_id) || $user->location_id === $target->location_id;
    }

    public function create(User $user): bool
    {
        return $user->canManageUsers();
    }

    public function update(User $user, User $target): bool
    {
        if (! $user->canManageUsers()) {
            return false;
        }

        // Only SuperAdmin can modify SuperAdmin accounts, and only their own account
        if ($target->isSuperAdmin() && ! $user->is($target)) {
            return false;
        }

        // Only SuperAdmin or LogicalSecurity can modify LogicalSecurity accounts
        if ($target->isLogicalSecurity() && ! ($user->isSuperAdmin() || $user->isLogicalSecurity())) {
            return false;
        }

        if ($user->hasNationalUserScope()) {
            return true;
        }

        return is_null($user->location_id) || $user->location_id === $target->location_id;
    }

    /** Administrators cannot delete their own account or SuperAdmin accounts. */
    public function delete(User $user, User $target): bool
    {
        if ($user->is($target)) {
            return false;
        }

        if (! $user->canManageUsers()) {
            return false;
        }

        if ($target->isSuperAdmin()) {
            return false;
        }

        if ($target->isLogicalSecurity() && ! $user->isSuperAdmin()) {
            return false;
        }

        if ($user->hasNationalUserScope()) {
            return true;
        }

        return is_null($user->location_id) || $user->location_id === $target->location_id;
    }

    public function resetPassword(User $user, User $target): bool
    {
        return $this->update($user, $target);
    }
}

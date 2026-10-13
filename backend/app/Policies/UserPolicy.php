<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, User $target): bool
    {
        if ($user->hasNationalScope()) {
            return true;
        }

        return $user->isAdmin() && (is_null($user->location_id) || $user->location_id === $target->location_id);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, User $target): bool
    {
        if ($user->hasNationalScope()) {
            return true;
        }

        return $user->isAdmin() && (is_null($user->location_id) || $user->location_id === $target->location_id);
    }

    /** Administrators cannot delete their own account. */
    public function delete(User $user, User $target): bool
    {
        if ($user->is($target)) {
            return false;
        }

        if ($user->hasNationalScope()) {
            return true;
        }

        return $user->isAdmin() && (is_null($user->location_id) || $user->location_id === $target->location_id);
    }
}

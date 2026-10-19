<?php

namespace App\Policies;

use App\Models\User;

/**
 * Shared policy for lookup tables (departments, locations, specialties):
 * everyone authenticated can read, only the national super administrator can write.
 */
class CatalogPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function delete(User $user): bool
    {
        return $user->isSuperAdmin();
    }
}

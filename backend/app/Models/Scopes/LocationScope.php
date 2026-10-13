<?php

namespace App\Models\Scopes;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Ensures strict territorial isolation across Mercal medical sedes.
 * Staff members (Admins, Receptionists, Doctors, Nurses) are restricted to their assigned location,
 * while SuperAdmins retain national visibility across all 24 states and Sede Central.
 */
class LocationScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (! auth()->check()) {
            return;
        }

        $user = auth()->user();

        // 1. National scope users (SuperAdmin) or accounts with unassigned location
        if ($user->hasNationalScope() || is_null($user->location_id)) {
            return;
        }

        // 2. Regular employees only query their own records (handled via user_id / visibleTo)
        if ($user->role === UserRole::Employee) {
            return;
        }

        // 3. Staff members are strictly enclaustered to their assigned location
        $builder->where($model->qualifyColumn('location_id'), $user->location_id);
    }
}

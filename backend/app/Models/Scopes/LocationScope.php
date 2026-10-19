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

        // 1. National scope users (SuperAdmin)
        if ($user->hasNationalScope()) {
            return;
        }

        // 2. Employees (own records, via user_id / visibleTo) and logical security
        //    (blocked from clinical data by visibleTo) are not territorial staff.
        if (! $user->role->isStaff() || $user->role === UserRole::Employee) {
            return;
        }

        // 3. Staff without an assigned sede see nothing (fail closed)
        if (is_null($user->location_id)) {
            $builder->whereRaw('1 = 0');

            return;
        }

        // 4. Staff members are strictly enclaustered to their assigned location
        $builder->where($model->qualifyColumn('location_id'), $user->location_id);
    }
}

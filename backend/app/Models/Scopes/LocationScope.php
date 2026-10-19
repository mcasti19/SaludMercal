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

        // 2. Developer: national, but only while an emergency access is open
        if ($user->isDeveloper()) {
            if (! $user->hasClinicalAccess()) {
                $builder->whereRaw('1 = 0');
            }

            return;
        }

        // 3. Employees (own records, via user_id / visibleTo) and logical security
        //    (blocked from clinical data by visibleTo) are not territorial staff.
        if (! $user->role->isStaff() || $user->role === UserRole::Employee) {
            return;
        }

        // 4. Staff are confined to their sede and the sedes of their group (fail closed without sede)
        $ids = $user->accessibleLocationIds() ?? [];

        if ($ids === []) {
            $builder->whereRaw('1 = 0');

            return;
        }

        $builder->where(function (Builder $query) use ($model, $ids) {
            $query->whereIn($model->qualifyColumn('location_id'), $ids);

            if (method_exists($model, 'extendTerritorialScope')) {
                $model->extendTerritorialScope($query, $ids);
            }
        });
    }
}

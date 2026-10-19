<?php

namespace App\Models\Concerns;

use App\Enums\UserRole;
use App\Models\Location;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use App\Models\Scopes\LocationScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Trait for models with a location_id foreign key that must be enclaustered by sede.
 */
trait BelongsToLocation
{
    public static function bootBelongsToLocation(): void
    {
        static::addGlobalScope(new LocationScope());

        static::creating(function ($model) {
            if (auth()->check()) {
                $user = auth()->user();

                // Employees act across sedes (e.g. booking with a doctor of another sede):
                // the record keeps the location chosen by the domain service.
                if ($user->role === UserRole::Employee && $model->location_id) {
                    return;
                }

                if (! $user->hasNationalScope() && $user->location_id) {
                    // Strictly enforce model's location matches user's location
                    $model->location_id = $user->location_id;
                } elseif (empty($model->location_id) && $user->location_id) {
                    $model->location_id = $user->location_id;
                }
            }
        });
    }

    /**
     * Extra visibility granted on top of "the record belongs to one of my sedes". By default a record
     * tied to a patient is also visible to the sedes the patient belongs to, so the origin sede keeps
     * seeing what happened to its patients elsewhere.
     *
     * @param  list<int>  $locationIds
     */
    public function extendTerritorialScope(Builder $query, array $locationIds): void
    {
        if (in_array('patient_id', $this->getFillable(), true)) {
            $query->orWhereIn(
                $this->qualifyColumn('patient_id'),
                DB::table('patients')->select('id')->whereIn('location_id', $locationIds),
            );
        }
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}

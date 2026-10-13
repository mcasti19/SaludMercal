<?php

namespace App\Models\Concerns;

use App\Models\Location;
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

                if (! $user->hasNationalScope() && $user->location_id) {
                    // Strictly enforce model's location matches user's location
                    $model->location_id = $user->location_id;
                } elseif (empty($model->location_id) && $user->location_id) {
                    $model->location_id = $user->location_id;
                }
            }
        });
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}

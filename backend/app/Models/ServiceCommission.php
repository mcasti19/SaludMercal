<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToLocation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Comisión de servicio: an employee of another sede temporarily working in `location_id`
 * (the destination). The patient keeps belonging to their origin sede.
 */
class ServiceCommission extends Model
{
    use Auditable, BelongsToLocation;

    protected $fillable = ['patient_id', 'location_id', 'registered_by', 'reason', 'ended_at'];

    protected function casts(): array
    {
        return ['ended_at' => 'datetime'];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class)->withoutGlobalScopes();
    }

    public function registrar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('ended_at');
    }
}

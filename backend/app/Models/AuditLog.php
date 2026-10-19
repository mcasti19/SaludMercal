<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'location_id', 'event', 'auditable_type', 'auditable_id',
        'old_values', 'new_values', 'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    /** Audit entries a given user is allowed to read. */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasNationalScope()) {
            return $query;
        }

        if ($user->isLogicalSecurity()) {
            return $query->where('auditable_type', User::class);
        }

        // Developer: technical trail always; clinical trail (old/new values) only in an emergency access.
        if ($user->isDeveloper()) {
            return $user->hasClinicalAccess()
                ? $query
                : $query->whereIn('auditable_type', [User::class, EmergencyAccess::class]);
        }

        if ($user->isAdmin()) {
            return $query->whereIn('location_id', $user->accessibleLocationIds() ?? []);
        }

        return $query->whereRaw('1 = 0');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

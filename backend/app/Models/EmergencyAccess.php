<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A justified, time-boxed window in which the developer role may read clinical data. */
class EmergencyAccess extends Model
{
    use Auditable;

    public const DURATION_MINUTES = 30;

    protected $fillable = ['user_id', 'reason', 'ip_address', 'expires_at', 'ended_at'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'ended_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('ended_at')->where('expires_at', '>', now());
    }
}

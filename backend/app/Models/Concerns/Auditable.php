<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Records create/update/delete events of a model in the audit_logs table.
 */
trait Auditable
{
    /** Attributes that must never be written to the audit trail. */
    private static array $auditExcluded = ['password', 'remember_token', 'updated_at'];

    public static function bootAuditable(): void
    {
        static::created(fn (Model $model) => self::writeAudit($model, 'created', [], $model->getAttributes()));

        static::updated(function (Model $model) {
            $changes = $model->getChanges();
            $old = array_intersect_key($model->getRawOriginal(), $changes);

            self::writeAudit($model, 'updated', $old, $changes);
        });

        static::deleted(fn (Model $model) => self::writeAudit($model, 'deleted', $model->getAttributes(), []));
    }

    /**
     * Records a custom event (e.g. a read access such as "viewed" or "downloaded").
     *
     * @param  array<string, mixed>  $context
     */
    public function recordAudit(string $event, array $context = []): void
    {
        self::writeAudit($this, $event, [], $context ?: ['id' => $this->getKey()]);
    }

    /**
     * @param  array<string, mixed>  $old
     * @param  array<string, mixed>  $new
     */
    private static function writeAudit(Model $model, string $event, array $old, array $new): void
    {
        $excluded = array_merge(self::$auditExcluded, $model->getHidden());
        $old = array_diff_key($old, array_flip($excluded));
        $new = array_diff_key($new, array_flip($excluded));

        if ($event === 'updated' && $new === []) {
            return;
        }

        AuditLog::create([
            'user_id' => auth()->id(),
            'event' => $event,
            'auditable_type' => $model::class,
            'auditable_id' => $model->getKey(),
            'old_values' => $old ?: null,
            'new_values' => $new ?: null,
            'ip_address' => request()?->ip(),
        ]);
    }
}

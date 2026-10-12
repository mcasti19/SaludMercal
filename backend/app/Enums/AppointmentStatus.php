<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case NoShow = 'no_show';

    /** Statuses that keep the time slot occupied. */
    public function occupiesSlot(): bool
    {
        return in_array($this, self::occupying(), true);
    }

    /** @return list<self> */
    public static function occupying(): array
    {
        return [self::Pending, self::Confirmed, self::InProgress];
    }

    /** @return list<string> */
    public static function occupyingValues(): array
    {
        return array_map(fn (self $s) => $s->value, self::occupying());
    }

    /** @return list<self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Confirmed, self::Cancelled],
            self::Confirmed => [self::InProgress, self::Cancelled, self::NoShow],
            self::InProgress => [self::Completed],
            self::Completed, self::Cancelled, self::NoShow => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }

    public function isFinal(): bool
    {
        return $this->allowedTransitions() === [];
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

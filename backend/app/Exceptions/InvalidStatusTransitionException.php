<?php

namespace App\Exceptions;

use App\Enums\AppointmentStatus;

class InvalidStatusTransitionException extends ApiException
{
    public function __construct(AppointmentStatus $from, AppointmentStatus $to)
    {
        parent::__construct("An appointment cannot move from '{$from->value}' to '{$to->value}'.");
    }

    protected function status(): int
    {
        return 422;
    }
}

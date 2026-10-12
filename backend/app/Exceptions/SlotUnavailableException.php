<?php

namespace App\Exceptions;

class SlotUnavailableException extends ApiException
{
    public function __construct(string $message = 'The selected time slot is not available.')
    {
        parent::__construct($message);
    }

    protected function status(): int
    {
        return 409;
    }
}

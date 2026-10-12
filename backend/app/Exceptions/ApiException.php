<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Domain exception that renders itself as a JSON API error.
 */
abstract class ApiException extends RuntimeException
{
    abstract protected function status(): int;

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], $this->status());
    }
}

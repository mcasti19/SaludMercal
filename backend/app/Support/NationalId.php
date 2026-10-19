<?php

namespace App\Support;

/** Venezuelan national ID helpers: V-12345678 / E-12345678. */
final class NationalId
{
    public const REGEX = '/^[VE]-\d{5,9}$/';

    /** Normalises "v12.345.678", "V 12345678" or "12345678" (assumed V) to "V-12345678"; other input is returned as is. */
    public static function normalise(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $clean = strtoupper(preg_replace('/[\s.\-]/', '', $value));

        if (preg_match('/^([VE])(\d+)$/', $clean, $m)) {
            return $m[1].'-'.$m[2];
        }

        return preg_match('/^\d+$/', $clean) ? 'V-'.$clean : $value;
    }
}

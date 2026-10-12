<?php

namespace App\Http\Requests\Concerns;

trait NormalizesNationalId
{
    /** Venezuelan ID format: V-12345678 / E-12345678 */
    protected const NATIONAL_ID_REGEX = '/^[VE]-\d{5,9}$/';

    protected function normalizeNationalId(string $key = 'national_id'): void
    {
        $value = $this->input($key);

        if (! is_string($value)) {
            return;
        }

        $clean = strtoupper(preg_replace('/[\s.\-]/', '', $value));

        if (preg_match('/^([VE])(\d+)$/', $clean, $m)) {
            $this->merge([$key => $m[1].'-'.$m[2]]);
        }
    }
}

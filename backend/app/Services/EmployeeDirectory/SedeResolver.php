<?php

namespace App\Services\EmployeeDirectory;

use App\Models\Location;
use Illuminate\Support\Str;

/** Maps the sede/state text of the central directory to one of our locations. */
class SedeResolver
{
    public function resolve(?string $sede): ?Location
    {
        if ($sede === null) {
            return null;
        }

        $needle = $this->normalise($sede);
        $alias = config('employee_directory.sede_aliases')[$needle] ?? null;

        $locations = Location::query()->where('is_active', true)->get();

        if ($alias !== null) {
            return $locations->first(fn (Location $l) => strcasecmp((string) $l->code, $alias) === 0 || $this->normalise($l->name) === $this->normalise($alias));
        }

        // Exact match by name, code or state first; then by name without the "sede mercal" prefix.
        foreach ([fn (Location $l) => $this->normalise($l->name), fn (Location $l) => $this->normalise((string) $l->code), fn (Location $l) => $this->normalise((string) $l->state)] as $key) {
            $match = $locations->first(fn (Location $l) => $key($l) === $needle);

            if ($match) {
                return $match;
            }
        }

        return null;
    }

    private function normalise(string $value): string
    {
        $value = Str::of(Str::ascii($value))->lower()->replaceMatches('/\b(sede|mercal|estado)\b/', ' ')->replaceMatches('/[^a-z0-9]+/', ' ');

        return trim((string) $value);
    }
}

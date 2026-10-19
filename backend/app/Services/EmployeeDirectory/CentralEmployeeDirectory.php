<?php

namespace App\Services\EmployeeDirectory;

use Illuminate\Support\Facades\DB;

/**
 * Reads the corporate central database view (read-only connection). Column names come from
 * config/employee_directory.php. The ID is matched with and without the "V-" prefix and dashes,
 * since the central source may store it as digits only.
 */
class CentralEmployeeDirectory implements EmployeeDirectory
{
    public function find(string $nationalId): ?EmployeeRecord
    {
        $cols = config('employee_directory.columns');
        $digits = preg_replace('/\D/', '', $nationalId);

        $row = DB::connection(config('employee_directory.connection'))
            ->table(config('employee_directory.view'))
            ->whereIn($cols['national_id'], array_unique([$nationalId, $digits, strtoupper(substr($nationalId, 0, 1)).$digits]))
            ->first();

        if (! $row) {
            return null;
        }

        $get = fn (string $key): ?string => isset($row->{$cols[$key]}) && trim((string) $row->{$cols[$key]}) !== ''
            ? trim((string) $row->{$cols[$key]})
            : null;

        $status = mb_strtolower((string) $get('status'));

        return new EmployeeRecord(
            nationalId: $nationalId,
            firstName: (string) $get('first_name'),
            lastName: (string) $get('last_name'),
            birthDate: $get('birth_date') ? substr($get('birth_date'), 0, 10) : null,
            gender: $this->normaliseGender($get('gender')),
            phone: $get('phone'),
            email: $get('email'),
            jobTitle: $get('job_title'),
            department: $get('department'),
            sede: $get('sede'),
            // No status column mapped/filled means we cannot tell: treat as active.
            isActive: $status === '' || in_array($status, config('employee_directory.active_statuses'), true),
        );
    }

    private function normaliseGender(?string $value): ?string
    {
        return match (mb_strtolower((string) $value)) {
            'm', 'masculino', 'male', 'h', 'hombre' => 'male',
            'f', 'femenino', 'female', 'mujer' => 'female',
            '' => null,
            default => 'other',
        };
    }
}

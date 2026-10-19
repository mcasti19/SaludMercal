<?php

namespace App\Services\EmployeeDirectory;

use Illuminate\Support\Facades\DB;

/** Development/test driver backed by the local `directory_employees` stub table. */
class LocalEmployeeDirectory implements EmployeeDirectory
{
    public function find(string $nationalId): ?EmployeeRecord
    {
        $row = DB::table('directory_employees')->where('national_id', $nationalId)->first();

        return $row ? new EmployeeRecord(
            nationalId: $row->national_id,
            firstName: $row->first_name,
            lastName: $row->last_name,
            birthDate: $row->birth_date,
            gender: $row->gender,
            phone: $row->phone,
            email: $row->email,
            jobTitle: $row->job_title,
            department: $row->department,
            sede: $row->sede,
            isActive: (bool) $row->is_active,
        ) : null;
    }
}

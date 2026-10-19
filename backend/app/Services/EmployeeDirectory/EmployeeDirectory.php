<?php

namespace App\Services\EmployeeDirectory;

interface EmployeeDirectory
{
    /** Finds an employee by normalised national ID (V-12345678). */
    public function find(string $nationalId): ?EmployeeRecord;
}

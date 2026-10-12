<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Receptionist = 'receptionist';
    case Doctor = 'doctor';
    case Nurse = 'nurse';
    case Employee = 'employee';

    /** Roles that work inside the administrative panel. */
    public function isStaff(): bool
    {
        return $this !== self::Employee;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case LogicalSecurity = 'logical_security';
    case Developer = 'developer';
    case Admin = 'admin';
    case Receptionist = 'receptionist';
    case Doctor = 'doctor';
    case Nurse = 'nurse';
    case Employee = 'employee';

    /**
     * Technical support role (platform developer): read-only, hidden from user listings and
     * allowed to read clinical data only during an audited emergency access.
     */
    public function isDeveloper(): bool
    {
        return $this === self::Developer;
    }

    /** Roles that work inside the administrative/clinical staff panels. */
    public function isStaff(): bool
    {
        return ! in_array($this, [self::Employee, self::LogicalSecurity, self::Developer], true);
    }

    /** Roles that manage user accounts and system access. */
    public function canManageUsers(): bool
    {
        return in_array($this, [self::SuperAdmin, self::LogicalSecurity, self::Admin], true);
    }

    /** Roles that have national (all-sedes) scope for user management. */
    public function hasNationalUserScope(): bool
    {
        return in_array($this, [self::SuperAdmin, self::LogicalSecurity], true);
    }

    /** Roles that are strictly limited to technical IAM security (no clinical data access). */
    public function isPureSecurityRole(): bool
    {
        return $this === self::LogicalSecurity;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

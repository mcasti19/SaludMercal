<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;

class AuditLogPolicy
{
    /**
     * Admins read the trail of their sede; logical security reads the IAM trail
     * (user accounts only) nationally and the developer reads the technical trail. Results are narrowed with AuditLog::visibleTo().
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isLogicalSecurity() || $user->isDeveloper();
    }

    public function view(User $user, AuditLog $log): bool
    {
        return AuditLog::query()->visibleTo($user)->whereKey($log->getKey())->exists();
    }
}

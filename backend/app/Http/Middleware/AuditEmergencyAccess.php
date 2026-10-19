<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Models\EmergencyAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Records every request made by the developer role while an emergency access is open,
 * so each clinical read taken under "break-glass" leaves a trail.
 */
class AuditEmergencyAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();
        $access = $user?->isDeveloper() ? $user->activeEmergencyAccess() : null;

        if ($access) {
            AuditLog::create([
                'user_id' => $user->id,
                'event' => 'accessed',
                'auditable_type' => EmergencyAccess::class,
                'auditable_id' => $access->id,
                'new_values' => [
                    'method' => $request->method(),
                    'path' => $request->path(),
                    'status' => $response->getStatusCode(),
                ],
                'ip_address' => $request->ip(),
            ]);
        }

        return $response;
    }
}

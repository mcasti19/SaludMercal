<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** In production the developer role is for diagnosis and support only: no creating, editing or deleting. */
class DeveloperReadOnlyInProduction
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->isDeveloper() && app()->isProduction() && ! $request->isMethodSafe()) {
            return response()->json(['message' => 'The developer role is read-only in production.'], 403);
        }

        return $next($request);
    }
}

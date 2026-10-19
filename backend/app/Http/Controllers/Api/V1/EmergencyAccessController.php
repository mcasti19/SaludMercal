<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmergencyAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Break-glass access to clinical data for the developer role. */
class EmergencyAccessController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $this->ensureDeveloper($request);

        return $this->payload($request->user()->activeEmergencyAccess());
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureDeveloper($request);

        $data = $request->validate(['reason' => ['required', 'string', 'min:20', 'max:500']]);
        $user = $request->user();

        if ($user->activeEmergencyAccess(refresh: true)) {
            return response()->json(['message' => 'An emergency access is already open.'], 409);
        }

        $user->emergencyAccesses()->create([
            'reason' => $data['reason'],
            'ip_address' => $request->ip(),
            'expires_at' => now()->addMinutes(EmergencyAccess::DURATION_MINUTES),
        ]);

        return $this->payload($user->activeEmergencyAccess(refresh: true), 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $this->ensureDeveloper($request);

        $access = $request->user()->activeEmergencyAccess(refresh: true);
        $access?->update(['ended_at' => now()]);
        $request->user()->activeEmergencyAccess(refresh: true);

        return $this->payload(null);
    }

    private function ensureDeveloper(Request $request): void
    {
        abort_unless($request->user()->isDeveloper(), 403);
    }

    private function payload(?EmergencyAccess $access, int $status = 200): JsonResponse
    {
        return response()->json(['data' => [
            'active' => $access !== null,
            'expires_at' => $access?->expires_at->toIso8601String(),
        ]], $status);
    }
}

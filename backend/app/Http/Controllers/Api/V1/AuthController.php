<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login with email or username. Issues a Sanctum bearer token that expires
     * after `sanctum.expiration` minutes and carries the user's role as ability.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $login = $request->string('login')->toString();
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::query()->where($field, $login)->first();

        // Always run a hash comparison so response time does not reveal valid usernames.
        $passwordMatches = Hash::check(
            $request->string('password')->toString(),
            $user?->password ?? self::dummyHash()
        );

        if (! $user || ! $passwordMatches || ! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->saveQuietly();

        $user->tokens()->where('name', 'spa-token')->delete();
        $token = $user->createToken('spa-token', [$user->role->value]);

        return response()->json([
            'token' => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at?->toIso8601String(),
            'user' => new UserResource($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => new UserResource($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Session closed.']);
    }

    /**
     * Change the authenticated user's password and revoke every other session.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        $user->forceFill([
            'password' => $request->string('password')->toString(),
            'must_change_password' => false,
        ])->save();

        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Password updated.']);
    }

    private static function dummyHash(): string
    {
        static $hash = null;

        return $hash ??= Hash::make(Str::random(32));
    }
}

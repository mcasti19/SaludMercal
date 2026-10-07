<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login — acepta email o username + contraseña.
     *
     * Emite un token Sanctum (Bearer) para ser almacenado de forma segura en
     * el cliente. El token se envía sólo una vez; el frontend lo guarda en
     * memoria o httpOnly cookie a través de Next.js (no en localStorage).
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'login'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $login    = $request->input('login');
        $password = $request->input('password');

        // Detectar si es email o username
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::where($field, $login)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // Revocar tokens anteriores del mismo dispositivo (evita acumulación)
        $user->tokens()->where('name', 'spa-token')->delete();

        // Crear token de acceso (1 día de expiración configurado en sanctum.php)
        $token = $user->createToken('spa-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'       => $user->id,
                'name'     => $user->name,
                'username' => $user->username,
                'email'    => $user->email,
                'role'     => $user->role,
            ],
        ]);
    }

    /**
     * Devuelve el usuario autenticado actualmente.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id'       => $user->id,
                'name'     => $user->name,
                'username' => $user->username,
                'email'    => $user->email,
                'role'     => $user->role,
            ],
        ]);
    }

    /**
     * Logout — revoca el token actual.
     */
    public function logout(Request $request): JsonResponse
    {
        // Revocar sólo el token que viene en la petición
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }
}

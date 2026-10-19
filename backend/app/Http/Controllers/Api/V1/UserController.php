<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $request->validate([
            'role' => ['nullable', Rule::enum(UserRole::class)],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
        ]);

        $currentUser = $request->user();

        $users = User::query()
            ->with(['location', 'patient.department'])
            ->visibleTo($currentUser)
            ->search($request->query('search'))
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->string('role')))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->when($currentUser->hasNationalUserScope(), function ($q) use ($request) {
                if ($request->filled('location_id')) {
                    $q->where('location_id', $request->integer('location_id'));
                }
            }, function ($q) use ($currentUser) {
                $currentUser->location_id !== null
                    ? $q->where('location_id', $currentUser->location_id)
                    : $q->whereRaw('1 = 0');
            })
            ->orderBy('name')
            ->paginate($this->perPage($request));

        return UserResource::collection($users);
    }

    public function show(User $user): UserResource
    {
        $this->authorize('view', $user);

        $user->loadMissing(['location', 'patient.department']);

        return new UserResource($user);
    }

    public function store(UserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validated();

        if (! $request->user()->hasNationalUserScope()) {
            $data['location_id'] = $request->user()->location_id;
        }

        $expirationMonths = (int) ($data['password_expiration_months'] ?? 3);
        $data['password_expiration_months'] = $expirationMonths;
        $data['session_timeout_minutes'] = (int) ($data['session_timeout_minutes'] ?? 30);
        $data['password_changed_at'] = now();
        $data['password_expires_at'] = now()->addMonths($expirationMonths);
        $data['must_change_password'] = $data['must_change_password'] ?? true;

        $user = User::create($data);
        $user->loadMissing(['location', 'patient.department']);

        return (new UserResource($user))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UserRequest $request, User $user): UserResource
    {
        $this->authorize('update', $user);

        $data = $request->validated();

        if (! $request->user()->hasNationalUserScope()) {
            unset($data['location_id']);
        }

        // Logical security can only enable/disable the developer account.
        if ($user->isDeveloper()) {
            $data = array_intersect_key($data, ['is_active' => true]);
        }

        if (! empty($data['password'])) {
            $months = (int) ($data['password_expiration_months'] ?? $user->password_expiration_months ?? 3);
            $data['password_changed_at'] = now();
            $data['password_expires_at'] = now()->addMonths($months);
        } elseif (isset($data['password_expiration_months']) && (int) $data['password_expiration_months'] !== (int) $user->password_expiration_months) {
            $baseTime = $user->password_changed_at ?? $user->created_at ?? now();
            $data['password_expires_at'] = $baseTime->copy()->addMonths((int) $data['password_expiration_months']);
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        // A deactivated account loses every active session immediately.
        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        $user->loadMissing(['location', 'patient.department']);

        return new UserResource($user);
    }

    public function destroy(User $user): Response
    {
        $this->authorize('delete', $user);

        $user->tokens()->delete();
        $user->delete();

        return response()->noContent();
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $this->authorize('resetPassword', $user);

        $validated = $request->validate([
            'password' => ['required', 'string', \Illuminate\Validation\Rules\Password::min(8)->letters()->mixedCase()->numbers()],
        ]);

        $months = $user->password_expiration_months ?? 3;

        $user->forceFill([
            'password' => $validated['password'],
            'must_change_password' => true,
            'password_changed_at' => now(),
            'password_expires_at' => now()->addMonths($months),
        ])->save();

        $user->tokens()->delete();

        return response()->json([
            'message' => 'Contraseña restablecida exitosamente. El usuario deberá cambiarla en su próximo inicio de sesión.',
        ]);
    }
}

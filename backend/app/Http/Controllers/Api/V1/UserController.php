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

        $request->validate(['role' => ['nullable', Rule::enum(UserRole::class)]]);

        $users = User::query()
            ->search($request->query('search'))
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->string('role')))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name')
            ->paginate($this->perPage($request));

        return UserResource::collection($users);
    }

    public function show(User $user): UserResource
    {
        $this->authorize('view', $user);

        return new UserResource($user);
    }

    public function store(UserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        return (new UserResource(User::create($request->validated())->refresh()))
            ->response()->setStatusCode(201);
    }

    public function update(UserRequest $request, User $user): UserResource
    {
        $this->authorize('update', $user);

        $user->update($request->validated());

        // A deactivated account loses every active session immediately.
        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return new UserResource($user->refresh());
    }

    public function destroy(User $user): Response
    {
        $this->authorize('delete', $user);

        $user->tokens()->delete();
        $user->delete();

        return response()->noContent();
    }
}

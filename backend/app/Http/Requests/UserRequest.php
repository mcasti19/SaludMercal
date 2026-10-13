<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->route('user');

        return $user ? $this->user()->can('update', $user) : $this->user()->can('create', User::class);
    }

    public function rules(): array
    {
        $target = $this->route('user');
        $isCreating = ! $target;

        // Anti-escalation: only SuperAdmin can assign the SuperAdmin role.
        $allowedRoles = UserRole::values();
        if (! $this->user()->isSuperAdmin()) {
            $allowedRoles = array_values(array_diff($allowedRoles, [UserRole::SuperAdmin->value]));
        }

        // Only SuperAdmin or LogicalSecurity can assign LogicalSecurity role.
        if (! ($this->user()->isSuperAdmin() || $this->user()->isLogicalSecurity())) {
            $allowedRoles = array_values(array_diff($allowedRoles, [UserRole::LogicalSecurity->value]));
        }

        return [
            'name' => [$isCreating ? 'required' : 'sometimes', 'string', 'max:255'],
            'username' => [
                $isCreating ? 'required' : 'sometimes',
                'string',
                'regex:/^[a-zA-Z0-9._-]+$/',
                'max:50',
                Rule::unique('users', 'username')->ignore($target),
            ],
            'email' => [
                $isCreating ? 'required' : 'sometimes',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->ignore($target),
            ],
            'role' => [
                $isCreating ? 'required' : 'sometimes',
                Rule::in($allowedRoles),
            ],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'is_active' => ['sometimes', 'boolean'],
            'must_change_password' => ['sometimes', 'boolean'],
            'password_expiration_months' => ['sometimes', 'integer', Rule::in([3, 6, 12])],
            'session_timeout_minutes' => ['sometimes', 'integer', Rule::in([5, 20, 30, 60])],
            'password' => [
                $isCreating ? 'required' : 'nullable',
                'string',
                Password::min(8)->letters()->mixedCase()->numbers(),
            ],
        ];
    }
}

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
        $user = $this->route('user');
        $required = $user ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:255'],
            'username' => [$required, 'string', 'alpha_dash', 'max:50', Rule::unique('users', 'username')->ignore($user)],
            'email' => [$required, 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'role' => [$required, Rule::enum(UserRole::class)],
            'is_active' => ['sometimes', 'boolean'],
            'must_change_password' => ['sometimes', 'boolean'],
            'password' => [$required, 'string', Password::min(8)->letters()->mixedCase()->numbers()],
        ];
    }
}

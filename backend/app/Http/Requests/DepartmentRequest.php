<?php

namespace App\Http\Requests;

use App\Models\Department;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $department = $this->route('department');

        return $department ? $this->user()->can('update', $department) : $this->user()->can('create', Department::class);
    }

    public function rules(): array
    {
        $department = $this->route('department');
        $required = $department ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:255', Rule::unique('departments', 'name')->ignore($department)],
            'code' => ['nullable', 'string', 'max:20', Rule::unique('departments', 'code')->ignore($department)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

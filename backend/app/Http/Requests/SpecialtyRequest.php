<?php

namespace App\Http\Requests;

use App\Models\Specialty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SpecialtyRequest extends FormRequest
{
    public function authorize(): bool
    {
        $specialty = $this->route('specialty');

        return $specialty ? $this->user()->can('update', $specialty) : $this->user()->can('create', Specialty::class);
    }

    public function rules(): array
    {
        $specialty = $this->route('specialty');
        $required = $specialty ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:255', Rule::unique('specialties', 'name')->ignore($specialty)],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

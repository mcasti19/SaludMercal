<?php

namespace App\Http\Requests;

use App\Models\Location;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $location = $this->route('location');

        return $location ? $this->user()->can('update', $location) : $this->user()->can('create', Location::class);
    }

    public function rules(): array
    {
        $location = $this->route('location');
        $required = $location ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:255', Rule::unique('locations', 'name')->ignore($location)],
            'code' => ['nullable', 'string', 'max:20', Rule::unique('locations', 'code')->ignore($location)],
            'state' => ['nullable', 'string', 'max:60'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_headquarters' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

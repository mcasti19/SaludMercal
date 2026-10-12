<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\NormalizesNationalId;
use App\Models\Doctor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DoctorRequest extends FormRequest
{
    use NormalizesNationalId;

    public function authorize(): bool
    {
        $doctor = $this->route('doctor');

        return $doctor ? $this->user()->can('update', $doctor) : $this->user()->can('create', Doctor::class);
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeNationalId();
    }

    public function rules(): array
    {
        $doctor = $this->route('doctor');
        $required = $doctor ? 'sometimes' : 'required';

        return [
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id'), Rule::unique('doctors', 'user_id')->ignore($doctor)],
            'specialty_id' => [$required, 'integer', Rule::exists('specialties', 'id')],
            'location_id' => ['nullable', 'integer', Rule::exists('locations', 'id')],
            'national_id' => ['nullable', 'string', 'regex:'.self::NATIONAL_ID_REGEX, Rule::unique('doctors', 'national_id')->ignore($doctor)],
            'license_number' => ['nullable', 'string', 'max:50', Rule::unique('doctors', 'license_number')->ignore($doctor)],
            'first_name' => [$required, 'string', 'max:100'],
            'last_name' => [$required, 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'office' => ['nullable', 'string', 'max:30'],
            'slot_duration_minutes' => ['sometimes', 'integer', 'between:10,120'],
            'is_active' => ['sometimes', 'boolean'],
            'schedules' => ['sometimes', 'array', 'max:50'],
            'schedules.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'schedules.*.start_time' => ['required', 'date_format:H:i'],
            'schedules.*.end_time' => ['required', 'date_format:H:i', 'after:schedules.*.start_time'],
        ];
    }

    public function messages(): array
    {
        return ['national_id.regex' => 'The national ID must look like V-12345678.'];
    }
}

<?php

namespace App\Http\Requests;

use App\Enums\Gender;
use App\Http\Requests\Concerns\NormalizesNationalId;
use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PatientRequest extends FormRequest
{
    use NormalizesNationalId;

    public function authorize(): bool
    {
        $patient = $this->route('patient');

        return $patient ? $this->user()->can('update', $patient) : $this->user()->can('create', Patient::class);
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeNationalId();
    }

    public function rules(): array
    {
        $patient = $this->route('patient');
        $required = $patient ? 'sometimes' : 'required';

        return [
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id'), Rule::unique('patients', 'user_id')->ignore($patient)],
            'national_id' => [$required, 'string', 'regex:'.self::NATIONAL_ID_REGEX, Rule::unique('patients', 'national_id')->ignore($patient)],
            'first_name' => [$required, 'string', 'max:100'],
            'last_name' => [$required, 'string', 'max:100'],
            'birth_date' => [$required, 'date', 'before:today', 'after:1900-01-01'],
            'gender' => ['nullable', Rule::enum(Gender::class)],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'department_id' => ['nullable', 'integer', Rule::exists('departments', 'id')],
            'location_id' => ['nullable', 'integer', Rule::exists('locations', 'id')],
            'job_title' => ['nullable', 'string', 'max:150'],
            'blood_type' => ['nullable', Rule::in(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])],
            'allergies' => ['nullable', 'string', 'max:2000'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['sometimes', 'boolean'],
            'beneficiaries' => ['nullable', 'array'],
            'beneficiaries.*.id' => ['nullable', 'integer'],
            'beneficiaries.*.first_name' => ['required_with:beneficiaries', 'string', 'max:100'],
            'beneficiaries.*.last_name' => ['required_with:beneficiaries', 'string', 'max:100'],
            'beneficiaries.*.relationship' => ['required_with:beneficiaries', 'string', 'max:30'],
            'beneficiaries.*.national_id' => ['nullable', 'string', 'max:20'],
            'beneficiaries.*.birth_date' => ['nullable', 'date'],
            'beneficiaries.*.gender' => ['nullable', 'string', 'max:10'],
            'beneficiaries.*.phone' => ['nullable', 'string', 'max:30'],
            'beneficiaries.*.is_active' => ['nullable', 'boolean'],
            'beneficiaries.*._delete' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['national_id.regex' => 'The national ID must look like V-12345678.'];
    }
}

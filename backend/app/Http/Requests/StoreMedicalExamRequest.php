<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMedicalExamRequest extends FormRequest
{
    public const MAX_FILES = 10;

    public const MAX_FILE_KB = 10240; // 10 MB

    public function authorize(): bool
    {
        return true; // authorization is enforced by MedicalExamPolicy in the controller
    }

    public function rules(): array
    {
        /** @var Patient $patient */
        $patient = $this->route('patient');

        return [
            'specialty_id' => ['required', 'integer', Rule::exists('specialties', 'id')->where('is_active', true)],
            'appointment_id' => ['nullable', 'integer', Rule::exists('appointments', 'id')->where('patient_id', $patient->getKey())],
            'title' => ['required', 'string', 'max:150'],
            'exam_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'files' => ['required', 'array', 'min:1', 'max:'.self::MAX_FILES],
            'files.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:'.self::MAX_FILE_KB],
        ];
    }
}


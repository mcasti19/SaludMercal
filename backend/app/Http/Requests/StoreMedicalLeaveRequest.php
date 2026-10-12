<?php

namespace App\Http\Requests;

use App\Enums\MedicalLeaveType;
use App\Models\MedicalLeave;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMedicalLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', MedicalLeave::class);
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['nullable', 'integer', Rule::exists('patients', 'id')->whereNull('deleted_at')],
            'doctor_id' => ['nullable', 'integer', Rule::exists('doctors', 'id')->whereNull('deleted_at')],
            'type' => ['required', Rule::enum(MedicalLeaveType::class)],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'diagnosis' => ['required', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }
}

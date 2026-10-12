<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewMedicalLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('review', $this->route('medical_leave'));
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'review_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

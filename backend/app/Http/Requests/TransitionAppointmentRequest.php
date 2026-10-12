<?php

namespace App\Http\Requests;

use App\Enums\AppointmentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransitionAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = AppointmentStatus::tryFrom((string) $this->input('status'));

        // An unknown status is reported by the validation rules instead.
        return $target === null || $this->user()->can('transition', [$this->route('appointment'), $target]);
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(AppointmentStatus::class)],
            'comment' => [
                Rule::requiredIf(fn () => $this->input('status') === AppointmentStatus::Cancelled->value),
                'nullable', 'string', 'max:500',
            ],
        ];
    }
}

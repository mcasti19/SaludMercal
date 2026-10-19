<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Appointment::class);
    }

    /** Employees book for themselves; staff name the patient. */
    private function targetPatientId(): int
    {
        $user = $this->user();

        if ($user->hasRole(UserRole::Employee)) {
            return (int) $user->patient()->value('id');
        }

        return (int) $this->input('patient_id');
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['nullable', 'integer', Rule::exists('patients', 'id')->whereNull('deleted_at'), function (string $attribute, mixed $value, \Closure $fail) {
                // Staff can only book patients visible to them (their sedes' or a service commission).
                if (! $this->user()->hasRole(UserRole::Employee) && ! Patient::query()->whereKey($value)->exists()) {
                    $fail('The selected patient is not available in your sede.');
                }
            }],
            // The beneficiary must be an active dependant of the patient the appointment is for.
            'beneficiary_id' => ['nullable', 'integer', Rule::exists('patient_beneficiaries', 'id')
                ->where('patient_id', $this->targetPatientId())
                ->where('is_active', true)
                ->whereNull('deleted_at')],
            'doctor_id' => ['required', 'integer', Rule::exists('doctors', 'id')->whereNull('deleted_at')],
            'location_id' => ['nullable', 'integer', Rule::exists('locations', 'id')->where('is_active', true)],
            'scheduled_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'reason' => ['required', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

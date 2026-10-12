<?php

namespace App\Policies;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;

class AppointmentPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // results are always narrowed with Appointment::visibleTo()
    }

    public function view(User $user, Appointment $appointment): bool
    {
        return Appointment::query()->visibleTo($user)->whereKey($appointment->getKey())->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Admin, UserRole::Receptionist, UserRole::Employee);
    }

    public function reschedule(User $user, Appointment $appointment): bool
    {
        return $user->hasRole(UserRole::Admin, UserRole::Receptionist)
            || $this->isOwner($user, $appointment);
    }

    /**
     * Whether the user may move the appointment to the given status.
     */
    public function transition(User $user, Appointment $appointment, AppointmentStatus $target): bool
    {
        return match ($user->role) {
            UserRole::Admin, UserRole::Receptionist => true,
            UserRole::Nurse => in_array($target, [AppointmentStatus::Confirmed, AppointmentStatus::InProgress], true),
            UserRole::Doctor => $this->isAssignedDoctor($user, $appointment)
                && in_array($target, [AppointmentStatus::InProgress, AppointmentStatus::Completed, AppointmentStatus::NoShow], true),
            UserRole::Employee => $target === AppointmentStatus::Cancelled && $this->isOwner($user, $appointment),
        };
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        return $user->isAdmin();
    }

    private function isOwner(User $user, Appointment $appointment): bool
    {
        return Patient::query()->whereKey($appointment->patient_id)->where('user_id', $user->id)->exists();
    }

    private function isAssignedDoctor(User $user, Appointment $appointment): bool
    {
        return Doctor::query()->whereKey($appointment->doctor_id)->where('user_id', $user->id)->exists();
    }
}

<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Exceptions\InvalidStatusTransitionException;
use App\Exceptions\SlotUnavailableException;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class AppointmentService
{
    /**
     * Free start times (H:i) for a doctor on a given date.
     *
     * @return list<string>
     */
    public function availableSlots(Doctor $doctor, CarbonInterface $date): array
    {
        $day = CarbonImmutable::parse($date->toDateString());
        $now = CarbonImmutable::now();

        if (! $doctor->is_active || $day->lt($now->startOfDay()) || $this->isOnTimeOff($doctor, $day)) {
            return [];
        }

        $booked = $doctor->appointments()
            ->occupyingSlot()
            ->whereDate('scheduled_date', $day->toDateString())
            ->pluck('start_time')
            ->map(fn (string $time) => substr($time, 0, 5))
            ->all();

        $duration = max(5, $doctor->slot_duration_minutes);
        $slots = [];

        foreach ($doctor->schedules()->where('day_of_week', $day->dayOfWeek)->get() as $schedule) {
            $cursor = $day->setTimeFromTimeString($schedule->start_time);
            $end = $day->setTimeFromTimeString($schedule->end_time);

            while ($cursor->addMinutes($duration)->lte($end)) {
                $label = $cursor->format('H:i');

                if ($cursor->gt($now) && ! in_array($label, $booked, true)) {
                    $slots[] = $label;
                }

                $cursor = $cursor->addMinutes($duration);
            }
        }

        $slots = array_values(array_unique($slots));
        sort($slots);

        return $slots;
    }

    /**
     * @param  array{patient_id:int, doctor_id:int, scheduled_date:string, start_time:string, reason:string, notes?:?string}  $data
     */
    public function book(array $data, User $actor): Appointment
    {
        return DB::transaction(function () use ($data, $actor) {
            $doctor = Doctor::query()->lockForUpdate()->findOrFail($data['doctor_id']);
            $date = CarbonImmutable::parse($data['scheduled_date']);
            $start = substr($data['start_time'], 0, 5);

            $this->assertSlotIsFree($doctor, $date, $start);
            $this->assertPatientIsFree((int) $data['patient_id'], $date, $start);

            try {
                $appointment = Appointment::create([
                    'patient_id' => $data['patient_id'],
                    'beneficiary_id' => $data['beneficiary_id'] ?? null,
                    'doctor_id' => $doctor->id,
                    'specialty_id' => $doctor->specialty_id,
                    'location_id' => $data['location_id'] ?? $doctor->location_id,
                    'scheduled_date' => $date->toDateString(),
                    'start_time' => $start,
                    'end_time' => $date->setTimeFromTimeString($start)->addMinutes($doctor->slot_duration_minutes)->format('H:i'),
                    'status' => AppointmentStatus::Pending,
                    'reason' => $data['reason'],
                    'notes' => $data['notes'] ?? null,
                    'created_by' => $actor->id,
                ]);
            } catch (UniqueConstraintViolationException) {
                throw new SlotUnavailableException;
            }

            $this->recordHistory($appointment, null, AppointmentStatus::Pending, $actor);

            return $appointment;
        });
    }

    public function reschedule(Appointment $appointment, string $scheduledDate, string $startTime, User $actor): Appointment
    {
        return DB::transaction(function () use ($appointment, $scheduledDate, $startTime, $actor) {
            $doctor = Doctor::query()->lockForUpdate()->findOrFail($appointment->doctor_id);
            $appointment = Appointment::query()->lockForUpdate()->findOrFail($appointment->id);

            if (! in_array($appointment->status, [AppointmentStatus::Pending, AppointmentStatus::Confirmed], true)) {
                throw new InvalidStatusTransitionException($appointment->status, AppointmentStatus::Pending);
            }

            $date = CarbonImmutable::parse($scheduledDate);
            $start = substr($startTime, 0, 5);

            $this->assertSlotIsFree($doctor, $date, $start);
            $this->assertPatientIsFree($appointment->patient_id, $date, $start, $appointment->id);

            try {
                $appointment->update([
                    'scheduled_date' => $date->toDateString(),
                    'start_time' => $start,
                    'end_time' => $date->setTimeFromTimeString($start)->addMinutes($doctor->slot_duration_minutes)->format('H:i'),
                ]);
            } catch (UniqueConstraintViolationException) {
                throw new SlotUnavailableException;
            }

            $this->recordHistory($appointment, $appointment->status, $appointment->status, $actor, 'Rescheduled');

            return $appointment;
        });
    }

    public function transition(Appointment $appointment, AppointmentStatus $target, User $actor, ?string $comment = null): Appointment
    {
        return DB::transaction(function () use ($appointment, $target, $actor, $comment) {
            $appointment = Appointment::query()->lockForUpdate()->findOrFail($appointment->id);
            $from = $appointment->status;

            if (! $from->canTransitionTo($target)) {
                throw new InvalidStatusTransitionException($from, $target);
            }

            $attributes = ['status' => $target];

            match ($target) {
                AppointmentStatus::Confirmed => $attributes['confirmed_at'] = now(),
                AppointmentStatus::InProgress => $attributes['started_at'] = now(),
                AppointmentStatus::Completed => $attributes['completed_at'] = now(),
                AppointmentStatus::Cancelled => $attributes += [
                    'cancelled_at' => now(),
                    'cancelled_by' => $actor->id,
                    'cancellation_reason' => $comment,
                ],
                default => null,
            };

            $appointment->update($attributes);
            $this->recordHistory($appointment, $from, $target, $actor, $comment);

            return $appointment;
        });
    }

    private function isOnTimeOff(Doctor $doctor, CarbonInterface $day): bool
    {
        return $doctor->timeOffs()
            ->whereDate('start_date', '<=', $day->toDateString())
            ->whereDate('end_date', '>=', $day->toDateString())
            ->exists();
    }

    private function assertSlotIsFree(Doctor $doctor, CarbonInterface $date, string $start): void
    {
        if (! in_array($start, $this->availableSlots($doctor, $date), true)) {
            throw new SlotUnavailableException;
        }
    }

    private function assertPatientIsFree(int $patientId, CarbonInterface $date, string $start, ?int $ignoreId = null): void
    {
        $conflict = Appointment::query()
            ->occupyingSlot()
            ->where('patient_id', $patientId)
            ->whereDate('scheduled_date', $date->toDateString())
            ->where('start_time', $start)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($conflict) {
            throw new SlotUnavailableException('The patient already has an appointment at that time.');
        }
    }

    private function recordHistory(Appointment $appointment, ?AppointmentStatus $from, AppointmentStatus $to, User $actor, ?string $comment = null): void
    {
        $appointment->statusHistory()->create([
            'from_status' => $from,
            'to_status' => $to,
            'changed_by' => $actor->id,
            'comment' => $comment,
        ]);
    }
}

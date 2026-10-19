<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToLocation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Appointment extends Model
{
    use Auditable, BelongsToLocation, HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'patient_id', 'beneficiary_id', 'doctor_id', 'specialty_id', 'location_id', 'scheduled_date',
        'start_time', 'end_time', 'status', 'reason', 'notes', 'cancellation_reason',
        'created_by', 'cancelled_by', 'confirmed_at', 'started_at', 'completed_at', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date:Y-m-d',
            'status' => AppointmentStatus::class,
            'confirmed_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $appointment) {
            $appointment->code ??= 'APT-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        });
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(PatientBeneficiary::class, 'beneficiary_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(AppointmentStatusHistory::class)->orderBy('created_at')->orderBy('id');
    }

    /** Appointments a given user is allowed to see. */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isLogicalSecurity()) {
            return $query->whereRaw('1 = 0');
        }

        if ($user->isAdmin() || $user->hasRole(UserRole::Receptionist, UserRole::Nurse)) {
            return $query;
        }

        if ($user->hasRole(UserRole::Doctor)) {
            return $query->whereHas('doctor', fn (Builder $q) => $q->where('user_id', $user->id));
        }

        return $query->whereHas('patient', fn (Builder $q) => $q->where('user_id', $user->id));
    }

    public function scopeOccupyingSlot(Builder $query): Builder
    {
        return $query->whereIn('status', AppointmentStatus::occupyingValues());
    }
}

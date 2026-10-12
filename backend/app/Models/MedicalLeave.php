<?php

namespace App\Models;

use App\Enums\MedicalLeaveStatus;
use App\Enums\MedicalLeaveType;
use App\Enums\UserRole;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MedicalLeave extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = [
        'patient_id', 'doctor_id', 'type', 'start_date', 'end_date', 'days', 'diagnosis',
        'status', 'attachment_path', 'reviewed_by', 'reviewed_at', 'review_notes',
    ];

    protected function casts(): array
    {
        return [
            'type' => MedicalLeaveType::class,
            'status' => MedicalLeaveStatus::class,
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'days' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** Leaves a given user is allowed to see. */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasRole(UserRole::Employee)) {
            return $query->whereHas('patient', fn (Builder $q) => $q->where('user_id', $user->id));
        }

        return $query;
    }
}

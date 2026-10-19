<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToLocation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MedicalExam extends Model
{
    use Auditable, BelongsToLocation, HasFactory, SoftDeletes;

    protected $fillable = [
        'patient_id', 'specialty_id', 'appointment_id', 'location_id', 'uploaded_by',
        'title', 'exam_date', 'notes',
    ];

    protected function casts(): array
    {
        return ['exam_date' => 'date:Y-m-d'];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function files(): HasMany
    {
        return $this->hasMany(MedicalExamFile::class);
    }

    /** Exams a given user is allowed to see. */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if (! $user->hasClinicalAccess()) {
            return $query->whereRaw('1 = 0');
        }

        if ($user->hasRole(UserRole::Employee)) {
            return $query->whereHas('patient', fn (Builder $q) => $q->where('user_id', $user->id));
        }

        return $query;
    }
}


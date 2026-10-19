<?php

namespace App\Models;

use App\Enums\Gender;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToLocation;
use App\Models\Concerns\SearchesColumns;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use Auditable, BelongsToLocation, HasFactory, SearchesColumns, SoftDeletes;

    protected $fillable = [
        'user_id', 'national_id', 'first_name', 'last_name', 'birth_date', 'gender',
        'phone', 'email', 'department_id', 'location_id', 'job_title', 'blood_type',
        'allergies', 'emergency_contact_name', 'emergency_contact_phone', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
            'gender' => Gender::class,
            'is_active' => 'boolean',
        ];
    }

    protected function fullName(): Attribute
    {
        return Attribute::get(fn () => "{$this->first_name} {$this->last_name}");
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function medicalLeaves(): HasMany
    {
        return $this->hasMany(MedicalLeave::class);
    }

    public function medicalExams(): HasMany
    {
        return $this->hasMany(MedicalExam::class);
    }

    public function beneficiaries(): HasMany
    {
        return $this->hasMany(PatientBeneficiary::class);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        return $query->searchColumns($term, ['national_id', 'first_name', 'last_name', 'email']);
    }

    /** Patients a given user is allowed to see. */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isLogicalSecurity()) {
            return $query->whereRaw('1 = 0');
        }

        return $user->role->isStaff() ? $query : $query->where('user_id', $user->id);
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToLocation;
use App\Models\Concerns\SearchesColumns;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Doctor extends Model
{
    use Auditable, BelongsToLocation, HasFactory, SearchesColumns, SoftDeletes;

    protected $fillable = [
        'user_id', 'specialty_id', 'location_id', 'national_id', 'license_number',
        'first_name', 'last_name', 'phone', 'email', 'office', 'photo_path',
        'slot_duration_minutes', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'slot_duration_minutes' => 'integer',
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

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class);
    }

    /** Every specialty the doctor holds (the primary one is also stored in specialty_id). */
    public function specialties(): BelongsToMany
    {
        return $this->belongsToMany(Specialty::class, 'doctor_specialty')->orderBy('name');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(DoctorSchedule::class)->orderBy('day_of_week')->orderBy('start_time');
    }

    public function timeOffs(): HasMany
    {
        return $this->hasMany(DoctorTimeOff::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Replaces the doctor's specialties. The primary one (kept in specialty_id, used by
     * appointments) is the requested one when it belongs to the set, otherwise the first.
     *
     * @param  list<int>  $specialtyIds
     */
    public function assignSpecialties(array $specialtyIds, ?int $primaryId = null): void
    {
        $primary = in_array($primaryId, $specialtyIds, true) ? $primaryId : $specialtyIds[0];

        $this->specialties()->sync($specialtyIds);
        $this->forceFill(['specialty_id' => $primary])->save();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        return $query->searchColumns($term, ['national_id', 'first_name', 'last_name', 'email']);
    }
}

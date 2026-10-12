<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\SearchesColumns;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Doctor extends Model
{
    use Auditable, HasFactory, SearchesColumns, SoftDeletes;

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

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        return $query->searchColumns($term, ['national_id', 'first_name', 'last_name', 'email']);
    }
}

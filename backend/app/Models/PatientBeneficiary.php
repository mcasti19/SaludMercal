<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PatientBeneficiary extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = [
        'patient_id',
        'first_name',
        'last_name',
        'relationship',
        'national_id',
        'birth_date',
        'gender',
        'phone',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
            'is_active' => 'boolean',
        ];
    }

    protected function fullName(): Attribute
    {
        return Attribute::get(fn () => "{$this->first_name} {$this->last_name}");
    }

    protected function relationshipLabel(): Attribute
    {
        return Attribute::get(function () {
            return match (strtolower($this->relationship)) {
                'conyuge' => 'Cónyuge',
                'hijo' => 'Hijo',
                'hija' => 'Hija',
                'padre' => 'Padre',
                'madre' => 'Madre',
                default => ucfirst($this->relationship),
            };
        });
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'beneficiary_id');
    }
}

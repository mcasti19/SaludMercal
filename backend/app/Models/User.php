<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\SearchesColumns;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use Auditable, HasApiTokens, HasFactory, Notifiable, SearchesColumns, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'role',
        'location_id',
        'is_active',
        'must_change_password',
        'password_expiration_months',
        'password_changed_at',
        'password_expires_at',
        'session_timeout_minutes',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'password_expiration_months' => 'integer',
            'password_changed_at' => 'datetime',
            'password_expires_at' => 'datetime',
            'session_timeout_minutes' => 'integer',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function patient(): HasOne
    {
        return $this->hasOne(Patient::class);
    }

    public function doctor(): HasOne
    {
        return $this->hasOne(Doctor::class);
    }

    public function location(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function hasRole(UserRole ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(UserRole::Admin, UserRole::SuperAdmin);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === UserRole::SuperAdmin;
    }

    public function isLogicalSecurity(): bool
    {
        return $this->role === UserRole::LogicalSecurity;
    }

    public function canManageUsers(): bool
    {
        return $this->role->canManageUsers();
    }

    public function hasNationalScope(): bool
    {
        return $this->role === UserRole::SuperAdmin;
    }

    public function hasNationalUserScope(): bool
    {
        return $this->role->hasNationalUserScope();
    }

    public function isPasswordExpired(): bool
    {
        return $this->password_expires_at !== null && now()->isAfter($this->password_expires_at);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        return $query->searchColumns($term, ['name', 'username', 'email']);
    }
}

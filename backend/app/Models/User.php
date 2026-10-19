<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\SearchesColumns;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
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

    /** @var list<int>|null */
    private ?array $accessibleLocationIds = null;

    private bool $emergencyAccessLoaded = false;

    private ?EmergencyAccess $activeEmergencyAccess = null;

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

    public function emergencyAccesses(): HasMany
    {
        return $this->hasMany(EmergencyAccess::class);
    }

    public function isDeveloper(): bool
    {
        return $this->role->isDeveloper();
    }

    /** The currently open emergency access, if any (memoised per request). */
    public function activeEmergencyAccess(bool $refresh = false): ?EmergencyAccess
    {
        if ($refresh || $this->emergencyAccessLoaded === false) {
            $this->activeEmergencyAccess = $this->emergencyAccesses()->active()->latest('id')->first();
            $this->emergencyAccessLoaded = true;
        }

        return $this->activeEmergencyAccess;
    }

    /**
     * Whether the user may read clinical data right now: logical security never can, the
     * developer only inside an emergency access, everyone else per their own policies.
     */
    public function hasClinicalAccess(): bool
    {
        return match (true) {
            $this->isLogicalSecurity() => false,
            $this->isDeveloper() => $this->activeEmergencyAccess() !== null,
            default => true,
        };
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

    /**
     * Whether the user may operate on records of the given sede. Fails closed: staff
     * without an assigned sede cannot reach any sede-bound record.
     */
    public function canAccessLocation(?int $locationId): bool
    {
        $ids = $this->accessibleLocationIds();

        return $ids === null || ($locationId !== null && in_array($locationId, $ids, true));
    }

    /**
     * Sedes whose records the user may reach: their own and every sede of the same group
     * (e.g. Sede Central, Capital and Vargas). `null` means unrestricted (national scope).
     *
     * @return list<int>|null
     */
    public function accessibleLocationIds(): ?array
    {
        if ($this->hasNationalScope()) {
            return null;
        }

        if ($this->isDeveloper()) {
            return $this->hasClinicalAccess() ? null : [];
        }

        if ($this->location_id === null) {
            return [];
        }

        return $this->accessibleLocationIds ??= $this->resolveLocationGroup();
    }

    /** @return list<int> */
    private function resolveLocationGroup(): array
    {
        $group = Location::query()->whereKey($this->location_id)->value('location_group');

        if ($group === null) {
            return [(int) $this->location_id];
        }

        return Location::query()->where('location_group', $group)->pluck('id')->map(fn ($id) => (int) $id)->all();
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

    /**
     * Scope users visible in management listings to a given viewer.
     *
     * Rules:
     * - Nobody except SuperAdmin can see SuperAdmin users.
     * - A SuperAdmin can ONLY see themselves among SuperAdmin accounts.
     * - Developer accounts are hidden from everybody except logical security and themselves.
     *
     * @param Builder<User> $query
     * @param User $viewer
     * @return Builder<User>
     */
    public function scopeVisibleTo(Builder $query, User $viewer): Builder
    {
        // The developer account is only visible to itself and to logical security (OTIC).
        if (! $viewer->isLogicalSecurity()) {
            $query->where(fn (Builder $q) => $q->where('role', '!=', UserRole::Developer)->orWhere('id', $viewer->id));
        }

        if ($viewer->isSuperAdmin()) {
            return $query->where(function (Builder $q) use ($viewer) {
                $q->where('role', '!=', UserRole::SuperAdmin)
                    ->orWhere('id', $viewer->id);
            });
        }

        return $query->where('role', '!=', UserRole::SuperAdmin);
    }
}

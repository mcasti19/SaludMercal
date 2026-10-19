<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Location;
use App\Models\Patient;
use App\Models\User;
use App\Services\EmployeeDirectory\EmployeeDirectory;
use App\Services\EmployeeDirectory\EmployeeRecord;
use App\Services\EmployeeDirectory\SedeResolver;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Creates and refreshes patients from the corporate employee directory. Not every employee is a patient:
 * the expediente is opened on demand from the national ID, keeping a local snapshot of the identity data.
 */
class PatientDirectoryService
{
    public const NOT_FOUND = 'not_found';

    public const HAS_RECORD = 'has_record';

    public const OTHER_SEDE = 'other_sede';

    public const SEDE_NOT_MAPPED = 'sede_not_mapped';

    public const AVAILABLE = 'available';

    public function __construct(private readonly EmployeeDirectory $directory, private readonly SedeResolver $sedes) {}

    /**
     * What the actor can do with this national ID.
     *
     * @return array{status:string, record?:EmployeeRecord, location?:Location, patient?:Patient, origin?:?string}
     */
    public function lookup(User $actor, string $nationalId): array
    {
        $result = $this->resolve($actor, $nationalId);

        AuditLog::create([
            'user_id' => $actor->id,
            'location_id' => $actor->location_id,
            'event' => 'directory_lookup',
            'auditable_type' => EmployeeRecord::class,
            'auditable_id' => 0,
            'new_values' => ['national_id' => $nationalId, 'result' => $result['status']],
            'ip_address' => request()?->ip(),
        ]);

        return $result;
    }

    /** Opens the expediente of an employee of the actor's sedes. */
    public function create(User $actor, string $nationalId): Patient
    {
        $result = $this->resolve($actor, $nationalId);

        if ($result['status'] !== self::AVAILABLE) {
            throw new HttpResponseException(response()->json(['message' => $this->message($result['status']), 'status' => $result['status']], $result['status'] === self::NOT_FOUND ? 404 : 422));
        }

        return $this->import($result['record'], $result['location']);
    }

    /**
     * Imports an employee of any sede (used by service commissions, where the actor is in the destination sede
     * and the patient keeps the origin sede reported by the directory).
     */
    public function importForCommission(string $nationalId): Patient
    {
        $record = $this->directory->find($nationalId);
        abort_unless($record, 404, $this->message(self::NOT_FOUND));

        $location = $this->sedes->resolve($record->sede);
        abort_unless($location, 422, $this->message(self::SEDE_NOT_MAPPED));

        return $this->import($record, $location);
    }

    /** Refreshes the directory-owned fields of an imported patient. Returns false when nothing could be refreshed. */
    public function sync(Patient $patient): bool
    {
        if (! $patient->isFromDirectory()) {
            return false;
        }

        $record = $this->directory->find($patient->national_id);

        if (! $record) {
            return false;
        }

        $location = $this->sedes->resolve($record->sede);

        $patient->update(array_filter([
            'first_name' => $record->firstName,
            'last_name' => $record->lastName,
            'birth_date' => $record->birthDate,
            'gender' => $record->gender,
            'job_title' => $record->jobTitle,
            'department_id' => $this->department($record->department)?->id,
            'location_id' => $location?->id,
            // Contact data may have been corrected locally: only fill the gaps.
            'phone' => $patient->phone ?: $record->phone,
            'email' => $patient->email ?: $record->email,
        ], fn ($value) => $value !== null) + [
            'employment_active' => $record->isActive,
            'directory_synced_at' => now(),
        ]);

        return true;
    }

    /** @return array{status:string, record?:EmployeeRecord, location?:Location, patient?:Patient, origin?:?string} */
    private function resolve(User $actor, string $nationalId): array
    {
        $existing = Patient::withoutGlobalScopes()->with('location')->where('national_id', $nationalId)->first();

        if ($existing) {
            $visible = Patient::query()->whereKey($existing->id)->exists() && $actor->canAccessLocation($existing->location_id);

            return $visible
                ? ['status' => self::HAS_RECORD, 'patient' => $existing]
                : ['status' => self::OTHER_SEDE, 'origin' => $existing->location?->name];
        }

        $record = $this->directory->find($nationalId);

        if (! $record) {
            return ['status' => self::NOT_FOUND];
        }

        $location = $this->sedes->resolve($record->sede);

        if (! $location) {
            return ['status' => self::SEDE_NOT_MAPPED, 'record' => $record];
        }

        if (! $actor->canAccessLocation($location->id)) {
            return ['status' => self::OTHER_SEDE, 'origin' => $location->name];
        }

        return ['status' => self::AVAILABLE, 'record' => $record, 'location' => $location];
    }

    private function import(EmployeeRecord $record, Location $location): Patient
    {
        $patient = new Patient([
            'national_id' => $record->nationalId,
            'first_name' => $record->firstName,
            'last_name' => $record->lastName,
            'birth_date' => $record->birthDate ?? '1900-01-01',
            'gender' => $record->gender,
            'phone' => $record->phone,
            'email' => $record->email,
            'job_title' => $record->jobTitle,
            'department_id' => $this->department($record->department)?->id,
            'location_id' => $location->id,
            'is_active' => true,
            'source' => 'directory',
            'employment_active' => $record->isActive,
            'directory_synced_at' => now(),
        ]);
        // The sede comes from the directory, not from the acting user.
        $patient->keepLocation = true;
        $patient->save();

        return $patient;
    }

    private function department(?string $name): ?Department
    {
        return $name === null ? null : Department::query()->firstOrCreate(['name' => $name], ['is_active' => true]);
    }

    public function message(string $status): string
    {
        return match ($status) {
            self::NOT_FOUND => 'No employee was found with that national ID in the corporate directory.',
            self::SEDE_NOT_MAPPED => 'The employee\'s sede has no equivalent in SaludMercal. Ask an administrator to map it.',
            self::OTHER_SEDE => 'The employee belongs to a sede outside your group. Use a service commission to attend them.',
            self::HAS_RECORD => 'The employee already has an expediente.',
            default => 'The employee cannot be registered.',
        };
    }
}

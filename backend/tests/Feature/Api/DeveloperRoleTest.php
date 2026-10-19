<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Location;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeveloperRoleTest extends TestCase
{
    use RefreshDatabase;

    private function developer(): User
    {
        $dev = User::factory()->role(UserRole::Developer)->create();
        Sanctum::actingAs($dev, ['developer']);

        return $dev;
    }

    private function openEmergency(): void
    {
        $this->postJson('/api/v1/emergency-access', ['reason' => 'Incidencia 123: diagnosticar error en historial'])->assertCreated();
    }

    public function test_developer_cannot_read_clinical_data_without_emergency_access(): void
    {
        Patient::factory()->create();
        $this->developer();

        $this->getJson('/api/v1/patients')->assertForbidden();
        $this->getJson('/api/v1/appointments')->assertForbidden();
        $this->getJson('/api/v1/medical-leaves')->assertForbidden();
        $this->getJson('/api/v1/reports/summary')->assertForbidden();
    }

    public function test_emergency_access_requires_a_justification_and_unlocks_nationwide_reads(): void
    {
        $other = Location::factory()->create();
        Patient::factory()->create();
        Patient::factory()->create(['location_id' => $other->id]);
        $this->developer();

        $this->postJson('/api/v1/emergency-access', ['reason' => 'corto'])->assertUnprocessable();

        $this->openEmergency();
        $this->postJson('/api/v1/emergency-access', ['reason' => 'Segundo intento con motivo suficiente'])->assertStatus(409);

        $this->getJson('/api/v1/patients')->assertOk()->assertJsonCount(2, 'data');

        $this->deleteJson('/api/v1/emergency-access')->assertOk()->assertJsonPath('data.active', false);
        $this->getJson('/api/v1/patients')->assertForbidden();
    }

    public function test_developer_never_writes_clinical_data_even_with_emergency_access(): void
    {
        $patient = Patient::factory()->create();
        $this->developer();
        $this->openEmergency();

        $this->postJson('/api/v1/patients', ['national_id' => 'V-12345678', 'first_name' => 'A', 'last_name' => 'B', 'birth_date' => '1990-01-01'])->assertForbidden();
        $this->putJson("/api/v1/patients/{$patient->id}", ['first_name' => 'X'])->assertForbidden();
        $this->deleteJson("/api/v1/patients/{$patient->id}")->assertForbidden();
        $this->postJson('/api/v1/users', [])->assertForbidden();
        $this->deleteJson('/api/v1/locations/1')->assertForbidden();
    }

    public function test_emergency_access_is_audited_per_request(): void
    {
        $dev = $this->developer();
        $this->openEmergency();
        $this->getJson('/api/v1/patients')->assertOk();

        $logs = \App\Models\AuditLog::where('user_id', $dev->id)->where('event', 'accessed')->get();
        $this->assertTrue($logs->contains(fn ($l) => ($l->new_values['path'] ?? null) === 'api/v1/patients'));
        $this->assertTrue(\App\Models\AuditLog::where('auditable_type', \App\Models\EmergencyAccess::class)->where('event', 'created')->exists());
    }

    public function test_developer_without_emergency_access_does_not_see_clinical_audit_trail(): void
    {
        Patient::factory()->create();
        $this->developer();

        $types = collect($this->getJson('/api/v1/audit-logs?per_page=100')->assertOk()->json('data'))->pluck('auditable_type')->unique();
        $this->assertFalse($types->contains('Patient'));

        $this->openEmergency();
        $types = collect($this->getJson('/api/v1/audit-logs?per_page=100')->assertOk()->json('data'))->pluck('auditable_type')->unique();
        $this->assertTrue($types->contains('Patient'));
    }

    public function test_developer_is_hidden_except_for_logical_security_who_can_only_toggle_activation(): void
    {
        $dev = User::factory()->role(UserRole::Developer)->create();

        foreach ([UserRole::SuperAdmin, UserRole::Admin] as $role) {
            Sanctum::actingAs(User::factory()->role($role)->create(), [$role->value]);
            $ids = collect($this->getJson('/api/v1/users?per_page=100')->assertOk()->json('data'))->pluck('id');
            $this->assertFalse($ids->contains($dev->id), "{$role->value} must not see the developer");
            $this->getJson("/api/v1/users/{$dev->id}")->assertForbidden();
            $this->deleteJson("/api/v1/users/{$dev->id}")->assertForbidden();
        }

        Sanctum::actingAs(User::factory()->logicalSecurity()->create(), ['logical_security']);
        $ids = collect($this->getJson('/api/v1/users?per_page=100')->assertOk()->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($dev->id));

        $this->patchJson("/api/v1/users/{$dev->id}", ['is_active' => false, 'name' => 'Hacked'])->assertOk();
        $dev->refresh();
        $this->assertFalse($dev->is_active);
        $this->assertNotSame('Hacked', $dev->name);
        $this->postJson("/api/v1/users/{$dev->id}/reset-password", ['password' => 'Password123*'])->assertForbidden();
        $this->deleteJson("/api/v1/users/{$dev->id}")->assertForbidden();
    }

    public function test_developer_role_cannot_be_assigned_through_the_api(): void
    {
        Sanctum::actingAs(User::factory()->role(UserRole::SuperAdmin)->create(), ['super_admin']);

        $this->postJson('/api/v1/users', ['name' => 'X', 'username' => 'x.dev', 'email' => 'x@mercal.gob.ve', 'role' => 'developer', 'password' => 'Password123*'])
            ->assertUnprocessable()->assertJsonValidationErrors('role');
    }

    public function test_developer_is_read_only_in_production(): void
    {
        $this->developer();
        $this->app['env'] = 'production';

        $this->postJson('/api/v1/locations', ['name' => 'X'])->assertForbidden()->assertJsonPath('message', 'The developer role is read-only in production.');
        $this->getJson('/api/v1/locations')->assertOk();
        $this->postJson('/api/v1/emergency-access', ['reason' => 'Soporte en producción con motivo claro'])->assertCreated();
    }
}

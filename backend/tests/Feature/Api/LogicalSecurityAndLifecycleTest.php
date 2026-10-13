<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Location;
use App\Models\MedicalLeave;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogicalSecurityAndLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_logical_security_can_manage_users_nationally(): void
    {
        $hqLocation = Location::factory()->create(['is_headquarters' => true]);
        $zuliaLocation = Location::factory()->create(['code' => 'MED-ZUL']);

        $secUser = User::factory()->role(UserRole::LogicalSecurity)->create([
            'location_id' => $hqLocation->id,
        ]);
        $this->actingAs($secUser, 'sanctum');

        // Create user in another location (Zulia)
        $response = $this->postJson('/api/v1/users', [
            'name' => 'Operador Zulia',
            'username' => 'operador.zulia',
            'email' => 'operador.zulia@mercal.gob.ve',
            'role' => UserRole::Receptionist->value,
            'location_id' => $zuliaLocation->id,
            'password' => 'Temporal123*',
            'password_expiration_months' => 6,
            'session_timeout_minutes' => 20,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', [
            'username' => 'operador.zulia',
            'location_id' => $zuliaLocation->id,
            'password_expiration_months' => 6,
            'session_timeout_minutes' => 20,
            'must_change_password' => true,
        ]);
    }

    public function test_anti_escalation_prevents_non_superadmin_from_assigning_superadmin(): void
    {
        $secUser = User::factory()->role(UserRole::LogicalSecurity)->create();
        $this->actingAs($secUser, 'sanctum');

        // Attempt to create SuperAdmin role
        $this->postJson('/api/v1/users', [
            'name' => 'Intruso Super',
            'username' => 'intruso.super',
            'email' => 'intruso@mercal.gob.ve',
            'role' => UserRole::SuperAdmin->value,
            'password' => 'Temporal123*',
        ])->assertUnprocessable()->assertJsonValidationErrors('role');
    }

    public function test_admin_cannot_assign_superadmin_or_logical_security(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        $this->postJson('/api/v1/users', [
            'name' => 'Nuevo Sec',
            'username' => 'nuevo.sec',
            'email' => 'sec@mercal.gob.ve',
            'role' => UserRole::LogicalSecurity->value,
            'password' => 'Temporal123*',
        ])->assertUnprocessable()->assertJsonValidationErrors('role');

        $this->postJson('/api/v1/users', [
            'name' => 'Nuevo Super',
            'username' => 'nuevo.super',
            'email' => 'super@mercal.gob.ve',
            'role' => UserRole::SuperAdmin->value,
            'password' => 'Temporal123*',
        ])->assertUnprocessable()->assertJsonValidationErrors('role');
    }

    public function test_logical_security_cannot_access_clinical_data(): void
    {
        $secUser = User::factory()->role(UserRole::LogicalSecurity)->create();
        $this->actingAs($secUser, 'sanctum');

        // Forbidden on patients list
        $this->getJson('/api/v1/patients')->assertForbidden();

        // Forbidden on creating patients
        $this->postJson('/api/v1/patients', [
            'first_name' => 'Juan',
            'last_name' => 'Perez',
            'national_id' => 'V-11223344',
        ])->assertForbidden();

        // Forbidden on appointments list
        $this->getJson('/api/v1/appointments')->assertForbidden();

        // Forbidden on medical leaves list
        $this->getJson('/api/v1/medical-leaves')->assertForbidden();

        // Forbidden on clinical reports
        $this->getJson('/api/v1/reports/summary')->assertForbidden();
    }

    public function test_password_expiration_lifecycle_and_middleware(): void
    {
        $user = User::factory()->create([
            'username' => 'usuario.vencido',
            'password' => 'Clave1234*',
            'password_expiration_months' => 3,
            'password_expires_at' => now()->subDay(), // Expired
            'must_change_password' => false,
        ]);

        // Login automatically detects expired password and sets must_change_password = true
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'login' => 'usuario.vencido',
            'password' => 'Clave1234*',
        ])->assertOk();

        $token = $loginRes->json('token');

        // Trying to access password-protected resources gets 403 password_change_required
        $this->withToken($token)->getJson('/api/v1/departments')
            ->assertStatus(403)
            ->assertJsonPath('code', 'password_change_required');

        // User changes password
        $this->withToken($token)->postJson('/api/v1/auth/change-password', [
            'current_password' => 'Clave1234*',
            'password' => 'NuevaClaveSegura123*',
            'password_confirmation' => 'NuevaClaveSegura123*',
        ])->assertOk();

        // Now user can access
        $this->withToken($token)->getJson('/api/v1/departments')
            ->assertOk();

        $user->refresh();
        $this->assertFalse($user->must_change_password);
        $this->assertTrue(now()->isBefore($user->password_expires_at));
    }

    public function test_reset_password_endpoint_by_security_officer(): void
    {
        $secUser = User::factory()->role(UserRole::LogicalSecurity)->create();
        $targetUser = User::factory()->create([
            'username' => 'target.user',
            'must_change_password' => false,
        ]);

        $this->actingAs($secUser, 'sanctum');

        $this->postJson("/api/v1/users/{$targetUser->id}/reset-password", [
            'password' => 'ResetPass123*',
        ])->assertOk();

        $targetUser->refresh();
        $this->assertTrue($targetUser->must_change_password);
        $this->assertTrue(password_verify('ResetPass123*', $targetUser->password));
    }
}

<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_superadmin_cannot_see_superadmin_in_users_list(): void
    {
        $superAdmin = User::factory()->role(UserRole::SuperAdmin)->create([
            'name' => 'Moisés SuperAdmin',
            'username' => 'moicastillo',
        ]);
        $logicalSecurity = $this->actingAsRole(UserRole::LogicalSecurity);

        $response = $this->getJson('/api/v1/users')->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertFalse($ids->contains($superAdmin->id));
        $this->assertTrue($ids->contains($logicalSecurity->id));
    }

    public function test_non_superadmin_querying_role_super_admin_returns_empty(): void
    {
        User::factory()->role(UserRole::SuperAdmin)->create();
        $this->actingAsRole(UserRole::Admin);

        $response = $this->getJson('/api/v1/users?role=super_admin')->assertOk();

        $this->assertEmpty($response->json('data'));
    }

    public function test_non_superadmin_cannot_view_or_update_superadmin_detail(): void
    {
        $superAdmin = User::factory()->role(UserRole::SuperAdmin)->create();
        $this->actingAsRole(UserRole::LogicalSecurity);

        $this->getJson("/api/v1/users/{$superAdmin->id}")->assertForbidden();
        $this->patchJson("/api/v1/users/{$superAdmin->id}", ['name' => 'Hack'])->assertForbidden();
    }

    public function test_superadmin_can_see_themselves_in_users_list(): void
    {
        $superAdmin = $this->actingAsRole(UserRole::SuperAdmin);
        $employee = User::factory()->role(UserRole::Employee)->create();

        $response = $this->getJson('/api/v1/users')->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($superAdmin->id));
        $this->assertTrue($ids->contains($employee->id));
    }

    public function test_superadmin_cannot_see_other_superadmins_in_users_list(): void
    {
        $superAdminA = $this->actingAsRole(UserRole::SuperAdmin);
        $superAdminB = User::factory()->role(UserRole::SuperAdmin)->create([
            'name' => 'Otro SuperAdmin',
            'username' => 'superadmin2',
        ]);

        $response = $this->getJson('/api/v1/users')->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($superAdminA->id));
        $this->assertFalse($ids->contains($superAdminB->id));
    }

    public function test_superadmin_querying_role_super_admin_returns_only_self(): void
    {
        $superAdminA = $this->actingAsRole(UserRole::SuperAdmin);
        $superAdminB = User::factory()->role(UserRole::SuperAdmin)->create();

        $response = $this->getJson('/api/v1/users?role=super_admin')->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertCount(1, $ids);
        $this->assertTrue($ids->contains($superAdminA->id));
        $this->assertFalse($ids->contains($superAdminB->id));
    }

    public function test_superadmin_cannot_view_or_update_other_superadmin(): void
    {
        $this->actingAsRole(UserRole::SuperAdmin);
        $otherSuperAdmin = User::factory()->role(UserRole::SuperAdmin)->create();

        $this->getJson("/api/v1/users/{$otherSuperAdmin->id}")->assertForbidden();
        $this->patchJson("/api/v1/users/{$otherSuperAdmin->id}", ['name' => 'Modificado'])->assertForbidden();
    }

    public function test_superadmin_can_view_and_update_themselves(): void
    {
        $superAdmin = $this->actingAsRole(UserRole::SuperAdmin);

        $this->getJson("/api/v1/users/{$superAdmin->id}")->assertOk();
        $this->patchJson("/api/v1/users/{$superAdmin->id}", [
            'name' => 'Moisés Castillo Actualizado',
        ])->assertOk();
    }
}

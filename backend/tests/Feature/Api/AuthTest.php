<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private const LOGIN = '/api/v1/auth/login';

    public function test_user_can_login_with_username_or_email(): void
    {
        $user = User::factory()->create(['username' => 'jdoe', 'email' => 'jdoe@mercal.gob.ve']);

        foreach (['jdoe', 'jdoe@mercal.gob.ve'] as $login) {
            $this->postJson(self::LOGIN, ['login' => $login, 'password' => 'Password123*'])
                ->assertOk()
                ->assertJsonStructure(['token', 'expires_at', 'user' => ['id', 'role']])
                ->assertJsonPath('user.id', $user->id);
        }
    }

    public function test_wrong_password_is_rejected_with_generic_message(): void
    {
        User::factory()->create(['username' => 'jdoe']);

        $this->postJson(self::LOGIN, ['login' => 'jdoe', 'password' => 'nope'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('login');

        $this->postJson(self::LOGIN, ['login' => 'ghost', 'password' => 'nope'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('login');
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::factory()->inactive()->create(['username' => 'jdoe']);

        $this->postJson(self::LOGIN, ['login' => 'jdoe', 'password' => 'Password123*'])
            ->assertUnprocessable();
    }

    public function test_login_is_rate_limited(): void
    {
        RateLimiter::clear('x');

        foreach (range(1, 5) as $_) {
            $this->postJson(self::LOGIN, ['login' => 'ghost', 'password' => 'nope'])->assertUnprocessable();
        }

        $this->postJson(self::LOGIN, ['login' => 'ghost', 'password' => 'nope'])->assertTooManyRequests();
    }

    public function test_protected_routes_require_authentication(): void
    {
        $this->getJson('/api/v1/patients')->assertUnauthorized()->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_logout_revokes_the_token(): void
    {
        User::factory()->create(['username' => 'jdoe']);
        $token = $this->postJson(self::LOGIN, ['login' => 'jdoe', 'password' => 'Password123*'])->json('token');

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_user_flagged_for_password_change_is_blocked_until_changed(): void
    {
        User::factory()->create(['username' => 'jdoe', 'must_change_password' => true]);
        $token = $this->postJson(self::LOGIN, ['login' => 'jdoe', 'password' => 'Password123*'])->json('token');

        $this->withToken($token)->getJson('/api/v1/departments')
            ->assertForbidden()->assertJsonPath('code', 'password_change_required');

        $this->withToken($token)->postJson('/api/v1/auth/change-password', [
            'current_password' => 'Password123*',
            'password' => 'NewPassword456*',
            'password_confirmation' => 'NewPassword456*',
        ])->assertOk();

        $this->withToken($token)->getJson('/api/v1/departments')->assertOk();
    }
}

<?php

namespace Tests;

use App\Enums\UserRole;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    protected function actingAsRole(UserRole $role): User
    {
        $user = User::factory()->role($role)->create();
        Sanctum::actingAs($user, [$role->value]);

        return $user;
    }

    /** The next Monday strictly after today (matches DoctorFactory::withWeekdaySchedule). */
    protected function nextMonday(): CarbonImmutable
    {
        return CarbonImmutable::today()->next(CarbonImmutable::MONDAY);
    }
}

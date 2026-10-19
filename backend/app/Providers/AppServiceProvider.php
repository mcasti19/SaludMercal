<?php

namespace App\Providers;

use App\Models\Department;
use App\Models\Location;
use App\Models\Specialty;
use App\Policies\CatalogPolicy;
use App\Services\EmployeeDirectory\CentralEmployeeDirectory;
use App\Services\EmployeeDirectory\EmployeeDirectory;
use App\Services\EmployeeDirectory\LocalEmployeeDirectory;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(EmployeeDirectory::class, fn () => config('employee_directory.driver') === 'database'
            ? new CentralEmployeeDirectory
            : new LocalEmployeeDirectory);
    }

    public function boot(): void
    {
        // Surface N+1 queries during development and testing.
        Model::preventLazyLoading(! $this->app->isProduction());

        foreach ([Department::class, Location::class, Specialty::class] as $model) {
            Gate::policy($model, CatalogPolicy::class);
        }

        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->id ?: $request->ip()));

        // Directory lookups by national ID: bounded to avoid enumerating the payroll.
        RateLimiter::for('directory', fn (Request $request) => Limit::perMinute(20)->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by(mb_strtolower((string) $request->input('login')).'|'.$request->ip()),
            Limit::perMinute(20)->by($request->ip()),
        ]);
    }
}

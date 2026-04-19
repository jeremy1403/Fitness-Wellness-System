<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerGates();
    }

    /**
     * Define role-based gates for programmatic authorization checks.
     *
     * These complement the EnsureRole route middleware and allow
     * authorization checks anywhere in the application via:
     *   Gate::allows('admin')
     *   $user->can('trainer')
     */
    private function registerGates(): void
    {
        Gate::define('admin', fn (User $user) => $user->hasRole('admin'));
        Gate::define('trainer', fn (User $user) => $user->hasRole('trainer'));
        Gate::define('member', fn (User $user) => $user->hasRole('member'));
        Gate::define('viewApiDocs', fn (?User $user) => app()->environment('local') || ($user && $user->hasRole('admin')));
    }
}

<?php

namespace App\Providers;

use App\Models\Payment;
use App\Observers\PaymentObserver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Repositories\Interfaces\HealthInsightRepositoryInterface::class,
            \App\Repositories\MockHealthInsightRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureModels();

        // Register the PaymentObserver
        // Every time a Payment is created, this fires automatically
        Payment::observe(PaymentObserver::class);
    }

    /**
     * Configure Eloquent model strictness for safety in development.
     *
     * In non-production environments this enables:
     * - preventLazyLoading      — catch N+1 queries early
     * - preventSilentlyDiscardingAttributes — catch typos in mass-assignment
     * - preventAccessingMissingAttributes   — catch missing column access
     */
    private function configureModels(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());
    }
}
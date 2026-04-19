<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Contracts\PromoServiceInterface;
use App\Services\Promo\RealPromoService;
use App\Services\Promo\PromoCodeProxy;
use App\Repositories\Contracts\PromoCodeRepositoryInterface;
use App\Repositories\Eloquent\EloquentPromoCodeRepository;

class PromoServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind the Repository
        $this->app->bind(PromoCodeRepositoryInterface::class, EloquentPromoCodeRepository::class);

        // PERFECT PROXY PATTERN BINDING:
        // Bind the Real service directly to it's class name, so the proxy can resolve it.
        $this->app->bind(RealPromoService::class, function ($app) {
            return new RealPromoService($app->make(PromoCodeRepositoryInterface::class));
        });

        // Bind the Interface to the Proxy, injecting the Real implementation into the Proxy.
        $this->app->bind(PromoServiceInterface::class, function ($app) {
            $realService = $app->make(RealPromoService::class);
            return new PromoCodeProxy($realService);
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}

<?php

namespace App\Providers;

use App\Repositories\Contracts\BookingRepositoryInterface;
use App\Repositories\Contracts\ClassScheduleRepositoryInterface;
use App\Repositories\Contracts\FitnessClassRepositoryInterface;
use App\Repositories\Contracts\MembershipPlanRepositoryInterface;
use App\Repositories\Contracts\MembershipRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Contracts\TrainerRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\EloquentBookingRepository;
use App\Repositories\Eloquent\EloquentClassScheduleRepository;
use App\Repositories\Eloquent\EloquentFitnessClassRepository;
use App\Repositories\Eloquent\EloquentMembershipPlanRepository;
use App\Repositories\Eloquent\EloquentMembershipRepository;
use App\Repositories\Eloquent\EloquentPaymentRepository;
use App\Repositories\Eloquent\EloquentRoleRepository;
use App\Repositories\Eloquent\EloquentTrainerRepository;
use App\Repositories\Eloquent\EloquentUserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public array $bindings = [
        UserRepositoryInterface::class => EloquentUserRepository::class,
        RoleRepositoryInterface::class => EloquentRoleRepository::class,
        TrainerRepositoryInterface::class => EloquentTrainerRepository::class,
        FitnessClassRepositoryInterface::class => EloquentFitnessClassRepository::class,
        ClassScheduleRepositoryInterface::class => EloquentClassScheduleRepository::class,
        BookingRepositoryInterface::class => EloquentBookingRepository::class,
        MembershipPlanRepositoryInterface::class => EloquentMembershipPlanRepository::class,
        MembershipRepositoryInterface::class => EloquentMembershipRepository::class,
        PaymentRepositoryInterface::class => EloquentPaymentRepository::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}

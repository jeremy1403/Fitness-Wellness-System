<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PromoCode;
use Carbon\Carbon;

class PromoCodeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        PromoCode::create([
            'code' => 'SUMMER10',
            'discount_amount' => 10.00,
            'discount_type' => 'percentage',
            'is_active' => true,
            'max_uses' => 100,
            'times_used' => 15,
            'expires_at' => Carbon::now()->addMonths(2)
        ]);

        PromoCode::create([
            'code' => 'WELCOME50',
            'discount_amount' => 50.00,
            'discount_type' => 'fixed',
            'is_active' => true,
            'max_uses' => 50,
            'times_used' => 49,
            'expires_at' => Carbon::now()->addDays(30)
        ]);

        PromoCode::create([
            'code' => 'EXPIRED20',
            'discount_amount' => 20.00,
            'discount_type' => 'fixed',
            'is_active' => false,
            'max_uses' => null,
            'times_used' => 0,
            'expires_at' => Carbon::now()->subDays(5)
        ]);

        PromoCode::create([
            'code' => 'NEWYEAR',
            'discount_amount' => 25.00,
            'discount_type' => 'percentage',
            'is_active' => true,
            'max_uses' => 500,
            'times_used' => 10,
            'expires_at' => Carbon::now()->addMonths(6)
        ]);
    }
}

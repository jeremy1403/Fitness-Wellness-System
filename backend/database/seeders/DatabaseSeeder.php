<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Order matters: roles must exist before users can be assigned to them.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            DefaultUserSeeder::class,
            MembershipPlanSeeder::class,
        ]);
    }
}
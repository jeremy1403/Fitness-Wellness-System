<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * System roles required by the application.
     *
     * @var array<int, string>
     */
    private const ROLES = ['admin', 'trainer', 'member'];

    /**
     * Seed the roles table with the three system roles.
     */
    public function run(): void
    {
        foreach (self::ROLES as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }
    }
}

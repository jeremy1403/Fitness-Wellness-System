<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DefaultUserSeeder extends Seeder
{
    /**
     * Default accounts created on every fresh seed.
     *
     * Each entry maps to one user with the given role.
     * Status defaults to 'active' unless explicitly set.
     *
     * @var array<int, array{name: string, email: string, role: string, status?: string}>
     */
    private const USERS = [
        [
            'name' => 'System Admin',
            'email' => 'admin@fitness.test',
            'role' => 'admin',
        ],
        [
            'name' => 'Default Trainer',
            'email' => 'trainer@fitness.test',
            'role' => 'trainer',
            'specialty' => 'General Fitness',
        ],
        [
            'name' => 'Default Member',
            'email' => 'member@fitness.test',
            'role' => 'member',
        ],
        [
            'name' => 'Disabled Member',
            'email' => 'disabled@fitness.test',
            'role' => 'member',
            'status' => 'disabled',
        ],
    ];

    /**
     * Create the default user accounts if they do not already exist.
     */
    public function run(): void
    {
        foreach (self::USERS as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => 'password',
                    'status' => $userData['status'] ?? 'active',
                ]
            );

            $role = Role::where('name', $userData['role'])->first();

            if ($role) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }

            if ($userData['role'] === 'trainer') {
                $user->trainer()->firstOrCreate([], [
                    'specialty' => $userData['specialty'] ?? 'General Fitness',
                    'status' => 'active',
                ]);
            }
        }
    }
}

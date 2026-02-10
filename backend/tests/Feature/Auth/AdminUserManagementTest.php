<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function createUserWithRole(string $role, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $roleModel = Role::where('name', $role)->firstOrFail();

        $user->roles()->syncWithoutDetaching([$roleModel->id]);

        return $user->refresh();
    }

    private function authHeaders(User $user): array
    {
        $token = $user->createToken('test-token');

        return ['Authorization' => 'Bearer '.$token->plainTextToken];
    }

    public function test_admin_can_list_users(): void
    {
        $admin = $this->createUserWithRole('admin');
        $this->createUserWithRole('member');
        $this->createUserWithRole('trainer');

        $response = $this->getJson('/api/v1/auth/users', $this->authHeaders($admin));

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_non_admin_cannot_access_user_list(): void
    {
        $member = $this->createUserWithRole('member');

        $response = $this->getJson('/api/v1/auth/users', $this->authHeaders($member));

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Forbidden. Insufficient role.');
    }

    public function test_admin_can_view_user(): void
    {
        $admin = $this->createUserWithRole('admin');
        $user = $this->createUserWithRole('member');

        $response = $this->getJson('/api/v1/auth/users/'.$user->id, $this->authHeaders($admin));

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $user->id);
    }

    public function test_admin_gets_404_for_missing_user(): void
    {
        $admin = $this->createUserWithRole('admin');

        $response = $this->getJson('/api/v1/auth/users/999', $this->authHeaders($admin));

        $response->assertStatus(404)
            ->assertJsonPath('message', 'User not found.');
    }

    public function test_admin_can_update_user_status(): void
    {
        $admin = $this->createUserWithRole('admin');
        $user = $this->createUserWithRole('member', ['status' => 'active']);

        $response = $this->patchJson('/api/v1/auth/users/'.$user->id.'/status', [
            'status' => 'disabled',
        ], $this->authHeaders($admin));

        $response->assertStatus(200)
            ->assertJsonPath('message', 'User status updated.')
            ->assertJsonPath('data.status', 'disabled');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'status' => 'disabled',
        ]);
    }

    public function test_admin_stats_counts_users(): void
    {
        $admin = $this->createUserWithRole('admin');
        $this->createUserWithRole('member');
        $this->createUserWithRole('trainer', ['status' => 'disabled']);

        $response = $this->getJson('/api/v1/auth/users/stats', $this->authHeaders($admin));

        $response->assertStatus(200)
            ->assertJsonPath('data.active', 2)
            ->assertJsonPath('data.disabled', 1)
            ->assertJsonPath('data.total', 3);
    }

    public function test_admin_can_assign_and_remove_role(): void
    {
        $admin = $this->createUserWithRole('admin');
        $user = $this->createUserWithRole('member');
        $trainerRole = Role::where('name', 'trainer')->firstOrFail();

        $assignResponse = $this->postJson('/api/v1/auth/users/'.$user->id.'/roles', [
            'role' => 'trainer',
        ], $this->authHeaders($admin));

        $assignResponse->assertStatus(200)
            ->assertJsonPath('message', 'Role assigned successfully.');

        $this->assertDatabaseHas('user_roles', [
            'user_id' => $user->id,
            'role_id' => $trainerRole->id,
        ]);

        $rolesAfterAssign = $assignResponse->json('data.roles');
        $this->assertContains('trainer', $rolesAfterAssign);

        $removeResponse = $this->deleteJson('/api/v1/auth/users/'.$user->id.'/roles', [
            'role' => 'trainer',
        ], $this->authHeaders($admin));

        $removeResponse->assertStatus(200)
            ->assertJsonPath('message', 'Role removed successfully.');

        $this->assertDatabaseMissing('user_roles', [
            'user_id' => $user->id,
            'role_id' => $trainerRole->id,
        ]);

        $rolesAfterRemove = $removeResponse->json('data.roles');
        $this->assertNotContains('trainer', $rolesAfterRemove);
    }
}

<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthEndpointsTest extends TestCase
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

    private function authHeaders(User $user, ?int &$tokenId = null): array
    {
        $token = $user->createToken('test-token');
        $tokenId = $token->accessToken->id;

        return ['Authorization' => 'Bearer '.$token->plainTextToken];
    }

    public function test_register_creates_user_assigns_role_and_returns_token(): void
    {
        $payload = [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'trainer',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Registration successful.')
            ->assertJsonPath('data.user.email', 'jane@example.com')
            ->assertJsonPath('data.user.status', 'active')
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'status', 'roles', 'created_at', 'updated_at'],
                    'token',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));
        $this->assertContains('trainer', $response->json('data.user.roles'));

        $user = User::where('email', 'jane@example.com')->first();
        $this->assertNotNull($user);

        $role = Role::where('name', 'trainer')->firstOrFail();
        $this->assertDatabaseHas('user_roles', [
            'user_id' => $user->id,
            'role_id' => $role->id,
        ]);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        $this->createUserWithRole('member', ['email' => 'jane@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'This email address is already registered.');
    }

    public function test_login_returns_token_for_active_user(): void
    {
        $this->createUserWithRole('member', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Login successful.')
            ->assertJsonPath('data.user.email', 'john@example.com')
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'status', 'roles', 'created_at', 'updated_at'],
                    'token',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));
        $this->assertContains('member', $response->json('data.user.roles'));
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $this->createUserWithRole('member', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'john@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'The provided credentials are incorrect.');
    }

    public function test_login_rejects_disabled_user(): void
    {
        $this->createUserWithRole('member', [
            'email' => 'disabled@example.com',
            'password' => 'password123',
            'status' => 'disabled',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'disabled@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'Your account has been disabled. Please contact support.');
    }

    public function test_me_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = $this->createUserWithRole('trainer', [
            'email' => 'trainer@example.com',
        ]);

        $response = $this->getJson('/api/v1/auth/me', $this->authHeaders($user));

        $response->assertStatus(200)
            ->assertJsonPath('data.email', 'trainer@example.com');

        $this->assertContains('trainer', $response->json('data.roles'));
    }

    public function test_update_profile_updates_name_and_email(): void
    {
        $user = $this->createUserWithRole('member', [
            'name' => 'Old Name',
            'email' => 'old@example.com',
        ]);

        $response = $this->putJson('/api/v1/auth/profile', [
            'name' => 'New Name',
            'email' => 'new@example.com',
        ], $this->authHeaders($user));

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Profile updated successfully.')
            ->assertJsonPath('data.email', 'new@example.com')
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'email' => 'new@example.com',
        ]);
    }

    public function test_update_profile_rejects_duplicate_email(): void
    {
        $user = $this->createUserWithRole('member', [
            'email' => 'first@example.com',
        ]);
        $this->createUserWithRole('member', [
            'email' => 'taken@example.com',
        ]);

        $response = $this->putJson('/api/v1/auth/profile', [
            'email' => 'taken@example.com',
        ], $this->authHeaders($user));

        $response->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'This email address is already taken.');
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = $this->createUserWithRole('member');
        $tokenId = null;

        $response = $this->postJson('/api/v1/auth/logout', [], $this->authHeaders($user, $tokenId));

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Logged out successfully.');

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
    }
}

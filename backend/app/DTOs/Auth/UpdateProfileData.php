<?php
namespace App\DTOs\Auth;

class UpdateProfileData
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $password = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            password: $data['password'] ?? null,
        );
    }
}

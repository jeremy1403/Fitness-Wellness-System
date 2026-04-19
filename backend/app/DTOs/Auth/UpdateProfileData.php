<?php

namespace App\DTOs\Auth;

class UpdateProfileData
{
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $email = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'] ?? null,
            email: $data['email'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'email' => $this->email,
        ], fn ($value) => $value !== null);
    }
}

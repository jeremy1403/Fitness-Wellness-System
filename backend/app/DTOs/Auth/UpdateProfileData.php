<?php
namespace App\DTOs\Auth;

class UpdateProfileData
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $password = null,
    ) {}
}
<?php
namespace App\DTOs\Auth;

class LoginData
{
    public function __construct(
        public readonly string $email,
        public readonly string $password,
    ) {}
}
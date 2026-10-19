<?php

namespace App\Services\EmployeeDirectory;

/** An employee as reported by the central directory. */
final class EmployeeRecord
{
    public function __construct(
        public readonly string $nationalId,
        public readonly string $firstName,
        public readonly string $lastName,
        public readonly ?string $birthDate,
        public readonly ?string $gender,
        public readonly ?string $phone,
        public readonly ?string $email,
        public readonly ?string $jobTitle,
        public readonly ?string $department,
        public readonly ?string $sede,
        public readonly bool $isActive,
    ) {}
}

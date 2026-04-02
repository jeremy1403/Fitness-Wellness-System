<?php

namespace App\Adapters\Health;

interface ExternalHealthAdapterInterface
{
    /**
     * Fetch health/wellness related data from an external source.
     *
     * @param int $userId
     * @return array
     */
    public function fetchData(int $userId): array;

    /**
     * Get the name of this adapter.
     * 
     * @return string
     */
    public function getAdapterName(): string;
}

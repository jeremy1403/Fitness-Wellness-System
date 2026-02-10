<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DbCheckCommand extends Command
{
    protected $signature = 'db:check';

    protected $description = 'Verify MySQL database connectivity and display connection info';

    public function handle(): int
    {
        $this->info('Checking database connection...');

        try {
            $pdo = DB::connection()->getPdo();

            $this->info('Connection successful!');
            $this->table(
                ['Setting', 'Value'],
                [
                    ['Driver', config('database.default')],
                    ['Host', config('database.connections.mysql.host')],
                    ['Port', config('database.connections.mysql.port')],
                    ['Database', config('database.connections.mysql.database')],
                    ['Server Version', $pdo->getAttribute(\PDO::ATTR_SERVER_VERSION)],
                    ['Charset', config('database.connections.mysql.charset')],
                    ['Engine', config('database.connections.mysql.engine') ?? 'default'],
                ]
            );

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Connection failed: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}

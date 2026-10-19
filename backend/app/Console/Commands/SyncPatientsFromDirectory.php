<?php

namespace App\Console\Commands;

use App\Models\Patient;
use App\Services\PatientDirectoryService;
use Illuminate\Console\Command;

class SyncPatientsFromDirectory extends Command
{
    protected $signature = 'patients:sync-directory';

    protected $description = 'Refresh the identity data (sede, name, job, status) of directory-sourced patients';

    public function handle(PatientDirectoryService $directory): int
    {
        $synced = $missing = 0;

        Patient::withoutGlobalScopes()->where('source', 'directory')->chunkById(200, function ($patients) use ($directory, &$synced, &$missing) {
            foreach ($patients as $patient) {
                $directory->sync($patient) ? $synced++ : $missing++;
            }
        });

        $this->info("Synced: {$synced}. Not refreshed: {$missing}.");

        return self::SUCCESS;
    }
}

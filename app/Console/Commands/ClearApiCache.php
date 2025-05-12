<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ClearApiCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api:clear-cache {type? : The specific cache type to clear (window_types, extras, finishes, company_info, all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear API data cache';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $type = $this->argument('type') ?? 'all';
        
        switch ($type) {
            case 'window_types':
                Cache::forget('window_types');
                $this->info('Window types cache cleared.');
                Log::info('Window types cache cleared manually.');
                break;
                
            case 'extras':
                Cache::forget('extras');
                $this->info('Extras cache cleared.');
                Log::info('Extras cache cleared manually.');
                break;
                
            case 'finishes':
                Cache::forget('finishes');
                $this->info('Finishes cache cleared.');
                Log::info('Finishes cache cleared manually.');
                break;
                
            case 'company_info':
                Cache::forget('company_info');
                $this->info('Company info cache cleared.');
                Log::info('Company info cache cleared manually.');
                break;
                
            case 'all':
                Cache::forget('window_types');
                Cache::forget('extras');
                Cache::forget('finishes');
                Cache::forget('company_info');
                $this->info('All API cache cleared.');
                Log::info('All API cache cleared manually.');
                break;
                
            default:
                $this->error('Invalid cache type. Available types: window_types, extras, finishes, company_info, all');
                return 1;
        }
        
        return 0;
    }
}

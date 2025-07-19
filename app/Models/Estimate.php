<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Estimate extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'reference_number',
        'customer_name',
        'customer_email',
        'customer_phone',
        'customer_address',
        'additional_info',
        'window_count',
        'total_amount',
        'estimate_data',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'estimate_data' => 'array',
        'total_amount' => 'decimal:2',
        'window_count' => 'integer',
    ];

    /**
     * Get the file associated with the estimate.
     */
    public function file(): HasOne
    {
        return $this->hasOne(EstimateFile::class);
    }
}

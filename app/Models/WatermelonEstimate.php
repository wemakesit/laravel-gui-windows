<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use NathanHeffley\LaravelWatermelon\Traits\Watermelon;

class WatermelonEstimate extends Model
{
    use HasFactory, SoftDeletes, Watermelon;

    protected $table = 'watermelon_estimates';

    protected $fillable = [
        'watermelon_id',
        'customer_id',
        'reference_number',
        'status',
        'total_amount',
        'discount_amount',
        'vat_amount',
        'final_amount',
        'notes',
        'valid_until',
        'pdf_generated_at',
        'pdf_url',
        'is_synced',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'valid_until' => 'datetime',
        'pdf_generated_at' => 'datetime',
        'is_synced' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // WatermelonDB sync attributes
    protected array $watermelonAttributes = [
        'customer_id',
        'reference_number',
        'status',
        'total_amount',
        'discount_amount',
        'vat_amount',
        'final_amount',
        'notes',
        'valid_until',
        'pdf_generated_at',
        'pdf_url',
        'is_synced',
    ];

    /**
     * Relationships
     */
    public function customer()
    {
        return $this->belongsTo(WatermelonCustomer::class, 'customer_id', 'watermelon_id');
    }

    public function windows()
    {
        return $this->hasMany(WatermelonWindow::class, 'estimate_id', 'watermelon_id');
    }

    public function extras()
    {
        return $this->hasMany(WatermelonExtra::class, 'estimate_id', 'watermelon_id');
    }

    public function photos()
    {
        return $this->hasMany(WatermelonPhoto::class, 'estimate_id', 'watermelon_id');
    }

    /**
     * Scope for WatermelonDB sync - restrict to authenticated user's data
     */
    public function scopeWatermelon($query)
    {
        // For now, return all estimates
        // You can add user-based filtering here if needed
        return $query;
    }

    /**
     * Convert to WatermelonDB format
     */
    public function toWatermelonArray(): array
    {
        $attributes = [];
        
        foreach ($this->watermelonAttributes as $attribute) {
            $attributes[$attribute] = $this->getAttribute($attribute);
        }

        return array_merge([
            'id' => $this->watermelon_id,
        ], $attributes);
    }
}

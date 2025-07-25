<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use NathanHeffley\LaravelWatermelon\Traits\Watermelon;

class WatermelonCustomer extends Model
{
    use HasFactory, SoftDeletes, Watermelon;

    protected $table = 'watermelon_customers';

    protected $fillable = [
        'watermelon_id',
        'name',
        'email',
        'phone',
        'address_line_1',
        'address_line_2',
        'city',
        'county',
        'postcode',
        'country',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // WatermelonDB sync attributes
    protected array $watermelonAttributes = [
        'name',
        'email',
        'phone',
        'address_line_1',
        'address_line_2',
        'city',
        'county',
        'postcode',
        'country',
    ];

    /**
     * Relationships
     */
    public function estimates()
    {
        return $this->hasMany(WatermelonEstimate::class, 'customer_id', 'watermelon_id');
    }

    /**
     * Scope for WatermelonDB sync
     */
    public function scopeWatermelon($query)
    {
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

    /**
     * Get full address as a single string
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address_line_1,
            $this->address_line_2,
            $this->city,
            $this->county,
            $this->postcode,
            $this->country,
        ]);

        return implode(', ', $parts);
    }
}

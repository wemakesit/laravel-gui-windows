<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use NathanHeffley\LaravelWatermelon\Traits\Watermelon;

class WatermelonWindow extends Model
{
    use HasFactory, SoftDeletes, Watermelon;

    protected $table = 'watermelon_windows';

    protected $fillable = [
        'watermelon_id',
        'estimate_id',
        'room',
        'window_type',
        'width',
        'height',
        'quantity',
        'finish',
        'glass_type',
        'opening_type',
        'notes',
    ];

    protected $casts = [
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'quantity' => 'integer',

        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // WatermelonDB sync attributes
    protected array $watermelonAttributes = [
        'estimate_id',
        'room',
        'window_type',
        'width',
        'height',
        'quantity',
        'finish',
        'glass_type',
        'opening_type',
        'notes',
    ];

    /**
     * Relationships
     */
    public function estimate()
    {
        return $this->belongsTo(WatermelonEstimate::class, 'estimate_id', 'watermelon_id');
    }

    public function photos()
    {
        return $this->hasMany(WatermelonPhoto::class, 'window_id', 'watermelon_id');
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
}

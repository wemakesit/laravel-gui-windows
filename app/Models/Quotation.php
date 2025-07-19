<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Quotation extends Model
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
        'quotation_data',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quotation_data' => 'array',
        'total_amount' => 'decimal:2',
        'window_count' => 'integer',
    ];

    /**
     * Get the file associated with the quotation.
     */
    public function file(): HasOne
    {
        return $this->hasOne(QuotationFile::class);
    }

    /**
     * Generate a unique reference number for a new quotation.
     */
    public static function generateReferenceNumber(): string
    {
        $prefix = 'QUO-';
        $date = date('Ymd');
        $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));

        return $prefix.$date.'-'.$random;
    }
}

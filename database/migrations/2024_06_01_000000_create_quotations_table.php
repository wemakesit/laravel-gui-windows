<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->text('customer_address');
            $table->text('additional_info')->nullable();
            $table->integer('window_count');
            $table->decimal('total_amount', 10, 2);
            $table->json('quotation_data'); // Store the full quotation data as JSON
            $table->timestamps();
        });

        Schema::create('quotation_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->onDelete('cascade');
            $table->string('filename');
            $table->string('path');
            $table->string('mime_type')->default('application/pdf');
            $table->bigInteger('size')->unsigned();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_files');
        Schema::dropIfExists('quotations');
    }
};

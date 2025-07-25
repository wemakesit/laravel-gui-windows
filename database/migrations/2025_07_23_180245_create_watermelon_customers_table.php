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
        Schema::create('watermelon_customers', function (Blueprint $table) {
            $table->id();
            $table->string('watermelon_id')->unique();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address_line_1')->nullable();
            $table->string('address_line_2')->nullable();
            $table->string('city')->nullable();
            $table->string('county')->nullable();
            $table->string('postcode')->nullable();
            $table->string('country')->default('UK');
            $table->timestamps();
            $table->softDeletes();

            $table->index('watermelon_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('watermelon_customers');
    }
};

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
        // Rename quotations table to estimates
        Schema::rename('quotations', 'estimates');

        // Rename quotation_files table to estimate_files
        Schema::rename('quotation_files', 'estimate_files');

        // Update foreign key column name in estimate_files table
        Schema::table('estimate_files', function (Blueprint $table) {
            $table->dropForeign(['quotation_id']);
            $table->renameColumn('quotation_id', 'estimate_id');
            $table->foreign('estimate_id')->references('id')->on('estimates')->onDelete('cascade');
        });

        // Rename quotation_data column to estimate_data in estimates table
        Schema::table('estimates', function (Blueprint $table) {
            $table->renameColumn('quotation_data', 'estimate_data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse the column rename in estimates table
        Schema::table('estimates', function (Blueprint $table) {
            $table->renameColumn('estimate_data', 'quotation_data');
        });

        // Reverse the foreign key changes in estimate_files table
        Schema::table('estimate_files', function (Blueprint $table) {
            $table->dropForeign(['estimate_id']);
            $table->renameColumn('estimate_id', 'quotation_id');
            $table->foreign('quotation_id')->references('id')->on('estimates')->onDelete('cascade');
        });

        // Rename tables back
        Schema::rename('estimate_files', 'quotation_files');
        Schema::rename('estimates', 'quotations');
    }
};

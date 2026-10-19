<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Stub of the corporate employee directory, read by the `local` driver while the central view is not available. */
    public function up(): void
    {
        Schema::create('directory_employees', function (Blueprint $table) {
            $table->id();
            $table->string('national_id', 20)->unique();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->date('birth_date')->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('job_title', 150)->nullable();
            $table->string('department')->nullable();
            $table->string('sede')->nullable();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('directory_employees');
    }
};

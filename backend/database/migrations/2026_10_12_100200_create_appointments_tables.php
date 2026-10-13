<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->foreignId('doctor_id')->constrained()->restrictOnDelete();
            $table->foreignId('specialty_id')->constrained()->restrictOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->date('scheduled_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('status', 20)->default('pending');
            $table->string('reason', 500);
            $table->text('notes')->nullable();
            $table->string('cancellation_reason', 500)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['doctor_id', 'scheduled_date']);
            $table->index(['patient_id', 'scheduled_date']);
            $table->index(['location_id', 'scheduled_date']);
            $table->index(['scheduled_date', 'status']);
        });

        // Database-level guarantee against double booking: one active appointment
        // per doctor/date/start time. Cancelled, completed and no-show rows free the slot.
        DB::statement(
            "CREATE UNIQUE INDEX appointments_active_slot_unique
             ON appointments (doctor_id, scheduled_date, start_time)
             WHERE status IN ('pending', 'confirmed', 'in_progress') AND deleted_at IS NULL"
        );

        Schema::create('appointment_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20);
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('comment', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['appointment_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_status_histories');
        DB::statement('DROP INDEX IF EXISTS appointments_active_slot_unique');
        Schema::dropIfExists('appointments');
    }
};

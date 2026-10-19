<?php

use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\DoctorController;
use App\Http\Controllers\Api\V1\EmergencyAccessController;
use App\Http\Controllers\Api\V1\LocationController;
use App\Http\Controllers\Api\V1\MedicalExamController;
use App\Http\Controllers\Api\V1\MedicalLeaveController;
use App\Http\Controllers\Api\V1\PatientController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ServiceCommissionController;
use App\Http\Controllers\Api\V1\SpecialtyController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ── Public ────────────────────────────────────────────────────────────
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    // ── Authenticated ─────────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

        // Everything below requires the account not to be flagged for a password change.
        Route::middleware('password.changed')->group(function () {
            // Break-glass access (developer only) is outside the read-only guard on purpose.
            Route::get('emergency-access', [EmergencyAccessController::class, 'show']);
            Route::post('emergency-access', [EmergencyAccessController::class, 'store']);
            Route::delete('emergency-access', [EmergencyAccessController::class, 'destroy']);
        });

        Route::middleware(['password.changed', 'developer.readonly', 'emergency.audit'])->group(function () {

            Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword']);
            Route::apiResource('users', UserController::class);
            Route::get('audit-logs', [AuditLogController::class, 'index']);

            Route::apiResource('departments', DepartmentController::class);
            Route::apiResource('locations', LocationController::class);
            Route::apiResource('specialties', SpecialtyController::class);

            Route::get('service-commissions', [ServiceCommissionController::class, 'index']);
            Route::post('service-commissions', [ServiceCommissionController::class, 'store']);
            Route::post('service-commissions/{service_commission}/end', [ServiceCommissionController::class, 'end']);

            Route::get('patients/me', [PatientController::class, 'me']);
            Route::apiResource('patients', PatientController::class);

            Route::get('patients/{patient}/medical-exams', [MedicalExamController::class, 'index']);
            Route::post('patients/{patient}/medical-exams', [MedicalExamController::class, 'store']);
            Route::get('medical-exams/{medical_exam}/files/{file}', [MedicalExamController::class, 'file'])->whereNumber('file');
            Route::apiResource('medical-exams', MedicalExamController::class)
                ->parameters(['medical-exams' => 'medical_exam'])
                ->only(['show', 'destroy']);

            Route::get('doctors/{doctor}/availability', [DoctorController::class, 'availability']);
            Route::post('doctors/{doctor}/time-offs', [DoctorController::class, 'storeTimeOff']);
            Route::delete('doctors/{doctor}/time-offs/{timeOff}', [DoctorController::class, 'destroyTimeOff']);
            Route::apiResource('doctors', DoctorController::class);

            Route::post('appointments/{appointment}/status', [AppointmentController::class, 'transition']);
            Route::patch('appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);
            Route::get('appointments/{appointment}/prescription', [AppointmentController::class, 'prescription']);
            Route::apiResource('appointments', AppointmentController::class)->except('update');

            Route::post('medical-leaves/{medical_leave}/review', [MedicalLeaveController::class, 'review']);
            Route::get('medical-leaves/{medical_leave}/attachment', [MedicalLeaveController::class, 'attachment']);
            Route::get('medical-leaves/{medical_leave}/certificate', [MedicalLeaveController::class, 'certificate']);
            Route::apiResource('medical-leaves', MedicalLeaveController::class)
                ->parameters(['medical-leaves' => 'medical_leave'])
                ->except('update');

            Route::get('reports/summary', [ReportController::class, 'summary']);
            Route::get('reports/export', [ReportController::class, 'export']);
        });
    });
});

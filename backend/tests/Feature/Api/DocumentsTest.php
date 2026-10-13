<?php

namespace Tests\Feature\Api;

use App\Enums\AppointmentStatus;
use App\Enums\MedicalLeaveStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\MedicalLeave;
use App\Models\Patient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_medical_leave_certificate_can_be_downloaded_when_approved(): void
    {
        $admin = $this->actingAsRole(UserRole::Admin);
        $patient = Patient::factory()->create();

        $leave = MedicalLeave::factory()->create([
            'patient_id' => $patient->id,
            'status' => MedicalLeaveStatus::Approved,
            'reviewed_by' => $admin->id,
        ]);

        $response = $this->get("/api/v1/medical-leaves/{$leave->id}/certificate");

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');

        $this->assertNotEmpty($response->getContent());
    }

    public function test_medical_leave_certificate_rejected_if_pending(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $patient = Patient::factory()->create();

        $leave = MedicalLeave::factory()->create([
            'patient_id' => $patient->id,
            'status' => MedicalLeaveStatus::Pending,
        ]);

        $this->getJson("/api/v1/medical-leaves/{$leave->id}/certificate")
            ->assertStatus(422);
    }

    public function test_completed_appointment_prescription_pdf_download(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $doctor = Doctor::factory()->create();
        $patient = Patient::factory()->create();

        $appointment = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'status' => AppointmentStatus::Completed,
            'notes' => 'Tomar Paracetamol 500mg cada 8 horas por 3 dias.',
        ]);

        $response = $this->get("/api/v1/appointments/{$appointment->id}/prescription");

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');

        $this->assertNotEmpty($response->getContent());
    }

    public function test_prescription_rejected_if_appointment_not_completed(): void
    {
        $this->actingAsRole(UserRole::Admin);
        $doctor = Doctor::factory()->create();
        $patient = Patient::factory()->create();

        $appointment = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'status' => AppointmentStatus::Pending,
        ]);

        $this->getJson("/api/v1/appointments/{$appointment->id}/prescription")
            ->assertStatus(422);
    }

    public function test_reports_export_csv(): void
    {
        $this->actingAsRole(UserRole::Admin);

        $response = $this->get('/api/v1/reports/export?format=csv');

        $response->assertOk()
            ->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_reports_export_pdf(): void
    {
        $this->actingAsRole(UserRole::Admin);

        $response = $this->get('/api/v1/reports/export?format=pdf');

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');

        $this->assertNotEmpty($response->getContent());
    }
}

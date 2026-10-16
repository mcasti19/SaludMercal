<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Doctor;
use App\Models\MedicalExam;
use App\Models\Patient;
use App\Models\Specialty;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MedicalExamTest extends TestCase
{
    use RefreshDatabase;

    private function payload(Specialty $specialty, array $overrides = []): array
    {
        return [
            'specialty_id' => $specialty->id,
            'title' => 'Hematología completa',
            'exam_date' => now()->subDay()->toDateString(),
            'files' => [UploadedFile::fake()->create('resultado.pdf', 200, 'application/pdf')],
            ...$overrides,
        ];
    }

    public function test_doctor_can_upload_exam_with_multiple_files(): void
    {
        Storage::fake('local');
        $this->actingAsRole(UserRole::Doctor);
        $patient = Patient::factory()->create();
        $specialty = Specialty::factory()->create();

        $this->postJson("/api/v1/patients/{$patient->id}/medical-exams", $this->payload($specialty, [
            'files' => [
                UploadedFile::fake()->create('a.pdf', 100, 'application/pdf'),
                UploadedFile::fake()->create('b.jpg', 50, 'image/jpeg'),
            ],
        ]))
            ->assertCreated()
            ->assertJsonCount(2, 'data.files')
            ->assertJsonPath('data.specialty_id', $specialty->id);

        $this->assertDatabaseHas('medical_exams', ['patient_id' => $patient->id, 'specialty_id' => $specialty->id]);
        $this->assertDatabaseCount('medical_exam_files', 2);
    }

    public function test_exam_can_be_linked_to_an_optional_appointment(): void
    {
        Storage::fake('local');
        $this->actingAsRole(UserRole::Admin);
        $patient = Patient::factory()->create();
        $specialty = Specialty::factory()->create();

        $this->postJson("/api/v1/patients/{$patient->id}/medical-exams", $this->payload($specialty))
            ->assertCreated()
            ->assertJsonPath('data.appointment_id', null);
    }

    public function test_upload_validates_files_and_date(): void
    {
        Storage::fake('local');
        $this->actingAsRole(UserRole::Doctor);
        $patient = Patient::factory()->create();
        $specialty = Specialty::factory()->create();
        $url = "/api/v1/patients/{$patient->id}/medical-exams";

        $this->postJson($url, $this->payload($specialty, ['files' => [UploadedFile::fake()->create('x.exe', 10)]]))
            ->assertJsonValidationErrors('files.0');

        $this->postJson($url, $this->payload($specialty, ['files' => [UploadedFile::fake()->create('big.pdf', 10241, 'application/pdf')]]))
            ->assertJsonValidationErrors('files.0');

        $this->postJson($url, $this->payload($specialty, ['files' => []]))
            ->assertJsonValidationErrors('files');

        $this->postJson($url, $this->payload($specialty, ['exam_date' => now()->addDay()->toDateString()]))
            ->assertJsonValidationErrors('exam_date');
    }

    public function test_employee_cannot_upload_but_can_view_own_exams_only(): void
    {
        Storage::fake('local');
        $employee = $this->actingAsRole(UserRole::Employee);
        $own = Patient::factory()->create(['user_id' => $employee->id]);
        $other = Patient::factory()->create();
        $specialty = Specialty::factory()->create();

        MedicalExam::factory()->create(['patient_id' => $own->id, 'specialty_id' => $specialty->id]);
        MedicalExam::factory()->create(['patient_id' => $other->id, 'specialty_id' => $specialty->id]);

        $this->postJson("/api/v1/patients/{$own->id}/medical-exams", $this->payload($specialty))->assertForbidden();
        $this->getJson("/api/v1/patients/{$own->id}/medical-exams")->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/v1/patients/{$other->id}/medical-exams")->assertForbidden();
    }

    public function test_logical_security_has_no_access(): void
    {
        $this->actingAsRole(UserRole::LogicalSecurity);
        $patient = Patient::factory()->create();

        $this->getJson("/api/v1/patients/{$patient->id}/medical-exams")->assertForbidden();
    }

    public function test_index_filters_by_specialty_and_date_range(): void
    {
        $this->actingAsRole(UserRole::Doctor);
        $patient = Patient::factory()->create();
        [$lab, $img] = Specialty::factory()->count(2)->create();

        MedicalExam::factory()->create(['patient_id' => $patient->id, 'specialty_id' => $lab->id, 'exam_date' => '2026-01-10']);
        MedicalExam::factory()->create(['patient_id' => $patient->id, 'specialty_id' => $img->id, 'exam_date' => '2026-03-10']);

        $url = "/api/v1/patients/{$patient->id}/medical-exams";

        $this->getJson("{$url}?specialty_id={$lab->id}")->assertJsonCount(1, 'data');
        $this->getJson("{$url}?from=2026-02-01")->assertJsonCount(1, 'data')->assertJsonPath('data.0.specialty_id', $img->id);
        $this->getJson($url)->assertJsonCount(2, 'data')->assertJsonPath('data.0.exam_date', '2026-03-10');
    }

    public function test_viewing_and_downloading_a_file_is_audited(): void
    {
        Storage::fake('local');
        $user = $this->actingAsRole(UserRole::Doctor);
        $patient = Patient::factory()->create();
        $specialty = Specialty::factory()->create();

        $exam = MedicalExam::find(
            $this->postJson("/api/v1/patients/{$patient->id}/medical-exams", $this->payload($specialty))->json('data.id')
        );
        $fileId = $exam->files()->value('id');

        $this->getJson("/api/v1/medical-exams/{$exam->id}")->assertOk();
        $this->get("/api/v1/medical-exams/{$exam->id}/files/{$fileId}")->assertOk();
        $this->get("/api/v1/medical-exams/{$exam->id}/files/{$fileId}?download=1")->assertOk();

        $this->assertSame(2, AuditLog::where('event', 'viewed')->where('user_id', $user->id)->count());
        $this->assertSame(1, AuditLog::where('event', 'downloaded')->where('user_id', $user->id)->count());
        $this->assertSame(1, AuditLog::where('event', 'created')->where('auditable_type', MedicalExam::class)->count());
    }

    public function test_only_admins_can_delete_exams(): void
    {
        $patient = Patient::factory()->create();
        $exam = MedicalExam::factory()->create(['patient_id' => $patient->id]);

        $this->actingAsRole(UserRole::Doctor);
        $this->deleteJson("/api/v1/medical-exams/{$exam->id}")->assertForbidden();

        $this->actingAsRole(UserRole::Admin);
        $this->deleteJson("/api/v1/medical-exams/{$exam->id}")->assertNoContent();
        $this->assertSoftDeleted($exam);
    }

    public function test_doctor_requires_at_least_one_specialty_and_accepts_several(): void
    {
        $this->actingAsRole(UserRole::Admin);
        [$a, $b] = Specialty::factory()->count(2)->create();

        $base = ['first_name' => 'Ana', 'last_name' => 'Pérez'];

        $this->postJson('/api/v1/doctors', $base)->assertJsonValidationErrors('specialty_ids');
        $this->postJson('/api/v1/doctors', $base + ['specialty_ids' => []])->assertJsonValidationErrors('specialty_ids');

        $response = $this->postJson('/api/v1/doctors', $base + ['specialty_ids' => [$a->id, $b->id], 'specialty_id' => $b->id])
            ->assertCreated()
            ->assertJsonPath('data.specialty_id', $b->id)
            ->assertJsonCount(2, 'data.specialties');

        $doctor = Doctor::find($response->json('data.id'));
        $this->assertEqualsCanonicalizing([$a->id, $b->id], $doctor->specialties()->pluck('specialties.id')->all());

        $this->putJson("/api/v1/doctors/{$doctor->id}", ['specialty_ids' => [$a->id]])
            ->assertOk()
            ->assertJsonPath('data.specialty_id', $a->id)
            ->assertJsonCount(1, 'data.specialties');
    }

    public function test_specialty_with_exams_cannot_be_deleted(): void
    {
        $this->actingAsRole(UserRole::SuperAdmin);
        $exam = MedicalExam::factory()->create();

        $this->deleteJson("/api/v1/specialties/{$exam->specialty_id}")->assertStatus(409);
    }
}

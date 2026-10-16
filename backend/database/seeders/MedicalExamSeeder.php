<?php

namespace Database\Seeders;

use App\Models\MedicalExam;
use App\Models\Patient;
use App\Models\Specialty;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Demo exams (with a tiny placeholder PDF each) so the patient file shows data out of the box.
 */
class MedicalExamSeeder extends Seeder
{
    private const SAMPLE_PDF = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";

    public function run(): void
    {
        $exams = [
            ['specialty' => 'Laboratorio', 'title' => 'Hematología completa', 'days_ago' => 30],
            ['specialty' => 'Laboratorio', 'title' => 'Perfil lipídico', 'days_ago' => 120],
            ['specialty' => 'Imagenología', 'title' => 'Radiografía de tórax', 'days_ago' => 60],
            ['specialty' => 'Cardiología', 'title' => 'Electrocardiograma', 'days_ago' => 15],
        ];

        foreach (Patient::query()->limit(3)->get() as $patient) {
            foreach ($exams as $data) {
                $specialty = Specialty::where('name', $data['specialty'])->first();

                if (! $specialty) {
                    continue;
                }

                $exam = MedicalExam::updateOrCreate(
                    ['patient_id' => $patient->id, 'specialty_id' => $specialty->id, 'title' => $data['title']],
                    ['location_id' => $patient->location_id, 'exam_date' => now()->subDays($data['days_ago'])->toDateString()]
                );

                if ($exam->files()->exists()) {
                    continue;
                }

                $path = "medical-exams/{$patient->id}/seed-{$exam->id}.pdf";
                Storage::disk('local')->put($path, self::SAMPLE_PDF);

                $exam->files()->create([
                    'path' => $path,
                    'original_name' => str($data['title'])->slug().'.pdf',
                    'mime_type' => 'application/pdf',
                    'size' => strlen(self::SAMPLE_PDF),
                ]);
            }
        }
    }
}

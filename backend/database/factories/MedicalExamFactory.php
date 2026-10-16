<?php

namespace Database\Factories;

use App\Models\MedicalExam;
use App\Models\Patient;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MedicalExam>
 */
class MedicalExamFactory extends Factory
{
    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'specialty_id' => Specialty::factory(),
            'title' => fake()->randomElement(['Hematología completa', 'Electrocardiograma', 'Radiografía de tórax', 'Perfil lipídico']),
            'exam_date' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}

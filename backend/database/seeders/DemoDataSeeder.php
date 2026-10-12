<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Location;
use App\Models\MedicalLeave;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Optional fake data for local development: php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CatalogSeeder::class);

        $location = Location::firstOrCreate(['name' => 'Sede Central'], ['code' => 'CCS', 'state' => 'Distrito Capital', 'city' => 'Caracas']);
        $departments = Department::all();

        $doctors = Specialty::all()->map(fn (Specialty $specialty) => Doctor::factory()
            ->withWeekdaySchedule()
            ->create(['specialty_id' => $specialty->id, 'location_id' => $location->id]));

        Doctor::first()?->update(['user_id' => User::factory()->role(UserRole::Doctor)->create()->id]);

        $patients = Patient::factory(25)->create([
            'location_id' => $location->id,
        ])->each(fn (Patient $p) => $p->update(['department_id' => $departments->random()->id]));

        Patient::first()?->update(['user_id' => User::factory()->create(['email' => 'employee@mercal.gob.ve', 'username' => 'employee'])->id]);

        foreach ($patients->take(15) as $i => $patient) {
            $doctor = $doctors->random();
            $start = now()->setTime(8, 0)->addMinutes(30 * $i);

            Appointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'specialty_id' => $doctor->specialty_id,
                'scheduled_date' => now()->addDays(($i % 5) + 1)->toDateString(),
                'start_time' => $start->format('H:i'),
                'end_time' => $start->addMinutes(30)->format('H:i'),
            ]);
        }

        MedicalLeave::factory(5)->create(['patient_id' => $patients->random()->id]);
    }
}

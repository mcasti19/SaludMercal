<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Location;
use App\Models\Patient;
use App\Models\User;
use App\Services\EmployeeDirectory\CentralEmployeeDirectory;
use App\Services\EmployeeDirectory\SedeResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Patients are opened on demand from the corporate employee directory. */
class PatientDirectoryTest extends TestCase
{
    use RefreshDatabase;

    private Location $central;

    private Location $capital;

    private Location $zulia;

    protected function setUp(): void
    {
        parent::setUp();

        $this->central = Location::factory()->create(['name' => 'Sede Central', 'state' => 'Distrito Capital', 'location_group' => 'caracas']);
        $this->capital = Location::factory()->create(['name' => 'Capital', 'state' => 'Distrito Capital', 'location_group' => 'caracas']);
        $this->zulia = Location::factory()->create(['name' => 'Sede Mercal Zulia', 'state' => 'Zulia']);
    }

    private function employee(string $nid, string $sede, bool $active = true, array $extra = []): void
    {
        DB::table('directory_employees')->insert($extra + [
            'national_id' => $nid, 'first_name' => 'Luisa', 'last_name' => 'Fernández', 'birth_date' => '1988-03-14',
            'gender' => 'female', 'phone' => '0414-1112233', 'email' => 'l@mercal.gob.ve', 'job_title' => 'Analista',
            'department' => 'Recursos Humanos', 'sede' => $sede, 'is_active' => $active,
        ]);
    }

    private function actAs(UserRole $role, Location $location): User
    {
        $user = User::factory()->role($role)->create(['location_id' => $location->id]);
        Sanctum::actingAs($user, [$role->value]);

        return $user;
    }

    public function test_reception_opens_an_expediente_from_the_directory_with_the_employees_sede(): void
    {
        $this->employee('V-20111222', 'Sede Central');
        $this->actAs(UserRole::Receptionist, $this->capital);

        $this->postJson('/api/v1/patients/directory-lookup', ['national_id' => '20111222'])
            ->assertOk()->assertJsonPath('data.status', 'available')->assertJsonPath('data.employee.sede', 'Sede Central');

        $this->postJson('/api/v1/patients/from-directory', ['national_id' => 'v-20.111.222'])
            ->assertCreated()
            ->assertJsonPath('data.source', 'directory')
            ->assertJsonPath('data.location_id', $this->central->id) // the employee's sede, not the reception's
            ->assertJsonPath('data.first_name', 'Luisa')
            ->assertJsonPath('data.employment_active', true);

        $this->postJson('/api/v1/patients/directory-lookup', ['national_id' => 'V-20111222'])
            ->assertOk()->assertJsonPath('data.status', 'has_record');
        $this->assertDatabaseHas('departments', ['name' => 'Recursos Humanos']);
    }

    public function test_employee_of_another_sede_cannot_be_opened_and_unknown_ids_are_rejected(): void
    {
        $this->employee('V-16444555', 'Zulia');
        $this->actAs(UserRole::Receptionist, $this->central);

        $this->postJson('/api/v1/patients/from-directory', ['national_id' => 'V-16444555'])
            ->assertUnprocessable()->assertJsonPath('status', 'other_sede');
        $this->postJson('/api/v1/patients/directory-lookup', ['national_id' => 'V-99999999'])->assertNotFound();
        $this->assertDatabaseCount('patients', 0);

        $this->employee('V-11111111', 'Región Desconocida');
        $this->postJson('/api/v1/patients/from-directory', ['national_id' => 'V-11111111'])
            ->assertUnprocessable()->assertJsonPath('status', 'sede_not_mapped');
    }

    public function test_doctor_cannot_open_expedientes_and_manual_creation_is_admin_only(): void
    {
        $this->actAs(UserRole::Doctor, $this->central);
        $this->postJson('/api/v1/patients/from-directory', ['national_id' => 'V-20111222'])->assertForbidden();

        $this->actAs(UserRole::Receptionist, $this->central);
        $payload = ['national_id' => 'V-12345678', 'first_name' => 'Ana', 'last_name' => 'Pérez', 'birth_date' => '1990-05-10'];
        $this->postJson('/api/v1/patients', $payload)->assertForbidden();

        $this->actAs(UserRole::Admin, $this->central);
        $this->postJson('/api/v1/patients', $payload)->assertCreated()->assertJsonPath('data.source', 'manual');
    }

    public function test_directory_fields_are_read_only_but_the_medical_file_is_editable(): void
    {
        $this->employee('V-20111222', 'Sede Central');
        $this->actAs(UserRole::Admin, $this->central);
        $id = $this->postJson('/api/v1/patients/from-directory', ['national_id' => 'V-20111222'])->json('data.id');

        $this->putJson("/api/v1/patients/{$id}", ['first_name' => 'Cambiado', 'blood_type' => 'O+', 'allergies' => 'Penicilina'])
            ->assertOk()
            ->assertJsonPath('data.first_name', 'Luisa')
            ->assertJsonPath('data.blood_type', 'O+')
            ->assertJsonPath('data.allergies', 'Penicilina');
    }

    public function test_sync_updates_the_sede_and_status_from_the_directory(): void
    {
        $this->employee('V-20111222', 'Sede Central');
        $this->actAs(UserRole::Admin, $this->central);
        $id = $this->postJson('/api/v1/patients/from-directory', ['national_id' => 'V-20111222'])->json('data.id');

        DB::table('directory_employees')->where('national_id', 'V-20111222')->update(['sede' => 'Capital', 'is_active' => false, 'job_title' => 'Jefa']);

        $this->artisan('patients:sync-directory')->assertSuccessful();

        $patient = Patient::withoutGlobalScopes()->find($id);
        $this->assertSame($this->capital->id, $patient->location_id);
        $this->assertFalse($patient->employment_active);
        $this->assertSame('Jefa', $patient->job_title);
        $this->assertDatabaseHas('audit_logs', ['auditable_type' => Patient::class, 'auditable_id' => $id, 'event' => 'updated']);
    }

    public function test_commission_opens_the_expediente_from_the_directory_with_its_origin_sede(): void
    {
        $this->employee('V-20111222', 'Sede Central');
        $this->actAs(UserRole::Receptionist, $this->zulia);

        $this->postJson('/api/v1/service-commissions', ['national_id' => 'V-20111222', 'reason' => 'Auditoría'])
            ->assertCreated()
            ->assertJsonPath('data.origin_location.id', $this->central->id)
            ->assertJsonPath('data.destination_location.id', $this->zulia->id);

        $this->assertSame('directory', Patient::withoutGlobalScopes()->where('national_id', 'V-20111222')->value('source'));
    }

    public function test_lookups_are_audited_and_rate_limited(): void
    {
        $user = $this->actAs(UserRole::Receptionist, $this->central);

        $this->postJson('/api/v1/patients/directory-lookup', ['national_id' => 'V-99999999'])->assertNotFound();
        $this->assertDatabaseHas('audit_logs', ['user_id' => $user->id, 'event' => 'directory_lookup']);

        $codes = collect(range(1, 25))->map(fn () => $this->postJson('/api/v1/patients/directory-lookup', ['national_id' => 'V-99999999'])->status());
        $this->assertContains(429, $codes->all());
    }

    public function test_central_database_driver_reads_the_configured_view_and_columns(): void
    {
        config(['database.connections.central' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => ''], 'employee_directory.view' => 'vw_empleados']);
        Schema::connection('central')->create('vw_empleados', function ($t) {
            foreach (['cedula', 'nombres', 'apellidos', 'fecha_nacimiento', 'sexo', 'telefono', 'correo', 'cargo', 'departamento', 'sede', 'estatus'] as $c) {
                $t->string($c)->nullable();
            }
        });
        DB::connection('central')->table('vw_empleados')->insert([
            'cedula' => '20111222', 'nombres' => 'LUISA', 'apellidos' => 'FERNANDEZ', 'fecha_nacimiento' => '1988-03-14 00:00:00',
            'sexo' => 'F', 'cargo' => 'Analista', 'departamento' => 'RRHH', 'sede' => 'Zulia', 'estatus' => 'EGRESADO',
        ]);

        $record = (new CentralEmployeeDirectory)->find('V-20111222');

        $this->assertSame('LUISA', $record->firstName);
        $this->assertSame('1988-03-14', $record->birthDate);
        $this->assertSame('female', $record->gender);
        $this->assertFalse($record->isActive);
        $this->assertNull((new CentralEmployeeDirectory)->find('V-1'));
        $this->assertSame($this->zulia->id, app(SedeResolver::class)->resolve($record->sede)?->id);
    }
}

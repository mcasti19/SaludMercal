<?php

/*
| Source of truth for employees (the corporate "central" database view). Patients are created on demand
| from it by national ID and keep a local snapshot. Until the view is available the `local` driver reads
| the stub table `directory_employees`.
*/
return [

    // local | database
    'driver' => env('EMPLOYEE_DIRECTORY_DRIVER', 'local'),

    // Read-only connection (see config/database.php `central`) and the view to query.
    'connection' => env('EMPLOYEE_DIRECTORY_CONNECTION', 'central'),
    'view' => env('EMPLOYEE_DIRECTORY_VIEW', 'vw_empleados'),

    // Column names of the view, mapped to the fields we use. Adjust once the final view exists.
    'columns' => [
        'national_id' => env('EMPLOYEE_DIRECTORY_COL_CEDULA', 'cedula'),
        'first_name' => env('EMPLOYEE_DIRECTORY_COL_NOMBRES', 'nombres'),
        'last_name' => env('EMPLOYEE_DIRECTORY_COL_APELLIDOS', 'apellidos'),
        'birth_date' => env('EMPLOYEE_DIRECTORY_COL_NACIMIENTO', 'fecha_nacimiento'),
        'gender' => env('EMPLOYEE_DIRECTORY_COL_SEXO', 'sexo'),
        'phone' => env('EMPLOYEE_DIRECTORY_COL_TELEFONO', 'telefono'),
        'email' => env('EMPLOYEE_DIRECTORY_COL_CORREO', 'correo'),
        'job_title' => env('EMPLOYEE_DIRECTORY_COL_CARGO', 'cargo'),
        'department' => env('EMPLOYEE_DIRECTORY_COL_DEPARTAMENTO', 'departamento'),
        'sede' => env('EMPLOYEE_DIRECTORY_COL_SEDE', 'sede'),
        'status' => env('EMPLOYEE_DIRECTORY_COL_ESTATUS', 'estatus'),
    ],

    // Values of the status column that mean "active employee" (case-insensitive).
    'active_statuses' => ['activo', 'active', 'a', '1'],

    // Central sede/state names that do not match one of our locations by name, state or code.
    // Example: 'dtto capital' => 'MED-CAP'. Keys are normalised (lowercase, no accents).
    'sede_aliases' => [],
];

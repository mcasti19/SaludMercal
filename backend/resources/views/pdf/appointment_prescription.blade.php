<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Comprobante de Consulta Médica e Indicaciones - Mercal</title>
    <style>
        @page {
            margin: 20mm 18mm 18mm 18mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 10.5pt;
            line-height: 1.45;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .institution-title {
            font-size: 14pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
        }
        .department-subtitle {
            font-size: 9.5pt;
            color: #0d9488;
            font-weight: 600;
        }
        .doc-meta {
            text-align: right;
            font-size: 8.5pt;
            color: #64748b;
        }
        .doc-title {
            text-align: center;
            font-size: 13pt;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 18px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background-color: #f0fdfa;
            padding: 7px;
            border-radius: 4px;
            border: 1px solid #ccfbf1;
        }
        .section-title {
            font-size: 10pt;
            font-weight: bold;
            color: #0f766e;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 8px;
            margin-top: 15px;
        }
        .info-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .info-grid td {
            padding: 4px 6px;
            vertical-align: top;
            font-size: 9.5pt;
        }
        .label {
            font-weight: bold;
            color: #475569;
            width: 25%;
        }
        .value {
            color: #0f172a;
        }
        .notes-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 5px;
            padding: 12px;
            min-height: 120px;
            font-size: 10pt;
            color: #1e293b;
            white-space: pre-wrap;
            margin-bottom: 25px;
        }
        .signatures-table {
            width: 100%;
            margin-top: 40px;
        }
        .signature-cell {
            width: 50%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 20px;
        }
        .signature-line {
            border-top: 1px solid #94a3b8;
            margin-top: 45px;
            margin-bottom: 4px;
        }
        .signature-title {
            font-size: 9pt;
            font-weight: bold;
            color: #334155;
        }
        .signature-sub {
            font-size: 8pt;
            color: #64748b;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 7.5pt;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
            text-align: center;
        }
        .hash-code {
            border: 1px dashed #cbd5e1;
            padding: 6px;
            text-align: center;
            font-size: 7pt;
            color: #64748b;
            background: #fafafa;
            margin-top: 25px;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="width: 70%;">
                <div class="institution-title">MERCADOS DE ALIMENTOS, C.A. (MERCAL)</div>
                <div class="department-subtitle">COORDINACIÓN DE SALUD LABORAL Y MEDICINA PREVENTIVA</div>
            </td>
            <td style="width: 30%;">
                <div class="doc-meta">
                    <strong>N° ATENCIÓN:</strong> CON-{{ str_pad($appointment->id, 6, '0', STR_PAD_LEFT) }}<br>
                    <strong>FECHA:</strong> {{ \Carbon\Carbon::parse($appointment->scheduled_date)->format('d/m/Y') }}<br>
                    <strong>HORA:</strong> {{ substr($appointment->scheduled_time, 0, 5) }}
                </div>
            </td>
        </tr>
    </table>

    <div class="doc-title">
        Comprobante de Consulta Médica e Indicaciones
    </div>

    <div class="section-title">1. Datos del Paciente / Trabajador</div>
    <table class="info-grid">
        <tr>
            <td class="label">Paciente:</td>
            <td class="value"><strong>{{ $patient->first_name }} {{ $patient->last_name }}</strong></td>
            <td class="label">Cédula:</td>
            <td class="value">{{ $patient->identification_type }} {{ $patient->national_id }}</td>
        </tr>
        <tr>
            <td class="label">Departamento:</td>
            <td class="value">{{ $patient->department?->name ?? 'General' }}</td>
            <td class="label">Teléfono:</td>
            <td class="value">{{ $patient->phone ?? 'No registrado' }}</td>
        </tr>
    </table>

    <div class="section-title">2. Datos de la Consulta y Especialista</div>
    <table class="info-grid">
        <tr>
            <td class="label">Médico Tratante:</td>
            <td class="value"><strong>Dr(a). {{ $doctor->first_name }} {{ $doctor->last_name }}</strong></td>
            <td class="label">Especialidad:</td>
            <td class="value">{{ $doctor->specialty?->name ?? 'Medicina General' }}</td>
        </tr>
        <tr>
            <td class="label">Cubículo / Consultorio:</td>
            <td class="value">{{ $doctor->room ?? 'Consultorio Principal' }}</td>
            <td class="label">Estado de Cita:</td>
            <td class="value" style="color: #059669; font-weight: bold;">ATENDIDA / COMPLETADA</td>
        </tr>
        <tr>
            <td class="label">Motivo de Consulta:</td>
            <td class="value" colspan="3">{{ $appointment->reason }}</td>
        </tr>
    </table>

    <div class="section-title">3. Indicaciones Médicas / Tratamiento / Récipe (Rx)</div>
    <div class="notes-box">
@if($appointment->notes)
{{ $appointment->notes }}
@else
<em>El médico tratante completó la atención sin observaciones registradas. Mantener recomendaciones de salud ocupacional.</em>
@endif
    </div>

    <table class="signatures-table">
        <tr>
            <td class="signature-cell">
                <div class="signature-line"></div>
                <div class="signature-title">DR(A). {{ strtoupper($doctor->first_name . ' ' . $doctor->last_name) }}</div>
                <div class="signature-sub">
                    Especialista en {{ $doctor->specialty?->name ?? 'Medicina Ocupacional' }}<br>
                    Servicio Médico Mercal
                </div>
            </td>
            <td class="signature-cell">
                <div class="signature-line"></div>
                <div class="signature-title">FIRMA DEL TRABAJADOR</div>
                <div class="signature-sub">
                    {{ $patient->first_name }} {{ $patient->last_name }}<br>
                    C.I. {{ $patient->identification_type }} {{ $patient->national_id }}
                </div>
            </td>
        </tr>
    </table>

    <div class="hash-code">
        CÓDIGO DE SEGURIDAD CLÍNICA: RX-{{ strtoupper(substr(sha1($appointment->id . $appointment->scheduled_date . config('app.key')), 0, 16)) }}<br>
        Documento oficial expedido para fines clínicos y laborales. Generado electrónicamente el {{ $generatedAt->format('d/m/Y H:i') }}.
    </div>

    <div class="footer">
        Mercados de Alimentos C.A. (MERCAL) · Red de Servicios Médicos Ocupacionales.
    </div>
</body>
</html>

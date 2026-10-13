<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Constancia Oficial de Reposo Médico - Mercal</title>
    <style>
        @page {
            margin: 25mm 20mm 20mm 20mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 11pt;
            line-height: 1.5;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 25px;
        }
        .institution-title {
            font-size: 15pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .department-subtitle {
            font-size: 10pt;
            color: #0284c7;
            font-weight: 600;
        }
        .certificate-number {
            text-align: right;
            font-size: 9pt;
            color: #64748b;
        }
        .certificate-title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 15px;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 1px;
            background-color: #f0f9ff;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #bae6fd;
        }
        .content-box {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 6px 8px;
            vertical-align: top;
        }
        .label {
            font-weight: bold;
            color: #475569;
            width: 28%;
            font-size: 10pt;
        }
        .value {
            color: #0f172a;
            font-size: 10pt;
        }
        .highlight-badge {
            display: inline-block;
            background-color: #dcfce7;
            color: #166534;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid #bbf7d0;
        }
        .text-justified {
            text-align: justify;
            margin-bottom: 20px;
            font-size: 10.5pt;
        }
        .signatures-table {
            width: 100%;
            margin-top: 50px;
        }
        .signature-cell {
            width: 50%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 20px;
        }
        .signature-line {
            border-top: 1px solid #94a3b8;
            margin-top: 50px;
            margin-bottom: 5px;
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
            font-size: 8pt;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 5px;
            text-align: center;
        }
        .qr-placeholder {
            border: 1px dashed #cbd5e1;
            padding: 8px;
            display: inline-block;
            font-size: 7.5pt;
            color: #64748b;
            background: #f8fafc;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="width: 70%;">
                <div class="institution-title">MERCADOS DE ALIMENTOS, C.A. (MERCAL)</div>
                <div class="department-subtitle">GERENCIA DE RECURSOS HUMANOS · COORDINACIÓN DE SALUD LABORAL</div>
            </td>
            <td style="width: 30%; text-align: right;">
                <div class="certificate-number">
                    <strong>FOLIO:</strong> REP-{{ str_pad($leave->id, 6, '0', STR_PAD_LEFT) }}<br>
                    <strong>FECHA EMISIÓN:</strong> {{ $generatedAt->format('d/m/Y') }}
                </div>
            </td>
        </tr>
    </table>

    <div class="certificate-title">
        Constancia Oficial de Reposo Médico Convalidado
    </div>

    <div class="text-justified">
        Por medio del presente documento, el Servicio Médico y de Salud Laboral de <strong>MERCAL C.A.</strong> hace constar que ha sido recibido, auditado y <strong>CONVALIDADO SATISFACTORIAMENTE</strong> el reposo médico correspondiente al empleado cuyos datos se especifican a continuación:
    </div>

    <div class="content-box">
        <table class="info-table">
            <tr>
                <td class="label">Nombres y Apellidos:</td>
                <td class="value"><strong>{{ $patient->first_name }} {{ $patient->last_name }}</strong></td>
            </tr>
            <tr>
                <td class="label">Cédula de Identidad:</td>
                <td class="value">{{ $patient->identification_type }} {{ $patient->national_id }}</td>
            </tr>
            <tr>
                <td class="label">Departamento / Área:</td>
                <td class="value">{{ $patient->department?->name ?? 'Servicios Generales' }}</td>
            </tr>
            <tr>
                <td class="label">Tipo de Contingencia:</td>
                <td class="value">{{ strtoupper($leave->type instanceof \BackedEnum ? $leave->type->value : (string) $leave->type) }}</td>
            </tr>
            <tr>
                <td class="label">Diagnóstico Clínico:</td>
                <td class="value">{{ $leave->diagnosis }}</td>
            </tr>
            <tr>
                <td class="label">Médico Tratante Emisor:</td>
                <td class="value">
                    @if($doctor)
                        Dr(a). {{ $doctor->first_name }} {{ $doctor->last_name }}
                    @else
                        Médico Tratante Particular / Externo
                    @endif
                </td>
            </tr>
            <tr>
                <td class="label">Período de Reposo:</td>
                <td class="value">
                    Desde el <strong>{{ \Carbon\Carbon::parse($leave->start_date)->format('d/m/Y') }}</strong>
                    hasta el <strong>{{ \Carbon\Carbon::parse($leave->end_date)->format('d/m/Y') }}</strong>
                </td>
            </tr>
            <tr>
                <td class="label">Días de Reposo:</td>
                <td class="value">
                    <span class="highlight-badge">{{ $leave->days }} {{ $leave->days == 1 ? 'DÍA' : 'DÍAS' }}</span>
                </td>
            </tr>
            @if($leave->review_notes)
            <tr>
                <td class="label">Observaciones Auditoría:</td>
                <td class="value"><em>{{ $leave->review_notes }}</em></td>
            </tr>
            @endif
        </table>
    </div>

    <p style="font-size: 9.5pt; color: #475569; text-align: justify;">
        Esta convalidación tiene validez oficial ante la Dirección de Talento Humano y la supervisión inmediata para justificar la inasistencia laboral durante el período señalado, en estricto cumplimiento con la legislación laboral y los protocolos internos de salud ocupacional de Mercal.
    </p>

    <table class="signatures-table">
        <tr>
            <td class="signature-cell">
                <div class="signature-line"></div>
                <div class="signature-title">DR(A). AUDITOR(A) DE SALUD LABORAL</div>
                <div class="signature-sub">
                    @if($reviewer)
                        Validado por: {{ $reviewer->name }}<br>
                    @endif
                    Servicio Médico Mercal
                </div>
            </td>
            <td class="signature-cell">
                <div class="signature-line"></div>
                <div class="signature-title">FIRMA DEL TRABAJADOR</div>
                <div class="signature-sub">
                    C.I. {{ $patient->identification_type }} {{ $patient->national_id }}<br>
                    Recibí conforme
                </div>
            </td>
        </tr>
    </table>

    <div style="margin-top: 30px; text-align: center;">
        <div class="qr-placeholder">
            VERIFICACIÓN DIGITAL: HASH-{{ strtoupper(substr(sha1($leave->id . $leave->created_at . config('app.key')), 0, 16)) }}<br>
            Documento emitido electrónicamente por el Sistema SaludMercal. Válido sin tachaduras ni enmiendas.
        </div>
    </div>

    <div class="footer">
        Mercados de Alimentos C.A. (MERCAL) · Av. Fuerzas Armadas con Av. Panteón, Caracas, Venezuela.
    </div>
</body>
</html>

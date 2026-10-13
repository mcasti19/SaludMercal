<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte Ejecutivo de Gestión Médica - Mercal</title>
    <style>
        @page {
            margin: 18mm 15mm 15mm 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 9.5pt;
            line-height: 1.4;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .institution-title {
            font-size: 13pt;
            font-weight: bold;
            color: #0f172a;
        }
        .department-subtitle {
            font-size: 9pt;
            color: #2563eb;
            font-weight: 600;
        }
        .doc-meta {
            text-align: right;
            font-size: 8pt;
            color: #64748b;
        }
        .report-title {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 15px;
            text-transform: uppercase;
            background-color: #eff6ff;
            padding: 6px;
            border-radius: 4px;
            border: 1px solid #bfdbfe;
        }
        .kpi-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6px;
            margin-bottom: 15px;
        }
        .kpi-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px;
            text-align: center;
            width: 25%;
        }
        .kpi-value {
            font-size: 15pt;
            font-weight: bold;
            color: #1e40af;
        }
        .kpi-label {
            font-size: 7.5pt;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
        }
        .section-header {
            font-size: 10pt;
            font-weight: bold;
            color: #1e3a8a;
            margin-top: 15px;
            margin-bottom: 6px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 2px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            font-size: 8.5pt;
            padding: 5px 6px;
            border: 1px solid #cbd5e1;
            text-align: left;
        }
        .data-table td {
            padding: 5px 6px;
            border: 1px solid #e2e8f0;
            font-size: 8.5pt;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
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
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="width: 70%;">
                <div class="institution-title">MERCADOS DE ALIMENTOS, C.A. (MERCAL)</div>
                <div class="department-subtitle">GERENCIA DE RECURSOS HUMANOS · GESTIÓN DE SALUD OCUPACIONAL</div>
            </td>
            <td style="width: 30%;">
                <div class="doc-meta">
                    <strong>PERÍODO:</strong> {{ \Carbon\Carbon::parse($from)->format('d/m/Y') }} al {{ \Carbon\Carbon::parse($to)->format('d/m/Y') }}<br>
                    <strong>GENERADO:</strong> {{ $generatedAt->format('d/m/Y H:i') }}
                </div>
            </td>
        </tr>
    </table>

    <div class="report-title">
        Informe Consolidado de Gestión y Atenciones Médicas
    </div>

    <!-- KPIs -->
    <table class="kpi-table">
        <tr>
            <td class="kpi-card">
                <div class="kpi-value">{{ $totalAppointments }}</div>
                <div class="kpi-label">Total Citas Agendadas</div>
            </td>
            <td class="kpi-card">
                <div class="kpi-value" style="color: #059669;">{{ $completedAppointments }}</div>
                <div class="kpi-label">Consultas Completadas</div>
            </td>
            <td class="kpi-card">
                <div class="kpi-value" style="color: #0891b2;">{{ $completionRate }}%</div>
                <div class="kpi-label">Tasa de Efectividad</div>
            </td>
            <td class="kpi-card">
                <div class="kpi-value" style="color: #d97706;">{{ $totalLeavesApproved }}</div>
                <div class="kpi-label">Reposos Convalidados</div>
            </td>
        </tr>
    </table>

    <!-- Appointments by Status -->
    <div class="section-header">1. Distribución de Citas por Estado</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Estado</th>
                <th style="text-align: right;">Cantidad</th>
                <th style="text-align: right;">Porcentaje</th>
            </tr>
        </thead>
        <tbody>
            @foreach($byStatus as $status => $count)
            <tr>
                <td>{{ strtoupper($status) }}</td>
                <td style="text-align: right;">{{ $count }}</td>
                <td style="text-align: right;">{{ $totalAppointments > 0 ? round(($count / $totalAppointments) * 100, 1) : 0 }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Appointments by Specialty -->
    <div class="section-header">2. Demanda de Atenciones por Especialidad</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Especialidad Médica</th>
                <th style="text-align: right;">Total Consultas</th>
            </tr>
        </thead>
        <tbody>
            @forelse($bySpecialty as $esp)
            <tr>
                <td>{{ $esp->name }}</td>
                <td style="text-align: right;">{{ $esp->total }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="2" style="text-align: center; color: #94a3b8;">Sin datos en el período</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Appointments by Doctor -->
    <div class="section-header">3. Productividad por Médico Tratante</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Médico</th>
                <th style="text-align: right;">Consultas Atendidas</th>
            </tr>
        </thead>
        <tbody>
            @forelse($byDoctor as $doc)
            <tr>
                <td>Dr(a). {{ $doc->first_name }} {{ $doc->last_name }}</td>
                <td style="text-align: right;">{{ $doc->total }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="2" style="text-align: center; color: #94a3b8;">Sin datos en el período</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Leaves Summary -->
    <div class="section-header">4. Ausentismo y Reposos por Departamento</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Departamento / Área</th>
                <th style="text-align: right;">Reposos Aprobados</th>
                <th style="text-align: right;">Días de Ausentismo</th>
            </tr>
        </thead>
        <tbody>
            @forelse($leavesByDept as $dep)
            <tr>
                <td>{{ $dep->name }}</td>
                <td style="text-align: right;">{{ $dep->total_leaves }}</td>
                <td style="text-align: right;">{{ $dep->total_days }} días</td>
            </tr>
            @empty
            <tr>
                <td colspan="3" style="text-align: center; color: #94a3b8;">Sin reposos convalidados en el período</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Mercados de Alimentos C.A. (MERCAL) · Sistema SaludMercal · Reporte Confidencial de Gestión.
    </div>
</body>
</html>

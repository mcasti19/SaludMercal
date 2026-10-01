import { Cita, Medico } from "@/types";
import { format, parse, addMinutes, isBefore, startOfDay } from "date-fns";

/**
 * Genera bloques de 30 minutos entre horaInicio y horaFin de un médico.
 * Remueve los bloques que ya estén ocupados por citas confirmadas/pendientes.
 */
export function generarSlotsDisponibles(
  medico: Medico | undefined,
  fechaSeleccionada: Date | undefined,
  citasExistentes: Cita[]
): string[] {
  if (!medico || !fechaSeleccionada || !medico.horaInicio || !medico.horaFin) return [];

  // Verificar que la fecha no sea en el pasado (opcional, pero buena práctica)
  const hoy = startOfDay(new Date());
  if (isBefore(startOfDay(fechaSeleccionada), hoy)) {
    return []; // No dar citas en el pasado
  }

  const dateStr = format(fechaSeleccionada, "yyyy-MM-dd");
  
  // Citas del médico en esa fecha específica
  const citasDelDia = citasExistentes.filter(
    (c) => 
      c.medicoId === medico.id && 
      c.fecha === dateStr &&
      ["PENDIENTE", "CONFIRMADA", "EN_ATENCION"].includes(c.estado)
  );

  const horasOcupadas = citasDelDia.map(c => c.hora);

  const slots: string[] = [];
  
  // Parsear la hora de inicio y fin (ej: "08:00")
  let currentTime = parse(medico.horaInicio, "HH:mm", fechaSeleccionada);
  const endTime = parse(medico.horaFin, "HH:mm", fechaSeleccionada);

  // Intervalo de 30 minutos
  const interval = 30;

  while (isBefore(currentTime, endTime)) {
    const timeStr = format(currentTime, "HH:mm");
    
    // Si la hora no está ocupada, la agregamos
    if (!horasOcupadas.includes(timeStr)) {
      slots.push(timeStr);
    }
    
    currentTime = addMinutes(currentTime, interval);
  }

  return slots;
}

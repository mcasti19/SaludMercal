import {
  EXAMEN_ALLOWED_MIME,
  EXAMEN_MAX_FILE_BYTES,
  EXAMEN_MAX_FILES,
} from "./examenes.store";

/** Returns a user-facing error for the first invalid file, or null when all are valid. */
export function validateExamFiles(files: Pick<File, "name" | "type" | "size">[]): string | null {
  if (files.length === 0) return "Adjunte al menos un archivo";
  if (files.length > EXAMEN_MAX_FILES) return `Máximo ${EXAMEN_MAX_FILES} archivos por examen`;

  for (const file of files) {
    if (!(EXAMEN_ALLOWED_MIME as readonly string[]).includes(file.type)) {
      return `"${file.name}": solo se permiten archivos PDF, JPG o PNG`;
    }
    if (file.size > EXAMEN_MAX_FILE_BYTES) {
      return `"${file.name}": supera el máximo de 10 MB`;
    }
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Groups items by a key, preserving first-seen order of the (already sorted) keys. */
export function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return [...map.entries()];
}


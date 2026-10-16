import { describe, it, expect } from "vitest";
import { examenSchema } from "@/lib/schemas";
import { formatFileSize, groupBy, validateExamFiles } from "@/modules/pacientes/examenes/examenes.utils";
import { mapApiExam } from "@/modules/pacientes/examenes/examenes.store";

const file = (name: string, type: string, size = 1000) => ({ name, type, size });

describe("validateExamFiles", () => {
  it("requires at least one file", () => {
    expect(validateExamFiles([])).toMatch(/al menos un archivo/);
  });

  it("accepts PDF, JPG and PNG up to 10 MB", () => {
    expect(
      validateExamFiles([
        file("a.pdf", "application/pdf"),
        file("b.jpg", "image/jpeg"),
        file("c.png", "image/png", 10 * 1024 * 1024),
      ])
    ).toBeNull();
  });

  it("rejects other types and files over 10 MB", () => {
    expect(validateExamFiles([file("x.exe", "application/x-msdownload")])).toMatch(/PDF, JPG o PNG/);
    expect(validateExamFiles([file("big.pdf", "application/pdf", 10 * 1024 * 1024 + 1)])).toMatch(/10 MB/);
  });

  it("rejects more than 10 files", () => {
    const many = Array.from({ length: 11 }, (_, i) => file(`f${i}.pdf`, "application/pdf"));
    expect(validateExamFiles(many)).toMatch(/Máximo 10/);
  });
});

describe("examenSchema", () => {
  const valid = { especialidadId: "1", titulo: "Hematología", fecha: "2020-01-01" };

  it("accepts a valid exam and an optional appointment", () => {
    expect(examenSchema.safeParse(valid).success).toBe(true);
    expect(examenSchema.safeParse({ ...valid, citaId: "" }).success).toBe(true);
  });

  it("rejects future dates and missing specialty", () => {
    expect(examenSchema.safeParse({ ...valid, fecha: "2999-01-01" }).success).toBe(false);
    expect(examenSchema.safeParse({ ...valid, especialidadId: "" }).success).toBe(false);
  });
});

describe("helpers", () => {
  it("groups items keeping key order", () => {
    const groups = groupBy([{ k: "b" }, { k: "a" }, { k: "b" }], (i) => i.k);
    expect(groups.map(([k, v]) => [k, v.length])).toEqual([["b", 2], ["a", 1]]);
  });

  it("formats sizes", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("maps the API exam", () => {
    const exam = mapApiExam({
      id: 3,
      patient_id: 7,
      specialty_id: 2,
      specialty: { id: 2, name: "Laboratorio" },
      title: "Perfil lipídico",
      exam_date: "2026-05-01",
      files: [{ id: 9, original_name: "r.pdf", mime_type: "application/pdf", size: 10 }],
    });
    expect(exam).toMatchObject({ id: "3", especialidadNombre: "Laboratorio", fecha: "2026-05-01" });
    expect(exam.archivos[0]).toEqual({ id: "9", nombre: "r.pdf", mimeType: "application/pdf", tamano: 10 });
  });
});


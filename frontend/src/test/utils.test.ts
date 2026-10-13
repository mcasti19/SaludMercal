import { describe, it, expect } from "vitest";
import { cn, formatDate, formatTime, calcularEdad, generateId } from "@/lib/utils";

describe("Utility Functions (src/lib/utils.ts)", () => {
  describe("cn", () => {
    it("merges class names and handles conditional tailwind overrides", () => {
      expect(cn("px-2 py-1", "bg-blue-500")).toBe("px-2 py-1 bg-blue-500");
      expect(cn("p-4", "p-2")).toBe("p-2");
      expect(cn("text-red-500", false && "text-blue-500", undefined, null)).toBe("text-red-500");
    });
  });

  describe("formatDate", () => {
    it("formats ISO date string into Venezuelan Spanish representation", () => {
      const formatted = formatDate("2026-05-15");
      // Format in es-VE: "15 de mayo de 2026" or contains 15, mayo, 2026
      expect(formatted.toLowerCase()).toContain("15");
      expect(formatted.toLowerCase()).toContain("2026");
      expect(formatted.toLowerCase()).toMatch(/mayo|05/);
    });
  });

  describe("formatTime", () => {
    it("converts 24-hour HH:mm to 12-hour AM/PM", () => {
      expect(formatTime("08:30")).toBe("8:30 AM");
      expect(formatTime("12:00")).toBe("12:00 PM");
      expect(formatTime("14:45")).toBe("2:45 PM");
      expect(formatTime("00:15")).toBe("12:15 AM");
    });
  });

  describe("generateId", () => {
    it("generates an uppercase alphanumeric string", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(typeof id1).toBe("string");
      expect(id1.length).toBeGreaterThan(4);
      expect(id1).not.toBe(id2);
      expect(id1).toBe(id1.toUpperCase());
    });
  });

  describe("calcularEdad", () => {
    it("calculates age accurately based on birth date", () => {
      const birthdate = "2000-01-01";
      const age = calcularEdad(birthdate);
      const currentYear = new Date().getFullYear();
      expect(age).toBeGreaterThanOrEqual(currentYear - 2000 - 1);
      expect(age).toBeLessThanOrEqual(currentYear - 2000);
    });
  });
});

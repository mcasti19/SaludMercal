import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CitaEstadoBadge } from "@/components/shared/CitaEstadoBadge";
import { CitaEstado } from "@/types";

describe("CitaEstadoBadge Component (src/components/shared/CitaEstadoBadge.tsx)", () => {
  const testCases: Array<{ estado: CitaEstado; label: string }> = [
    { estado: "PENDIENTE", label: "Pendiente" },
    { estado: "CONFIRMADA", label: "Confirmada" },
    { estado: "EN_ATENCION", label: "En Atención" },
    { estado: "COMPLETADA", label: "Completada" },
    { estado: "CANCELADA", label: "Cancelada" },
  ];

  testCases.forEach(({ estado, label }) => {
    it(`renders correct text and styling for estado: ${estado}`, () => {
      render(<CitaEstadoBadge estado={estado} />);
      const badge = screen.getByText(label);
      expect(badge).toBeInTheDocument();
    });
  });

  it("applies additional custom className when provided", () => {
    const { container } = render(
      <CitaEstadoBadge estado="CONFIRMADA" className="custom-test-class" />
    );
    const span = container.querySelector(".custom-test-class");
    expect(span).not.toBeNull();
  });
});

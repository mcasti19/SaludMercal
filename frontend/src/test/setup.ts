import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";

// Cleanup / mock stubs for jsdom environment
if (typeof window !== "undefined") {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock-blob");
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }
}

afterEach(() => {
  vi.clearAllMocks();
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});

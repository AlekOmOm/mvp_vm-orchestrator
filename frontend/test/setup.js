import { vi } from "vitest";

// Silence Svelte warnings that pollute output
vi.stubGlobal("console", {
   ...console,
   warn: vi.fn(),
});

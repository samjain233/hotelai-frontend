import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library only auto-cleans when test globals are enabled; they are not.
afterEach(() => {
    cleanup();
    localStorage.clear();
});

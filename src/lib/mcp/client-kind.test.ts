import { describe, expect, it } from "vitest";
import { isLocalCodexClient } from "@/lib/mcp/client-kind";

describe("isLocalCodexClient", () => {
  it("recognizes a Codex registration with a loopback callback", () => {
    expect(
      isLocalCodexClient({
        clientName: "Codex",
        redirectUris: ["http://127.0.0.1:64772/callback/example"],
      }),
    ).toBe(true);
  });

  it("does not group remote or similarly named clients with local Codex", () => {
    expect(
      isLocalCodexClient({
        clientName: "Codex",
        redirectUris: ["https://example.com/callback"],
      }),
    ).toBe(false);
    expect(
      isLocalCodexClient({
        clientName: "Codex Chat",
        redirectUris: ["http://localhost:3000/callback"],
      }),
    ).toBe(false);
  });
});

export type McpClientIdentity = {
  clientName: string;
  redirectUris: string[];
};

const localHosts = new Set(["127.0.0.1", "[::1]", "localhost"]);

function isLoopbackCallback(value: string) {
  try {
    const uri = new URL(value);
    return uri.protocol === "http:" && localHosts.has(uri.hostname);
  } catch {
    return false;
  }
}

export function isLocalCodexClient(client: McpClientIdentity) {
  return (
    client.clientName.trim().toLowerCase() === "codex" &&
    client.redirectUris.length > 0 &&
    client.redirectUris.every(isLoopbackCallback)
  );
}

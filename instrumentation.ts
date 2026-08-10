export async function register() {
  // The local Website Builder uses its own SSE stream and filesystem workspaces.
  // Keep startup database-free so Next's dev compiler never bundles the legacy
  // Postgres-backed WebSocket feeder into the application shell.
}

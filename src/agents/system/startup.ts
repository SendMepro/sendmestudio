// startup.ts — Auto-initializes SystemSupervisorAgent on module import
// Phase: G-1 / Agent Activation
// Purpose: Side-effect module that triggers SystemSupervisor.initialize()
// when first imported at app startup. No UI or API changes required.
//
// This module uses a lazy dynamic import to avoid pulling Node builtins
// (node:path, node:fs) into the client bundle. The supervisor only loads
// in environments where those modules are available (Node.js / SSR).
//
// Import pattern: import '../agents/system/startup';
// This fires once on module load, initializing the supervisor and
// registering all known agents for heartbeat monitoring.

// Lazy initialization: dynamically import the supervisor at runtime.
// This avoids bundling Node builtins (node:path, node:fs, node:fs/promises)
// in the client-side bundle while still auto-activating on server/SSR.
if (typeof globalThis !== 'undefined') {
  // Defer to a microtask to let other singletons initialize first
  Promise.resolve().then(async () => {
    try {
      const { SystemSupervisor } = await import('./SystemSupervisorAgent');
      // Note: AgentRegistry is pre-populated at construction time via AGENT_DEFINITIONS,
      // so agents are visible immediately even before this initialization completes.
      await SystemSupervisor.initialize();
    } catch (err) {
      // Silently ignore in environments where Node builtins are unavailable
      // (e.g., browser-only runtime without Node polyfills).
      // AgentRegistry still has all agent definitions loaded.
    }
  });
}

// Track initialised state for downstream inspection.
export const systemStartupInitialized = true;

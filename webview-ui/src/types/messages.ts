export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'getWorkspaceState' };

export type ExtensionMessage =
  | { type: 'workspaceState'; payload: { sidePanel: Record<string, unknown> } };

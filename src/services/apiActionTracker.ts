export interface ActiveApiAction {
  id: string;
  method: string;
  endpoint: string;
  title: string;
  subtitle: string;
  startedAt: number;
  cancel?: () => void;
}

const activeActions = new Map<string, ActiveApiAction>();
const actionListeners = new Set<(actions: ActiveApiAction[]) => void>();

export function notifyActionListeners(): void {
  const list = Array.from(activeActions.values());
  actionListeners.forEach((fn) => {
    try {
      fn(list);
    } catch (e) {
      console.error("Error in action listener", e);
    }
  });
}

export function subscribeToApiActions(listener: (actions: ActiveApiAction[]) => void): () => void {
  actionListeners.add(listener);
  listener(Array.from(activeActions.values()));
  return () => {
    actionListeners.delete(listener);
  };
}

export function registerTrackedAction(action: ActiveApiAction): void {
  activeActions.set(action.id, action);
  notifyActionListeners();
}

export function unregisterTrackedAction(actionId: string | null): void {
  if (!actionId) return;
  activeActions.delete(actionId);
  notifyActionListeners();
}

export function cancelActiveApiActions(): void {
  const actions = Array.from(activeActions.values());
  actions.forEach((action) => {
    try {
      action.cancel?.();
    } catch {
      // Ignore abort errors
    }
    activeActions.delete(action.id);
  });
  notifyActionListeners();
}

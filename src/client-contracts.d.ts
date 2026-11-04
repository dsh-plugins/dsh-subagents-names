/** Minimal structural contracts for the services supplied by the DSH module loader.
 * Type-only: React and all DSH services continue to come from the host at runtime.
 */
type ReactModule = typeof import('react');
type ReactDOMModule = typeof import('react-dom');
type UIComponent = import('react').ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean; state?: string }>;
interface ModuleRequire {
  (id: 'react'): ReactModule;
  (id: 'react-dom'): ReactDOMModule;
  (id: '@deepseek-ai/dsh-client-ui-primitives'): Record<string, UIComponent>;
}
interface ClientExports { apply?: (ctx: ClientContext) => void; inject?: string[] }
interface Window {
  __ModuleLoader__: { load(definition: { id: string; factory: (require: ModuleRequire) => ClientExports }): void };
}
interface TokenUsage { uncachedInputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }
interface SessionSummary {
  id: string; sessionId: string; origin?: string; parentId?: string; running?: boolean; title?: string;
  projectionValues?: { tokenUsage?: TokenUsage; subagentTiming?: { settledMs: number; active?: { through: number; since: number } } };
}
interface ChildEntry { kind: 'child'; id: string; label?: string; mode: string; activity: string; hasChildren?: boolean }
interface DiagnosticEntry { kind: 'diagnostic'; id: string; reason: string }
type CatalogEntry = ChildEntry | DiagnosticEntry;
interface Catalog { entries: CatalogEntry[]; parentAvailable: boolean; state: string; error?: { message?: string } | null }
type Summaries = Record<string, SessionSummary | undefined>;
interface SessionState { byId: Summaries; subagentsByParent: Record<string, Catalog | undefined> }
interface WorkspaceState { archivedSessionIds?: string[] }
type StoreHook<T> = <R>(select: (state: T) => R) => R;
interface ChildAddress { parentSessionId: string; childSessionId: string; mode: string }
interface RenameResult { ok: boolean; error?: { code?: string; message?: string } }
interface SessionService {
  binding(id: string): { session: { rename(title: string): Promise<RenameResult> } } | undefined;
  openSubagent(address: ChildAddress): unknown;
  refreshSubagents(id: string): unknown;
  setSubagentCatalogOpen(id: string, open: boolean): unknown;
}
interface SharedProps {
  useSessions: StoreHook<SessionState>; useWorkspaces: StoreHook<WorkspaceState>; sessions: SessionService;
  openChild(address: ChildAddress): unknown; refresh(id: string): unknown;
  setCatalogOpen(id: string, open: boolean): unknown; archiveSession(id: string): unknown;
}
interface LineageProps extends SharedProps { lineageSessionId: string; displayTitle?: string; openTitle?: () => void }
interface DropdownProps extends SharedProps {
  rootSessionId: string; currentSessionId?: string; displayTitle?: string; openTitle?: () => void;
  variant: 'count' | 'switcher'; separator?: boolean; protectedIds: Set<string>;
}
interface Guard { initialized: boolean; parentRunning: boolean; baselineIds: Set<string>; protectedIds: Set<string> }
interface EditorResult { ok: boolean; message?: string }
interface EditorProps { initial: string; onCancel(): void; onSubmit(title: string): Promise<EditorResult> }
interface RowsProps {
  parentSessionId: string; currentSessionId?: string; catalog: Catalog; catalogs: SessionState['subagentsByParent'];
  summaries: Summaries; expanded: Set<string>; level: number; now: number; archived: Set<string>;
  openChild(address: ChildAddress): unknown; refresh(id: string): unknown; toggleBranch(id: string): void; closeCatalog(): void;
  aliases: Record<string, string>; archiveSession(entry: ChildEntry): unknown; renameSession(entry: ChildEntry, title: string): Promise<EditorResult>;
  protectedIds: Set<string>; editingId: string | null; beginEdit(id: string): void; cancelEdit(): void; onError(error: string): void;
}
interface ClientContext {
  effect(effect: () => () => void): unknown;
  sessions: SessionService; workspaces: { archiveSession(id: string): unknown };
  slots: {
    inject(name: string, register: () => unknown): unknown;
    register(options: { name: string; priority: number; registrant: string; inject(): Pick<SharedProps, 'openChild' | 'refresh' | 'setCatalogOpen' | 'sessions' | 'archiveSession'> }, component: (props: LineageProps) => import('react').ReactNode): unknown;
  };
}

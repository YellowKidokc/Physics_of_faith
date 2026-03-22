import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Clipboard, 
  FolderOpen, 
  Tags, 
  FileText, 
  Bot, 
  Settings,
  BookOpen,
  Search,
  X,
  Pin,
  Copy,
  ExternalLink,
  Check,
  ChevronRight,
  Command,
  Terminal,
  Link2,
  Calendar as CalendarIcon,
  FileCode,
  Plus,
  Trash2,
  Edit3,
  Zap,
  AlertCircle,
  Sparkles,
  Globe,
  BrainCircuit,
  Wand2,
  Clock3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { axioms, getAxiomById } from '@/data/axioms';
import type { ViewType, SearchResult, Task, Prompt, Bookmark, CustomPage, ChatTurn, AiProvider, AiRole } from '@/types';

// ─── VIEW CONFIGURATION ───
const VIEWS: { id: ViewType; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#F2C94C' },
  { id: 'clipboard', label: 'Clipboard', icon: Clipboard, color: '#4ECB71' },
  { id: 'prompts', label: 'Prompts', icon: Terminal, color: '#f59e0b' },
  { id: 'research', label: 'Research', icon: Link2, color: '#4F8EF7' },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon, color: '#E05C6E' },
  { id: 'files', label: 'Files', icon: FolderOpen, color: '#4F8EF7' },
  { id: 'tags', label: 'Tags', icon: Tags, color: '#9B7FE8' },
  { id: 'notes', label: 'Notes', icon: FileText, color: '#F6821F' },
  { id: 'axioms', label: 'Axioms', icon: BookOpen, color: '#E05C6E' },
  { id: 'custom', label: 'Custom', icon: FileCode, color: '#22d3ee' },
  { id: 'ai', label: 'AI Agent', icon: Bot, color: '#22d3ee' },
  { id: 'settings', label: 'Settings', icon: Settings, color: '#8A8F9E' },
];

// ─── SEARCH RESULT ITEM ───
function SearchResultItem({ 
  result, 
  onClick, 
  query 
}: { 
  result: SearchResult; 
  onClick: () => void;
  query: string;
}) {
  const typeColors: Record<string, string> = {
    clip: '#4ECB71',
    note: '#F6821F',
    file: '#4F8EF7',
    tag: '#9B7FE8',
    bookmark: '#22d3ee',
    task: '#E05C6E',
    axiom: '#F2C94C',
    prompt: '#f59e0b',
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-gold/30 text-gold px-0.5 rounded">{part}</mark> : part
    );
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 hover:bg-muted/50 rounded-lg transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div 
          className="w-2 h-2 rounded-full mt-2 shrink-0"
          style={{ backgroundColor: typeColors[result.type] || '#8A8F9E' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {result.type}
            </span>
            {result.tags.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {result.tags.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
          <div className="font-medium text-foreground truncate mt-0.5">
            {highlightText(result.title, query)}
          </div>
          {result.subtitle && (
            <div className="text-sm text-muted-foreground truncate">
              {highlightText(result.subtitle, query)}
            </div>
          )}
          {result.content && (
            <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {highlightText(result.content, query)}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ─── UNIFIED SEARCH MODAL ───
function UnifiedSearch({ 
  isOpen, 
  onClose, 
  onNavigate,
  store 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onNavigate: (view: ViewType, id?: string) => void;
  store: ReturnType<typeof useDashboardStore>;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const searchData = useMemo(() => ({
    clips: store.clips,
    notes: store.notes,
    files: store.files,
    tags: store.tags,
    bookmarks: store.bookmarks,
    tasks: store.tasks,
    axioms,
    prompts: store.prompts,
  }), [store]);

  const results = useUnifiedSearch({ query, data: searchData, limit: 20 });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleResultClick = (result: SearchResult) => {
    const viewMap: Record<string, ViewType> = {
      clip: 'clipboard',
      note: 'notes',
      file: 'files',
      tag: 'tags',
      bookmark: 'research',
      task: 'calendar',
      axiom: 'axioms',
      prompt: 'prompts',
    };
    onNavigate(viewMap[result.type], result.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clips, notes, files, tags, prompts..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-1 text-xs bg-muted rounded text-muted-foreground">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="p-8 text-center text-muted-foreground">
              <Command className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Type to search across all your data</p>
              <div className="flex gap-4 justify-center mt-4 text-xs">
                <span className="px-2 py-1 bg-muted rounded">clips</span>
                <span className="px-2 py-1 bg-muted rounded">notes</span>
                <span className="px-2 py-1 bg-muted rounded">prompts</span>
                <span className="px-2 py-1 bg-muted rounded">bookmarks</span>
              </div>
            </div>
          )}
          
          {query && results.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No results found for "{query}"</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((result) => (
                <SearchResultItem
                  key={`${result.type}-${result.id}`}
                  result={result}
                  query={query}
                  onClick={() => handleResultClick(result)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#4ECB71]" /> Clips
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Prompts
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#9B7FE8]" /> Tags
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ───
function Sidebar({ 
  currentView, 
  onNavigate, 
  onOpenSearch,
  stats,
  customPages
}: { 
  currentView: ViewType; 
  onNavigate: (view: ViewType) => void;
  onOpenSearch: () => void;
  stats: ReturnType<typeof useDashboardStore>['stats'];
  customPages: CustomPage[];
}) {
  const [showCustomPages, setShowCustomPages] = useState(false);

  return (
    <aside className="w-16 lg:w-64 bg-card border-r border-border flex flex-col shrink-0 transition-all">
      {/* Logo */}
      <div className="h-14 flex items-center justify-center lg:justify-start lg:px-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center">
          <span className="text-black font-bold text-sm">P</span>
        </div>
        <span className="hidden lg:block ml-3 font-semibold">POF 2828</span>
      </div>

      {/* Search Button */}
      <div className="p-2">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground"
        >
          <Search className="w-4 h-4" />
          <span className="hidden lg:block text-sm">Search...</span>
          <kbd className="hidden lg:block ml-auto px-1.5 py-0.5 text-xs bg-muted rounded">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {VIEWS.map((view) => {
          const Icon = view.icon;
          const isActive = currentView === view.id;
          
          // Show badges for certain views
          let badge: number | null = null;
          if (view.id === 'clipboard') badge = stats.pinnedClips;
          if (view.id === 'calendar') badge = stats.todayTasks;
          if (view.id === 'prompts') badge = stats.totalPrompts;
          if (view.id === 'custom') badge = stats.totalCustomPages;

          // Custom pages submenu
          if (view.id === 'custom' && customPages.length > 0) {
            return (
              <div key={view.id}>
                <button
                  onClick={() => setShowCustomPages(!showCustomPages)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                    isActive 
                      ? 'bg-gold/10 text-gold' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" style={{ color: isActive ? view.color : undefined }} />
                  <span className="hidden lg:block text-sm font-medium">{view.label}</span>
                  {badge !== null && badge > 0 && (
                    <span className={cn(
                      'hidden lg:flex ml-auto text-xs px-2 py-0.5 rounded-full',
                      isActive ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'
                    )}>
                      {badge}
                    </span>
                  )}
                  <ChevronRight className={cn(
                    'hidden lg:block w-4 h-4 ml-auto transition-transform',
                    showCustomPages && 'rotate-90'
                  )} />
                </button>
                {showCustomPages && (
                  <div className="ml-4 mt-1 space-y-1">
                    {customPages.map(page => (
                      <button
                        key={page.id}
                        onClick={() => onNavigate('custom')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 text-sm"
                      >
                        <FileCode className="w-4 h-4" />
                        <span className="truncate">{page.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={view.id}
              onClick={() => onNavigate(view.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                isActive 
                  ? 'bg-gold/10 text-gold' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" style={{ color: isActive ? view.color : undefined }} />
              <span className="hidden lg:block text-sm font-medium">{view.label}</span>
              {badge !== null && badge > 0 && (
                <span className={cn(
                  'hidden lg:flex ml-auto text-xs px-2 py-0.5 rounded-full',
                  isActive ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'
                )}>
                  {badge}
                </span>
              )}
              {isActive && (
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full"
                  style={{ backgroundColor: view.color }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="hidden lg:block text-xs text-muted-foreground text-center">
          <span className="text-gold">{stats.totalClips}</span> clips · 
          <span className="text-gold ml-1">{stats.totalNotes}</span> notes · 
          <span className="text-gold ml-1">{stats.totalPrompts}</span> prompts
        </div>
      </div>
    </aside>
  );
}

// ─── DASHBOARD VIEW ───
function DashboardView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const recentClips = store.clips.slice(0, 5);
  const recentNotes = store.notes.slice(0, 5);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your personal command center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="text-3xl font-bold text-gold">{store.stats.totalClips}</div>
          <div className="text-sm text-muted-foreground">Total Clips</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="text-3xl font-bold text-blue-500">{store.stats.totalNotes}</div>
          <div className="text-sm text-muted-foreground">Notes</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="text-3xl font-bold text-purple-500">{store.stats.totalPrompts}</div>
          <div className="text-sm text-muted-foreground">Prompts</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="text-3xl font-bold text-red-500">{store.stats.pendingTasks}</div>
          <div className="text-sm text-muted-foreground">Pending Tasks</div>
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Clips */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clipboard className="w-4 h-4 text-green-500" />
              Recent Clips
            </h3>
            <button 
              onClick={() => store.navigateTo('clipboard')}
              className="text-xs text-gold hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {recentClips.map(clip => (
              <div key={clip.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  {clip.pinned && <Pin className="w-3 h-3 text-gold" />}
                  <span className="truncate">{clip.title || clip.content.slice(0, 50)}</span>
                </div>
              </div>
            ))}
            {recentClips.length === 0 && (
              <p className="text-sm text-muted-foreground">No clips yet</p>
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Recent Notes
            </h3>
            <button 
              onClick={() => store.navigateTo('notes')}
              className="text-xs text-gold hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {recentNotes.map(note => (
              <div key={note.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                <div className="font-medium">{note.title}</div>
                <div className="text-muted-foreground text-xs truncate">
                  {note.content.slice(0, 60)}...
                </div>
              </div>
            ))}
            {recentNotes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet</p>
            )}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-red-500" />
              Today's Tasks
            </h3>
            <button 
              onClick={() => store.navigateTo('calendar')}
              className="text-xs text-gold hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {store.tasks.filter(t => !t.done && t.due === todayStr).slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg text-sm">
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                <span>{task.title}</span>
              </div>
            ))}
            {store.tasks.filter(t => !t.done && t.due === todayStr).length === 0 && (
              <p className="text-sm text-muted-foreground">No tasks for today</p>
            )}
          </div>
        </div>

        {/* Tag Cloud */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Tags className="w-4 h-4 text-purple-500" />
              Tags
            </h3>
            <button 
              onClick={() => store.navigateTo('tags')}
              className="text-xs text-gold hover:underline"
            >
              Manage
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {store.tags.map(tag => (
              <span 
                key={tag.id}
                className="px-3 py-1 rounded-full text-sm"
                style={{ 
                  backgroundColor: `${tag.color}20`, 
                  color: tag.color,
                  border: `1px solid ${tag.color}40`
                }}
              >
                {tag.name} ({tag.count})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CLIPBOARD VIEW ───
function ClipboardView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const [newClip, setNewClip] = useState('');
  const pinnedClips = store.clips.filter(c => c.pinned);
  const regularClips = store.clips.filter(c => !c.pinned);

  const handleAdd = () => {
    if (newClip.trim()) {
      store.addClip(newClip.trim());
      setNewClip('');
    }
  };

  const copyToClipboard = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clipboard</h1>
          <p className="text-muted-foreground">Cross-session clipboard with pins and tags</p>
        </div>
      </div>

      {/* Add New */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newClip}
          onChange={(e) => setNewClip(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add new clip..."
          className="flex-1 px-4 py-2 bg-card border border-border rounded-lg outline-none focus:border-gold"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-gold text-black rounded-lg font-medium hover:bg-gold/90"
        >
          Add
        </button>
      </div>

      {/* Pinned Section */}
      {pinnedClips.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gold mb-3 flex items-center gap-2">
            <Pin className="w-4 h-4" /> Pinned
          </h3>
          <div className="grid gap-2">
            {pinnedClips.map(clip => (
              <div key={clip.id} className="p-4 bg-gold/5 border border-gold/20 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {clip.title && <div className="font-medium mb-1">{clip.title}</div>}
                    <div className="text-sm text-muted-foreground font-mono">{clip.content}</div>
                    <div className="flex gap-2 mt-2">
                      {clip.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => copyToClipboard(clip.content)}
                      className="p-2 hover:bg-muted rounded"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => store.togglePinClip(clip.id)}
                      className="p-2 hover:bg-muted rounded text-gold"
                      title="Unpin"
                    >
                      <Pin className="w-4 h-4 fill-current" />
                    </button>
                    <button 
                      onClick={() => store.deleteClip(clip.id)}
                      className="p-2 hover:bg-muted rounded text-red-500"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Clips */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">History</h3>
        <div className="grid gap-2">
          {regularClips.map(clip => (
            <div key={clip.id} className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {clip.title && <div className="font-medium mb-1">{clip.title}</div>}
                  <div className="text-sm text-muted-foreground font-mono">{clip.content}</div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => copyToClipboard(clip.content)}
                    className="p-2 hover:bg-muted rounded"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => store.togglePinClip(clip.id)}
                    className="p-2 hover:bg-muted rounded"
                    title="Pin"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => store.deleteClip(clip.id)}
                    className="p-2 hover:bg-muted rounded text-red-500"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {regularClips.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No clips yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROMPTS VIEW ───
function PromptsView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const [chain, setChain] = useState<Prompt[]>([]);
  const [showChain, setShowChain] = useState(false);

  const categories = [
    { key: null, label: 'ALL', color: '#94a3b8' },
    { key: 'core8', label: 'CORE 8', color: '#f59e0b' },
    { key: 'extended', label: 'EXTENDED', color: '#3b82f6' },
    { key: 'chains', label: 'CHAINS', color: '#10b981' },
    { key: 'ops', label: 'OPS', color: '#a855f7' },
    { key: 'custom', label: 'CUSTOM', color: '#ef4444' },
  ];

  const filteredPrompts = store.prompts.filter(p => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || 
             p.short.toLowerCase().includes(q) || 
             p.template.toLowerCase().includes(q);
    }
    return true;
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const addToChain = (prompt: Prompt) => {
    if (!chain.some(c => c.id === prompt.id)) {
      setChain([...chain, prompt]);
      setShowChain(true);
    }
  };

  const removeFromChain = (id: string) => {
    setChain(chain.filter(c => c.id !== id));
  };

  const copyChain = () => {
    const text = chain.map(c => c.name).join(' → ') + '\n\n' +
      chain.map((c, i) => `--- Step ${i + 1}: ${c.name} ---\n${c.template}`).join('\n\n');
    copyToClipboard(text);
  };

  const highlightTemplate = (tpl: string) => {
    return tpl
      .replace(/\{[^}]+\}/g, match => `<span class="text-gold bg-gold/10 px-1 rounded border border-gold/20">${match}</span>`)
      .replace(/(\/[A-Z]+)/g, '<span class="text-blue-400 font-semibold">$1</span>');
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - List */}
      <div className={cn("border-r border-border flex flex-col", showChain ? "w-[35%]" : "w-[42%]")}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Prompts</h1>
              <p className="text-xs text-muted-foreground">{filteredPrompts.length} commands</p>
            </div>
            <button
              onClick={() => setShowChain(!showChain)}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors",
                chain.length > 0 
                  ? "bg-green-500/10 text-green-500 border border-green-500/30" 
                  : "bg-muted text-muted-foreground border border-border"
              )}
            >
              <Zap className="w-3 h-3" />
              CHAIN {chain.length > 0 && `(${chain.length})`}
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands..."
              className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 mt-3">
            {categories.map(cat => (
              <button
                key={cat.key || 'all'}
                onClick={() => setSelectedCategory(cat.key as string | null)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-medium tracking-wider transition-colors",
                  selectedCategory === cat.key
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground bg-muted"
                )}
                style={selectedCategory === cat.key ? { backgroundColor: cat.color, color: '#000' } : {}}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPrompts.map(prompt => {
            const isSelected = selectedPrompt?.id === prompt.id;
            const inChain = chain.some(c => c.id === prompt.id);
            return (
              <div
                key={prompt.id}
                onClick={() => {
                  setSelectedPrompt(prompt);
                  setEditMode(false);
                  setEditText(prompt.template);
                }}
                className={cn(
                  "p-3 border-b border-border cursor-pointer flex items-center justify-between group",
                  isSelected ? "bg-muted border-l-2 border-l-gold" : "hover:bg-muted/50 border-l-2 border-l-transparent"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: prompt.color }}>{prompt.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{prompt.categoryLabel}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{prompt.short}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToChain(prompt);
                  }}
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center text-xs transition-colors",
                    inChain 
                      ? "text-green-500 border border-green-500/30" 
                      : "text-muted-foreground border border-border hover:border-green-500/30 hover:text-green-500"
                  )}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Panel - Preview */}
      <div className="flex-1 flex flex-col border-r border-border">
        {selectedPrompt ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg" style={{ color: selectedPrompt.color }}>{selectedPrompt.name}</span>
                  <span className="text-sm text-muted-foreground">{selectedPrompt.short}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={cn(
                    "px-3 py-1.5 rounded text-xs border transition-colors",
                    editMode 
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/30" 
                      : "text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {editMode ? 'PREVIEW' : 'EDIT'}
                </button>
                <button
                  onClick={() => copyToClipboard(editMode ? editText : selectedPrompt.template)}
                  className="px-3 py-1.5 rounded text-xs bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20"
                >
                  COPY
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {editMode ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full h-full bg-muted rounded-lg p-4 text-sm font-mono outline-none resize-none"
                />
              ) : (
                <pre 
                  className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed font-mono"
                  dangerouslySetInnerHTML={{ __html: highlightTemplate(selectedPrompt.template) }}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Terminal className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a command</p>
              <p className="text-xs text-muted-foreground">or start typing to search</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Chain */}
      {showChain && (
        <div className="w-56 bg-muted/30 border-l border-border flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-green-500 tracking-wider">CHAIN BUILDER</span>
            <button 
              onClick={() => { setChain([]); setShowChain(false); }}
              className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground"
            >
              CLEAR
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {chain.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs p-4">
                Click <span className="text-green-500">+</span> on any command to build a pipeline
              </div>
            ) : (
              chain.map((item, i) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between p-2 bg-card rounded border border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono">{i + 1}</span>
                      <span className="text-xs font-semibold" style={{ color: item.color }}>{item.name}</span>
                    </div>
                    <button 
                      onClick={() => removeFromChain(item.id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {i < chain.length - 1 && (
                    <div className="text-center text-green-500 text-xs py-0.5">→</div>
                  )}
                </div>
              ))
            )}
          </div>
          {chain.length > 0 && (
            <div className="p-2 border-t border-border">
              <button
                onClick={copyChain}
                className="w-full py-2 rounded text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500/20"
              >
                COPY CHAIN
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── RESEARCH LINKS VIEW ───
function ResearchView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const SEARCH_HISTORY_KEY = 'pof2828_research_search_history';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', category: '', tags: '' });
  const [searchPreset, setSearchPreset] = useState<'general' | 'dev' | 'academic' | 'obsidian' | 'datasets' | 'docs'>('general');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, [history]);

  const categories = ['all', ...Array.from(new Set(store.bookmarks.map(b => b.category || 'General')))];

  const filteredBookmarks = store.bookmarks.filter(b => {
    if (selectedCategory !== 'all' && (b.category || 'General') !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q);
    }
    return true;
  });

  const presets = {
    general: { label: 'General', filter: '' },
    dev: { label: 'Dev / Code', filter: '(site:github.com OR site:stackoverflow.com OR site:dev.to)' },
    academic: { label: 'Academic', filter: '(site:arxiv.org OR site:scholar.google.com) filetype:pdf' },
    obsidian: { label: 'Obsidian', filter: '(site:github.com OR site:forum.obsidian.md OR site:obsidian.md)' },
    datasets: { label: 'Data / Datasets', filter: '(site:kaggle.com OR site:data.gov) (filetype:csv OR filetype:xlsx OR filetype:json)' },
    docs: { label: 'Docs', filter: '(filetype:pdf OR filetype:docx)' },
  } as const;

  const catColors: Record<string, string> = {
    'theophysics': '#f59e0b', 'infrastructure': '#3b82f6', 'research': '#10b981',
    'consciousness': '#8b5cf6', 'physics': '#06b6d4', 'general': '#6b7280',
  };

  const getCatColor = (cat: string) => catColors[cat.toLowerCase()] || '#4a6fa5';

  const openCreateModal = () => {
    setEditingBookmark(null);
    setFormData({ title: '', url: '', category: '', tags: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setFormData({
      title: bookmark.title,
      url: bookmark.url,
      category: bookmark.category || '',
      tags: bookmark.tags.join(', '),
    });
    setIsModalOpen(true);
  };

  const saveBookmark = () => {
    const data = {
      title: formData.title.trim(),
      url: formData.url.trim(),
      category: formData.category.trim() || 'General',
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    if (!data.title || !data.url) return;

    if (editingBookmark) {
      store.updateBookmark(editingBookmark.id, data);
    } else {
      store.addBookmark(data.title, data.url, data.category, data.tags);
    }
    setIsModalOpen(false);
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
  };

  const builtSearch = [searchQuery.trim(), presets[searchPreset].filter].filter(Boolean).join(' ').trim();

  const saveSearchToHistory = (query: string) => {
    if (!query) return;
    setHistory(prev => [query, ...prev.filter(item => item !== query)].slice(0, 8));
  };

  const openSearchTarget = (target: 'google' | 'exa' | 'crawler') => {
    if (!builtSearch) return;
    saveSearchToHistory(builtSearch);
    const encoded = encodeURIComponent(builtSearch);
    const urls = {
      google: `https://www.google.com/search?q=${encoded}`,
      exa: `https://exa.ai/search?q=${encoded}`,
      crawler: `https://searcht1.com/search?q=${encoded}`,
    };
    window.open(urls[target], '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Research Links + Search
            </h1>
            <p className="text-xs text-muted-foreground">Bookmark library plus smart search presets that build the query string for you.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-3 py-1.5 rounded text-xs bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20"
          >
            + NEW
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(Object.entries(presets) as [keyof typeof presets, typeof presets[keyof typeof presets]][]).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setSearchPreset(key)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  searchPreset === key ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the web with preset-aware filters..."
                className="w-full pl-9 pr-3 py-3 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
              />
            </div>
            <button onClick={() => openSearchTarget('google')} disabled={!builtSearch} className="rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-40">Google</button>
            <button onClick={() => openSearchTarget('exa')} disabled={!builtSearch} className="rounded-lg border border-cyan-500/40 px-4 py-3 text-sm font-medium text-cyan-400 disabled:opacity-40">Exa</button>
            <button onClick={() => openSearchTarget('crawler')} disabled={!builtSearch} className="rounded-lg border border-emerald-500/40 px-4 py-3 text-sm font-medium text-emerald-400 disabled:opacity-40">Smart Crawler</button>
          </div>

          <div className="rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
            <span className="mr-2 text-[10px] uppercase tracking-[0.2em]">Built query</span>
            <span className="text-foreground">{builtSearch || 'Choose a preset and enter a query to build the final search string.'}</span>
          </div>

          {history.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <Clock3 className="w-3.5 h-3.5" />
                Search history
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map(item => (
                  <button
                    key={item}
                    onClick={() => setSearchQuery(item)}
                    className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter saved bookmarks..."
              className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded text-[10px] font-medium tracking-wider whitespace-nowrap transition-colors',
                  selectedCategory === cat
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredBookmarks.map(bookmark => (
          <div
            key={bookmark.id}
            className="p-3 bg-card border border-border rounded-lg"
            style={{ borderLeftColor: getCatColor(bookmark.category || ''), borderLeftWidth: '3px' }}
          >
            <div className="font-medium text-sm">{bookmark.title}</div>
            <div className="text-xs text-muted-foreground truncate">{bookmark.url}</div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {bookmark.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 bg-muted rounded text-muted-foreground">{tag}</span>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-[10px] border border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
              >
                <ExternalLink className="w-3 h-3" /> OPEN
              </a>
              <button
                onClick={() => copyUrl(bookmark.url)}
                className="px-3 py-2 rounded text-[10px] border border-green-500/30 text-green-500 hover:bg-green-500/10"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={() => openEditModal(bookmark)}
                className="px-3 py-2 rounded text-[10px] border border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={() => store.deleteBookmark(bookmark.id)}
                className="px-3 py-2 rounded text-[10px] border border-red-500/30 text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {filteredBookmarks.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No bookmarks found</p>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 text-gold">{editingBookmark ? 'Edit' : 'New'} Bookmark</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
                  placeholder="e.g. Theophysics Dashboard"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
                  placeholder="e.g. Theophysics"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
                  placeholder="e.g. dashboard, api"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={saveBookmark}
                className="px-4 py-2 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CALENDAR VIEW ───
function CalendarView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const [viewMode, setViewMode] = useState<'agenda' | 'month'>('agenda');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ title: '', due: '', time: '', priority: '4', project: '', desc: '' });

  const todayStr = new Date().toISOString().split('T')[0];

  const monthName = (m: number) => ['January','February','March','April','May','June','July','August','September','October','November','December'][m];
  const shortMonth = (m: number) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];
  const dayName = (d: Date) => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const navigateDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const goToday = () => setSelectedDate(new Date());

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({ title: '', due: fmtDate(selectedDate), time: '', priority: '4', project: '', desc: '' });
    setIsAddModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      due: task.due || '',
      time: task.time || '',
      priority: task.priority,
      project: task.project || '',
      desc: task.desc || '',
    });
    setIsAddModalOpen(true);
  };

  const saveTask = () => {
    const data = {
      title: formData.title.trim(),
      due: formData.due || undefined,
      time: formData.time || undefined,
      priority: formData.priority as Task['priority'],
      project: formData.project || undefined,
      desc: formData.desc || undefined,
    };
    if (!data.title) return;

    if (editingTask) {
      store.updateTask(editingTask.id, data);
    } else {
      store.addTask(data.title, data.project, data.priority, data.due);
    }
    setIsAddModalOpen(false);
  };

  const deleteTask = (id: string) => {
    if (confirm('Delete this task?')) {
      store.deleteTask(id);
    }
  };

  const getProjectColor = (id?: string) => {
    const p = store.projects.find(p => p.id === id);
    return p?.color || '#5A5F6E';
  };

  const getPriorityColor = (p: string) => {
    return p === '1' ? '#E05C6E' : p === '2' ? '#F6821F' : p === '3' ? '#4F8EF7' : '#5A5F6E';
  };

  // Week strip
  const renderWeekStrip = () => {
    const d = new Date(selectedDate);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    
    return (
      <div className="flex gap-0.5 p-3 bg-card border-b border-border">
        {Array.from({ length: 7 }, (_, i) => {
          const ds = fmtDate(d);
          const isToday = ds === todayStr;
          const isSelected = ds === fmtDate(selectedDate);
          d.setDate(d.getDate() + 1);
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(new Date(ds))}
              className={cn(
                "flex-1 text-center py-2 rounded-lg transition-colors",
                isSelected ? "bg-gold/10 border border-gold/30" : "hover:bg-muted",
                isToday && !isSelected && "bg-red-500/10 border border-red-500/30"
              )}
            >
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</div>
              <div className={cn("text-lg font-semibold", isToday && "text-red-500", isSelected && "text-gold")}>
                {new Date(ds).getDate()}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // Agenda view
  const renderAgenda = () => {
    const selectedStr = fmtDate(selectedDate);
    const isToday = selectedStr === todayStr;
    const dayTasks = store.tasks.filter(t => t.due === selectedStr && !t.done).sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
    const doneTasks = store.tasks.filter(t => t.due === selectedStr && t.done);
    const overdue = store.tasks.filter(t => !t.done && t.due && t.due < todayStr);

    return (
      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Date Header */}
        <div>
          <h2 className="text-xl font-bold">{isToday ? 'Today' : dayName(selectedDate)}</h2>
          <p className="text-sm text-muted-foreground">{shortMonth(selectedDate.getMonth())} {selectedDate.getDate()}, {selectedDate.getFullYear()}</p>
        </div>

        {/* Overdue */}
        {overdue.length > 0 && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-red-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Overdue
              </span>
              <button 
                onClick={() => overdue.forEach(t => store.updateTask(t.id, { due: todayStr }))}
                className="text-xs text-red-500 hover:underline"
              >
                Reschedule all
              </button>
            </div>
            {overdue.map(task => renderTaskItem(task))}
          </div>
        )}

        {/* Tasks */}
        <div className="space-y-2">
          {dayTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tasks for this day</p>
          ) : (
            dayTasks.map(task => renderTaskItem(task))
          )}
        </div>

        {/* Completed */}
        {doneTasks.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm text-muted-foreground mb-2">Completed</h4>
            <div className="space-y-2 opacity-60">
              {doneTasks.map(task => renderTaskItem(task))}
            </div>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={openAddModal}
          className="w-full flex items-center gap-2 p-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" /> Add task
        </button>
      </div>
    );
  };

  const renderTaskItem = (task: Task) => (
    <div key={task.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg group">
      <button
        onClick={() => store.toggleTask(task.id)}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors",
          task.done 
            ? "bg-green-500 border-green-500" 
            : "border-muted-foreground hover:border-green-500"
        )}
      >
        {task.done && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm", task.done && "line-through text-muted-foreground")}>{task.title}</div>
        <div className="flex items-center gap-2 mt-1">
          {task.time && <span className="text-[10px] text-muted-foreground font-mono">{task.time}</span>}
          {task.project && (
            <span 
              className="text-[10px] px-1.5 py-0.5 rounded border"
              style={{ color: getProjectColor(task.project), borderColor: `${getProjectColor(task.project)}40`, backgroundColor: `${getProjectColor(task.project)}15` }}
            >
              {store.projects.find(p => p.id === task.project)?.name}
            </span>
          )}
          <span 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          />
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => openEditModal(task)} className="p-1.5 hover:bg-muted rounded">
          <Edit3 className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={() => deleteTask(task.id)} className="p-1.5 hover:bg-muted rounded">
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );

  // Month view
  const renderMonthView = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells: React.ReactNode[] = [];
    
    // Previous month
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push(
        <div key={`prev-${i}`} className="p-2 opacity-35 bg-card border border-border">
          <div className="text-xs">{prevDays - i}</div>
        </div>
      );
    }
    
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = ds === todayStr;
      const dayTasks = store.tasks.filter(t => t.due === ds && !t.done);
      cells.push(
        <div 
          key={d} 
          onClick={() => { setSelectedDate(new Date(ds)); setViewMode('agenda'); }}
          className={cn(
            "p-2 min-h-[80px] bg-card border border-border cursor-pointer hover:bg-muted transition-colors",
            isToday && "ring-2 ring-red-500/50"
          )}
        >
          <div className={cn("text-xs font-medium", isToday && "text-red-500")}>{d}</div>
          <div className="space-y-0.5 mt-1">
            {dayTasks.slice(0, 3).map(t => (
              <div 
                key={t.id} 
                className="text-[9px] truncate px-1 py-0.5 rounded"
                style={{ backgroundColor: `${getProjectColor(t.project)}20`, color: getProjectColor(t.project) }}
              >
                {t.title}
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="text-[9px] text-muted-foreground">+{dayTasks.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }
    
    // Fill remainder
    const totalCells = startDay + daysInMonth;
    const rem = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let d = 1; d <= rem; d++) {
      cells.push(
        <div key={`next-${d}`} className="p-2 opacity-35 bg-card border border-border">
          <div className="text-xs">{d}</div>
        </div>
      );
    }

    return (
      <div className="p-4 overflow-y-auto">
        <div className="grid grid-cols-7 gap-px bg-border">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="p-2 bg-card text-[10px] text-muted-foreground uppercase tracking-wider text-center">
              {d}
            </div>
          ))}
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{monthName(selectedDate.getMonth())} <span className="text-gold">{selectedDate.getFullYear()}</span></h1>
          <div className="flex gap-1">
            <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-muted rounded">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button onClick={goToday} className="px-3 py-1.5 text-xs bg-muted rounded hover:bg-muted/80">
              Today
            </button>
            <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-muted rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('agenda')}
            className={cn(
              "px-3 py-1.5 rounded text-xs transition-colors",
              viewMode === 'agenda' ? "bg-gold/10 text-gold border border-gold/30" : "text-muted-foreground hover:bg-muted"
            )}
          >
            Agenda
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              "px-3 py-1.5 rounded text-xs transition-colors",
              viewMode === 'month' ? "bg-gold/10 text-gold border border-gold/30" : "text-muted-foreground hover:bg-muted"
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'agenda' && (
        <>
          {renderWeekStrip()}
          {renderAgenda()}
        </>
      )}
      {viewMode === 'month' && renderMonthView()}

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 text-gold">{editingTask ? 'Edit' : 'Add'} Task</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
                  placeholder="Task name..."
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Due Date</label>
                  <input
                    type="date"
                    value={formData.due}
                    onChange={(e) => setFormData({ ...formData, due: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
                  >
                    <option value="4">None</option>
                    <option value="1">🔴 Priority 1</option>
                    <option value="2">🟠 Priority 2</option>
                    <option value="3">🔵 Priority 3</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Project</label>
                  <select
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50"
                  >
                    <option value="">No project</option>
                    {store.projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              {editingTask && (
                <button
                  onClick={() => { store.deleteTask(editingTask.id); setIsAddModalOpen(false); }}
                  className="px-4 py-2 rounded text-sm text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={saveTask}
                className="px-4 py-2 rounded text-sm bg-red-500 text-white hover:bg-red-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NOTES VIEW ───
function NotesView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const startNewNote = () => {
    setIsEditing(true);
    setEditingNote(null);
    setTitle('');
    setContent('');
  };

  const startEdit = (note: typeof store.notes[0]) => {
    setIsEditing(true);
    setEditingNote(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const saveNote = () => {
    if (title.trim()) {
      if (editingNote) {
        store.updateNote(editingNote, { title, content });
      } else {
        store.addNote(title, content);
      }
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setIsEditing(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
          <button 
            onClick={saveNote}
            className="px-4 py-2 bg-gold text-black rounded-lg font-medium"
          >
            Save
          </button>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="text-2xl font-bold bg-transparent border-none outline-none mb-4"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="flex-1 bg-transparent border-none outline-none resize-none font-mono text-sm"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Quick notes with markdown support</p>
        </div>
        <button
          onClick={startNewNote}
          className="px-4 py-2 bg-gold text-black rounded-lg font-medium hover:bg-gold/90"
        >
          + New Note
        </button>
      </div>

      <div className="grid gap-4">
        {store.notes.map(note => (
          <div 
            key={note.id} 
            onClick={() => startEdit(note)}
            className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:border-gold/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{note.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {note.content}
                </p>
                <div className="flex gap-2 mt-2">
                  {note.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded">{tag}</span>
                  ))}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(note.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        {store.notes.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No notes yet. Create your first note!</p>
        )}
      </div>
    </div>
  );
}

// ─── TAGS VIEW ───
function TagsView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const [newTagName, setNewTagName] = useState('');
  const colors = ['#F2C94C', '#4F8EF7', '#4ECB71', '#9B7FE8', '#F6821F', '#E05C6E', '#22d3ee'];

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      store.addTag(newTagName.trim(), randomColor);
      setNewTagName('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="text-muted-foreground">Universal tags across all features</p>
      </div>

      {/* Add Tag */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          placeholder="New tag name..."
          className="flex-1 px-4 py-2 bg-card border border-border rounded-lg outline-none focus:border-gold"
        />
        <button
          onClick={handleAddTag}
          className="px-4 py-2 bg-gold text-black rounded-lg font-medium hover:bg-gold/90"
        >
          Add Tag
        </button>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {store.tags.map(tag => (
          <div 
            key={tag.id}
            className="p-4 bg-card border border-border rounded-lg"
            style={{ borderColor: `${tag.color}40` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span className="font-medium">{tag.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {tag.count} items
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FILES VIEW ───
function FilesView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const folders = [
    { id: 'documents', label: 'Documents', icon: '📄', color: '#4F8EF7' },
    { id: 'videos', label: 'Videos', icon: '🎬', color: '#E05C6E' },
    { id: 'music', label: 'Music', icon: '🎵', color: '#9B7FE8' },
    { id: 'pictures', label: 'Pictures', icon: '🖼️', color: '#4ECB71' },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Files</h1>
        <p className="text-muted-foreground">Synced folders and file browser</p>
      </div>

      {/* Folder Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {folders.map(folder => (
          <button
            key={folder.id}
            className="p-6 bg-card border border-border rounded-xl hover:border-gold/50 transition-colors text-left"
          >
            <div className="text-4xl mb-3">{folder.icon}</div>
            <div className="font-medium">{folder.label}</div>
            <div className="text-sm text-muted-foreground">
              {store.files.filter(f => f.folder === folder.id).length} files
            </div>
          </button>
        ))}
      </div>

      {/* Bookmarks Section */}
      <div>
        <h3 className="font-semibold mb-3">Bookmarks</h3>
        <div className="grid gap-2">
          {store.bookmarks.map(bookmark => (
            <div key={bookmark.id} className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{bookmark.title}</div>
                  <div className="text-sm text-muted-foreground">{bookmark.url}</div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-muted rounded">{bookmark.category}</span>
                    {bookmark.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <a 
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-muted rounded"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => store.deleteBookmark(bookmark.id)}
                    className="p-2 hover:bg-muted rounded text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {store.bookmarks.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No bookmarks yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI AGENT VIEW ───
function AIAgentView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const AI_HISTORY_KEY = 'pof2828_ai_chat_history';
  const AI_SETTINGS_KEY = 'pof2828_ai_chat_settings';
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<AiProvider>('openai');
  const [role, setRole] = useState<AiRole>('copilot');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [includeClips, setIncludeClips] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeTasks, setIncludeTasks] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedPrompt = store.prompts.find(prompt => prompt.id === selectedPromptId) || null;

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(AI_HISTORY_KEY);
      const storedSettings = localStorage.getItem(AI_SETTINGS_KEY);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as {
          provider?: AiProvider;
          role?: AiRole;
          includeClips?: boolean;
          includeNotes?: boolean;
          includeTasks?: boolean;
          selectedPromptId?: string;
        };
        setProvider(parsed.provider || 'openai');
        setRole(parsed.role || 'copilot');
        setIncludeClips(parsed.includeClips ?? true);
        setIncludeNotes(parsed.includeNotes ?? true);
        setIncludeTasks(parsed.includeTasks ?? true);
        setSelectedPromptId(parsed.selectedPromptId || '');
      }
    } catch (error) {
      console.error('Failed to load AI panel state:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save AI chat history:', error);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify({
        provider,
        role,
        includeClips,
        includeNotes,
        includeTasks,
        selectedPromptId,
      }));
    } catch (error) {
      console.error('Failed to save AI chat settings:', error);
    }
  }, [provider, role, includeClips, includeNotes, includeTasks, selectedPromptId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const contextPackets = useMemo(() => {
    const packets: string[] = [];
    if (includeClips) {
      store.clips.slice(0, 3).forEach(clip => {
        packets.push(`Clip: ${clip.title || clip.content.slice(0, 40)} → ${clip.content.slice(0, 120)}`);
      });
    }
    if (includeNotes) {
      store.notes.slice(0, 2).forEach(note => {
        packets.push(`Note: ${note.title} → ${note.content.replace(/\s+/g, ' ').slice(0, 140)}`);
      });
    }
    if (includeTasks) {
      store.tasks.filter(task => !task.done).slice(0, 3).forEach(task => {
        packets.push(`Task: ${task.title}${task.due ? ` (due ${task.due})` : ''}`);
      });
    }
    return packets;
  }, [includeClips, includeNotes, includeTasks, store.clips, store.notes, store.tasks]);

  const applyPrompt = () => {
    if (!selectedPrompt) return;
    setInput(prev => prev ? `${prev}

${selectedPrompt.template}` : selectedPrompt.template);
  };

  const clearConversation = () => {
    setMessages([]);
    try {
      localStorage.removeItem(AI_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear AI chat history:', error);
    }
  };

  const buildAssistantReply = (userMessage: string) => {
    const normalized = userMessage.toLowerCase();
    const created: string[] = [];

    if (normalized.includes('add task') || normalized.includes('create task')) {
      const taskTitle = userMessage
        .replace(/.*(?:add task|create task)[:\-]?/i, '')
        .trim() || 'Follow up on AI workflow';
      store.addTask(taskTitle, undefined, '2');
      created.push(`Task created: ${taskTitle}`);
    }

    if (normalized.includes('save note') || normalized.includes('create note')) {
      const noteTitle = userMessage
        .replace(/.*(?:save note|create note)[:\-]?/i, '')
        .trim() || 'AI Session Note';
      store.addNote(noteTitle, `Captured from AI panel on ${new Date().toLocaleString()}`, ['ai']);
      created.push(`Note created: ${noteTitle}`);
    }

    if (normalized.includes('save clip') || normalized.includes('add clip')) {
      const clipContent = userMessage
        .replace(/.*(?:save clip|add clip)[:\-]?/i, '')
        .trim() || 'Captured from AI panel';
      store.addClip(clipContent, 'AI clip', ['ai']);
      created.push(`Clip saved: ${clipContent.slice(0, 48)}`);
    }

    const promptLine = selectedPrompt ? `Prompt library injection: ${selectedPrompt.name}.` : 'No prompt preset attached.';
    const contextLine = contextPackets.length > 0
      ? `Context injected from dashboard memory (${contextPackets.length} items).`
      : 'No dashboard context injected.';
    const routingLine = `Provider route ready: ${provider.toUpperCase()} · role ${role}.`;

    const replySections = [
      routingLine,
      promptLine,
      contextLine,
      created.length > 0
        ? `Dispatcher actions completed: ${created.join(' · ')}.`
        : 'Dispatcher standing by — ask me to add a task, save a note, or store a clip.',
      'Next step: connect this panel to a streaming Worker endpoint so the same UI can switch from local mock mode to real provider responses without redesign.',
    ];

    return {
      fullText: replySections.join('\n\n'),
      created,
    };
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatTurn = {
      id: `chat_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
      provider,
      contextSummary: contextPackets,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const { fullText } = buildAssistantReply(userMessage.content);
    const assistantId = `chat_${Date.now()}_assistant`;
    const assistantShell: ChatTurn = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      provider,
      contextSummary: contextPackets,
    };

    setMessages(prev => [...prev, assistantShell]);

    let cursor = 0;
    const interval = window.setInterval(() => {
      cursor += Math.max(8, Math.floor(fullText.length / 18));
      const nextChunk = fullText.slice(0, cursor);
      setMessages(prev => prev.map(message => (
        message.id === assistantId ? { ...message, content: nextChunk } : message
      )));

      if (cursor >= fullText.length) {
        window.clearInterval(interval);
        setIsLoading(false);
      }
    }, 60);
  };

  return (
    <div className="h-full flex flex-col xl:flex-row">
      <div className="w-full xl:w-80 border-b xl:border-b-0 xl:border-r border-border bg-muted/20">
        <div className="p-4 border-b border-border space-y-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-cyan-400" />
              AI Control Panel
            </h1>
            <p className="text-sm text-muted-foreground">Streaming-ready local shell with provider routing, prompt injection, and dashboard context.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {([
              { value: 'openai', label: 'OpenAI' },
              { value: 'xai', label: 'xAI / Grok' },
              { value: 'anthropic', label: 'Anthropic' },
              { value: 'ollama', label: 'Ollama' },
            ] as { value: AiProvider; label: string }[]).map(option => (
              <button
                key={option.value}
                onClick={() => setProvider(option.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition-colors',
                  provider === option.value ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300' : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-70">provider</div>
              </button>
            ))}
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Role routing</div>
            <div className="flex gap-2 flex-wrap">
              {(['interface', 'logic', 'copilot'] as AiRole[]).map(option => (
                <button
                  key={option}
                  onClick={() => setRole(option)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs capitalize transition-colors',
                    role === option ? 'border-gold bg-gold/10 text-gold' : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Prompt library</div>
            <div className="flex gap-2">
              <select
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
              >
                <option value="">No preset</option>
                {store.prompts.map(prompt => (
                  <option key={prompt.id} value={prompt.id}>{prompt.name} — {prompt.short}</option>
                ))}
              </select>
              <button
                onClick={applyPrompt}
                disabled={!selectedPrompt}
                className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-medium text-gold disabled:opacity-40"
              >
                Inject
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Context sources</div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Clips', value: includeClips, onChange: setIncludeClips, count: store.clips.length },
                { label: 'Notes', value: includeNotes, onChange: setIncludeNotes, count: store.notes.length },
                { label: 'Tasks', value: includeTasks, onChange: setIncludeTasks, count: store.tasks.filter(task => !task.done).length },
              ].map(item => (
                <label key={item.label} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.count} available</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.value}
                    onChange={(e) => item.onChange(e.target.checked)}
                    className="h-4 w-4 accent-cyan-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Injected preview</div>
            <button onClick={clearConversation} className="text-xs text-muted-foreground hover:text-red-400">Clear chat</button>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground max-h-56 overflow-y-auto pr-1">
            {contextPackets.length > 0 ? contextPackets.map(packet => (
              <div key={packet} className="rounded-lg border border-border bg-card px-3 py-2">
                {packet}
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">Enable a source to inject dashboard context.</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-6 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Conversation</h2>
            <p className="text-sm text-muted-foreground">Chat history persists in localStorage and is ready for a Worker-backed streaming endpoint.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {messages.length} turns stored
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-base">Start a conversation with dashboard memory attached.</p>
              <p className="text-sm mt-2">Example: “Add task: wire Cloudflare Worker proxy” or “Save note: MCP tool ideas”.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-4', msg.role === 'user' ? 'flex-row-reverse' : '')}
            >
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold',
                msg.role === 'user' ? 'bg-gold text-black' : 'bg-cyan-500/20 text-cyan-300'
              )}>
                {msg.role === 'user' ? 'You' : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                'max-w-[80%] rounded-2xl border px-4 py-3',
                msg.role === 'user' ? 'border-gold/20 bg-gold/10' : 'border-border bg-card'
              )}>
                <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>{msg.role}</span>
                  {msg.provider && <span>· {msg.provider}</span>}
                  <span>· {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content || '…'}</div>
                {msg.contextSummary && msg.contextSummary.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {msg.contextSummary.slice(0, 3).map(item => (
                      <span key={item} className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{item.slice(0, 48)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-card border border-border p-4 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border space-y-3">
          {selectedPrompt && (
            <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm">
              <div className="font-medium text-gold">Active prompt preset: {selectedPrompt.name}</div>
              <div className="text-muted-foreground mt-1 line-clamp-2">{selectedPrompt.short}</div>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask anything, or issue a command like 'Add task: build MCP tools'..."
              className="min-h-[88px] flex-1 resize-none rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-cyan-500"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="self-end rounded-xl bg-cyan-500 px-5 py-3 font-medium text-black disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AXIOMS VIEW ───
function AxiomsView() {
  const [selectedAxiomId, setSelectedAxiomId] = useState<string | null>(null);
  const selectedAxiom = selectedAxiomId ? getAxiomById(selectedAxiomId) : null;

  return (
    <div className="h-full flex">
      {/* Axiom List */}
      <div className="w-80 border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Axioms</h2>
          <p className="text-sm text-muted-foreground">{axioms.length} loaded</p>
        </div>
        <div className="divide-y divide-border">
          {axioms.map(axiom => (
            <button
              key={axiom.id}
              onClick={() => setSelectedAxiomId(axiom.id)}
              className={cn(
                'w-full p-4 text-left hover:bg-muted/50 transition-colors',
                selectedAxiomId === axiom.id && 'bg-gold/10 border-l-2 border-l-gold'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {String(axiom.chainPosition).padStart(3, '0')}
                </span>
                <span className="font-medium">{axiom.id}</span>
                <div 
                  className={cn(
                    'w-2 h-2 rounded-full ml-auto',
                    axiom.status === 'validated' && 'bg-emerald-500',
                    axiom.status === 'draft' && 'bg-amber-500',
                    axiom.status === 'review' && 'bg-blue-500',
                    axiom.status === 'critical' && 'bg-red-500'
                  )}
                />
              </div>
              <div className="text-sm text-muted-foreground mt-1">{axiom.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Axiom Detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedAxiom ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>Master Index</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gold">{selectedAxiom.id}</span>
              </div>
              <h1 className="text-3xl font-bold">{selectedAxiom.id} — {selectedAxiom.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Chain Position: {selectedAxiom.chainPosition} of 188</span>
                <span>•</span>
                <span>Stage {selectedAxiom.stage}</span>
                <span>•</span>
                <span className={cn(
                  'capitalize',
                  selectedAxiom.tier === 'primitive' && 'text-emerald-400',
                  selectedAxiom.tier === 'definition' && 'text-purple-400',
                  selectedAxiom.tier === 'lemma' && 'text-amber-400',
                )}>
                  {selectedAxiom.tier}
                </span>
              </div>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Formal Statement</h3>
              <p className="text-foreground">{selectedAxiom.formalStatement}</p>
              {selectedAxiom.formalStatementMath && (
                <code className="block mt-2 p-2 bg-muted rounded text-gold font-mono">
                  {selectedAxiom.formalStatementMath}
                </code>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-card border border-border rounded-lg text-center">
                <div className="text-2xl font-bold text-red-400">{selectedAxiom.analytics.contradictions}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Contradictions</div>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg text-center">
                <div className="text-2xl font-bold text-gold">{selectedAxiom.analytics.bridgeScore}/10</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Bridge Score</div>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg text-center">
                <div className={cn(
                  'text-2xl font-bold',
                  selectedAxiom.analytics.crRating === 'Critical' && 'text-red-400',
                  selectedAxiom.analytics.crRating === 'High' && 'text-amber-400',
                  selectedAxiom.analytics.crRating === 'Medium' && 'text-blue-400',
                  selectedAxiom.analytics.crRating === 'Low' && 'text-emerald-400',
                )}>
                  {selectedAxiom.analytics.crRating}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">CR Rating</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select an axiom to view details
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CUSTOM PAGES VIEW ───
function CustomPagesView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [description, setDescription] = useState('');

  const generateHtmlFromPrompt = (prompt: string) => {
    const safePrompt = prompt.trim() || 'Untitled custom page';
    const headline = safePrompt.split(/[.!?]/)[0].slice(0, 72) || 'Custom Page';
    const bullets = safePrompt
      .split(/[,.;\n]/)
      .map(part => part.trim())
      .filter(Boolean)
      .slice(0, 4);

    return `<div style="font-family: Inter, Arial, sans-serif; min-height: 100vh; background: linear-gradient(135deg, #0f172a, #111827); color: #f8fafc; padding: 32px;">
  <div style="max-width: 960px; margin: 0 auto; display: grid; gap: 24px;">
    <section style="padding: 28px; border-radius: 24px; border: 1px solid rgba(34, 211, 238, 0.24); background: rgba(15, 23, 42, 0.82); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);">
      <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(34, 211, 238, 0.12); color: #67e8f9; font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em;">AI Generated Layout</div>
      <h1 style="font-size: 42px; line-height: 1.1; margin: 18px 0 12px;">${headline}</h1>
      <p style="font-size: 18px; line-height: 1.7; color: rgba(226, 232, 240, 0.86); max-width: 780px;">${safePrompt}</p>
    </section>
    <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
      ${(bullets.length > 0 ? bullets : ['Hero section', 'Supporting details', 'Call to action']).map((item, index) => `<article style="padding: 20px; border-radius: 20px; background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(148, 163, 184, 0.2);">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; color: #facc15; margin-bottom: 10px;">Block ${index + 1}</div>
        <h2 style="font-size: 20px; margin: 0 0 10px;">${item}</h2>
        <p style="font-size: 14px; line-height: 1.7; color: rgba(226, 232, 240, 0.76);">Replace this with live content, embed a widget, or route messages from the comms dispatcher into this custom page.</p>
      </article>`).join('')}
    </section>
  </div>
</div>`;
  };

  const startNewPage = () => {
    setIsEditing(true);
    setEditingPage(null);
    setTitle('');
    setDescription('');
    setHtml('<div style="padding:20px">\n  <h1>My Custom Page</h1>\n  <p>Add your HTML here...</p>\n</div>');
  };

  const startEdit = (page: CustomPage) => {
    setIsEditing(true);
    setEditingPage(page);
    setTitle(page.title);
    setDescription('');
    setHtml(page.html);
  };

  const savePage = () => {
    if (title.trim()) {
      if (editingPage) {
        store.updateCustomPage(editingPage.id, { title, html });
      } else {
        store.addCustomPage(title, html);
      }
      setIsEditing(false);
    }
  };

  const generatePage = () => {
    const generatedTitle = title.trim() || description.trim().split(/[.!?]/)[0].slice(0, 40) || 'AI Generated Page';
    setTitle(generatedTitle);
    setHtml(generateHtmlFromPrompt(description));
  };

  if (isEditing) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <button
            onClick={() => setIsEditing(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={savePage}
              className="px-4 py-2 bg-gold text-black rounded-lg font-medium"
            >
              Save
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-border bg-muted/20 grid lg:grid-cols-[1.1fr,0.9fr] gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Page title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Landing page, knowledge card, dashboard widget..."
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Describe the page in plain text</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the layout, content blocks, tone, and interactions you want Codex to scaffold."
                className="mt-1 min-h-[108px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none resize-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-cyan-300">
              <Wand2 className="w-4 h-4" />
              AI page builder scaffold
            </div>
            <p className="mt-2 text-muted-foreground">This generator stays local for now, outputs self-contained HTML, and previews inside a sandboxed iframe so you can later swap in a real model call without changing the editor flow.</p>
            <button
              onClick={generatePage}
              disabled={!description.trim()}
              className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 disabled:opacity-40"
            >
              Generate HTML
            </button>
          </div>
        </div>

        <div className="flex-1 grid lg:grid-cols-2 min-h-0">
          <div className="flex min-h-0 flex-col border-r border-border">
            <div className="p-2 bg-muted text-xs text-muted-foreground uppercase tracking-wider">HTML Editor</div>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="flex-1 p-4 bg-card text-sm font-mono outline-none resize-none"
              spellCheck={false}
            />
          </div>
          <div className="flex min-h-0 flex-col">
            <div className="p-2 bg-muted text-xs text-muted-foreground uppercase tracking-wider">Sandbox Preview</div>
            <iframe
              title="Custom page preview"
              sandbox="allow-scripts"
              srcDoc={html}
              className="flex-1 w-full bg-white"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Custom Pages</h1>
          <p className="text-muted-foreground">Describe a page, generate self-contained HTML, and save it into the dashboard.</p>
        </div>
        <button
          onClick={startNewPage}
          className="px-4 py-2 bg-gold text-black rounded-lg font-medium hover:bg-gold/90"
        >
          + New Page
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {store.customPages.map(page => (
          <div
            key={page.id}
            className="p-4 bg-card border border-border rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FileCode className="w-8 h-8 text-cyan-400" />
                <div>
                  <h3 className="font-medium">{page.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(page.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(page)}
                  className="p-2 hover:bg-muted rounded"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => store.deleteCustomPage(page.id)}
                  className="p-2 hover:bg-muted rounded text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {store.customPages.length === 0 && (
          <p className="text-muted-foreground text-center py-8 col-span-2">No custom pages yet. Create your first page!</p>
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS VIEW ───
function SettingsView({ store }: { store: ReturnType<typeof useDashboardStore> }) {
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleImport = () => {
    if (importText.trim()) {
      const success = store.importData(importText);
      if (success) {
        alert('Data imported successfully!');
        setImportText('');
        setShowImport(false);
      } else {
        alert('Import failed. Please check your JSON.');
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your dashboard</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-card border border-border rounded-lg">
          <h3 className="font-semibold mb-2">AI Provider</h3>
          <p className="text-sm text-muted-foreground mb-4">Choose your AI provider for the agent</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gold text-black rounded-lg">Anthropic (Claude)</button>
            <button className="px-4 py-2 bg-muted rounded-lg">OpenAI (GPT)</button>
            <button className="px-4 py-2 bg-muted rounded-lg">Ollama (Local)</button>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <h3 className="font-semibold mb-2">API Keys</h3>
          <p className="text-sm text-muted-foreground mb-4">Manage your API keys</p>
          <input 
            type="password" 
            placeholder="Anthropic API Key"
            className="w-full px-4 py-2 bg-muted rounded-lg outline-none"
          />
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <h3 className="font-semibold mb-2">Data</h3>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => store.exportData()}
              className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80"
            >
              Export Data
            </button>
            <button 
              onClick={() => setShowImport(!showImport)}
              className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80"
            >
              Import Data
            </button>
            <button 
              onClick={() => {
                if (confirm('Clear all data? This cannot be undone.')) {
                  localStorage.clear();
                  location.reload();
                }
              }}
              className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
            >
              Clear All Data
            </button>
          </div>
          
          {showImport && (
            <div className="mt-4 space-y-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your exported JSON here..."
                className="w-full h-32 px-4 py-2 bg-muted rounded-lg outline-none resize-none font-mono text-xs"
              />
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Import
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <h3 className="font-semibold mb-2">Statistics</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Clips</span>
              <span>{store.stats.totalClips}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Notes</span>
              <span>{store.stats.totalNotes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Prompts</span>
              <span>{store.stats.totalPrompts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Tasks</span>
              <span>{store.stats.totalTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Tasks</span>
              <span>{store.stats.pendingTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custom Pages</span>
              <span>{store.stats.totalCustomPages}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───
function App() {
  const store = useDashboardStore();
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render current view
  const renderView = () => {
    switch (store.currentView) {
      case 'dashboard':
        return <DashboardView store={store} />;
      case 'clipboard':
        return <ClipboardView store={store} />;
      case 'prompts':
        return <PromptsView store={store} />;
      case 'research':
        return <ResearchView store={store} />;
      case 'calendar':
        return <CalendarView store={store} />;
      case 'notes':
        return <NotesView store={store} />;
      case 'tags':
        return <TagsView store={store} />;
      case 'files':
        return <FilesView store={store} />;
      case 'ai':
        return <AIAgentView store={store} />;
      case 'axioms':
        return <AxiomsView />;
      case 'custom':
        return <CustomPagesView store={store} />;
      case 'settings':
        return <SettingsView store={store} />;
      default:
        return <DashboardView store={store} />;
    }
  };

  if (!store.isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        currentView={store.currentView} 
        onNavigate={store.navigateTo}
        onOpenSearch={() => setSearchOpen(true)}
        stats={store.stats}
        customPages={store.customPages}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>

      {/* Unified Search Modal */}
      <UnifiedSearch 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
        store={store}
      />
    </div>
  );
}

export default App;

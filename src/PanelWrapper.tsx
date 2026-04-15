import { useParams } from 'react-router-dom';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { TTSView } from '@/views/TTSView';
import { ClipboardView } from '@/views/ClipboardView';
import { PromptsView } from '@/views/PromptsView';
import {
  ResearchView,
  CalendarView,
  NotesView,
  SettingsView,
  DashboardView,
  AIAgentView,
} from '@/App';
import type { ViewType } from '@/types';

export function PanelWrapper() {
  const { viewId } = useParams<{ viewId: string }>();
  const store = useDashboardStore();

  if (!store.isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#0a0a0f', color: '#f59e0b' }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#f59e0b', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden" style={{ background: '#0a0a0f', color: '#c8ccd4' }}>
      <PanelContent viewId={viewId as ViewType} store={store} />
    </div>
  );
}

function PanelContent({ viewId, store }: { viewId: ViewType; store: ReturnType<typeof useDashboardStore> }) {
  switch (viewId) {
    case 'tts': return <TTSView />;
    case 'clipboard': return <ClipboardView />;
    case 'prompts': return <PromptsView />;
    case 'research': return <ResearchView store={store} />;
    case 'calendar': return <CalendarView store={store} />;
    case 'notes': return <NotesView store={store} />;
    case 'ai': return <AIAgentView store={store} />;
    case 'settings': return <SettingsView store={store} />;
    case 'dashboard': return <DashboardView store={store} />;
    default:
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>{viewId?.toUpperCase()}</p>
          <p style={{ fontSize: '12px', color: '#3a3a4a', marginBottom: '16px' }}>Panel not found</p>
          <a href="./" style={{ fontSize: '11px', color: '#f59e0b', textDecoration: 'underline' }}>Open full dashboard</a>
        </div>
      );
  }
}

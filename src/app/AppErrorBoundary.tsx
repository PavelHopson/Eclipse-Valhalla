import React from 'react';

interface AppErrorBoundaryState {
  error: Error | null;
}

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

const VALHALLA_STORAGE_PREFIXES = [
  'eclipse_',
  'lumina_',
  'reminders_',
  'notes_',
  'routines_',
  'workout_',
];

function resetValhallaStorage(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && VALHALLA_STORAGE_PREFIXES.some((p) => key.startsWith(p))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error('[Eclipse Valhalla] Fatal:', error);
  }

  render() {
    if (this.state.error) {
      const isRussian = navigator.language?.startsWith('ru');
      return (
        <div
          style={{
            background: '#0A0A0F',
            color: '#E8E8F0',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter,sans-serif',
            padding: 32,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Eclipse Valhalla</h1>
          <p style={{ color: '#FF4444', marginBottom: 16 }}>
            {isRussian ? 'Ошибка системы.' : 'System error.'}
          </p>
          <p
            style={{
              color: '#55556A',
              fontSize: 12,
              marginBottom: 24,
              maxWidth: 400,
              textAlign: 'center',
            }}
          >
            {String(this.state.error?.message || '')}
          </p>
          <button
            onClick={() => {
              resetValhallaStorage();
              window.location.href = '/';
            }}
            style={{
              background: '#5DAEFF',
              color: '#0A0A0F',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 12,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {isRussian ? 'Сброс и перезагрузка' : 'Reset & Reload'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

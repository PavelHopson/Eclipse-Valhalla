/**
 * Eclipse Valhalla — Update Notification
 * Shows a banner when a new version is available on GitHub
 */
import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw, Check } from 'lucide-react';
import { useLanguage } from '../i18n';

type UpdateState = 'idle' | 'available' | 'downloading' | 'ready';

const UpdateNotification: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [state, setState] = useState<UpdateState>('idle');
  const [version, setVersion] = useState('');
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const valhalla = (window as any).valhalla;
    if (!valhalla) return;

    valhalla.onUpdateAvailable?.((data: any) => {
      setVersion(data.version);
      setState('available');
    });

    valhalla.onUpdateProgress?.((data: any) => {
      setState('downloading');
      setProgress(data.percent || 0);
    });

    valhalla.onUpdateDownloaded?.((data: any) => {
      setVersion(data.version);
      setState('ready');
    });
  }, []);

  if (state === 'idle' || dismissed) return null;

  const handleInstall = () => {
    (window as any).valhalla?.installUpdate?.();
  };

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-top-4 duration-500"
      style={{ maxWidth: '420px', width: '90%' }}>
      <div className="rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#1A1A26', border: '1px solid #2A2A3C', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>

        {/* Progress bar for downloading */}
        {state === 'downloading' && (
          <div className="h-1" style={{ backgroundColor: '#0A0A0F' }}>
            <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #5DAEFF, #4ADE80)' }} />
          </div>
        )}

        <div className="px-4 py-3 flex items-center gap-3">
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: state === 'ready' ? '#4ADE8015' : '#5DAEFF15',
              border: `1px solid ${state === 'ready' ? '#4ADE8030' : '#5DAEFF30'}`,
            }}>
            {state === 'downloading' ? (
              <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#5DAEFF' }} />
            ) : state === 'ready' ? (
              <Check className="w-4 h-4" style={{ color: '#4ADE80' }} />
            ) : (
              <Download className="w-4 h-4" style={{ color: '#5DAEFF' }} />
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#F2F1EE]">
              {state === 'available' && (isRu ? `Доступно обновление v${version}` : `Update v${version} available`)}
              {state === 'downloading' && (isRu ? `Загрузка v${version}... ${progress}%` : `Downloading v${version}... ${progress}%`)}
              {state === 'ready' && (isRu ? `v${version} готово к установке` : `v${version} ready to install`)}
            </p>
            <p className="text-[10px] text-[#55556A]">
              {state === 'available' && (isRu ? 'Загрузка начнётся автоматически' : 'Download will start automatically')}
              {state === 'downloading' && (isRu ? 'Не закрывайте приложение' : 'Keep the app running')}
              {state === 'ready' && (isRu ? 'Перезапустите для обновления' : 'Restart to update')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {state === 'ready' && (
              <button onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ backgroundColor: '#4ADE80', color: '#0A0A0F' }}>
                {isRu ? 'Перезапуск' : 'Restart'}
              </button>
            )}
            <button onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg text-[#55556A] hover:text-[#B4B0A7] transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;

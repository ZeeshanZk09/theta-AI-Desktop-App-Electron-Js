import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Check, RefreshCw } from 'lucide-react';

const electronAPI = (window as any).electronAPI;

interface UpdateInfo {
  version: string;
  releaseDate?: string;
}

interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

type UpdateState = 'idle' | 'available' | 'downloading' | 'ready';

const UpdateNotification: React.FC = () => {
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  // Helper to compare semver (Remote > Current)
  const isVersionNewer = (remote: string, current: string) => {
    if (!remote || !current) return false;
    // Strip 'v' prefix if present
    const r = remote.replace('v', '').split('.').map(Number);
    const c = current.replace('v', '').split('.').map(Number);

    for (let i = 0; i < Math.max(r.length, c.length); i++) {
      const rVal = r[i] || 0;
      const cVal = c[i] || 0;
      if (rVal > cVal) return true;
      if (rVal < cVal) return false;
    }
    return false;
  };

  useEffect(() => {
    console.log('UpdateNotification Component Mounted');

    // Get current app version
    electronAPI?.getAppVersion().then((version: string) => {
      console.log('Current App Version:', version);
      setCurrentVersion(version);
    });

    // Listen for debug logs from Main process
    if (electronAPI?.onUpdateLog) {
      electronAPI.onUpdateLog((message: string) => {
        console.log('%c[AutoUpdate Main Log]:', 'color: cyan', message);
      });
    }

    // Listen for update events (Natively handled by electron-updater, usually reliable)
    const unsubAvailable = electronAPI?.onUpdateAvailable((info: UpdateInfo) => {
      console.log('EVENT RECEIVED: Update available:', info);
      setUpdateInfo(info);
      setUpdateState('available');
      setIsExpanded(true);
    });

    const unsubProgress = electronAPI?.onUpdateDownloadProgress((progress: DownloadProgress) => {
      console.log('EVENT RECEIVED: Download progress:', progress);
      setDownloadProgress(progress);
    });

    const unsubDownloaded = electronAPI?.onUpdateDownloaded(() => {
      console.log('EVENT RECEIVED: Update downloaded');
      setUpdateState('ready');
      setDownloadProgress(null);
    });

    // MANUALLY CHECK FOR UPDATE ON MOUNT
    // Now using proper version comparison logic
    console.log('Invoking manual check-for-update from UI...');
    electronAPI
      ?.checkForUpdate()
      .then((res: any) => {
        console.log('Manual check result:', res);
        if (res && res.success && res.version) {
          electronAPI?.getAppVersion().then((currentVer: string) => {
            // FIX: Only show if Remote Version is GREATER than Current Version
            if (isVersionNewer(res.version, currentVer)) {
              console.log(`Update confirmed: ${res.version} is newer than ${currentVer}`);
              setUpdateInfo({ version: res.version });
              setUpdateState('available');
              setIsExpanded(true);
            } else {
              console.log(`No valid update: ${res.version} is not newer than ${currentVer}`);
            }
          });
        }
      })
      .catch((err: any) => console.error('Manual check error:', err));

    return () => {
      unsubAvailable?.();
      unsubProgress?.();
      unsubDownloaded?.();
    };
  }, []);

  const handleDownload = async () => {
    setUpdateState('downloading');
    await electronAPI?.downloadUpdate();
  };

  const handleInstall = async () => {
    await electronAPI?.installUpdate();
  };

  const handleDismiss = () => {
    setIsExpanded(false);
  };

  // Don't render anything if no update
  if (updateState === 'idle') return null;

  return (
    <>
      {/* Compact Badge - Always visible when update available */}
      {!isExpanded &&
        (updateState === 'available' ||
          updateState === 'downloading' ||
          updateState === 'ready') && (
          <button
            onClick={() => setIsExpanded(true)}
            className='flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                     bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 
                     border border-emerald-500/30 text-emerald-400
                     hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]
                     transition-all duration-300 animate-pulse'
          >
            <Download size={12} />
            Update v{updateInfo?.version}
          </button>
        )}

      {/* Expanded Notification Panel - Portal to Document Body to ensure it's on top of everything */}
      {isExpanded &&
        createPortal(
          <div
            className='fixed top-20 right-6 z-[9999] w-80 
                        bg-j-surface/95 backdrop-blur-xl rounded-xl 
                        border border-white/10 shadow-2xl
                        animate-in slide-in-from-top-2 duration-300'
          >
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-white/5'>
              <div className='flex items-center gap-3'>
                <div
                  className='w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 
                              flex items-center justify-center border border-emerald-500/30'
                >
                  {updateState === 'ready' ? (
                    <Check size={20} className='text-emerald-400' />
                  ) : updateState === 'downloading' ? (
                    <RefreshCw size={20} className='text-cyan-400 animate-spin' />
                  ) : (
                    <Download size={20} className='text-emerald-400' />
                  )}
                </div>
                <div>
                  <p className='text-sm font-semibold text-white'>
                    {updateState === 'ready'
                      ? 'Ready to Install'
                      : updateState === 'downloading'
                        ? 'Downloading...'
                        : 'Update Available'}
                  </p>
                  <p className='text-xs text-j-text-secondary'>
                    v{currentVersion} → v{updateInfo?.version}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className='p-1.5 rounded-lg hover:bg-white/5 text-j-text-secondary 
                         hover:text-white transition-colors'
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className='p-4 space-y-4'>
              {/* Progress Bar - Show during download */}
              {updateState === 'downloading' && downloadProgress && (
                <div className='space-y-2'>
                  <div className='h-2 bg-j-void rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-emerald-500 to-cyan-500 
                               transition-all duration-300 rounded-full
                               shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      style={{ width: `${downloadProgress.percent}%` }}
                    />
                  </div>
                  <div className='flex justify-between text-xs text-j-text-secondary'>
                    <span>{downloadProgress.percent}%</span>
                    <span>
                      {(downloadProgress.transferred / 1024 / 1024).toFixed(1)} /
                      {(downloadProgress.total / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex gap-2'>
                {updateState === 'available' && (
                  <>
                    <button
                      onClick={handleDismiss}
                      className='flex-1 px-4 py-2.5 rounded-lg text-sm font-medium
                               bg-white/5 hover:bg-white/10 text-j-text-secondary
                               hover:text-white transition-colors'
                    >
                      Later
                    </button>
                    <button
                      onClick={handleDownload}
                      className='flex-1 px-4 py-2.5 rounded-lg text-sm font-medium
                               bg-gradient-to-r from-emerald-500 to-cyan-500
                               hover:from-emerald-400 hover:to-cyan-400
                               text-white shadow-lg hover:shadow-emerald-500/25
                               transition-all duration-300'
                    >
                      Download Now
                    </button>
                  </>
                )}

                {updateState === 'ready' && (
                  <button
                    onClick={handleInstall}
                    className='w-full px-4 py-2.5 rounded-lg text-sm font-medium
                             bg-gradient-to-r from-emerald-500 to-cyan-500
                             hover:from-emerald-400 hover:to-cyan-400
                             text-white shadow-lg hover:shadow-emerald-500/25
                             transition-all duration-300 flex items-center justify-center gap-2'
                  >
                    <RefreshCw size={16} />
                    Install & Restart
                  </button>
                )}
              </div>

              {/* Info Text */}
              <p className='text-xs text-j-text-secondary text-center'>
                {updateState === 'ready'
                  ? 'Update downloaded. Click to install and restart.'
                  : updateState === 'downloading'
                    ? 'Please wait while the update downloads...'
                    : 'A new version of Theta AI is available.'}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default UpdateNotification;

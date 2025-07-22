import { usePWA } from '../Hooks/usePWA';

export default function PWADebug() {
  const {
    status,
    canInstall,
    isInstalled,
    serviceWorkerReady,
    resetInstallPrompt,
  } = usePWA();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className='bg-gray-100 border border-gray-300 rounded p-4 mb-4 text-xs'>
      <h4 className='font-bold mb-2'>PWA Debug Info:</h4>
      <div className='space-y-1'>
        <div>Service Worker Ready: {serviceWorkerReady ? '✅' : '❌'}</div>
        <div>Can Install: {canInstall ? '✅' : '❌'}</div>
        <div>Is Installed: {isInstalled ? '✅' : '❌'}</div>
        <div>Is Online: {status.isOnline ? '✅' : '❌'}</div>
        <div>Last Sync: {status.lastSync?.toLocaleString() || 'Never'}</div>
        <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
        <div>Protocol: {window.location.protocol}</div>
        <div>Host: {window.location.host}</div>
      </div>
      <div className='mt-3 pt-3 border-t border-gray-300'>
        <button
          onClick={resetInstallPrompt}
          className='text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200'
        >
          Reset Install Prompt
        </button>
      </div>
    </div>
  );
}

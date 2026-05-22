importScripts('../config.js', '../lib/cache.js');

const SYNC_ALARM = 'syncCache';
const SYNC_INTERVAL_MINUTES = 360;

async function backgroundSync () {
  const result = await syncCache();
  if (result.success) {
    console.log('[BG] Cache synced:', result.total, 'companies');
  } else {
    console.error('[BG] Cache sync failed:', result.error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: SYNC_INTERVAL_MINUTES });
  backgroundSync();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM) {
    backgroundSync();
  }
});

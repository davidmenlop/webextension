importScripts('../config.js');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[BG] HubSpot Company Search extension installed');
});

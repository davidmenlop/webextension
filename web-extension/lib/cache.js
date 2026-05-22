const CACHE_KEY = 'companyCache';

function isCacheValid (cacheData) {
  if (!cacheData || !cacheData.syncedAt) return false;
  const ttlMs = (CONFIG.CACHE_TTL_HOURS || 24) * 60 * 60 * 1000;
  return (Date.now() - cacheData.syncedAt) < ttlMs;
}

async function getCache () {
  try {
    const data = await chrome.storage.local.get(CACHE_KEY);
    const cacheData = data[CACHE_KEY];
    if (isCacheValid(cacheData)) {
      return { valid: true, companies: cacheData.companies, total: cacheData.total, syncedAt: cacheData.syncedAt };
    }
    return { valid: false, companies: cacheData ? cacheData.companies : [], total: cacheData ? cacheData.total : 0, syncedAt: cacheData ? cacheData.syncedAt : null };
  } catch (err) {
    console.error('[Cache] Read error:', err);
    return { valid: false, companies: [], total: 0 };
  }
}

async function setCache (companies, total) {
  try {
    await chrome.storage.local.set({
      [CACHE_KEY]: {
        companies,
        total,
        syncedAt: Date.now()
      }
    });
    return true;
  } catch (err) {
    console.error('[Cache] Write error:', err);
    return false;
  }
}

async function syncCache () {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(CONFIG.BACKEND_URL + '/api/v1/web-extension/companies/all', {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    await setCache(data.companies, data.total);
    return { success: true, companies: data.companies, total: data.total };
  } catch (err) {
    clearTimeout(timeout);
    console.error('[Cache] Sync error:', err);
    return { success: false, error: err.message };
  }
}

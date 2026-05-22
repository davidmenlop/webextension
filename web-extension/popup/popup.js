const searchInput = document.getElementById('search');
const resultsList = document.getElementById('results');
const resultsContainer = document.getElementById('results-container');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const emptyEl = document.getElementById('empty');
const cacheBadge = document.getElementById('cache-badge');

let companies = [];
let selectedIndex = -1;

function setCacheBadge (state) {
  cacheBadge.className = state;
  const titles = {
    valid: 'Caché sincronizado',
    invalid: 'Caché expirado — sincronizando...',
    error: 'Error de sincronización'
  };
  cacheBadge.title = titles[state] || '';
}

function showLoading () {
  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  emptyEl.classList.add('hidden');
  resultsContainer.style.display = 'none';
}

function showError (msg) {
  loadingEl.classList.add('hidden');
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
  emptyEl.classList.add('hidden');
  resultsContainer.style.display = 'none';
}

function showResults () {
  loadingEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  resultsContainer.style.display = '';
}

function showEmpty () {
  loadingEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  emptyEl.classList.remove('hidden');
  resultsContainer.style.display = 'none';
}

function sendCodCliente (codCliente) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'fillCodCliente',
      value: codCliente
    }, () => {
      window.close();
    });
  });
}

function highlightText (text, term) {
  if (!term) return text;
  const normText = normalize(text);
  const normTerm = normalize(term);
  const idx = normText.indexOf(normTerm);
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + normTerm.length);
  const after = text.slice(idx + normTerm.length);
  return before + '<span class="highlight">' + match + '</span>' + after;
}

function renderResults (results) {
  resultsList.innerHTML = '';
  selectedIndex = -1;

  if (!results || results.length === 0) {
    showEmpty();
    return;
  }

  showResults();

  const term = searchInput.value.trim();

  results.forEach((company) => {
    const li = document.createElement('li');
    li.dataset.codCliente = company.cod_cliente || '';

    const codSpan = document.createElement('span');
    codSpan.className = 'item-cod';
    codSpan.innerHTML = highlightText(company.cod_cliente || 'Sin codigo', term) || 'Sin codigo';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'item-name';
    nameSpan.innerHTML = highlightText(company.name || 'Sin nombre', term) || 'Sin nombre';

    li.appendChild(codSpan);
    li.appendChild(nameSpan);
    li.addEventListener('click', () => {
      sendCodCliente(company.cod_cliente || '');
    });

    resultsList.appendChild(li);
  });
}

function moveSelection (direction) {
  const items = resultsList.querySelectorAll('li');
  if (items.length === 0) return;

  items.forEach((li) => li.classList.remove('active'));

  if (direction === 'down') {
    selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
  } else if (direction === 'up') {
    selectedIndex = Math.max(selectedIndex - 1, 0);
  }

  const activeItem = items[selectedIndex];
  if (activeItem) {
    activeItem.classList.add('active');
    activeItem.scrollIntoView({ block: 'nearest' });
  }
}

let debounceTimer = null;

searchInput.addEventListener('input', () => {
  const term = searchInput.value;
  if (!term || !term.trim()) {
    clearTimeout(debounceTimer);
    if (companies.length > 0) {
      renderResults(companies.slice(0, CONFIG.MAX_RESULTS));
    } else {
      resultsList.innerHTML = '';
      emptyEl.classList.add('hidden');
      resultsContainer.style.display = 'none';
    }
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const results = fuzzySearch(term, companies, {
      tolerance: CONFIG.FUZZY_TOLERANCE,
      maxResults: CONFIG.MAX_RESULTS
    });
    renderResults(results);
  }, CONFIG.DEBOUNCE_MS || 150);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveSelection('down');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveSelection('up');
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const items = resultsList.querySelectorAll('li');
    if (selectedIndex >= 0 && items[selectedIndex]) {
      sendCodCliente(items[selectedIndex].dataset.codCliente);
    }
  }
});

async function init () {
  showLoading();
  setCacheBadge('invalid');

  const cache = await getCache();

  if (cache.valid && cache.companies.length > 0) {
    companies = cache.companies;
    setCacheBadge('valid');
    renderResults(companies.slice(0, CONFIG.MAX_RESULTS));
    return;
  }

  const result = await syncCache();

  if (result.success) {
    const freshCache = await getCache();
    companies = freshCache.companies;
    setCacheBadge('valid');
    renderResults(companies.slice(0, CONFIG.MAX_RESULTS));
  } else {
    if (cache.companies.length > 0) {
      companies = cache.companies;
      setCacheBadge('invalid');
      renderResults(companies.slice(0, CONFIG.MAX_RESULTS));
    } else {
      setCacheBadge('error');
      showError('No se pudo sincronizar. Verifica la conexión.');
    }
  }
}

document.addEventListener('DOMContentLoaded', init);

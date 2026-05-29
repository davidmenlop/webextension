const searchInput = document.getElementById('search');
const resultsList = document.getElementById('results');
const resultsContainer = document.getElementById('results-container');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const emptyEl = document.getElementById('empty');

let selectedIndex = -1;

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

function sendCodCliente (codCliente, name) {
  console.log('[Popup] sendCodCliente:', codCliente, '|', name);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('[Popup] tabs:', tabs.length);
    if (!tabs[0]) {
      console.log('[Popup] No tab activa');
      return;
    }
    console.log('[Popup] Enviando a tab', tabs[0].id);
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'fillCodCliente',
      codCliente: codCliente,
      name: name
    }, (response) => {
      console.log('[Popup] Respuesta:', response);
      window.close();
    });
  });
}

function normalize (str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function highlightText (text, term) {
  if (!term) return text;
  var normText = normalize(text);
  var normTerm = normalize(term);
  var idx = normText.indexOf(normTerm);
  if (idx === -1) return text;
  return text.slice(0, idx) +
    '<span class="highlight">' + text.slice(idx, idx + normTerm.length) + '</span>' +
    text.slice(idx + normTerm.length);
}

function renderResults (results, term) {
  resultsList.innerHTML = '';
  selectedIndex = -1;

  if (!results || results.length === 0) {
    showEmpty();
    return;
  }

  results.forEach(function (company) {
    var li = document.createElement('li');
    li.dataset.codCliente = company.cod_cliente || '';
    li.dataset.name = company.name || '';
    li.innerHTML =
      '<span class="company-name">' + highlightText(company.name, term) + '</span>' +
      '<span class="company-cod">' + (company.cod_cliente ? 'COD: ' + highlightText(company.cod_cliente, term) : '') + '</span>';

    li.addEventListener('click', function () {
      sendCodCliente(company.cod_cliente, company.name);
    });

    resultsList.appendChild(li);
  });

  showResults();
}

var abortController = null;

async function doSearch (term) {
  if (abortController) abortController.abort();
  abortController = new AbortController();

  showLoading();
  try {
    var url = CONFIG.BACKEND_URL + '/api/v1/web-extension/companies/search?q=' + encodeURIComponent(term);
    var response = await fetch(url, { signal: abortController.signal });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    var data = await response.json();
    renderResults(data.results, term);
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('[Search] Error:', err);
    showError('Error al buscar. Verifica la conexion.');
  }
}

var debounceTimer = null;

searchInput.addEventListener('input', function () {
  var term = searchInput.value.trim();
  if (!term) {
    clearTimeout(debounceTimer);
    if (abortController) abortController.abort();
    resultsList.innerHTML = '';
    showEmpty();
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function () {
    doSearch(term);
  }, CONFIG.DEBOUNCE_MS || 300);
});

searchInput.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveSelection('down');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveSelection('up');
  } else if (e.key === 'Enter') {
    e.preventDefault();
    var items = resultsList.querySelectorAll('li');
    if (selectedIndex >= 0 && items[selectedIndex]) {
      sendCodCliente(items[selectedIndex].dataset.codCliente, items[selectedIndex].dataset.name);
    }
  }
});

function moveSelection (direction) {
  var items = resultsList.querySelectorAll('li');
  if (items.length === 0) return;

  items.forEach(function (li) { li.classList.remove('active'); });

  if (direction === 'down') {
    selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
  } else if (direction === 'up') {
    selectedIndex = Math.max(selectedIndex - 1, 0);
  }

  var activeItem = items[selectedIndex];
  if (activeItem) {
    activeItem.classList.add('active');
    activeItem.scrollIntoView({ block: 'nearest' });
  }
}

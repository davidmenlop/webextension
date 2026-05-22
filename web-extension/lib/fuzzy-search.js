function normalize (str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function levenshtein (a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[n];
}

function score (term, company, tolerance) {
  const normName = normalize(company.name);
  const normCod = normalize(company.cod_cliente || '');
  const normTerm = normalize(term);

  let bestScore = Infinity;
  let matchType = 'none';

  const checkField = (field, fieldName) => {
    if (!field) return;

    if (field === normTerm) {
      if (bestScore > 0) { bestScore = 0; matchType = 'exact'; }
      return;
    }
    if (field.startsWith(normTerm)) {
      const s = 1;
      if (bestScore > s) { bestScore = s; matchType = 'prefix-' + fieldName; }
      return;
    }
    if (field.includes(normTerm)) {
      const s = 5;
      if (bestScore > s) { bestScore = s; matchType = 'contains-' + fieldName; }
      return;
    }

    const dist = levenshtein(normTerm, field);
    if (dist <= tolerance && dist < bestScore) {
      bestScore = dist;
      matchType = 'fuzzy-' + fieldName;
    }
  };

  checkField(normName, 'name');
  checkField(normCod, 'cod_cliente');

  return { score: bestScore, matchType };
}

function fuzzySearch (term, companies, options = {}) {
  const tolerance = options.tolerance || 2;
  const maxResults = options.maxResults || 20;

  if (!term || !term.trim()) return [];

  const results = companies
    .map((company) => {
      const { score: s, matchType } = score(term, company, tolerance);
      return { company, score: s, matchType };
    })
    .filter((r) => r.score < Infinity)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return (a.company.name || '').localeCompare(b.company.name || '');
    })
    .slice(0, maxResults)
    .map((r) => r.company);

  return results;
}

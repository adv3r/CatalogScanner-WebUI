// ── Drag & drop ────────────────────────────────────────────
const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileNameEl = document.getElementById('file-name');

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    fileNameEl.textContent = t('file_prefix') + fileInput.files[0].name;
  }
});
fileInput.addEventListener('change', () => {
  fileNameEl.textContent = fileInput.files.length ? t('file_prefix') + fileInput.files[0].name : '';
});

// ── Form submit ────────────────────────────────────────────
const form      = document.getElementById('scan-form');
const scanBtn   = document.getElementById('scan-btn');
const errorBox  = document.getElementById('error-box');
const progressW = document.getElementById('progress-wrap');
const fillEl    = document.getElementById('progress-fill');
const resultsEl = document.getElementById('results');

form.addEventListener('submit', async e => {
  e.preventDefault();
  errorBox.innerHTML = '';
  resultsEl.style.display = 'none';
  scanBtn.disabled = true;
  progressW.style.display = 'block';
  animateProgress();

  const data = new FormData(form);
  if (!document.getElementById('for-sale').checked) {
    data.set('for_sale', 'false');
  }

  try {
    const resp = await fetch('/scan', { method: 'POST', body: data });
    const json = await resp.json();
    stopProgress();
    if (!resp.ok || json.error) { showError(json.error || t('error_unknown')); return; }
    renderResults(json);
  } catch (err) {
    stopProgress();
    showError(t('error_network') + err.message);
  } finally {
    scanBtn.disabled = false;
  }
});

// ── Progress animation ─────────────────────────────────────
let progressInterval = null;
let progressValue = 0;

function animateProgress() {
  progressValue = 0;
  fillEl.style.width = '0%';
  progressInterval = setInterval(() => {
    if (progressValue < 90) {
      progressValue += (90 - progressValue) * 0.03;
      fillEl.style.width = progressValue.toFixed(1) + '%';
    }
  }, 200);
}

function stopProgress() {
  clearInterval(progressInterval);
  fillEl.style.width = '100%';
  setTimeout(() => { progressW.style.display = 'none'; fillEl.style.width = '0%'; }, 700);
}

// ── Error display ──────────────────────────────────────────
function showError(msg) {
  errorBox.innerHTML = `<div class="alert alert-error">⚠️ <span>${escapeHtml(msg)}</span></div>`;
}

// ── Render results ─────────────────────────────────────────
let allItems = [];
let _lastUnmatched = [];

function renderResults(data) {
  allItems = data.items || [];
  document.getElementById('meta-mode').textContent   = data.mode   || '—';
  document.getElementById('meta-locale').textContent = data.locale || '—';
  document.getElementById('result-count').textContent = t('result_count', allItems.length);
  renderTable(allItems);

  _lastUnmatched = data.unmatched || [];
  renderUnmatched(_lastUnmatched);

  resultsEl.style.display = 'block';
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderTable(items) {
  const tbody = document.getElementById('result-tbody');
  tbody.innerHTML = items.length === 0
    ? `<tr><td colspan="2" class="results-table__empty-cell">${t('no_items')}</td></tr>`
    : items.map((item, i) =>
        `<tr><td class="results-table__num-cell">${i + 1}</td><td>${escapeHtml(item)}</td></tr>`
      ).join('');
  document.getElementById('result-count').textContent = t('result_count', items.length);
}

// ── Filter ─────────────────────────────────────────────────
document.getElementById('search-box').addEventListener('input', function () {
  const q = this.value.toLowerCase().trim();
  renderTable(q ? allItems.filter(i => i.toLowerCase().includes(q)) : allItems);
});

// ── Copy ───────────────────────────────────────────────────
document.getElementById('copy-btn').addEventListener('click', async () => {
  if (!allItems.length) return;
  await navigator.clipboard.writeText(allItems.join('\n')).catch(() => null);
  const btn = document.getElementById('copy-btn');
  btn.textContent = t('btn_copy_done');
  setTimeout(() => btn.textContent = t('btn_copy'), 2200);
});

// ── Export .txt ─────────────────────────────────────────────
document.getElementById('export-btn').addEventListener('click', () => {
  if (!allItems.length) return;
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([allItems.join('\n')], { type: 'text/plain' })),
    download: 'catalog_items.txt',
  });
  a.click();
});
// ── Unmatched section ──────────────────────────────────
function renderUnmatched(unmatched) {
  const unmatchedWrap = document.getElementById('unmatched-wrap');
  if (unmatched && unmatched.length > 0) {
    unmatchedWrap.innerHTML = `
      <details class="unmatched">
        <summary class="unmatched__summary">${t('unmatched_summary', unmatched.length)}</summary>
        <div class="unmatched__list">${unmatched.map(escapeHtml).join('<br/>')}</div>
      </details>`;
  } else {
    unmatchedWrap.innerHTML = '';
  }
}

// ── Re-render dynamic content on language change ───────
document.addEventListener('langchange', () => {
  if (document.getElementById('results').style.display !== 'none') {
    const q = document.getElementById('search-box').value.toLowerCase().trim();
    renderTable(q ? allItems.filter(i => i.toLowerCase().includes(q)) : allItems);
    renderUnmatched(_lastUnmatched);
  }
});
// ── Helpers ─────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

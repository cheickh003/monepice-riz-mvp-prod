/*
  Script: Reprice products from PDF and split by category
  - Reads: lib/data/products.json (current), PRODUITS.xlsx (sheets), PRODUIT MONEPICERIZ VENTE EN LIGNE.pdf
  - Outputs:
    - reports/ecarts-prix.csv
    - reports/matching-issues.csv
    - reports/coverage.json
    - lib/data/products/<category>.json (split files)
    - lib/data/products/index.ts (aggregator importing split files)
    - lib/data/categories.json (updated productCount)
*/

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');
const { PdfReader } = require('pdfreader');

const ROOT = process.cwd();
const PRODUCTS_JSON = path.join(ROOT, 'lib', 'data', 'products.json');
const CATEGORIES_JSON = path.join(ROOT, 'lib', 'data', 'categories.json');
// Support CLI args: --excel <path>, --pdf <path>
const argv = process.argv.slice(2);
function getArg(flag) {
  const i = argv.findIndex(a => a === flag || a.startsWith(flag + '='));
  if (i === -1) return undefined;
  const eq = argv[i].indexOf('=');
  if (eq !== -1) return argv[i].slice(eq + 1);
  return argv[i + 1];
}
const EXCEL_ARG = getArg('--excel');
const PDF_ARG = getArg('--pdf');
const EXCEL_FILE = EXCEL_ARG ? path.resolve(ROOT, EXCEL_ARG) : path.join(ROOT, 'PRODUITS.xlsx');
const DEFAULT_PDF_CANDIDATES = [
  path.join(ROOT, 'PRODUITS.pdf'),
  path.join(ROOT, 'PRODUIT MONEPICERIZ VENTE EN LIGNE.pdf'),
];
const PDF_FILE = PDF_ARG ? path.resolve(ROOT, PDF_ARG) : (DEFAULT_PDF_CANDIDATES.find(f => fs.existsSync(f)) || DEFAULT_PDF_CANDIDATES[0]);
const REPORTS_DIR = path.join(ROOT, 'reports');
const SPLIT_DIR = path.join(ROOT, 'lib', 'data', 'products');
const MIN_PRICE = 50;
const MAX_PRICE = 500000;

/** Utils **/
const deburr = (str) => (
  (str || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
);

const norm = (str) => deburr(String(str || ''))
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, ' ') // keep letters, numbers, spaces
  .replace(/\s+/g, ' ') // collapse spaces
  .trim();

const extractNumber = (s) => {
  if (!s) return null;
  // Match numbers like 8 000, 12.500, 8000 optionally followed by F / F CFA
  const m = String(s).match(/(\d{1,3}(?:[ .]\d{3})+|\d+)(?=\s*(?:F(?:\s*CFA)?)?\b|\b)/);
  if (!m) return null;
  const num = m[1].replace(/[ .]/g, '');
  const n = parseInt(num, 10);
  return Number.isFinite(n) ? n : null;
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/** Read JSON data **/
function readJson(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

// Load base product list from split dir if present, else products.json
function loadBaseProducts() {
  if (fs.existsSync(SPLIT_DIR)) {
    const files = fs.readdirSync(SPLIT_DIR).filter(f => f.endsWith('.json') && f !== 'index.ts');
    let all = [];
    for (const f of files) {
      const p = path.join(SPLIT_DIR, f);
      try {
        const arr = readJson(p);
        if (Array.isArray(arr)) all = all.concat(arr);
      } catch {}
    }
    if (all.length > 0) return all;
  }
  return readJson(PRODUCTS_JSON);
}

/** Markdown extraction (bullet lines containing ref, barcode, name, F <HT> F <TTC>) **/
function extractMarkdownPrices(mdPath) {
  if (!fs.existsSync(mdPath)) {
    return { priceByName: new Map(), priceByRef: new Map(), priceByBarcode: new Map(), rows: [] };
  }
  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const priceByName = new Map();
  const priceByRef = new Map();
  const priceByBarcode = new Map();
  const rows = [];
  for (const line of lines) {
    const l = line.trim();
    if (!l.startsWith('- ')) continue;
    // drop bullet prefix
    let body = l.replace(/^-[\s]+/, '');
    // split into tokens to remove 2 first tokens (ref, barcode) if present
    const toks = body.split(/\s+/);
    let idx = 0;
    const looksId = (t) => /^[a-z0-9]{2,}$/i.test(t);
    const refTok = toks[idx] && looksId(toks[idx]) ? toks[idx++] : '';
    const barcodeTok = toks[idx] && looksId(toks[idx]) ? toks[idx++] : '';
    body = toks.slice(idx).join(' ');

    // Find TTC: prefer pattern 'F <num>' and take the last occurrence
    const fThenNum = Array.from(body.matchAll(/\bF\s+(\d{1,3}(?:[ .]\d{3})+|\d+)\b/g)).map(m => m[1]);
    const numThenF = Array.from(body.matchAll(/\b(\d{1,3}(?:[ .]\d{3})+|\d+)\s*F\b/g)).map(m => m[1]);
    let price = null;
    if (fThenNum.length) price = parseInt(fThenNum[fThenNum.length - 1].replace(/[ .]/g, ''), 10);
    else if (numThenF.length) price = parseInt(numThenF[numThenF.length - 1].replace(/[ .]/g, ''), 10);
    if (!(Number.isFinite(price) && price >= MIN_PRICE && price <= MAX_PRICE)) {
      continue;
    }

    // Extract name: text before the first currency segment
    const fPos = body.search(/\bF\s+\d/);
    const nfPos = body.search(/\d+\s*F\b/);
    let cutPos = -1;
    if (fPos >= 0 && nfPos >= 0) cutPos = Math.min(fPos, nfPos);
    else cutPos = Math.max(fPos, nfPos);
    let name = cutPos >= 0 ? body.slice(0, cutPos) : body;
    name = name.replace(/[|]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    // Drop trailing units like '0' or measurement if they are at end before price
    name = name.replace(/\s+(?:[0-9]+(?:g|kg|cl|l|ml|gr)\b|0)\s*$/i, '').trim();
    if (!name) continue;

    const key = norm(name);
    if (!key) continue;
    if (!priceByName.has(key) || price > priceByName.get(key)) {
      priceByName.set(key, price);
    }
    // indexes by barcode / ref if they look plausible (numeric id-like)
    if (barcodeTok && /\d{6,}/.test(barcodeTok)) {
      priceByBarcode.set(barcodeTok, price);
    }
    if (refTok && /\d{6,}/.test(refTok)) {
      priceByRef.set(refTok, price);
    }
    rows.push({ name, price, ref: refTok, barcode: barcodeTok });
  }
  return { priceByName, priceByRef, priceByBarcode, rows };
}

/** Excel extraction (all sheets → flat list) **/
function parsePriceStr(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  // Examples: 'F 2 200', '2 200', 'F2200', 2200
  const m = s.match(/(\d{1,3}(?:[ .]\d{3})+|\d+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/[ .]/g, ''), 10);
}

function extractExcelIndex(excelPath) {
  if (!fs.existsSync(excelPath)) {
    return { sheets: [], rows: [], nameIndex: new Map() };
  }
  const wb = xlsx.readFile(excelPath);
  const sheets = wb.SheetNames;
  const rows = [];
  for (const name of sheets) {
    const ws = wb.Sheets[name];
    const aoa = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
    if (!Array.isArray(aoa) || aoa.length === 0) continue;
    // Find header row containing 'Nom' (and ideally 'Prix TTC')
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(10, aoa.length); r++) {
      const row = aoa[r].map(v => String(v).trim());
      const hasName = row.some(v => /^(nom|libell\w*|désignation|designation)$/i.test(v));
      const looksLikeHeader = row.some(v => /réf|ref/i.test(v)) && row.some(v => /barcode|code.?bar|ean/i.test(v));
      if (hasName && looksLikeHeader) { headerRowIdx = r; break; }
      if (hasName) { headerRowIdx = r; break; }
    }
    if (headerRowIdx === -1) {
      // As fallback, try the very first row
      headerRowIdx = 0;
    }
    const header = aoa[headerRowIdx].map(v => String(v).trim());
    const idxOf = (re) => header.findIndex(h => re.test(h));
    const idxName = idxOf(/^(nom|libell\w*|désignation|designation)$/i);
    const idxRef = idxOf(/réf|ref/i);
    const idxBarcode = idxOf(/barcode|code.?bar|ean/i);
    const idxPrixHT = idxOf(/prix\s*ht/i);
    const idxPrixTTC = idxOf(/prix\s*ttc|vente\s*ttc|pu\s*ttc/i);

    for (let r = headerRowIdx + 1; r < aoa.length; r++) {
      const row = aoa[r];
      if (!row || row.length === 0) continue;
      const nameVal = idxName >= 0 ? row[idxName] : '';
      const refVal = idxRef >= 0 ? row[idxRef] : '';
      const barcodeVal = idxBarcode >= 0 ? row[idxBarcode] : '';
      const htVal = idxPrixHT >= 0 ? row[idxPrixHT] : '';
      const ttcVal = idxPrixTTC >= 0 ? row[idxPrixTTC] : '';
      const name = String(nameVal || '').trim();
      // skip section titles (category rows): usually only first column filled or no name
      const nonEmptyCount = row.filter(v => String(v || '').trim() !== '').length;
      if (!name || nonEmptyCount <= 1) continue;
      rows.push({
        sheet: name,
        name,
        ref: String(refVal || '').trim(),
        barcode: String(barcodeVal || '').trim(),
        priceHT: parsePriceStr(htVal),
        priceTTC: parsePriceStr(ttcVal),
        raw: Object.fromEntries(header.map((h, i) => [h || `col_${i}`, row[i]])),
      });
    }
  }

  const nameIndex = new Map();
  const priceByName = new Map();
  for (const r of rows) {
    const key = norm(r.name);
    if (!key) continue;
    if (!nameIndex.has(key)) nameIndex.set(key, []);
    nameIndex.get(key).push(r);
    const price = r.priceTTC ?? r.priceHT;
    if (price != null && Number.isFinite(price)) {
      // prefer higher value if conflicting (TTc over HT typically)
      const prev = priceByName.get(key);
      if (prev == null || price > prev) priceByName.set(key, price);
    }
  }

  return { sheets, rows, nameIndex, priceByName };
}

/** PDF extraction **/
async function extractPdfText(pdfPath) {
  if (!fs.existsSync(pdfPath)) {
    throw new Error('PDF not found: ' + pdfPath);
  }
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(buffer);
  const text = data.text || '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return { text, lines };
}

// Approximate matching helpers
const STOPWORDS = new Set(['poisson','viande','de','du','des','le','la','les','en','ou','et','frais','fraiche','fraîche','entier','tranche','tranches','au','aux','a','à']);
function tokensSet(s) {
  const base = deburr(String(s||'').toLowerCase()).replace(/[^\p{L}\p{N}\s]/gu,' ');
  const parts = base.split(/\s+/).filter(t => t.length >= 3 && !STOPWORDS.has(t));
  return new Set(parts);
}
function packLike(text) {
  const s = String(text || '').toLowerCase();
  if (/\bpack\b|\bbte\b/.test(s)) return true;
  if (/\b(\d{1,2})\s*[xX]\s*\d+/.test(s)) return true; // 12x15cl
  if (/\b(\d{1,2})\s*[xX]\b/.test(s)) return true; // 6x
  return false;
}
function volumeMl(text) {
  const s = String(text || '').toLowerCase();
  const m = s.match(/(\d+(?:[\.,]\d+)?)\s*(ml|cl|l)\b/);
  if (!m) return null;
  let v = parseFloat(m[1].replace(',', '.'));
  if (!Number.isFinite(v)) return null;
  const unit = m[2];
  if (unit === 'l') return Math.round(v * 1000);
  if (unit === 'cl') return Math.round(v * 10);
  if (unit === 'ml') return Math.round(v);
  return null;
}
function overlapCount(aSet, bSet) {
  let c = 0; for (const t of aSet) if (bSet.has(t)) c++; return c;
}
function findApproxPriceByName(rows, productName, category) {
  if (!rows || rows.length === 0) return null;
  const a = tokensSet(productName);
  if (!['poissonnerie','boucherie','epices','boissons','volaille','petits-fumes','entretien','bebes','frais','sec'].includes(String(category||'').toLowerCase())) return null;
  const prodPack = packLike(productName);
  const prodVol = volumeMl(productName);
  const cands = [];
  for (const r of rows) {
    if (!r.name || r.price == null) continue;
    const b = tokensSet(r.name);
    const rowPack = packLike(r.name) || packLike(r.unit);
    const rowVol = (r.unit ? volumeMl(r.unit) : null) ?? volumeMl(r.name);
    const ov = overlapCount(a, b);
    if (ov < 1) continue;
    // Enforce pack consistency: if product mentions pack, require row pack-like; if not, avoid pack rows
    if (prodPack && !rowPack) continue;
    if (!prodPack && rowPack) continue;
    // If both have volume, require same volume (±5%)
    if (prodVol != null && rowVol != null) {
      const diff = Math.abs(prodVol - rowVol) / Math.max(prodVol, 1);
      if (diff > 0.05) continue;
    }
    cands.push({ r, ov });
  }
  if (cands.length === 0) return null;
  cands.sort((x,y) => y.ov - x.ov);
  const top = cands.filter(x => x.ov === cands[0].ov);
  if (top.length === 1) return top[0].r.price;
  const uniqPrices = new Set(top.map(x => x.r.price));
  if (uniqPrices.size === 1) return top[0].r.price;
  return null;
}

/** Extract price mapping from PDF using x/y coordinates per page **/
async function extractPdfTablePrices(pdfPath) {
  if (!fs.existsSync(pdfPath)) {
    return new Map();
  }
  const reader = new PdfReader();
  const pages = [];
  let current = [];
  function flushPage() {
    if (current.length) pages.push(current), (current = []);
  }
  await new Promise((resolve, reject) => {
    reader.parseFileItems(pdfPath, (err, item) => {
      if (err) return reject(err);
      if (!item) {
        flushPage();
        return resolve(null);
      }
      if (item.page) {
        flushPage();
      } else if (item.text) {
        current.push(item);
      }
    });
  });

  const rowsOut = [];
  const priceByName = new Map();
  const priceByRef = new Map();
  const priceByBarcode = new Map();
  const isPriceLike = (s) => /\b(?:F\s+(\d{1,3}(?:[ .]\d{3})+|\d+)|(\d{1,3}(?:[ .]\d{3})+|\d+)\s*F(?:\s*CFA)?)\b/i.test(String(s));
  const getLastPrice = (s) => {
    const arr = Array.from(String(s).matchAll(/\b(?:F\s+(\d{1,3}(?:[ .]\d{3})+|\d+)|(\d{1,3}(?:[ .]\d{3})+|\d+)\s*F(?:\s*CFA)?)\b/gi));
    if (!arr.length) return null;
    const last = arr[arr.length - 1];
    const raw = (last[1] || last[2] || '').replace(/[ .]/g, '');
    const val = parseInt(raw, 10);
    if (!Number.isFinite(val) || val < MIN_PRICE || val > MAX_PRICE) return null;
    return { value: val, index: last.index, length: last[0].length };
  };
  const isIdToken = (t) => /^[a-z0-9]{2,}$/i.test(String(t));

  for (const items of pages) {
    // Group by Y rows (tolerance)
    const rowsByY = new Map();
    const tolY = 1.5;
    for (const it of items) {
      const yKey = Math.round(it.y / tolY) * tolY;
      if (!rowsByY.has(yKey)) rowsByY.set(yKey, []);
      rowsByY.get(yKey).push(it);
    }
    const rowYs = Array.from(rowsByY.keys()).sort((a, b) => a - b);

    // Detect header row and column x positions
    let headerY = null;
    let cols = {};
    for (const y of rowYs.slice(0, 20)) { // search early rows for header
      const row = rowsByY.get(y).sort((a, b) => a.x - b.x);
      const texts = row.map(r => r.text.toLowerCase());
      const hasRef = texts.some(t => /réf\.?|ref\.?/.test(t));
      const hasBarcode = texts.some(t => /barcode|code\s*bar/.test(t));
      const hasNom = texts.some(t => /\bnom\b/.test(t));
      const hasPrix = texts.some(t => /ttc|prix\s*ttc/.test(t));
      if ((hasRef || hasBarcode) && hasNom && hasPrix) {
        headerY = y;
        for (const cell of row) {
          const t = cell.text.toLowerCase();
          if (/réf\.?|ref\.?/.test(t)) cols.ref = cell.x;
          else if (/barcode|code\s*bar/.test(t)) cols.barcode = cell.x;
          else if (/\bnom\b/.test(t)) cols.name = cell.x;
          else if (/unité|unite/.test(t)) cols.unit = cell.x;
          else if (/prix\s*ht|\bht\b/.test(t)) cols.ht = cell.x;
          else if (/ttc|prix\s*ttc/.test(t)) cols.ttc = cell.x;
        }
        break;
      }
    }

    const colKeys = Object.keys(cols).sort((a,b) => cols[a]-cols[b]);
    const hasColumns = colKeys.length >= 3 && cols.ttc != null;

    for (const y of rowYs) {
      const row = rowsByY.get(y).sort((a, b) => a.x - b.x);
      const pieces = row.map(r => r.text.trim()).filter(Boolean);
      const joined = pieces.join(' ').replace(/\s{2,}/g, ' ').trim();
      // Skip headings or section lines
      if (/^(catalogue\b|réf\.|barcode\b|nom\b|prix\b|ttc\b|ht\b)/i.test(joined)) continue;

      let refTok = '', barcodeTok = '', name = '', unit = '', price = null;

      if (hasColumns) {
        // Assign items to nearest column
        const buckets = {};
        for (const key of colKeys) buckets[key] = [];
        for (const cell of row) {
          let bestKey = null, bestDx = Infinity;
          for (const key of colKeys) {
            const dx = Math.abs(cell.x - cols[key]);
            if (dx < bestDx) { bestDx = dx; bestKey = key; }
          }
          if (bestKey) buckets[bestKey].push(cell.text.trim());
        }
        const refVal = (buckets.ref||[]).join(' ');
        const barcodeVal = (buckets.barcode||[]).join(' ');
        const nameVal = (buckets.name||[]).join(' ');
        const unitVal = (buckets.unit||[]).join(' ');
        const ttcVal = (buckets.ttc||[]).join(' ');
        refTok = refVal || '';
        barcodeTok = barcodeVal || '';
        name = (nameVal || '').trim();
        unit = (unitVal || '').trim();
        const last = getLastPrice(ttcVal || joined);
        price = last && last.value || null;
      } else {
        // Fallback row parsing
        const last = getLastPrice(joined);
        if (!last) continue;
        price = last.value;
        const before = joined.slice(0, last.index).trim();
        const toks = before.split(/\s+/);
        let i0 = 0;
        refTok = toks[i0] && isIdToken(toks[i0]) ? toks[i0++] : '';
        barcodeTok = toks[i0] && isIdToken(toks[i0]) ? toks[i0++] : '';
        name = toks.slice(i0).join(' ').replace(/\s{2,}/g, ' ').trim();
      }

      if (!name || name.length < 2 || price == null) continue;

      const key = norm(name);
      if (key) {
        if (!priceByName.has(key) || price > priceByName.get(key)) priceByName.set(key, price);
      }
      if (refTok) priceByRef.set(refTok, price);
      if (barcodeTok) priceByBarcode.set(barcodeTok, price);
      rowsOut.push({ name, unit, price, ref: refTok, barcode: barcodeTok, y, page: pages.indexOf(items) + 1 });
    }
  }
  return { priceByName, priceByRef, priceByBarcode, rows: rowsOut };
}

/** Find price near a product name within the PDF **/
function findPriceForName(pdfLines, targetName) {
  const key = norm(targetName);
  if (!key) return null;
  const windowAhead = 2; // scan same line + next 2 lines
  const minPrice = 100; // ignore tiny numbers likely to be volumes (e.g., 50 CL)
  for (let i = 0; i < pdfLines.length; i++) {
    const line = pdfLines[i];
    const lineNorm = norm(line);
    if (!lineNorm) continue;
    if (lineNorm.includes(key)) {
      // scan current + next N lines for price
      for (let j = i; j <= Math.min(i + windowAhead, pdfLines.length - 1); j++) {
        const s = pdfLines[j];
        // require currency marker in the same string
        const matches = Array.from(s.matchAll(/\b(?:F\s+(\d{1,3}(?:[ .]\d{3})+|\d+)|(\d{1,3}(?:[ .]\d{3})+|\d+)\s*F(?:\s*CFA)?)\b/gi));
        if (matches.length) {
          const last = matches[matches.length - 1];
          const numStr = (last[1] || last[2] || '').replace(/[ .]/g, '');
          const val = parseInt(numStr, 10);
          if (Number.isFinite(val) && val >= MIN_PRICE && val <= MAX_PRICE) return val;
        }
      }
    }
  }
  return null;
}

/** Main **/
(async () => {
  try {
    ensureDir(REPORTS_DIR);

    const products = loadBaseProducts();
    const categories = readJson(CATEGORIES_JSON);

    console.log('Using Excel:', EXCEL_FILE);
    console.log('Using PDF  :', PDF_FILE);
    const excel = extractExcelIndex(EXCEL_FILE);
    const mdPath = getArg('--md') || path.join(ROOT, 'produits.md');
    const md = extractMarkdownPrices(mdPath);
    const { lines: pdfLines } = await extractPdfText(PDF_FILE);
    const pdfTab = await extractPdfTablePrices(PDF_FILE);

    const byCategory = new Map();
    const catSummary = new Map(); // category -> { total, updated, missing }
    const diffs = [];
    const issues = [];
    const nameUpdates = [];
    const coverage = {
      excelSheets: excel.sheets,
      excelRows: excel.rows.length,
      productsInJson: products.length,
      jsonNotInExcel: [],
      excelPotentialNotInJson: [],
    };

    // Coverage: JSON vs Excel by normalized name
    const excelNameSet = new Set(excel.rows.map(r => norm(r.name)).filter(Boolean));
    for (const p of products) {
      const k = norm(p.name);
      if (!excelNameSet.has(k)) {
        coverage.jsonNotInExcel.push({ id: p.id, name: p.name });
      }
    }
    // Excel names not in JSON (top 200)
    const jsonNameSet = new Set(products.map(p => norm(p.name)));
    const exNotInJson = [];
    for (const k of excelNameSet) if (!jsonNameSet.has(k)) exNotInJson.push(k);
    coverage.excelPotentialNotInJson = exNotInJson.slice(0, 200);

    // Repricing from PDF strictly (TTC only, no promo touch)
    for (const p of products) {
      const original = p.price;
      const k = norm(p.name);
      let found = null;
      // 1) Markdown via Barcode
      if (md.priceByBarcode && p.barcode && md.priceByBarcode.has(String(p.barcode))) {
        found = md.priceByBarcode.get(String(p.barcode));
      }
      // 1b) Markdown via Ref
      if (found == null && md.priceByRef && p.ref && md.priceByRef.has(String(p.ref))) {
        found = md.priceByRef.get(String(p.ref));
      }
      // 1c) Markdown via normalized name
      if (found == null && md.priceByName && md.priceByName.has(k)) {
        found = md.priceByName.get(k);
      }
      // 2) Excel TTC if available
      if (found == null && excel.priceByName && excel.priceByName.has(k)) {
        found = excel.priceByName.get(k);
      }
      // 3) PDF table maps (barcode/ref/name)
      if (found == null) {
        if (p.barcode && pdfTab.priceByBarcode.has(String(p.barcode))) {
          found = pdfTab.priceByBarcode.get(String(p.barcode));
        }
        if (found == null && p.ref && pdfTab.priceByRef.has(String(p.ref))) {
          found = pdfTab.priceByRef.get(String(p.ref));
        }
        if (found == null && pdfTab.priceByName && pdfTab.priceByName.has(k)) {
          found = pdfTab.priceByName.get(k);
        }
      }
      // 4) Approximate by tokens (MD rows then PDF rows) for targeted categories
      if (found == null) {
        const approxMd = findApproxPriceByName(md.rows, p.name, p.mainCategory);
        if (approxMd != null) found = approxMd;
      }
      if (found == null) {
        const approxPdf = findApproxPriceByName(pdfTab.rows, p.name, p.mainCategory);
        if (approxPdf != null) found = approxPdf;
      }
      // 5) Fallback: PDF proximity match
      if (found == null) {
        const fromPdf = findPriceForName(pdfLines, p.name);
        if (fromPdf != null) found = fromPdf;
      }
      if (found != null && Number.isFinite(found) && found > 0) {
        if (found !== original) {
          diffs.push({ id: p.id, name: p.name, before: original, after: found });
          p.price = found;
          p.priceTTC = found;
          p.priceHT = found; // No TVA management per user instruction
          // preserve isPromo/promoPrice untouched
        }
      } else {
        issues.push({ id: p.id, name: p.name, reason: 'price_not_found_in_pdf' });
      }

      // Update official name only on strong signal: matching barcode
      let officialName = null;
      if (p.barcode) {
        const mdRow = (md.rows || []).find(r => r.barcode === String(p.barcode));
        if (mdRow && mdRow.name) officialName = mdRow.name.trim();
        if (!officialName) {
          const pdfRow = (pdfTab.rows || []).find(r => r.barcode === String(p.barcode));
          if (pdfRow && pdfRow.name) officialName = pdfRow.name.trim();
        }
      }
      if (officialName && officialName.length >= 2) {
        const sanitize = (s) => String(s)
          .replace(/\bF\b.*$/i, '') // drop anything after currency marker
          .replace(/\s+[-–—]\s*\d+.*$/, '') // drop trailing dash-number fragments
          .replace(/\s+\d+(?:[,.]\d+)?\s*(?:g|kg|cl|l|ml|%)?\s*$/i, '') // drop trailing numeric units
          .replace(/\s+[\d,.;:-]+$/,'') // drop dangling numeric punctuation
          .replace(/\s{2,}/g, ' ')
          .trim();
        officialName = sanitize(officialName);
      }
      if (officialName && officialName.length >= 2 && norm(p.name) !== norm(officialName)) {
        const toks = (s) => (String(s).toLowerCase().normalize('NFD').replace(/[^\p{L}\s]/gu,'').split(/\s+/).filter(w => w.length >= 3));
        const a = new Set(toks(p.name));
        const b = new Set(toks(officialName));
        let overlap = 0;
        for (const t of b) if (a.has(t)) overlap++;
        if (overlap >= 1) {
          nameUpdates.push({ id: p.id, before: p.name, after: officialName });
          p.name = officialName;
        }
      }

      // Group by mainCategory for splitting
      const cat = p.mainCategory || 'autres';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(p);
      if (!catSummary.has(cat)) catSummary.set(cat, { total: 0, updated: 0, missing: 0 });
      const s = catSummary.get(cat);
      s.total += 1;
      if (found == null) s.missing += 1; else if (found !== original) s.updated += 1;
    }

    // Manual overrides (explicit corrections)
    const overrides = [
      { slug: 'filet-de-boeuf-mature', name: 'Filet de boeuf', price: 8500 },
      // Beverage packs overrides when catalog ambiguity exists
      { matchName: /\beau\s+evian\b.*\b1[\.,]?5\s*l\b.*\bpack\b/i, price: 5000 },
      // Ensure single bottle stays at unit price
      { matchName: /\beau\s+evian\b.*\b1\s*l\b(?!.*pack)/i, price: 500 },
    ];
    for (const ov of overrides) {
      if (ov.slug) {
        const p = products.find(pp => pp.slug === ov.slug);
        if (p) {
          if (ov.name && norm(p.name) !== norm(ov.name)) {
            nameUpdates.push({ id: p.id, before: p.name, after: ov.name });
            p.name = ov.name;
          }
          if (ov.price && p.price !== ov.price) {
            diffs.push({ id: p.id, name: p.name, before: p.price, after: ov.price });
            p.price = ov.price;
            p.priceTTC = ov.price;
            p.priceHT = ov.price;
          }
        }
      } else if (ov.matchName) {
        for (const p of products) {
          if (ov.matchName.test(p.name)) {
            if (ov.name && norm(p.name) !== norm(ov.name)) {
              nameUpdates.push({ id: p.id, before: p.name, after: ov.name });
              p.name = ov.name;
            }
            if (ov.price && p.price !== ov.price) {
              diffs.push({ id: p.id, name: p.name, before: p.price, after: ov.price });
              p.price = ov.price;
              p.priceTTC = ov.price;
              p.priceHT = ov.price;
            }
          }
        }
      }
    }

    // Clean issues list after overrides
    const updatedIds = new Set(diffs.map(d => d.id));
    const issuesAfter = issues.filter(it => {
      if (updatedIds.has(it.id)) return false;
      const p = products.find(pp => pp.id === it.id);
      return !(p && Number.isFinite(p.price) && p.price > 0);
    });
    // overwrite issues
    while (issues.length) issues.pop();
    for (const it of issuesAfter) issues.push(it);

    // Write reports
    const diffsCsv = ['id,name,before,after'].concat(
      diffs.map(d => `${d.id},"${d.name.replace(/"/g, '""')}",${d.before},${d.after}`)
    ).join('\n');
    fs.writeFileSync(path.join(REPORTS_DIR, 'ecarts-prix.csv'), diffsCsv, 'utf8');

    const issuesCsv = ['id,name,reason'].concat(
      issues.map(d => `${d.id},"${d.name.replace(/"/g, '""')}",${d.reason}`)
    ).join('\n');
    fs.writeFileSync(path.join(REPORTS_DIR, 'matching-issues.csv'), issuesCsv, 'utf8');

    fs.writeFileSync(path.join(REPORTS_DIR, 'coverage.json'), JSON.stringify(coverage, null, 2), 'utf8');
    const namesCsv = ['id,before,after'].concat(nameUpdates.map(n => `${n.id},"${String(n.before).replace(/"/g,'""')}","${String(n.after).replace(/"/g,'""')}"`)).join('\n');
    fs.writeFileSync(path.join(REPORTS_DIR, 'name-updates.csv'), namesCsv, 'utf8');
    // Category summary outputs
    const catCsv = ['category,total,updated,missing'];
    for (const [c, s] of catSummary.entries()) {
      catCsv.push(`${c},${s.total},${s.updated},${s.missing}`);
    }
    fs.writeFileSync(path.join(REPORTS_DIR, 'category-summary.csv'), catCsv.join('\n'), 'utf8');
    fs.writeFileSync(path.join(REPORTS_DIR, 'category-summary.json'), JSON.stringify(Object.fromEntries(catSummary), null, 2), 'utf8');

    // Missing by category (Markdown)
    const missMd = [];
    missMd.push('# Produits avec prix manquants par catégorie');
    for (const [c, s] of catSummary.entries()) {
      if (s.missing === 0) continue;
      missMd.push(`\n## ${c} (${s.missing})`);
      const items = (byCategory.get(c) || []).filter(pp => issues.find(it => it.id === pp.id));
      for (const it of items) {
        missMd.push(`- ${it.id} — ${it.name}`);
      }
    }
    fs.writeFileSync(path.join(REPORTS_DIR, 'missing-by-category.md'), missMd.join('\n'), 'utf8');

    // Split files by category
    ensureDir(SPLIT_DIR);
    const catSlugToFile = new Map();
    // Build a quick lookup for category id/slug mapping
    const catBySlug = new Map(categories.map(c => [c.slug, c]));
    const catById = new Map(categories.map(c => [c.id, c]));

    for (const [cat, items] of byCategory.entries()) {
      const slug = catById.get(cat)?.slug || catBySlug.get(cat)?.slug || String(cat).toLowerCase();
      const safeSlug = slug.replace(/[^a-z0-9\-]/gi, '-');
      const filePath = path.join(SPLIT_DIR, `${safeSlug}.json`);
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
      catSlugToFile.set(safeSlug, `./${safeSlug}.json`);
    }

    // Update categories productCount
    const updatedCategories = categories.map(c => {
      const items = byCategory.get(c.id) || byCategory.get(c.slug) || [];
      return { ...c, productCount: items.length };
    });
    fs.writeFileSync(CATEGORIES_JSON, JSON.stringify(updatedCategories, null, 2), 'utf8');

    // Generate an index.ts aggregator that imports split JSONs statically
    const imports = [];
    const spreads = [];
    for (const [slug, rel] of catSlugToFile.entries()) {
      const varName = slug.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase()).replace(/[^a-zA-Z0-9_]/g, '_');
      imports.push(`import ${varName} from '${rel}';`);
      spreads.push(`...(${varName} as any)`);
    }
    const indexTs = `// Auto-generated by scripts/reprice.js\n${imports.join('\n')}\n\nexport const byCategory = {\n${Array.from(catSlugToFile.keys()).map(slug => `  '${slug}': ${slug.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase()).replace(/[^a-zA-Z0-9_]/g, '_')} as any`).join(',\n')}\n};\n\nconst all = [\n  ${spreads.join(',\n  ')}\n];\nexport default all as any;\n`;
    fs.writeFileSync(path.join(SPLIT_DIR, 'index.ts'), indexTs, 'utf8');

    console.log('Repricing completed.');
    console.log(`Updated ${diffs.length} price(s), ${issues.length} issue(s).`);
    console.log(`Split into ${byCategory.size} category file(s).`);
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  }
})();

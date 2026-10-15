'use strict';
const crypto = require('crypto');

/**
 * CsvImportService — parse, clean, and normalise CSV files from IG Lead Scrapper.
 *
 * Supported CSV columns (case-insensitive):
 *   userId, userName, commentId, commentText, profileUrl, Date
 *
 * The service stores parsed results in an in-memory Map keyed by an importToken
 * (UUID). Tokens expire after IMPORT_TTL_MS to prevent memory leaks.
 */

const IMPORT_TTL_MS  = 10 * 60 * 1000; // 10 minutes
const MAX_ROWS       = 10_000;
const MIN_TEXT_LEN   = 1;

// ─── In-memory import store ───────────────────────────────────────────────────

/** @type {Map<string, {data: ParsedComment[], summary: ImportSummary, expiresAt: number}>} */
const importStore = new Map();

// Periodically clean up expired tokens (every 5 min)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of importStore) {
    if (entry.expiresAt < now) importStore.delete(token);
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();

// ─── Column mapping ───────────────────────────────────────────────────────────

/**
 * Maps known CSV column names (lowercase) to internal field names.
 * IG Lead Scrapper exports with these headers.
 */
const COLUMN_MAP = {
  userid:      'userId',
  username:    'userName',
  commentid:   'commentId',
  commenttext: 'commentText',
  profileurl:  'profileUrl',
  date:        'date',
  // Common alternatives
  id:          'commentId',
  user:        'userName',
  text:        'commentText',
  comment:     'commentText',
  timestamp:   'date',
  createdat:   'date',
};

const REQUIRED_COLUMNS = ['commentText'];

// ─── CSV parser ───────────────────────────────────────────────────────────────

/**
 * Parse a raw CSV string into an array of row objects.
 * Handles quoted fields that may contain commas or newlines.
 *
 * @param {string} csvText
 * @returns {{ headers: string[], rows: Record<string, string>[] }}
 */
function parseCsvText(csvText) {
  const lines = splitCsvLines(csvText.trim());
  if (lines.length < 2) {
    throw new Error('CSV file appears to be empty or has no data rows.');
  }

  const headers = parseCsvRow(lines[0]).map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCsvRow(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Split CSV text into lines, respecting quoted fields containing newlines.
 */
function splitCsvLines(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Parse a single CSV row into an array of field values.
 */
function parseCsvRow(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ─── Column normalisation ─────────────────────────────────────────────────────

/**
 * Map raw CSV headers to internal field names using COLUMN_MAP.
 * Returns a map from rawHeader → internalField.
 */
function buildHeaderMapping(headers) {
  const mapping = {};
  for (const h of headers) {
    const key = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (COLUMN_MAP[key]) {
      mapping[h] = COLUMN_MAP[key];
    }
  }
  return mapping;
}

/**
 * Validate that all required internal fields are covered by the mapping.
 */
function validateRequiredColumns(mapping) {
  const mappedFields = new Set(Object.values(mapping));
  const missing = REQUIRED_COLUMNS.filter(f => !mappedFields.has(f));
  if (missing.length > 0) {
    throw new Error(
      `CSV missing required column(s): ${missing.join(', ')}. ` +
      `Expected one of: commentText, comment, text`
    );
  }
}

// ─── Date normalisation ───────────────────────────────────────────────────────

/**
 * Parse a date string from various common formats to ISO 8601.
 * Returns null if the date cannot be parsed.
 */
function normaliseDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return null;

  // Try direct parse first (handles ISO, common locale formats)
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString();

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const [, dd, mm, yy] = dmyMatch;
    const year = yy.length === 2 ? `20${yy}` : yy;
    const d2 = new Date(`${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }

  return null;
}

// ─── Text normalisation ───────────────────────────────────────────────────────

/**
 * Produce a lightweight normalised version of a comment for analysis.
 * Does NOT aggressively strip emoji/negation/mentions — preserves sentiment signals.
 * Only normalises whitespace and Unicode.
 */
function normaliseText(text) {
  return text
    .replace(/\r\n|\r/g, '\n')       // normalise line endings
    .replace(/\t/g, ' ')              // tabs → space
    .replace(/[ ]{2,}/g, ' ')        // collapse multiple spaces
    .normalize('NFC')                 // Unicode normalisation
    .trim();
}

// ─── Main cleaning pipeline ───────────────────────────────────────────────────

/**
 * Parse and clean a CSV buffer.
 *
 * @param {Buffer} buffer     - Raw CSV file buffer
 * @param {string} platform   - 'instagram' | 'tiktok'
 * @param {string} postUrl    - Source post URL
 * @param {string} filename   - Original filename for metadata
 *
 * @returns {{ preview: ParsedComment[], skipped: SkippedRow[], summary: ImportSummary, importToken: string }}
 */
function parseAndClean(buffer, platform, postUrl, filename) {
  const csvText = buffer.toString('utf-8');

  // 1. Parse raw CSV
  const { headers, rows } = parseCsvText(csvText);
  const totalRows = rows.length;

  // 2. Build column mapping & validate
  const headerMap = buildHeaderMapping(headers);
  validateRequiredColumns(headerMap);

  // 3. Check row limit
  if (totalRows > MAX_ROWS) {
    throw new Error(`CSV has ${totalRows} rows. Maximum allowed is ${MAX_ROWS} per import.`);
  }

  // 4. Map raw rows to internal objects
  const rawComments = rows.map(row => {
    const mapped = {};
    for (const [rawHeader, internalField] of Object.entries(headerMap)) {
      mapped[internalField] = row[rawHeader] ?? '';
    }
    return mapped;
  });

  // 5. Dedup tracking by commentId
  const seenCommentIds = new Set();

  const validComments   = [];
  const skippedRows     = [];

  for (let i = 0; i < rawComments.length; i++) {
    const raw = rawComments[i];
    const rowNum = i + 2; // 1-indexed, +1 for header row

    // 5a. Check empty/whitespace text
    const rawText = raw.commentText ?? '';
    if (!rawText.trim() || rawText.trim().length < MIN_TEXT_LEN) {
      skippedRows.push({ rowNum, rawText, skipReason: 'empty_text' });
      continue;
    }

    // 5b. Dedup by commentId (only if commentId is present and non-empty)
    const commentId = raw.commentId?.trim() || null;
    if (commentId) {
      if (seenCommentIds.has(commentId)) {
        skippedRows.push({ rowNum, rawText, skipReason: 'duplicate_id', commentId });
        continue;
      }
      seenCommentIds.add(commentId);
    }

    // 5c. Valid comment — normalise fields
    validComments.push({
      platformCommentId: commentId,
      username:          raw.userName?.trim()   || null,
      rawText:           rawText,
      normalizedText:    normaliseText(rawText),
      publishedAt:       normaliseDate(raw.date),
      profileUrl:        raw.profileUrl?.trim() || null,
      platform,
      postUrl,
    });
  }

  // 6. Compute summary
  const summary = {
    totalRows,
    valid:      validComments.length,
    skipped:    skippedRows.filter(r => r.skipReason === 'empty_text').length,
    duplicates: skippedRows.filter(r => r.skipReason === 'duplicate_id').length,
    filename,
    platform,
    postUrl,
  };

  // 7. Store in memory with TTL
  const importToken = crypto.randomUUID();
  importStore.set(importToken, {
    data:      validComments,
    summary,
    expiresAt: Date.now() + IMPORT_TTL_MS,
  });

  // 8. Build preview (first 10 valid rows)
  const preview = validComments.slice(0, 10);

  return { preview, skipped: skippedRows, summary, importToken };
}

/**
 * Retrieve and consume stored import data by token.
 * Returns null if token is expired or not found.
 *
 * @param {string} importToken
 * @returns {{ data: ParsedComment[], summary: ImportSummary } | null}
 */
function getImportData(importToken) {
  const entry = importStore.get(importToken);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    importStore.delete(importToken);
    return null;
  }
  // Consume — remove from store after retrieval
  importStore.delete(importToken);
  return { data: entry.data, summary: entry.summary };
}

module.exports = { parseAndClean, getImportData };

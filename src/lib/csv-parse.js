/**
 * Minimal CSV parser for pipeline export (handles quoted fields and escaped quotes).
 * Use for recipe_database.csv / recipe_final.csv import in the browser.
 */

/**
 * Parse a single CSV row respecting quoted fields (RFC 4180–style).
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVRow(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += c
    }
  }
  result.push(current)
  return result
}

/**
 * Parse CSV text into array of objects (first row = headers).
 * Handles quoted fields and newlines inside quoted fields by splitting on \n only when not inside quotes.
 * @param {string} text - Full CSV file text
 * @returns {{ headers: string[], rows: Record<string, string>[] }}
 */
export function parseCSV(text) {
  const lines = []
  let line = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        line += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      line += c
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && text[i + 1] === '\n') i++
      if (line.trim()) lines.push(line)
      line = ''
    } else {
      if (c !== '\r') line += c
    }
  }
  if (line.trim()) lines.push(line)

  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseCSVRow(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i])
    const row = {}
    headers.forEach((h, j) => {
      row[h] = values[j] ?? ''
    })
    rows.push(row)
  }
  return { headers, rows }
}

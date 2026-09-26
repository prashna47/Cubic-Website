/**
 * Auto-stamps "Date Added" in the job links sheet.
 *
 * Sheet layout (row 1 = headers):
 *   A: Link   B: Date Added   C: Company (optional)   D: Title (optional)   E: Site (optional)
 *
 * Whenever a link is typed or pasted into column A, column B of that row is
 * filled with the current date/time (only if it is still empty).
 *
 * Setup: in the sheet open Extensions > Apps Script, paste this file, save.
 * The simple onEdit trigger runs automatically; no further setup is needed.
 */
function onEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();
  if (sheet.getIndex() !== 1) return; // first tab only
  if (range.getColumn() > 1 || range.getLastColumn() < 1) return; // touched column A?

  var firstRow = Math.max(range.getRow(), 2); // skip header
  var lastRow = range.getLastRow();
  if (lastRow < firstRow) return;

  var links = sheet.getRange(firstRow, 1, lastRow - firstRow + 1, 1).getValues();
  var dates = sheet.getRange(firstRow, 2, links.length, 1);
  var current = dates.getValues();
  var now = new Date();

  for (var i = 0; i < links.length; i++) {
    var hasLink = String(links[i][0]).trim() !== '';
    if (hasLink && current[i][0] === '') current[i][0] = now;
  }
  dates.setValues(current);
  dates.setNumberFormat('yyyy-mm-dd hh:mm');
}

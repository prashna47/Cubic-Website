/**
 * Interview booking requests: receives them from the website, and turns an
 * approval into a booked seat.
 *
 * Flow
 *   1. The website POSTs a request here. It is appended to the "Booking
 *      Requests" tab with Status = Pending (resume saved to Drive).
 *   2. You set Status to Approved or Rejected from the dropdown.
 *   3. Approved copies the request into the "Interview Booking" tab, which the
 *      website reads for availability, so the slot loses a seat. Changing an
 *      approved request to anything else removes that row again.
 *
 * Setup (once)
 *   1. Extensions > Apps Script. Paste this file over the old version, save.
 *   2. Project Settings (gear) > Script properties > add TOKEN = a long random
 *      string (also in server/.env as BOOKING_WEBHOOK_TOKEN).
 *   3. Pick the function `setupBookingRequests` in the toolbar and click Run.
 *      Approve the permissions. This creates the tab if needed, adds the
 *      colored Status dropdown, and installs the approval trigger.
 *   4. Deploy > Manage deployments > edit (pencil) > Version: New version >
 *      Deploy. Who has access must be "Anyone". Web app URL goes in
 *      server/.env as BOOKING_WEBHOOK_URL.
 */
var SHEET_NAME = 'Booking Requests';
var INTERVIEW_SHEET_NAME = 'Interview Booking';
var RESUME_FOLDER = 'Interview Request Resumes';
var STATUS_ROWS = 1000; // how far down the dropdown is applied

var HEADERS = [
  'Submitted At', 'Status', 'Candidate', 'Date', 'Time', 'Duration',
  'Stage', 'Mode', 'Location', 'Client', 'Vendor', 'Panel',
  'Note / Meeting URL', 'Job Description', 'Resume', 'Requested By'
];

var STATUSES = {
  Pending: { bg: '#fff2cc', fg: '#7f6000' },  // yellow
  Approved: { bg: '#d9ead3', fg: '#274e13' }, // green
  Rejected: { bg: '#f4cccc', fg: '#990000' }  // red
};

// Columns copied into the Interview Booking tab, matched by its header text.
// Headers are checked from the start of the text, so e.g. "Candidate Number"
// is not mistaken for the candidate's name.
var INTERVIEW_COLUMNS = [
  { pattern: /^date/i, from: 'Date' },
  { pattern: /^time/i, from: 'Time' },
  { pattern: /^candidate[_ ]?name|^candidate$/i, from: 'Candidate' },
  { pattern: /^(client|company)/i, from: 'Client' },
  { pattern: /^vendor/i, from: 'Vendor' },
  { pattern: /^panel/i, from: 'Panel' },
  { pattern: /^location/i, from: 'Location' },
  { pattern: /^duration/i, from: 'Duration' },
  { pattern: /stage/i, from: 'Stage' },
  { pattern: /mode/i, from: 'Mode' },
  { pattern: /^(note|meeting)/i, from: 'Note / Meeting URL' },
  { pattern: /^resume/i, from: 'Resume' }
];

// ---------------------------------------------------------------- website

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!token || body.token !== token) return json({ ok: false, error: 'unauthorized' });

    var sheet = requestsSheet();

    var resumeUrl = '';
    if (body.resume && body.resume.base64) {
      var blob = Utilities.newBlob(
        Utilities.base64Decode(body.resume.base64),
        body.resume.mimeType,
        body.candidateName + ' - ' + body.resume.name
      );
      resumeUrl = resumeFolder().createFile(blob).getUrl();
    }

    sheet.appendRow([
      new Date(body.submittedAt), 'Pending', body.candidateName, body.date,
      body.timeLabel, body.duration, body.stage, body.mode, body.location,
      body.client, body.vendor, body.panel, body.note, body.jobDescription,
      resumeUrl, body.requestedBy
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ------------------------------------------------------------------ setup

/** Run once from the editor. Safe to run again. */
function setupBookingRequests() {
  var sheet = requestsSheet();
  styleStatusColumn(sheet);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'onBookingEdit';
  });
  if (!exists) {
    // An installable trigger, so it doesn't clash with any other onEdit.
    ScriptApp.newTrigger('onBookingEdit').forSpreadsheet(ss).onEdit().create();
  }
}

/** Status dropdown (Pending / Approved / Rejected) with yellow, green, red. */
function styleStatusColumn(sheet) {
  var col = columnOf(sheet, 'Status');
  if (col < 0) return;
  if (sheet.getMaxRows() < STATUS_ROWS + 1) {
    sheet.insertRowsAfter(sheet.getMaxRows(), STATUS_ROWS + 1 - sheet.getMaxRows());
  }
  var range = sheet.getRange(2, col, STATUS_ROWS, 1);
  range.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(Object.keys(STATUSES), true)
      .setAllowInvalid(false)
      .build()
  );
  var rules = Object.keys(STATUSES).map(function (name) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(name)
      .setBackground(STATUSES[name].bg)
      .setFontColor(STATUSES[name].fg)
      .setRanges([range])
      .build();
  });
  sheet.setConditionalFormatRules(rules);
}

// ---------------------------------------------------------------- approval

/** Installable edit trigger: reacts to changes in the Status column. */
function onBookingEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;
  var statusCol = columnOf(sheet, 'Status');
  if (statusCol < 0 || range.getColumn() > statusCol || range.getLastColumn() < statusCol) return;

  var first = Math.max(range.getRow(), 2);
  for (var row = first; row <= range.getLastRow(); row++) {
    var status = String(sheet.getRange(row, statusCol).getValue()).trim();
    var request = readRequest(sheet, row);
    if (!request.Candidate || !request.Date) continue;
    if (status === 'Approved') addInterview(request);
    else removeInterview(request);
  }
}

function readRequest(sheet, row) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
  var out = {};
  headers.forEach(function (h, i) {
    out[String(h).trim()] = values[i];
  });
  out.Date = dateText(out.Date);
  return out;
}

/** "2026-09-28" text or a real date cell -> "9/28/2026". */
function dateText(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'M/d/yyyy');
  }
  var m = String(v).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m ? Number(m[2]) + '/' + Number(m[3]) + '/' + m[1] : String(v);
}

function interviewSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(INTERVIEW_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(INTERVIEW_SHEET_NAME);
    sheet.appendRow([
      'Client', 'Location', 'Candidate_Name', 'Date', 'Time (CST)', 'Duration',
      'Vendor', 'Panel_name', 'Stage', 'Mode', 'Note / Meeting URL', 'Resume'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Same request already in the tab? Returns its row number, or 0. */
function findInterviewRow(sheet, request) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var find = function (re) {
    for (var i = 0; i < headers.length; i++) if (re.test(String(headers[i]))) return i;
    return -1;
  };
  var c = { name: find(/^candidate[_ ]?name|^candidate$/i), date: find(/^date/i), time: find(/^time/i) };
  if (c.name < 0 || c.date < 0 || c.time < 0) return 0;
  var data = sheet.getRange(2, 1, last - 1, headers.length).getValues();
  for (var i = 0; i < data.length; i++) {
    if (
      String(data[i][c.name]).trim() === String(request.Candidate).trim() &&
      dateText(data[i][c.date]) === request.Date &&
      String(data[i][c.time]).trim() === String(request.Time).trim()
    ) return i + 2;
  }
  return 0;
}

function addInterview(request) {
  var sheet = interviewSheet();
  if (findInterviewRow(sheet, request)) return; // already there
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function (h) {
    for (var i = 0; i < INTERVIEW_COLUMNS.length; i++) {
      if (INTERVIEW_COLUMNS[i].pattern.test(String(h).trim())) {
        var v = request[INTERVIEW_COLUMNS[i].from];
        return v === undefined ? '' : v;
      }
    }
    return '';
  });
  sheet.appendRow(row);
}

function removeInterview(request) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INTERVIEW_SHEET_NAME);
  if (!sheet) return;
  var rowNumber = findInterviewRow(sheet, request);
  if (rowNumber) sheet.deleteRow(rowNumber);
}

// ---------------------------------------------------------------- helpers

function requestsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    styleStatusColumn(sheet);
  }
  return sheet;
}

/** 1-based column number of a header, or -1. */
function columnOf(sheet, header) {
  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === header) return i + 1;
  }
  return -1;
}

function resumeFolder() {
  var it = DriveApp.getFoldersByName(RESUME_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(RESUME_FOLDER);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

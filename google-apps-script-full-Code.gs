/**
 * ПЪЛЕН КОПИРАН ФАЙЛ за Google Apps Script (Code.gs).
 * Замени съдържанието на "Код.gs" с това и направи Deploy → New version.
 */

const QUESTIONS_FILE_ID = '1WNDa11ED6DwExzGC_XfUbVLlKKCvfgz4';
const SCORES_SHEET_ID = '1lD8q3bReS7t7RRldXvlSrDCA3Zi0rVqGq7Wmh9r6pkw';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'questions';

  if (action === 'scores') {
    return getScores_();
  }

  const file = DriveApp.getFileById(QUESTIONS_FILE_ID);
  const content = file.getBlob().getDataAsString('UTF-8');

  return ContentService
    .createTextOutput(content)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');

    // Анкета от tech-quiz.js: { type: "survey", respondentId, sample, answers }
    if (payload.type === 'survey') {
      return saveSurveyResponse_(payload);
    }

    // Резултат от играта: { name, score }
    const name = String(payload.name || '').trim();
    const score = Number(payload.score);

    if (!name || Number.isNaN(score)) {
      return json_({ ok: false, error: 'Invalid payload' });
    }

    const ss = SpreadsheetApp.openById(SCORES_SHEET_ID);
    const sheet = ss.getSheetByName('scores') || ss.insertSheet('scores');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['timestamp', 'name', 'score']);
    }

    sheet.appendRow([new Date().toISOString(), name, score]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function saveSurveyResponse_(payload) {
  var answers = payload.answers || {};
  var ss = SpreadsheetApp.openById(SCORES_SHEET_ID);
  var sheet =
      ss.getSheetByName('survey_responses') || ss.insertSheet('survey_responses');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'timestamp',
      'respondentId',
      'sample',
      'q1',
      'q2',
      'q3',
      'q4',
      'q5',
      'answers_json',
    ]);
  }

  sheet.appendRow([
    new Date().toISOString(),
    String(payload.respondentId || ''),
    String(payload.sample || ''),
    answers.q1 != null ? answers.q1 : '',
    answers.q2 != null ? answers.q2 : '',
    answers.q3 != null ? answers.q3 : '',
    answers.q4 != null ? answers.q4 : '',
    answers.q5 != null ? answers.q5 : '',
    JSON.stringify(answers),
  ]);

  return json_({ ok: true });
}

function getScores_() {
  const ss = SpreadsheetApp.openById(SCORES_SHEET_ID);
  const sheet = ss.getSheetByName('scores');

  if (!sheet || sheet.getLastRow() < 2) {
    return json_([]);
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  const scores = rows
    .map((r) => ({ name: String(r[1] || ''), score: Number(r[2] || 0) }))
    .filter((x) => x.name && !Number.isNaN(x.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return json_(scores);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Еднократно: Run за права към Sheet */
function authSheetsNow() {
  var ss = SpreadsheetApp.openById(SCORES_SHEET_ID);
  Logger.log(ss.getName());
}

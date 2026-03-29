// ============================================================
// GOOGLE APPS SCRIPT - BACKEND ALARMAVISION SG-SST
// VERSIÓN CORREGIDA - Sin problemas de CORS
//
// PARA ACTUALIZAR (tu URL NO cambia):
// 1. Apps Script → "Implementar" → "Administrar implementaciones"
// 2. Clic en el lápiz (editar)
// 3. Versión → "Nueva versión"
// 4. Clic en "Implementar"
// ============================================================

const SHEET_NAME = "Reportes SG-SST";
const HEADERS = ["ID","Nombre","Cédula","Tipo de Riesgo","Nivel de Riesgo","Observaciones","Fecha","Hora","Estado","Fecha Atención"];

// TODO pasa por doGet (evita CORS del navegador)
function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  try {
    const action = (e.parameter && e.parameter.action) ? e.parameter.action : "get";
    let result;
    if      (action === "submit")       result = addReport(e.parameter);
    else if (action === "updateStatus") result = updateStatus(e.parameter.id);
    else if (action === "get")          result = getReports();
    else if (action === "stats")        result = getStats();
    else if (action === "ping")         result = { success: true, message: "OK", ts: new Date().toISOString() };
    else                                result = { success: false, error: "Accion desconocida: " + action };
    output.setContent(JSON.stringify(result));
  } catch(err) {
    output.setContent(JSON.stringify({ success: false, error: err.toString() }));
  }
  return output;
}

function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  try {
    let data = {};
    try { data = JSON.parse(e.postData.contents); } catch(x) {}
    output.setContent(JSON.stringify(addReport(data)));
  } catch(err) {
    output.setContent(JSON.stringify({ success: false, error: err.toString() }));
  }
  return output;
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    const hr = sheet.getRange(1,1,1,HEADERS.length);
    hr.setBackground("#1B3A8C"); hr.setFontColor("#FFFFFF");
    hr.setFontWeight("bold"); hr.setFontSize(11);
    sheet.setFrozenRows(1);
    [70,200,130,220,100,250,110,80,120,150].forEach((w,i) => sheet.setColumnWidth(i+1,w));
  }
  return sheet;
}

function addReport(data) {
  const nombre        = String(data.nombre        || data.Nombre        || "").trim();
  const cedula        = String(data.cedula        || data.Cedula        || data["Cédula"] || "").trim();
  const tipoRiesgo    = String(data.tipoRiesgo    || data["Tipo de Riesgo"]  || "").trim();
  const nivelRiesgo   = String(data.nivelRiesgo   || data["Nivel de Riesgo"] || "").trim();
  const observaciones = String(data.observaciones || data.Observaciones  || "").trim();

  if (!nombre || !cedula || !tipoRiesgo || !nivelRiesgo)
    return { success: false, error: "Faltan campos: nombre, cedula, tipoRiesgo, nivelRiesgo" };

  const sheet  = getOrCreateSheet();
  const tz     = "America/Bogota";
  const now    = new Date();
  const id     = "RPT-" + String(sheet.getLastRow()).padStart(4,"0");
  const fecha  = Utilities.formatDate(now, tz, "dd/MM/yyyy");
  const hora   = Utilities.formatDate(now, tz, "HH:mm:ss");

  sheet.appendRow([id, nombre, cedula, tipoRiesgo, nivelRiesgo, observaciones, fecha, hora, "No atendido", ""]);

  const n = sheet.getLastRow();
  const bg = nivelRiesgo==="Alto" ? "#FFE0E0" : nivelRiesgo==="Medio" ? "#FFF9E0" : "#E8FFE8";
  sheet.getRange(n, 1, 1, HEADERS.length).setBackground(bg);

  return { success: true, id, message: "Reporte registrado", fecha, hora };
}

function getReports() {
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h,i) => { obj[h] = row[i] !== undefined ? String(row[i]) : ""; });
    return obj;
  });
  return { success: true, data: rows };
}

function updateStatus(id) {
  if (!id) return { success: false, error: "ID requerido" };
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const ts = Utilities.formatDate(new Date(), "America/Bogota", "dd/MM/yyyy HH:mm");
      sheet.getRange(i+1, 9).setValue("Atendido");
      sheet.getRange(i+1, 10).setValue(ts);
      sheet.getRange(i+1, 1, 1, HEADERS.length).setBackground("#C8F0D0");
      return { success: true, message: "Atendido", id };
    }
  }
  return { success: false, error: "ID no encontrado: " + id };
}

function getStats() {
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues().slice(1);
  const s = { total: data.length, porNivel: {Alto:0,Medio:0,Bajo:0}, atendidos:0, noAtendidos:0, porTipo:{} };
  data.forEach(row => {
    const nivel = String(row[4]); const estado = String(row[8]); const tipo = String(row[3]);
    if (s.porNivel[nivel] !== undefined) s.porNivel[nivel]++;
    if (estado === "Atendido") s.atendidos++; else s.noAtendidos++;
    s.porTipo[tipo] = (s.porTipo[tipo] || 0) + 1;
  });
  return { success: true, stats: s };
}

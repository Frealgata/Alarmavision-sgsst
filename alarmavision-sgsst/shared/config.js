// ============================================================
// CONFIGURACIÓN CENTRAL - ALARMAVISION SG-SST
// Edita GOOGLE_SCRIPT_URL con tu URL de Google Apps Script
// ============================================================

const CONFIG = {
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/TU_ID_AQUI/exec",
  APP_NAME: "Alarmavision SG-SST",
  COMPANY: "Alarmavision Services S.A.S.",
  VERSION: "1.0.0",
  COLORS: {
    blue: "#1B3A8C",
    blueLight: "#2E5FD9",
    gray: "#9EA2A2",
    grayDark: "#6B6E6E",
    black: "#080808",
    white: "#FFFFFF"
  },
  RISKS: [
    "Daño en silla",
    "Daño en módulo de trabajo",
    "Cableado en mal estado",
    "Iluminación deficiente",
    "Riesgo eléctrico",
    "Caídas o tropiezos",
    "Riesgo de incendio",
    "Señalización deficiente",
    "Extintor vencido o ausente",
    "Salida de emergencia bloqueada",
    "Otros"
  ],
  RISK_LEVELS: ["Alto", "Medio", "Bajo"]
};

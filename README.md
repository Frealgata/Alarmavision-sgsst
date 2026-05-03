# 🛡️ Alarmavision SG-SST — Sistema de Reporte de Riesgos

Sistema completo de reporte y gestión de riesgos SG-SST para **Alarmavision Services S.A.S.**, compuesto por dos PWAs instalables que se comunican a través de Google Sheets.

---

## 📱 App Móvil (Emisor)
> **`mobile-app/index.html`** — Instalable en celular como PWA

- Formulario de reporte de riesgos SG-SST
- Selección de nivel: Alto / Medio / Bajo
- 3 tipos de riesgo predefinidos
- Funcionamiento **offline** con cola de sincronización
- Historial local de reportes enviados

## 💻 Panel de Escritorio (Receptor)
> **`desktop-app/index.html`** — Instalable en PC como PWA

- Dashboard con estadísticas en tiempo real
- Tabla completa de reportes con filtros
- Marcar casos como "Atendido" (fila verde)
- Filtros por nombre, cédula, nivel, fecha, estado
- Exportar a **Excel (.xlsx)** y **PDF**
- Auto-actualización cada 60 segundos

---

Instalar como PWA

**En móvil (Chrome/Safari):**
1. Abre la URL de la app móvil
2. Chrome: menú ⋮ → "Agregar a pantalla de inicio"
3. Safari: botón compartir → "Añadir a inicio"

**En PC (Chrome/Edge):**
1. Abre la URL del panel de escritorio
2. Clic en el ícono de instalación en la barra de direcciones (⊕)
3. Clic en "Instalar"

---


## 🔧 Arquitectura

```
📱 App Móvil          🌐 Google Sheets         💻 Panel Admin
(Emisor PWA)    →    (Backend + Storage)   →   (Receptor PWA)
    │                        │                        │
    │  POST /submit           │  GET /reports           │
    │ ─────────────────────→  │ ←─────────────────────  │
    │                        │                        │
    │  Offline Queue         │  Auto-refresh 60s      │
    │  (localStorage)        │  (fetch periódico)      │
```

---

## 🛡️ Seguridad y Privacidad

- Los datos se almacenan en tu propio Google Drive
- El script de Google Apps Script es privado en tu cuenta
- Las apps funcionan offline con datos locales en `localStorage`
- No hay dependencias de terceros para datos

---

## 📄 Licencia

Desarrollado para **Alarmavision Services S.A.S.** — Uso interno.

---

*Versión 1.0.0 · 2026*

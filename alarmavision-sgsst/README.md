# 🛡️ Alarmavision SG-SST — Sistema de Reporte de Riesgos

Sistema completo de reporte y gestión de riesgos SG-SST para **Alarmavision Services S.A.S.**, compuesto por dos PWAs instalables que se comunican a través de Google Sheets como backend gratuito.

![Colores](https://img.shields.io/badge/PANTONE-2746C-1B3A8C?style=flat&labelColor=000)
![Colores](https://img.shields.io/badge/PANTONE-CoolGray7C-9EA2A2?style=flat&labelColor=000)

---

## 📱 App Móvil (Emisor)
> **`mobile-app/index.html`** — Instalable en celular como PWA

- Formulario de reporte de riesgos SG-SST
- Selección de nivel: Alto / Medio / Bajo
- 11 tipos de riesgo predefinidos
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

## 🚀 Instalación Paso a Paso

### 1. Configurar el Backend (Google Sheets)

1. Crea una hoja de cálculo en [Google Drive](https://drive.google.com)
2. Ve a **Extensiones → Apps Script**
3. Borra el código existente y pega el contenido de `docs/google-apps-script.js`
4. Guarda con `Ctrl+S`
5. Clic en **"Implementar" → "Nueva implementación"**
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Clic en **"Implementar"** y copia la URL generada

### 2. Configurar la URL en las Apps

Edita `shared/config.js` y reemplaza:
```js
GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/TU_ID_AQUI/exec",
```
Con tu URL real.

**También** puedes configurarlo desde la interfaz:
- En el **Panel de Escritorio** → Configuración → pega la URL → Guardar
- En la **App Móvil** → la URL se guarda automáticamente si está en config.js

### 3. Subir a GitHub Pages

```bash
git clone https://github.com/TU_USUARIO/alarmavision-sgsst
cd alarmavision-sgsst
# Coloca las imágenes de logos en shared/assets/
# (ver sección de logos abajo)
git add .
git commit -m "Initial commit"
git push origin main
```

En GitHub: **Settings → Pages → Branch: main → Save**

URLs resultantes:
- 📱 Móvil: `https://TU_USUARIO.github.io/alarmavision-sgsst/mobile-app/`
- 💻 Escritorio: `https://TU_USUARIO.github.io/alarmavision-sgsst/desktop-app/`

### 4. Instalar como PWA

**En móvil (Chrome/Safari):**
1. Abre la URL de la app móvil
2. Chrome: menú ⋮ → "Agregar a pantalla de inicio"
3. Safari: botón compartir → "Añadir a inicio"

**En PC (Chrome/Edge):**
1. Abre la URL del panel de escritorio
2. Clic en el ícono de instalación en la barra de direcciones (⊕)
3. Clic en "Instalar"

---

## 🖼️ Logos — Activos requeridos

Coloca estos archivos en `shared/assets/`:

| Archivo | Descripción | Tamaño recomendado |
|---------|-------------|-------------------|
| `logo-company.png` | Logo Alarmavision Services S.A.S. | 200×200px |
| `logo-sgsst.png` | Logo SG-SST | 200×200px |

> Los logos provistos (logo-png.png y SG-SST.png) deben renombrarse y colocarse allí.

---

## 🏗️ Estructura del Proyecto

```
alarmavision-sgsst/
├── mobile-app/
│   ├── index.html          # App emisora de reportes
│   ├── manifest.json       # Config PWA móvil
│   └── sw.js               # Service Worker (offline)
├── desktop-app/
│   ├── index.html          # Panel administrativo
│   ├── manifest.json       # Config PWA escritorio
│   └── sw.js               # Service Worker
├── shared/
│   ├── config.js           # ⚙️ Configuración central
│   └── assets/             # Logos e imágenes
├── docs/
│   └── google-apps-script.js  # Backend Google Sheets
└── README.md
```

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

## 📊 Colores Corporativos

| Color | Pantone | HEX | Uso |
|-------|---------|-----|-----|
| Azul | PANTONE 2746 C | `#1B3A8C` | Principal, headers |
| Azul claro | — | `#2E5FD9` | Acentos, links |
| Gris | PANTONE Cool Gray 7 C | `#9EA2A2` | Textos secundarios |
| Negro | — | `#080808` | Fondo principal |

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

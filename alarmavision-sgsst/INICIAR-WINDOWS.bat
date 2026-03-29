@echo off
chcp 65001 >nul
title Alarmavision SG-SST — Servidor Local

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║      ALARMAVISION SG-SST — Iniciando...      ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Python encontrado. Iniciando servidor...
    goto :start_python
)

py --version >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Python encontrado. Iniciando servidor...
    goto :start_py
)

:: Si no hay Python, intentar con Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Node.js encontrado. Iniciando servidor...
    goto :start_node
)

:: Ninguno disponible
echo  [ERROR] No se encontro Python ni Node.js.
echo.
echo  Por favor instala Python desde: https://python.org
echo  (Marca la casilla "Add Python to PATH" durante la instalacion)
echo.
pause
exit /b 1

:start_python
start "" "http://localhost:8080"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/mobile-app/"
timeout /t 1 /nobreak >nul
start "" "http://localhost:8080/desktop-app/"
python -m http.server 8080
goto :end

:start_py
start "" "http://localhost:8080"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/mobile-app/"
timeout /t 1 /nobreak >nul
start "" "http://localhost:8080/desktop-app/"
py -m http.server 8080
goto :end

:start_node
:: Crear servidor node temporal
echo const http = require('http'); > "%TEMP%\srv.js"
echo const fs = require('fs'); >> "%TEMP%\srv.js"
echo const path = require('path'); >> "%TEMP%\srv.js"
echo const mime = {'html':'text/html','css':'text/css','js':'application/javascript','json':'application/json','png':'image/png','ico':'image/x-icon'}; >> "%TEMP%\srv.js"
echo http.createServer((req,res) => { >> "%TEMP%\srv.js"
echo   let file = path.join('%CD%', req.url === '/' ? '/index.html' : req.url); >> "%TEMP%\srv.js"
echo   fs.readFile(file, (e,d) => { >> "%TEMP%\srv.js"
echo     if(e){res.writeHead(404);res.end('Not found');return;} >> "%TEMP%\srv.js"
echo     const ext = path.extname(file).slice(1); >> "%TEMP%\srv.js"
echo     res.writeHead(200,{'Content-Type':mime[ext]||'text/plain'}); >> "%TEMP%\srv.js"
echo     res.end(d); >> "%TEMP%\srv.js"
echo   }); >> "%TEMP%\srv.js"
echo }).listen(8080, () => console.log('Servidor en http://localhost:8080')); >> "%TEMP%\srv.js"

start "" "http://localhost:8080"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/mobile-app/"
timeout /t 1 /nobreak >nul
start "" "http://localhost:8080/desktop-app/"
node "%TEMP%\srv.js"

:end
echo.
echo  Servidor detenido.
pause

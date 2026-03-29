#!/bin/bash
# ============================================================
# ALARMAVISION SG-SST — Iniciador Mac/Linux
# ============================================================

PUERTO=8080
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo " ╔══════════════════════════════════════════════╗"
echo " ║      ALARMAVISION SG-SST — Iniciando...      ║"
echo " ╚══════════════════════════════════════════════╝"
echo ""
echo " Directorio: $DIR"
echo " Puerto: $PUERTO"
echo ""

cd "$DIR"

# Función para abrir navegador
abrir() {
  sleep 1
  if command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:$PUERTO" &
    sleep 1
    xdg-open "http://localhost:$PUERTO/mobile-app/" &
    sleep 1
    xdg-open "http://localhost:$PUERTO/desktop-app/" &
  elif command -v open &>/dev/null; then
    open "http://localhost:$PUERTO"
    sleep 1
    open "http://localhost:$PUERTO/mobile-app/"
    sleep 1
    open "http://localhost:$PUERTO/desktop-app/"
  fi
}

abrir &

# Intentar Python 3
if command -v python3 &>/dev/null; then
  echo " [OK] Usando Python 3"
  echo " Abriendo navegador..."
  echo " Presiona Ctrl+C para detener"
  echo ""
  python3 -m http.server $PUERTO
  exit 0
fi

# Intentar Python 2
if command -v python &>/dev/null; then
  echo " [OK] Usando Python 2"
  python -m SimpleHTTPServer $PUERTO
  exit 0
fi

# Intentar Node.js
if command -v node &>/dev/null; then
  echo " [OK] Usando Node.js"
  node -e "
    const http=require('http'),fs=require('fs'),path=require('path');
    const mime={'html':'text/html','css':'text/css','js':'application/javascript','json':'application/json','png':'image/png'};
    http.createServer((req,res)=>{
      let f=path.join('$DIR',req.url==='/'?'/index.html':req.url);
      fs.readFile(f,(e,d)=>{
        if(e){res.writeHead(404);res.end('Not found');return;}
        res.writeHead(200,{'Content-Type':mime[path.extname(f).slice(1)]||'text/plain'});
        res.end(d);
      });
    }).listen($PUERTO,()=>console.log('Servidor listo en http://localhost:$PUERTO'));
  "
  exit 0
fi

echo " [ERROR] No se encontró Python ni Node.js"
echo " Instala Python desde: https://python.org"
exit 1

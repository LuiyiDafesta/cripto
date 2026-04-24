# CipherDesk — Ferozo Deployment Workflow

## URL de producción
`https://lsnethub.com/aurafinance`

## Estructura del repositorio
```
/                    ← raíz del repo = raíz de /aurafinance en Ferozo
├── index.html       ← entrada principal de la SPA
├── .htaccess        ← reescritura Apache para SPA routing
├── favicon.ico
├── placeholder.svg
├── robots.txt
├── _source/         ← JS y CSS compilados (hashed para cache busting)
│   ├── index-*.css
│   └── index-*.js
└── assets/          ← imágenes y assets estáticos (si los hay)
```

## Cómo deployar

### 1. Build local
```bash
cd alpha-intelligence
npx vite build
```

### 2. Copiar build al repo de deploy
Copiar el contenido de `dist/` a la raíz del repo `cripto`.

### 3. Push a GitHub
```bash
cd deploy-temp   # o donde esté el repo cripto
git add -A
git commit -m "deploy: actualización CipherDesk"
git push origin main
```

### 4. Sincronizar en Ferozo
En el panel de Ferozo, hacer pull del repo en la carpeta `/aurafinance`.

## Servicios externos
| Servicio | URL |
|----------|-----|
| Supabase | https://iasuoipyowtecbaetwnr.supabase.co |
| CMC Proxy | https://cmc.lsnetinformatica.com.ar |
| Groq AI | API key embebida en build |

## Notas
- Las variables de entorno se bake-an en el build (VITE_*)
- El `.htaccess` maneja el routing SPA (todas las rutas → index.html)
- Los assets en `_source/` tienen hash → cache infinito seguro

# CuentaLibre

**Free, open-source, bilingual accounting for small business owners.**

CuentaLibre is a desktop accounting app for Windows, Mac, and Linux, built for small business owners — not accountants. It speaks plain language, works in English and Spanish, and keeps all your data on your computer.

- 💰 **Plain-language dashboard** — see money in, money out, and what's left at a glance. No accounting jargon.
- 🧾 **Invoices** — create, send, and track invoices your clients will actually understand.
- 🧰 **Expenses with trade-specific categories** — pick from 10 business types (restaurant, food truck/catering, retail, salon/barbershop, construction, cleaning, landscaping, auto repair, freelancer, childcare) and get expense categories that match your work.
- 📊 **6 report types** — run any report over any custom date range you choose, and download it as CSV.
- 💾 **Save work / Open backup** — save your books to a file and open backups whenever you need.
- 🌐 **English / Español toggle** — the whole app is fully translated, one tap to switch.
- 🔒 **Your data stays on your computer** — everything is stored locally in SQLite. No cloud, no account required, no subscription.
- 🔄 **Built-in auto-updates** — the app checks for updates from GitHub Releases and installs them automatically.

## Screenshots

Screenshots coming soon.

## Requirements

- **Node.js 20+**
- **Rust (stable)** — needed to build the desktop app

## Run it

```bash
npm install
npm run tauri dev
```

## Build installers

```bash
npm run tauri build
```

Installers are produced in `src-tauri/target/release/bundle`.

## Auto-update setup

CuentaLibre updates itself from GitHub Releases using Tauri's updater. To enable signing:

1. Generate a signing keypair:
   ```bash
   npm run tauri signer generate -w ~/.tauri/cuentalibre.key
   ```
2. Put the **public** key in `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.
3. In the same updater config, replace `YOUR_GITHUB_USERNAME` in the updater endpoints with your real GitHub org/user.
4. Add the **private** key as the `TAURI_SIGNING_PRIVATE_KEY` secret in your GitHub repository settings (plus `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` if you set a password).
5. Push a tag like `v0.1.0` — the release workflow (`.github/workflows/release.yml`) builds for Windows, Mac, and Linux, signs the update bundle, and publishes it.

## Project structure

```
cuentalibre/
├── src/                  # React + Vite + TypeScript frontend
│   ├── components/       # UI components (dashboard, invoices, expenses, reports...)
│   ├── i18n/             # English/Spanish translation dictionaries
│   └── categories/       # Trade-specific expense category packs
├── src-tauri/            # Tauri v2 backend (Rust)
│   ├── src/              # Rust commands, SQLite database layer
│   ├── icons/            # App icons
│   └── tauri.conf.json   # Tauri config (incl. updater settings)
└── .github/workflows/    # Release + CI automation
```

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first — especially the rule that **every user-facing string must exist in both English and Spanish**.

## License

CuentaLibre is [MIT licensed](LICENSE) — free forever, for everyone.

---

# CuentaLibre (Español)

**Contabilidad gratuita, de código abierto y bilingüe para dueños de pequeños negocios.**

CuentaLibre es una aplicación de contabilidad de escritorio para Windows, Mac y Linux, creada para dueños de pequeños negocios — no para contadores. Habla en lenguaje sencillo, funciona en inglés y español, y guarda todos tus datos en tu computadora.

- 💰 **Panel en lenguaje sencillo** — mira el dinero que entra, el que sale y lo que queda de un vistazo. Sin jerga contable.
- 🧾 **Facturas** — crea, envía y da seguimiento a facturas que tus clientes sí van a entender.
- 🧰 **Gastos con categorías por oficio** — elige entre 10 tipos de negocio (restaurante, food truck/catering, venta minorista, salón/barbería, construcción, limpieza, jardinería, reparación de autos, freelance, cuidado infantil) y obtén categorías de gastos que coinciden con tu trabajo.
- 📊 **6 tipos de reportes** — genera cualquier reporte en cualquier rango de fechas que elijas y descárgalo en CSV.
- 💾 **Guardar trabajo / Abrir respaldo** — guarda tus libros en un archivo y abre respaldos cuando lo necesites.
- 🌐 **Botón English / Español** — toda la aplicación está completamente traducida; cambia de idioma con un toque.
- 🔒 **Tus datos se quedan en tu computadora** — todo se guarda localmente en SQLite. Sin nube, sin cuenta, sin suscripción.
- 🔄 **Actualizaciones automáticas** — la app busca actualizaciones en GitHub Releases y las instala automáticamente.

## Capturas de pantalla

Capturas de pantalla próximamente.

## Requisitos

- **Node.js 20+**
- **Rust (estable)** — necesario para compilar la aplicación de escritorio

## Ejecutarla

```bash
npm install
npm run tauri dev
```

## Compilar instaladores

```bash
npm run tauri build
```

Los instaladores se generan en `src-tauri/target/release/bundle`.

## Configurar actualizaciones automáticas

CuentaLibre se actualiza desde GitHub Releases usando el actualizador de Tauri. Para habilitar la firma:

1. Genera un par de claves de firma:
   ```bash
   npm run tauri signer generate -w ~/.tauri/cuentalibre.key
   ```
2. Pon la clave **pública** en `src-tauri/tauri.conf.json` bajo `plugins.updater.pubkey`.
3. En la misma configuración del actualizador, reemplaza `YOUR_GITHUB_USERNAME` en las URLs con tu usuario u organización real de GitHub.
4. Agrega la clave **privada** como el secreto `TAURI_SIGNING_PRIVATE_KEY` en la configuración de tu repositorio de GitHub (más `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` si le pusiste contraseña).
5. Publica una etiqueta como `v0.1.0` — el flujo de lanzamiento (`.github/workflows/release.yml`) compila para Windows, Mac y Linux, firma el paquete de actualización y lo publica.

## Estructura del proyecto

```
cuentalibre/
├── src/                  # Frontend React + Vite + TypeScript
│   ├── components/       # Componentes de UI (panel, facturas, gastos, reportes...)
│   ├── i18n/             # Diccionarios de traducción inglés/español
│   └── categories/       # Paquetes de categorías de gastos por oficio
├── src-tauri/            # Backend Tauri v2 (Rust)
│   ├── src/              # Comandos Rust, capa de base de datos SQLite
│   ├── icons/            # Iconos de la app
│   └── tauri.conf.json   # Configuración de Tauri (incl. actualizador)
└── .github/workflows/    # Automatización de lanzamientos y CI
```

## Cómo contribuir

¡Aceptamos contribuciones! Lee primero [CONTRIBUTING.md](CONTRIBUTING.md) — especialmente la regla de que **todo texto visible para el usuario debe existir en inglés y español**.

## Licencia

CuentaLibre tiene [licencia MIT](LICENSE) — gratis para siempre, para todos.

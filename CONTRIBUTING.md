# Contributing to CuentaLibre

Welcome! CuentaLibre is a free, open-source accounting app for small business owners, and we're glad you want to help. Every contribution — code, translations, bug reports, design ideas — makes the app better for the people who use it.

## How to contribute

1. **For big changes, open an issue first.** Describe what you'd like to build or change so we can agree on the direction before you write code.
2. **Fork the repository**, create a branch, and make your changes.
3. **Open a pull request** against `main`. Keep it focused: one PR per change.
4. Wait for review. We may ask for changes — that's normal and part of the process.

## Dev setup

```bash
npm install
npm run tauri dev
```

You need Node.js 20+ and Rust (stable) installed.

## Code rules

These are the rules that keep CuentaLibre trustworthy for its users. Please follow them all.

- **Bilingual, always.** EVERY user-facing string must exist in both English and Spanish in the i18n dictionary. No hardcoded UI text — no exceptions.
- **Plain language only.** Write for small business owners, not accountants. No accounting jargon.
- **Category packs need EN+ES labels for every category.** If you add or change a trade-specific category, provide both translations.
- **Type-check before pushing.** Run `npx tsc --noEmit` and fix all errors before opening your PR.
- **Keep PRs focused.** One change per PR, and small enough to review in one sitting.

Thanks for helping make accounting easier for everyone. ❤️

---

# Cómo contribuir a CuentaLibre

¡Bienvenido/a! CuentaLibre es una aplicación de contabilidad gratuita y de código abierto para dueños de pequeños negocios, y nos alegra que quieras ayudar. Cada contribución — código, traducciones, reportes de errores, ideas de diseño — hace la app mejor para quienes la usan.

## Cómo contribuir

1. **Para cambios grandes, abre un issue primero.** Describe lo que quieres construir o cambiar para que podamos acordar la dirección antes de que escribas código.
2. **Haz un fork del repositorio**, crea una rama y haz tus cambios.
3. **Abre un pull request** contra `main`. Manténlo enfocado: un PR por cambio.
4. Espera la revisión. Es posible que pidamos cambios — eso es normal y parte del proceso.

## Configuración de desarrollo

```bash
npm install
npm run tauri dev
```

Necesitas Node.js 20+ y Rust (estable) instalados.

## Reglas de código

Estas son las reglas que mantienen a CuentaLibre confiable para sus usuarios. Por favor, síguelas todas.

- **Bilingüe, siempre.** TODO texto visible para el usuario debe existir en inglés y español en el diccionario i18n. Nada de texto fijo en la interfaz — sin excepciones.
- **Solo lenguaje sencillo.** Escribe para dueños de pequeños negocios, no para contadores. Sin jerga contable.
- **Los paquetes de categorías necesitan etiquetas EN+ES para cada categoría.** Si agregas o cambias una categoría por oficio, proporciona ambas traducciones.
- **Verifica los tipos antes de subir cambios.** Ejecuta `npx tsc --noEmit` y corrige todos los errores antes de abrir tu PR.
- **Mantén los PRs enfocados.** Un cambio por PR, y lo suficientemente pequeño para revisarlo de una sentada.

Gracias por ayudar a hacer la contabilidad más fácil para todos. ❤️

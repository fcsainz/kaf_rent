# Sistema de Diseño Visual — KAF Rent

**Versión:** 1.0
**Fecha:** 2026-06-24
**Decisión de referencia:** [ADR-0011](0011-sistema-diseno-visual.md)
**Estándares de UX/UI:** [CLAUDE.md](../../CLAUDE.md) §4 (este documento aporta los *tokens* concretos que aquellos principios exigen)

Documento de referencia para construir cualquier interfaz de KAF Rent. La dirección visual es **cálida y de hospitalidad** (terracota + oliva), con tipografía **amigable moderna** (Poppins + Inter) y **formas redondeadas**. Pensado para Google Apps Script HTML Service: tokens en CSS custom properties, listos para pegar en `:root`.

---

## 1. Marca y tono

- **Personalidad:** acogedora, cercana, fiable. Una herramienta operativa que no intimida a usuarios no técnicos.
- **Principios visuales:** claridad sobre densidad, mucho aire, jerarquía evidente, color con intención (no decorativo).
- El color **nunca** es el único portador de significado: siempre acompañado de texto o icono (accesibilidad).

---

## 2. Paleta de color

### 2.1 Color de marca — Terracota (primario)

| Token | Hex | Uso |
|---|---|---|
| `--c-primary-50` | `#FBF1EC` | fondos muy suaves, hover de filas |
| `--c-primary-100` | `#F6E0D5` | fondos de chips/badges suaves |
| `--c-primary-300` | `#DD9A7B` | bordes/acentos suaves |
| `--c-primary-500` | `#B5562E` | **color primario base** (botones, enlaces, acentos) |
| `--c-primary-600` | `#9A4727` | hover de primario |
| `--c-primary-700` | `#8E4322` | active / texto primario sobre fondo claro (contraste AA) |
| `--c-primary-900` | `#4F2412` | texto sobre fondos primarios claros |

### 2.2 Color secundario — Oliva (acento)

| Token | Hex | Uso |
|---|---|---|
| `--c-accent-50` | `#F2F4EC` | fondos suaves |
| `--c-accent-100` | `#E2E8D4` | badges suaves |
| `--c-accent-500` | `#5E7C46` | **acento base** (resaltes secundarios, foco) |
| `--c-accent-600` | `#4D6739` | hover |
| `--c-accent-700` | `#3D522E` | texto de acento sobre claro |

### 2.3 Colores semánticos de estado

| Token | Hex | Fondo suave | Uso |
|---|---|---|---|
| `--c-success` | `#4C8C4A` | `#E6F2E6` | éxito, cobro ingresado, completada |
| `--c-warning` | `#D08A1E` | `#FBEFD9` | aviso, reserva abierta/pendiente |
| `--c-error` | `#B23A2E` | `#F7E2DF` | error, acción destructiva |
| `--c-info` | `#4A6D7C` | `#E5EDF0` | información neutra |

### 2.4 Neutros (gris cálido, afín a la paleta)

| Token | Hex | Uso |
|---|---|---|
| `--c-bg` | `#FBF8F4` | fondo de la app |
| `--c-surface` | `#FFFFFF` | tarjetas, paneles, modales |
| `--c-surface-alt` | `#F5F0E9` | cabeceras de tabla, zonas alternas |
| `--c-border` | `#ECE5DC` | bordes y separadores |
| `--c-border-strong` | `#D9CFC2` | bordes de inputs, divisores marcados |
| `--c-text` | `#2A2420` | texto principal |
| `--c-text-muted` | `#6E655C` | texto secundario, etiquetas |
| `--c-text-disabled` | `#A89E92` | texto deshabilitado |

### 2.5 Mapa de color por estado de reserva y por espacio

| Concepto | Color | Token |
|---|---|---|
| Estado **Abierta** | amber | `--c-warning` |
| Estado **Completada** | verde | `--c-success` |
| Estado **Cancelada** | gris | `--c-text-muted` |
| Espacio **Piscina / Jardín** (eventos Calendar, badges) | oliva | `--c-accent-500` |
| Espacio **Habitación** | terracota | `--c-primary-500` |

### 2.6 Reglas de contraste (WCAG 2.1 AA)

- Texto normal: contraste mínimo **4.5:1**; texto grande/negrita (≥18px bold): **3:1**.
- Sobre **terracota `#B5562E`** usar **texto blanco** y solo para texto grande/botones. Para texto pequeño de color terracota sobre fondo claro, usar `--c-primary-700`.
- Verificar siempre los pares texto/fondo antes de fijar un color nuevo.

---

## 3. Tipografía

- **Títulos:** **Poppins** (geométrica redondeada) — pesos 500/600/700.
- **Cuerpo e interfaz:** **Inter** — pesos 400/500/600.
- **Fallback:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Carga (en el `<head>` del HTML Service):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
```

### Escala tipográfica (base 16px = 1rem)

| Rol | Familia / peso | Tamaño | Interlineado |
|---|---|---|---|
| Display (título de pantalla) | Poppins 600 | 2rem (32px) | 1.2 |
| H1 | Poppins 600 | 1.5rem (24px) | 1.25 |
| H2 | Poppins 600 | 1.25rem (20px) | 1.3 |
| H3 | Poppins 500 | 1.125rem (18px) | 1.35 |
| Cuerpo | Inter 400 | 1rem (16px) | 1.5 |
| Cuerpo fuerte / etiquetas | Inter 600 | 1rem (16px) | 1.5 |
| Pequeño | Inter 400 | 0.875rem (14px) | 1.45 |
| Caption / ayuda | Inter 400 | 0.75rem (12px) | 1.4 |

Tamaño mínimo de cuerpo legible: **16px** (no bajar de 14px en texto informativo).

---

## 4. Espaciado, radios y sombras

### Espaciado (escala base 4px)

| Token | Valor |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |
| `--space-8` | 64px |

### Radios (formas redondeadas)

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | 6px | chips pequeños, inputs compactos |
| `--radius-md` | 10px | **por defecto**: inputs, botones, tarjetas |
| `--radius-lg` | 16px | modales, paneles grandes |
| `--radius-pill` | 999px | badges de estado, etiquetas |

### Sombras

| Token | Valor | Uso |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(42,36,32,.06)` | tarjetas en reposo |
| `--shadow-md` | `0 4px 12px rgba(42,36,32,.10)` | dropdowns, elementos elevados |
| `--shadow-lg` | `0 12px 32px rgba(42,36,32,.18)` | modales |

---

## 5. Estados interactivos

Aplican a todo elemento interactivo (botones, enlaces, filas, inputs):

- **Hover:** oscurecer el color un paso (p. ej. primario 500 → 600).
- **Active:** un paso más (600 → 700) o ligero `scale(.99)`.
- **Focus:** **anillo visible siempre** — `outline: 2px solid var(--c-accent-500); outline-offset: 2px;` (nunca quitar el foco sin sustituirlo).
- **Disabled:** `opacity: .5; cursor: not-allowed;` y color neutro; sin hover.

---

## 6. Componentes base

### Botones
- **Primario:** fondo `--c-primary-500`, texto blanco, `--radius-md`, padding `10px 16px`, peso Inter 600. Hover 600 / active 700.
- **Secundario:** fondo transparente, borde `--c-primary-500`, texto `--c-primary-700`.
- **Fantasma (ghost):** sin borde, texto `--c-primary-700`, hover fondo `--c-primary-50`.
- **Destructivo:** fondo `--c-error`, texto blanco (cancelar/borrar).
- Etiqueta con **verbo del dominio** ("Crear Reserva", "Guardar", no "Aceptar"). Una sola acción primaria por pantalla.
- Deshabilitar el botón mientras una llamada `google.script.run` esté en vuelo.

### Inputs y formularios
- Etiqueta **visible encima** del campo (no solo placeholder). Campos obligatorios marcados.
- Borde `--c-border-strong`, `--radius-md`, padding `10px 12px`, foco con anillo de acento.
- Estado error: borde `--c-error` + mensaje accionable debajo en `--c-error`.
- Validación en dos capas (cliente + servidor, CLAUDE.md §2.8).

### Tablas (últimas reservas, gestionar)
- Cabecera fondo `--c-surface-alt`, texto `--c-text-muted` en mayúscula sutil, peso 600.
- Filas con separador `--c-border`; hover `--c-primary-50`.
- Columnas ordenables con indicador ▲/▼.
- Importes alineados a la derecha; estados como badge (ver abajo).

### Badges de estado
- Pastilla `--radius-pill`, padding `2px 10px`, texto 0.75rem peso 600, fondo suave + texto del color de estado (p. ej. Completada: fondo `#E6F2E6`, texto `--c-success`).

### Tarjetas / paneles
- Fondo `--c-surface`, borde `--c-border`, `--radius-lg`, `--shadow-sm`, padding `--space-5`.

### Modales (confirmación de acciones destructivas)
- Overlay `rgba(42,36,32,.45)`; contenedor `--c-surface`, `--radius-lg`, `--shadow-lg`.
- Texto que explica la consecuencia; botón destructivo (`--c-error`) claramente diferenciado del de volver.

### Estados vacíos
- Icono o ilustración ligera + mensaje claro + acción ("No hay reservas registradas" + botón "Crear Reserva"). Nunca pantalla en blanco.

### Feedback
- **Carga:** spinner/indicador en operaciones que tarden (GAS puede tardar segundos).
- **Éxito/Error:** toast o banner; los errores, accionables (qué pasó + cómo resolver). Sin fallo silencioso.

---

## 7. Iconografía

- Set ligero y consistente (p. ej. Material Symbols o SVG inline), trazo medio, esquinas redondeadas afines a las formas.
- Siempre acompañado de texto en acciones importantes; nunca un icono solo para algo crítico.

---

## 8. Tokens CSS (`:root`) — copiar al proyecto

```css
:root {
  /* Marca */
  --c-primary-50:#FBF1EC; --c-primary-100:#F6E0D5; --c-primary-300:#DD9A7B;
  --c-primary-500:#B5562E; --c-primary-600:#9A4727; --c-primary-700:#8E4322; --c-primary-900:#4F2412;
  --c-accent-50:#F2F4EC; --c-accent-100:#E2E8D4; --c-accent-500:#5E7C46; --c-accent-600:#4D6739; --c-accent-700:#3D522E;
  /* Semánticos */
  --c-success:#4C8C4A; --c-success-bg:#E6F2E6;
  --c-warning:#D08A1E; --c-warning-bg:#FBEFD9;
  --c-error:#B23A2E;   --c-error-bg:#F7E2DF;
  --c-info:#4A6D7C;    --c-info-bg:#E5EDF0;
  /* Neutros */
  --c-bg:#FBF8F4; --c-surface:#FFFFFF; --c-surface-alt:#F5F0E9;
  --c-border:#ECE5DC; --c-border-strong:#D9CFC2;
  --c-text:#2A2420; --c-text-muted:#6E655C; --c-text-disabled:#A89E92;
  /* Espaciado */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:24px; --space-6:32px; --space-7:48px; --space-8:64px;
  /* Radios */
  --radius-sm:6px; --radius-md:10px; --radius-lg:16px; --radius-pill:999px;
  /* Sombras */
  --shadow-sm:0 1px 2px rgba(42,36,32,.06);
  --shadow-md:0 4px 12px rgba(42,36,32,.10);
  --shadow-lg:0 12px 32px rgba(42,36,32,.18);
  /* Tipografía */
  --font-head:"Poppins", system-ui, sans-serif;
  --font-body:"Inter", system-ui, sans-serif;
}
```

---

## 9. Pendiente

- Set de iconos definitivo.
- Logotipo / wordmark de KAF Rent.
- Modo oscuro (no prioritario para uso interno).
- Maquetas de alta fidelidad de Inicio, Crear, Gestionar y Estadísticas aplicando estos tokens.

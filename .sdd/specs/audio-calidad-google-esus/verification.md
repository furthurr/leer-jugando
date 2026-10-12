# Verificación — Generación de audio con Google Cloud TTS es-US

Modo SDD: standard
Fase: Verificación
Estado: cerrada
Gate 4: aprobado

## Ciclo de pruebas

- Estrategia: TDD focalizado (`node:test`) con clientes SDK inyectados; ninguna
  prueba usa ADC ni envía solicitudes reales.
- RED/GREEN: cada tarea de Wave 1–2 registró RED observado y GREEN en `tasks.md`.
- Suite: `npm test` → **97/97**, 0 fallos.
- Cobertura de audio: `npm run verificar` → **284 esperados, 0 faltantes, 0 sobrantes**.
- Excepción: la calidad de acento/ritmo no es automatizable; se verificó con
  escucha humana del piloto (`es-US-Neural2-C`) y muestra lenta.

## Matriz de trazabilidad

| Requisito | Tarea(s) | Evidencia | Estado |
|-----------|----------|-----------|--------|
| Req 1.1 | 1.1, 1.2, 1.3 | `tools/google-tts.mjs`, `tools/plan-generacion-google.js`; `node --test tests/google-tts.test.js` | ✅ |
| Req 1.2 | 1.1, 2.2, 3.2 | `tools/tmp/google-pilot/2026-10-08T03-14-49-307Z/` (12 WAV + 12 MP3) | ✅ |
| Req 1.3 | 3.3 | Escucha del usuario; muestra lenta `tools/tmp/google-pilot-slow/es-US-Neural2-C/` | ✅ |
| Req 1.4 | 2.1, 3.3 | Flags `--acepto-piloto`/`--confirmar-lote`; piloto MiMo rechazado se conservó | ✅ |
| Req 1.5 | 2.3, 3.4 | Lote 279/279 con `es-US-Neural2-C`; `npm run verificar` 284/284 | ✅ |
| Req 1.6 | 2.3, 3.4 | Efectos `cmp` idénticos; respaldo `tools/tmp/google-backup/audio-2026-10-08T03-30-32-008Z/` | ✅ |
| Req 1.7 | 2.1, 2.3 | `tests/generar-audios-google.test.js` error API/ADC sin publicar | ✅ |
| Req 1.8 | 2.1, 3.1 | `--confirmar-costo` obligatorio; bloqueo antes de ADC sin flag | ✅ |
| Req 1.9 | 1.2, 2.4 | ADC fuera del repo; `.gitignore`; tests sin credenciales | ✅ |
| Req 1.10 | 2.4, 4.2 | `rg "googleapis|GOOGLE_|texttospeech|API_KEY" index.html css js` → 0 | ✅ |
| Req 1.11 | 2.3, 4.1, 4.2 | Verificador 284/0/0; paquete 4.04 MB (<20 MB) | ✅ |

## Self-check RNF

| RNF | Evidencia | Estado |
|-----|-----------|--------|
| Runtime offline sin credenciales | 0 referencias a Google/API_KEY en `index.html`, `css/`, `js/` | ✅ |
| API solo en herramientas locales | SDK usado en `tools/`; `devDependencies` | ✅ |
| Secretos fuera del repositorio | ADC en `~/.config/gcloud`; `.env` ignorado; sin tokens en logs | ✅ |
| Efectos preservados | `cmp` byte a byte contra respaldo | ✅ |
| Límite de tamaño | Paquete reportado 4.04 MB | ✅ |

## Pasos humanos pendientes

- Abrir `index.html` con doble clic (protocolo `file://`) y sin red, y confirmar
  que las voces nuevas se escuchan bien en el flujo real del juego.

## Cierre

Todos los requisitos tienen evidencia salvo la comprobación manual final en
navegador, que se registra como paso humano.

"""Sintetiza en lote con Piper cargando la voz una sola vez.

Uso: python piper_lote.py <modelo.onnx> <lote.json>
lote.json = [{"texto": "...", "wav": "ruta.wav", "lento": 1.1}, ...]
"""
import json
import sys
import wave

from piper import PiperVoice, SynthesisConfig


def main() -> int:
    modelo, lote = sys.argv[1], sys.argv[2]
    voz = PiperVoice.load(modelo)
    with open(lote, encoding="utf-8") as f:
        items = json.load(f)
    for i, item in enumerate(items, 1):
        config = SynthesisConfig(length_scale=item.get("lento", 1.1))
        with wave.open(item["wav"], "wb") as w:
            voz.synthesize_wav(item["texto"], w, syn_config=config)
        print(f"[{i}/{len(items)}] {item['texto']}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())

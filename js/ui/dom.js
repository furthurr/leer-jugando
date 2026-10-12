/* Utilidades de DOM. Todo el texto se inserta con textContent/nodos de texto (nunca innerHTML). */
(function (raiz) {
  'use strict';

  /**
   * el('button', { class: 'x', texto: 'Hola', onclick: fn, 'aria-label': '...' }, hijo1, hijo2)
   * Los hijos string se convierten en nodos de texto.
   */
  function el(tag, props, ...hijos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'texto') e.textContent = v;
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else if (k === 'estilo') Object.assign(e.style, v);
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : String(v));
    }
    for (const h of hijos.flat(Infinity)) {
      if (h === null || h === undefined || h === false) continue;
      e.append(h && typeof h === 'object' && h.nodeType ? h : document.createTextNode(String(h)));
    }
    return e;
  }

  /** Mantener pulsado `ms` milisegundos para ejecutar `accion` (zona de adultos, Req 7.1). */
  function mantenerPulsado(elemento, ms, accion) {
    let temporizador = null;
    const cancelar = () => {
      clearTimeout(temporizador); temporizador = null;
      elemento.classList.remove('cargando');
    };
    elemento.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      elemento.style.setProperty('--duracion', ms + 'ms');
      elemento.classList.add('cargando');
      temporizador = setTimeout(() => { cancelar(); accion(); }, ms);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => elemento.addEventListener(t, cancelar));
    elemento.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }

  /** Reinicia una animación CSS de una sola vez (p. ej. "sacudir"). */
  function animar(elemento, clase) {
    elemento.classList.remove(clase);
    void elemento.offsetWidth; // fuerza reflow para reiniciar la animación
    elemento.classList.add(clase);
    elemento.addEventListener('animationend', () => elemento.classList.remove(clase), { once: true });
  }

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  const api = { el, mantenerPulsado, animar, esperar };
  raiz.LEER = raiz.LEER || {};
  raiz.LEER.dom = api;
  raiz.LEER.pantallas = raiz.LEER.pantallas || {};
  raiz.LEER.actividades = raiz.LEER.actividades || {};
})(this);

/* Pantalla de perfil: nombre (lo escribe un adulto) y sexo. Permite saltar (Req 9.1-9.5). */
(function (raiz) {
  'use strict';
  const { el } = raiz.LEER.dom;
  const perfilDom = raiz.LEER.perfil;

  function pantallaPerfil(app, { inicial } = {}) {
    let sexo = inicial ? inicial.sexo : null;

    const aviso = el('p', { class: 'aviso', 'aria-live': 'polite' });
    const campo = el('input', {
      class: 'campo-nombre', type: 'text', inputmode: 'text', autocomplete: 'off',
      maxlength: '20', placeholder: 'Nombre', 'aria-label': 'Nombre del niño o niña',
      value: inicial && inicial.nombre ? inicial.nombre : '',
    });

    const botonNino = el('button', { class: 'sexo-nino', 'aria-pressed': sexo === 'm' },
      el('span', { texto: '👦' }), 'niño');
    const botonNina = el('button', { class: 'sexo-nina', 'aria-pressed': sexo === 'f' },
      el('span', { texto: '👧' }), 'niña');

    function elegirSexo(valor, boton, palabra) {
      sexo = valor;
      botonNino.setAttribute('aria-pressed', String(valor === 'm'));
      botonNina.setAttribute('aria-pressed', String(valor === 'f'));
      app.decirPalabra(palabra);
    }
    botonNino.addEventListener('click', () => elegirSexo('m', botonNino, 'niño'));
    botonNina.addEventListener('click', () => elegirSexo('f', botonNina, 'niña'));

    const listo = el('button', { class: 'boton-grande boton-exito', texto: 'Listo', disabled: true });

    function revisar() {
      const r = perfilDom.validarNombre(campo.value);
      const ok = r.ok || campo.value.trim() === ''; // vacío = se permite saltar
      campo.setAttribute('aria-invalid', String(!ok && campo.value.trim() !== ''));
      aviso.textContent = ok ? '' : 'Usa solo letras (máximo 20).';
      listo.disabled = !ok || campo.value.trim() === '';
    }
    campo.addEventListener('input', revisar);

    listo.addEventListener('click', () => {
      const r = perfilDom.validarNombre(campo.value);
      app.guardarPerfil({ nombre: r.ok ? r.valor : null, sexo });
    });

    const saltar = el('button', { class: 'boton-texto', texto: 'Saltar', onclick: () => app.guardarPerfil({ nombre: null, sexo }) });

    return el('div', { class: 'pantalla centro' },
      el('div', { class: 'emoji-gigante', texto: '👋' }),
      el('p', { class: 'etiqueta-adulto', texto: 'Para el adulto: escribe el nombre' }),
      campo,
      aviso,
      el('p', { class: 'subtitulo', texto: '¿Eres niño o niña?' }),
      el('div', { class: 'sexo' }, botonNino, botonNina),
      el('div', { class: 'acciones' }, saltar, listo));
  }

  raiz.LEER.pantallas.perfil = pantallaPerfil;
})(this);

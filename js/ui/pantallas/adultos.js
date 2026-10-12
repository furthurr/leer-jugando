/* Zona de adultos: reiniciar, desbloquear todo, volumen y editar/borrar el perfil (Req 7.2-7.5). */
(function (raiz) {
  'use strict';
  const { el } = raiz.LEER.dom;

  function adultos(app) {
    const estado = app.estado;

    // Volumen (Req 7.4)
    const rango = el('input', { type: 'range', min: '0', max: '100', value: String(Math.round(app.reproductor.getVolumen() * 100)), 'aria-label': 'Volumen' });
    rango.addEventListener('input', () => {
      const v = Number(rango.value) / 100;
      app.reproductor.setVolumen(v);
      app.actualizar({ volumen: v });
    });
    rango.addEventListener('change', () => app.reproductor.reproducir(app.clavesAudio.ruta('efectos', 'clic')));

    // Reiniciar (Req 7.2) con confirmación
    const reiniciar = el('button', { class: 'boton-peligro boton-texto', texto: 'Reiniciar progreso' });
    const confirmar = el('div', { class: 'acciones' });
    reiniciar.addEventListener('click', () => {
      confirmar.textContent = '';
      confirmar.append(
        el('span', { texto: '¿Seguro? Se borrarán las estrellas.' }),
        el('button', { class: 'boton-peligro boton-texto', texto: 'Sí, borrar', onclick: () => { app.reiniciarProgreso(); app.irAMapa(); } }),
        el('button', { class: 'boton-texto', texto: 'No', onclick: () => { confirmar.textContent = ''; } }));
    });

    // Desbloquear todo (Req 7.3)
    const desbloquear = el('button', { class: 'boton-texto', texto: estado.todoDesbloqueado ? 'Todo desbloqueado ✔' : 'Desbloquear todos los niveles', disabled: estado.todoDesbloqueado });
    desbloquear.addEventListener('click', () => { app.actualizar({ todoDesbloqueado: true }); desbloquear.disabled = true; desbloquear.textContent = 'Todo desbloqueado ✔'; });

    // Editar / borrar perfil (Req 7.5)
    const editar = el('button', { class: 'boton-texto', texto: 'Cambiar nombre y sexo', onclick: () => app.editarPerfil() });
    const borrar = el('button', { class: 'boton-texto', texto: 'Borrar perfil', onclick: () => { app.actualizarPerfil({ nombre: null, sexo: null }); borrar.textContent = 'Perfil borrado ✔'; } });

    const perfilTexto = estado.perfil.nombre
      ? estado.perfil.nombre + ' (' + (estado.perfil.sexo === 'm' ? 'niño' : estado.perfil.sexo === 'f' ? 'niña' : 'sin sexo') + ')'
      : 'sin nombre';

    return el('div', { class: 'pantalla' },
      el('div', { class: 'barra' },
        el('button', { class: 'icono', texto: '🏠', 'aria-label': 'Volver', onclick: () => app.irAMapa() }),
        el('h1', { class: 'titulo', texto: 'Adultos' }),
        el('span', { texto: '' })),
      el('div', { class: 'adultos' },
        el('section', {}, el('h2', { texto: 'Sonido' }), rango),
        el('section', {}, el('h2', { texto: 'Perfil' }),
          el('p', { texto: 'Actual: ' + perfilTexto }),
          el('div', { class: 'acciones' }, editar, borrar)),
        el('section', {}, el('h2', { texto: 'Niveles' }), desbloquear),
        el('section', {}, el('h2', { texto: 'Empezar de nuevo' }), reiniciar, confirmar)));
  }

  raiz.LEER.pantallas.adultos = adultos;
})(this);

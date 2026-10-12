/* Composition root: crea servicios, los inyecta y enruta pantallas. Única pieza que une todo. */
(function (raiz) {
  'use strict';
  const L = raiz.LEER;

  function iniciar() {
    const contenedor = document.getElementById('app');

    // Infraestructura (adaptadores del navegador), creada una sola vez aquí.
    const storage = (() => { try { return raiz.localStorage; } catch (_) { return null; } })();
    const almacen = L.almacen.crearAlmacen(storage, console);
    const reproductor = L.reproductor.crearReproductor(() => new raiz.Audio(), console);
    const vozNombre = L.vozNombre.crearVozNombre(raiz.speechSynthesis, console);

    const carga = almacen.cargar();
    const orden = contenido().niveles.map((n) => n.id);

    const app = {
      contenido: contenido(),
      progreso: L.progreso,
      sesion: L.sesion,
      perfil: L.perfil,
      clavesAudio: L.clavesAudio,
      reproductor, vozNombre,
      estado: carga.datos,
      audioListo: false,
      enfocar: null,

      // --- estado persistente ---
      actualizar(parche) {
        this.estado = { ...this.estado, ...parche };
        almacen.guardar(this.estado);
      },
      actualizarPerfil(perfil) {
        this.estado = L.progreso.conPerfil(this.estado, perfil);
        almacen.guardar(this.estado);
      },
      reiniciarProgreso() {
        this.estado = L.progreso.reiniciar(this.estado);
        almacen.guardar(this.estado);
      },

      // --- navegación ---
      mostrar(nodo) { contenedor.textContent = ''; contenedor.append(nodo); if (this.enfocar) { const f = this.enfocar; this.enfocar = null; setTimeout(f, 60); } },
      continuarDesdeInicio() { reproductor.setVolumen(this.estado.volumen); L.progreso.tienePerfil(this.estado) ? this.irASaludo() : this.irAPerfil(); },
      irAPerfil(inicial) { this.mostrar(L.pantallas.perfil(this, { inicial })); },
      editarPerfil() { this.mostrar(L.pantallas.perfil(this, { inicial: this.estado.perfil })); },
      guardarPerfil(perfil) { this.actualizarPerfil(perfil); this.irASaludo(); },
      irASaludo() { this.mostrar(L.pantallas.saludo(this)); },
      irAMapa() { reproductor.detener(); this.mostrar(L.pantallas.mapa(this)); },
      irAAdultos() { reproductor.reproducir(this.clavesAudio.ruta('instr', 'adultos')); this.mostrar(L.pantallas.adultos(this)); },
      jugarNivel(id) { reproductor.detener(); this.mostrar(L.pantallas.actividad(this, id)); },
      terminarNivel(nivel, resultado) {
        this.estado = L.progreso.registrar(this.estado, nivel.id, resultado.estrellas);
        almacen.guardar(this.estado);
        this.mostrar(L.pantallas.celebracion(this, nivel, resultado));
      },

      // --- ayudas ---
      pasoNombre(nombre) {
        if (!nombre) return null;
        const clave = nombre.trim().toLowerCase();
        const grabados = this.contenido.nombresGrabados;
        if (Object.prototype.hasOwnProperty.call(grabados, clave)) {
          return this.clavesAudio.ruta('palabras', clave);
        }
        return vozNombre.disponible() ? () => vozNombre.decir(nombre, reproductor.getVolumen()) : null;
      },
      siguienteNivel(id) { const i = orden.indexOf(id); const sig = orden[i + 1]; return sig && L.progreso.estaDesbloqueado(orden, sig, this.estado) ? sig : null; },
      felicitacionAleatoria() {
        const base = this.contenido.FELICITACIONES[Math.floor(Math.random() * this.contenido.FELICITACIONES.length)];
        const esObjeto = typeof this.contenido.instrucciones[base] === 'object';
        return esObjeto ? base + '-' + L.perfil.variante(this.estado.perfil.sexo) : base;
      },
      reproducir(ruta) { return reproductor.reproducir(ruta); },
      decirPalabra(palabra) { reproductor.reproducir(this.clavesAudio.ruta('palabras', palabra)); },
    };

    app.mostrar(L.pantallas.inicio(app));
  }

  function contenido() { return raiz.LEER.contenido; }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(this);

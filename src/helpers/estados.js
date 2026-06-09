const ESTADOS = {
  TRAMITE: {
    INICIADO:    ['EN_REVISION'],
    EN_REVISION: ['OBSERVADO', 'APROBADO'],
    OBSERVADO:   ['CORREGIDO'],
    CORREGIDO:   ['EN_REVISION'],
    APROBADO:    ['FINALIZADO'],
    FINALIZADO:  [],
  },
  HITO: {
    PENDIENTE:   ['EN_REVISION'],
    EN_REVISION: ['OBSERVADO', 'APROBADO'],
    OBSERVADO:   ['EN_REVISION'],
    APROBADO:    [],
  },
  DOCUMENTO: {
    SUBIDO:      ['EN_REVISION'],
    EN_REVISION: ['OBSERVADO', 'APROBADO'],
    OBSERVADO:   [],       // el reemplazo genera nuevo doc con SUBIDO
    APROBADO:    [],
    REEMPLAZADO: [],
  },
  CONVENIO: {
    EN_PROCESO:  ['VIGENTE', 'CADUCADO'],
    VIGENTE:     ['SUSPENDIDO', 'FINALIZADO', 'CADUCADO'],
    SUSPENDIDO:  ['VIGENTE', 'FINALIZADO'],
    FINALIZADO:  [],
    CADUCADO:    [],
  },
};

function transicionValida(categoria, estadoActual, estadoNuevo) {
  const siguientes = ESTADOS[categoria]?.[estadoActual];
  if (!siguientes) return false;
  return siguientes.includes(estadoNuevo);
}

function siguientesEstados(categoria, estadoActual) {
  return ESTADOS[categoria]?.[estadoActual] ?? [];
}

module.exports = { ESTADOS, transicionValida, siguientesEstados };

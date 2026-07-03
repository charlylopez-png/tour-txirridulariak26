// Motor de cálculo de la Porra Tour de Francia 2026
// Tabla de puntos tal cual la hoja "Puntuación" original

const TABLA_PUNTOS = {
  etapa:              [100, 80, 70, 60, 50, 40, 30, 20, 10, 5],
  generalDiaria:      [50, 45, 40, 35, 30, 25, 20, 15, 10, 5],
  generalFinal:       [600, 400, 200, 125, 100, 80, 70, 60, 50, 40],
  regularidadDiaria:  [25, 20, 15, 10, 5],
  regularidadFinal:   [25, 20, 15, 10, 5],
  montanaDiaria:      [25, 20, 15, 10, 5],
  montanaFinal:       [125, 75, 50, 30, 15],
  equiposDiaria:      [25, 20, 15, 10, 5],
  equiposFinal:       [25, 20, 15, 10, 5],
};

function normaliza(txt) {
  if (!txt) return "";
  return txt
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function puntosDeLista(lista, nombre, tabla) {
  if (!lista || !lista.length) return 0;
  const objetivo = normaliza(nombre);
  const idx = lista.findIndex((n) => normaliza(n) === objetivo);
  if (idx === -1 || idx >= tabla.length) return 0;
  return tabla[idx];
}

// Calcula el desglose de puntos de UNA etapa para UN participante
function puntosEtapaParticipante(participante, etapaResultado) {
  let total = 0;
  const detalle = [];

  (participante.corredores || []).forEach((corredor) => {
    const pEtapa = puntosDeLista(etapaResultado.etapa, corredor, TABLA_PUNTOS.etapa);
    const pGeneral = puntosDeLista(etapaResultado.general, corredor, TABLA_PUNTOS.generalDiaria);
    const pPuntos = puntosDeLista(etapaResultado.puntos, corredor, TABLA_PUNTOS.regularidadDiaria);
    const pMontana = puntosDeLista(etapaResultado.montana, corredor, TABLA_PUNTOS.montanaDiaria);
    const suma = pEtapa + pGeneral + pPuntos + pMontana;
    if (suma > 0) detalle.push({ nombre: corredor, puntos: suma, tipo: "corredor" });
    total += suma;
  });

  (participante.equipos || []).forEach((equipo) => {
    const pEquipo = puntosDeLista(etapaResultado.equipos, equipo, TABLA_PUNTOS.equiposDiaria);
    if (pEquipo > 0) detalle.push({ nombre: equipo, puntos: pEquipo, tipo: "equipo" });
    total += pEquipo;
  });

  return { total, detalle };
}

// Calcula el bonus final (clasificaciones definitivas del Tour) para UN participante
function puntosBonusFinal(participante, bonusFinal) {
  if (!bonusFinal) return { total: 0, detalle: [] };
  let total = 0;
  const detalle = [];

  (participante.corredores || []).forEach((corredor) => {
    const pGeneral = puntosDeLista(bonusFinal.general, corredor, TABLA_PUNTOS.generalFinal);
    const pPuntos = puntosDeLista(bonusFinal.puntos, corredor, TABLA_PUNTOS.regularidadFinal);
    const pMontana = puntosDeLista(bonusFinal.montana, corredor, TABLA_PUNTOS.montanaFinal);
    const suma = pGeneral + pPuntos + pMontana;
    if (suma > 0) detalle.push({ nombre: corredor, puntos: suma, tipo: "corredor-final" });
    total += suma;
  });

  (participante.equipos || []).forEach((equipo) => {
    const pEquipo = puntosDeLista(bonusFinal.equipos, equipo, TABLA_PUNTOS.equiposFinal);
    if (pEquipo > 0) detalle.push({ nombre: equipo, puntos: pEquipo, tipo: "equipo-final" });
    total += pEquipo;
  });

  return { total, detalle };
}

// Calcula la clasificación general completa: total y evolución día a día por participante
function calcularClasificacion(datos) {
  const participantes = datos.participantes || [];
  const resultados = (datos.resultados || []).slice().sort((a, b) => a.numero - b.numero);
  const bonusFinal = datos.bonusFinal || null;

  const filas = participantes.map((p) => {
    let acumulado = 0;
    const porEtapa = resultados.map((r) => {
      const { total } = puntosEtapaParticipante(p, r);
      acumulado += total;
      return { numero: r.numero, nombre: r.nombre, puntosDia: total, acumulado };
    });

    const bonus = puntosBonusFinal(p, bonusFinal);
    const totalFinal = acumulado + bonus.total;

    return {
      id: p.id,
      nombre: p.nombre,
      corredores: p.corredores,
      equipos: p.equipos,
      porEtapa,
      puntosBonus: bonus.total,
      detalleBonus: bonus.detalle,
      total: totalFinal,
    };
  });

  filas.sort((a, b) => b.total - a.total);
  filas.forEach((f, i) => (f.posicion = i + 1));
  return filas;
}

if (typeof module !== "undefined") {
  module.exports = { TABLA_PUNTOS, calcularClasificacion, puntosEtapaParticipante, puntosBonusFinal, normaliza };
}

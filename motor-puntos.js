// Motor de cálculo de la Porra Tour de Francia 2026
// Tabla de puntos tal cual la hoja "Puntuación" original.
// El admin puede sobreescribir estos valores (se guardan en datos.tablaPuntos);
// si no hay nada personalizado, se usan estos valores por defecto.

const TABLA_PUNTOS_DEFECTO = {
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

// Devuelve la tabla de puntos activa: la personalizada por el admin si existe
// (fusionada categoría a categoría), o si no la de defecto.
function obtenerTablaPuntos(datos){
  const personalizada = datos && datos.tablaPuntos;
  if(!personalizada) return TABLA_PUNTOS_DEFECTO;
  return { ...TABLA_PUNTOS_DEFECTO, ...personalizada };
}

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
function puntosEtapaParticipante(participante, etapaResultado, tabla) {
  tabla = tabla || TABLA_PUNTOS_DEFECTO;
  let total = 0;
  const detalle = [];

  (participante.corredores || []).forEach((corredor) => {
    const pEtapa = puntosDeLista(etapaResultado.etapa, corredor, tabla.etapa);
    const pGeneral = puntosDeLista(etapaResultado.general, corredor, tabla.generalDiaria);
    const pPuntos = puntosDeLista(etapaResultado.puntos, corredor, tabla.regularidadDiaria);
    const pMontana = puntosDeLista(etapaResultado.montana, corredor, tabla.montanaDiaria);
    const suma = pEtapa + pGeneral + pPuntos + pMontana;
    if (suma > 0) detalle.push({ nombre: corredor, puntos: suma, tipo: "corredor" });
    total += suma;
  });

  (participante.equipos || []).forEach((equipo) => {
    const pEquipo = puntosDeLista(etapaResultado.equipos, equipo, tabla.equiposDiaria);
    if (pEquipo > 0) detalle.push({ nombre: equipo, puntos: pEquipo, tipo: "equipo" });
    total += pEquipo;
  });

  return { total, detalle };
}

// Calcula el bonus final (clasificaciones definitivas del Tour) para UN participante
function puntosBonusFinal(participante, bonusFinal, tabla) {
  tabla = tabla || TABLA_PUNTOS_DEFECTO;
  if (!bonusFinal) return { total: 0, detalle: [] };
  let total = 0;
  const detalle = [];

  (participante.corredores || []).forEach((corredor) => {
    const pGeneral = puntosDeLista(bonusFinal.general, corredor, tabla.generalFinal);
    const pPuntos = puntosDeLista(bonusFinal.puntos, corredor, tabla.regularidadFinal);
    const pMontana = puntosDeLista(bonusFinal.montana, corredor, tabla.montanaFinal);
    const suma = pGeneral + pPuntos + pMontana;
    if (suma > 0) detalle.push({ nombre: corredor, puntos: suma, tipo: "corredor-final" });
    total += suma;
  });

  (participante.equipos || []).forEach((equipo) => {
    const pEquipo = puntosDeLista(bonusFinal.equipos, equipo, tabla.equiposFinal);
    if (pEquipo > 0) detalle.push({ nombre: equipo, puntos: pEquipo, tipo: "equipo-final" });
    total += pEquipo;
  });

  return { total, detalle };
}

// Calcula la clasificación general completa: total y evolución día a día por participante
function calcularClasificacion(datos) {
  const tabla = obtenerTablaPuntos(datos);
  const participantes = datos.participantes || [];
  const resultados = (datos.resultados || []).slice().sort((a, b) => a.numero - b.numero);
  const bonusFinal = datos.bonusFinal || null;

  const filas = participantes.map((p) => {
    let acumulado = 0;
    const porEtapa = resultados.map((r) => {
      const { total } = puntosEtapaParticipante(p, r, tabla);
      acumulado += total;
      return { numero: r.numero, nombre: r.nombre, puntosDia: total, acumulado };
    });

    const bonus = puntosBonusFinal(p, bonusFinal, tabla);
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

// Ranking de corredores reales por puntos totales acumulados (pestaña Data > KOM)
function rankingCorredores(datos){
  const tabla = obtenerTablaPuntos(datos);
  const resultados = (datos.resultados || []);
  const bonusFinal = datos.bonusFinal || null;
  const mapa = {};

  function sumar(lista, tablaCat, campo){
    if(!lista) return;
    lista.forEach((nombre, idx)=>{
      if(idx >= tablaCat.length) return;
      const key = normaliza(nombre);
      if(!mapa[key]) mapa[key] = { nombre, etapa:0, general:0, puntos:0, montana:0, bonus:0 };
      mapa[key][campo] += tablaCat[idx];
    });
  }

  resultados.forEach(r=>{
    sumar(r.etapa, tabla.etapa, 'etapa');
    sumar(r.general, tabla.generalDiaria, 'general');
    sumar(r.puntos, tabla.regularidadDiaria, 'puntos');
    sumar(r.montana, tabla.montanaDiaria, 'montana');
  });
  if(bonusFinal){
    sumar(bonusFinal.general, tabla.generalFinal, 'bonus');
    sumar(bonusFinal.puntos, tabla.regularidadFinal, 'bonus');
    sumar(bonusFinal.montana, tabla.montanaFinal, 'bonus');
  }

  const filas = Object.values(mapa).map(f => ({ ...f, total: f.etapa + f.general + f.puntos + f.montana + f.bonus }));
  filas.sort((a,b)=>b.total-a.total);
  filas.forEach((f,i)=>f.posicion = i+1);
  return filas;
}

// Igual que arriba, pero para equipos ciclistas (clasificación por equipos de la porra)
function rankingEquipos(datos){
  const tabla = obtenerTablaPuntos(datos);
  const resultados = (datos.resultados || []);
  const bonusFinal = datos.bonusFinal || null;
  const mapa = {};

  resultados.forEach(r=>{
    (r.equipos||[]).forEach((nombre, idx)=>{
      if(idx >= tabla.equiposDiaria.length) return;
      const key = normaliza(nombre);
      if(!mapa[key]) mapa[key] = { nombre, diaria:0, bonus:0 };
      mapa[key].diaria += tabla.equiposDiaria[idx];
    });
  });
  if(bonusFinal){
    (bonusFinal.equipos||[]).forEach((nombre, idx)=>{
      if(idx >= tabla.equiposFinal.length) return;
      const key = normaliza(nombre);
      if(!mapa[key]) mapa[key] = { nombre, diaria:0, bonus:0 };
      mapa[key].bonus += tabla.equiposFinal[idx];
    });
  }

  const filas = Object.values(mapa).map(f => ({ ...f, total: f.diaria + f.bonus }));
  filas.sort((a,b)=>b.total-a.total);
  filas.forEach((f,i)=>f.posicion = i+1);
  return filas;
}

if (typeof module !== "undefined") {
  module.exports = {
    TABLA_PUNTOS_DEFECTO, obtenerTablaPuntos, calcularClasificacion,
    puntosEtapaParticipante, puntosBonusFinal, normaliza, rankingCorredores, rankingEquipos
  };
}

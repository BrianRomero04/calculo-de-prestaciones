// =====================================================
// CALCULADORA DE PRESTACIONES LABORALES
// Dejé comentarios sencillos para saber qué hace cada parte.
// =====================================================

// Valores que usamos en las fórmulas vistas en clase.
const FACTOR_EXTRA_DIURNA = 2;
const FACTOR_NOCTURNIDAD = 1.25;
const FACTOR_EXTRA_NOCTURNA = FACTOR_EXTRA_DIURNA * FACTOR_NOCTURNIDAD;
const FACTOR_ASUETO = 2;
const FACTOR_DESCANSO = 1.5;
const HORAS_JORNADA = 8;
const ISSS_TRABAJADOR = 0.03;
const ISSS_TOPE = 1000;
const AFP_TRABAJADOR = 0.0725;

// Aquí conecto el JavaScript con los campos de la página.
const $ = id => document.getElementById(id);
const consultaAnonima = $("consultaAnonima");
const datosPersonales = $("datosPersonales");
const nombreInput = $("nombre");
const duiInput = $("dui");
const empresaInput = $("empresa");
const cargoInput = $("cargo");
const salarioInput = $("salario");
const fechaInicioInput = $("fechaInicio");
const fechaFinInput = $("fechaFin");
const tipoCierreInput = $("tipoCierre");
const sectorLaboralInput = $("sectorLaboral");
const minimoPersonalizadoInput = $("minimoPersonalizado");
const campoSector = $("campoSector");
const campoMinimoPersonalizado = $("campoMinimoPersonalizado");
const renunciaCampos = document.querySelectorAll(".renuncia-campo");
const tipoCargoRenunciaInput = $("tipoCargoRenuncia");
const dioPreavisoInput = $("dioPreaviso");
const fechaPreavisoInput = $("fechaPreaviso");
const campoFechaPreaviso = $("campoFechaPreaviso");
const renunciaFormalInput = $("renunciaFormal");
const avisoCierre = $("avisoCierre");
const textoAvisoCierre = $("textoAvisoCierre");
const calFechaInicio = $("calFechaInicio");
const calFechaFin = $("calFechaFin");
const calAntiguedad = $("calAntiguedad");
const calNotaCierre = $("calNotaCierre");
const btnContinuar = $("btnContinuar");
const btnLimpiarGeneral = $("btnLimpiarGeneral");
const estadoGenerales = $("estadoGenerales");

const bloqueEspeciales = $("bloqueEspeciales");
const bloquePrestaciones = $("bloquePrestaciones");
const bloqueDeducciones = $("bloqueDeducciones");
const accionesCalculo = $("accionesCalculo");
const noAplicaEspeciales = $("noAplicaEspeciales");
const contenidoEspeciales = $("contenidoEspeciales");
const horasDiurnasInput = $("horasDiurnas");
const horasNocturnasInput = $("horasNocturnas");
const horasAsuetoDiurnasInput = $("horasAsuetoDiurnas");
const horasAsuetoNocturnasInput = $("horasAsuetoNocturnas");
const horasDescansoDiurnasInput = $("horasDescansoDiurnas");
const horasDescansoNocturnasInput = $("horasDescansoNocturnas");
const asuetoChecks = document.querySelectorAll(".asueto-check");
const fechaDescansoInput = $("fechaDescanso");
const btnAgregarDescanso = $("btnAgregarDescanso");
const listaDescansos = $("listaDescansos");
const rConteoDescansos = $("rConteoDescansos");
const rCoincidencias = $("rCoincidencias");
const avisoCompensatorio = $("avisoCompensatorio");

const vacacionesPagadas = $("vacacionesPagadas");
const preguntasBeneficiosVacacion = $("preguntasBeneficiosVacacion");
const alojamientoVacacion = $("alojamientoVacacion");
const alimentacionVacacion = $("alimentacionVacacion");
const periodoVacacion = $("periodoVacacion");
const aguinaldoPagado = $("aguinaldoPagado");
const fechaUltimoAguinaldo = $("fechaUltimoAguinaldo");
const campoUltimoAguinaldo = $("campoUltimoAguinaldo");
const notaAguinaldo = $("notaAguinaldo");
const aplicarDeducciones = $("aplicarDeducciones");

const btnCalcular = $("btnCalcular");
const btnLimpiar = $("btnLimpiar");
const btnExportar = $("btnExportar");
const sinCalculo = $("sinCalculo");
const detalleResultados = $("detalleResultados");
const toast = $("toast");

let datosGeneralesConfirmados = false;
let fechasDescanso = [];

// Aquí doy formato de dinero a todos los resultados.
function dinero(valor) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number.isFinite(valor) ? valor : 0);
}

// Evito mostrar “-$0.00” cuando una deducción es cero.
function dineroDeduccion(valor) {
    const monto = Number(valor) || 0;
    return monto > 0 ? `-${dinero(monto)}` : dinero(0);
}


// Esta tabla se usa para la retención mensual de ISR que aparece en el comprobante.
// Primero se restan ISSS y AFP de la remuneración gravada y luego se aplica el tramo.
function calcularISR(baseGravada) {
    const base = Math.max(0, Number(baseGravada) || 0);
    if (base <= 550) return 0;
    if (base <= 895.24) return (base - 550) * 0.10 + 17.67;
    if (base <= 2038.10) return (base - 895.24) * 0.20 + 60;
    return (base - 2038.10) * 0.30 + 288.57;
}

// En el PDF uso una fecha larga para que se vea como el modelo de la docente.
function fechaLarga(valor) {
    if (!valor) return "—";
    return new Intl.DateTimeFormat("es-SV", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    }).format(new Date(valor + "T12:00:00Z"));
}

function fechaHoraGeneracion() {
    return new Intl.DateTimeFormat("es-SV", {
        timeZone: "America/El_Salvador",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(new Date()).replace(",", "");
}

// Convierto el monto neto a letras porque el formato de la docente lo muestra así.
function grupoNumeroALetras(n) {
    const especiales = [
        "CERO", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
        "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
        "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"
    ];
    const decenas = {30:"TREINTA",40:"CUARENTA",50:"CINCUENTA",60:"SESENTA",70:"SETENTA",80:"OCHENTA",90:"NOVENTA"};
    const centenas = {1:"CIENTO",2:"DOSCIENTOS",3:"TRESCIENTOS",4:"CUATROCIENTOS",5:"QUINIENTOS",6:"SEISCIENTOS",7:"SETECIENTOS",8:"OCHOCIENTOS",9:"NOVECIENTOS"};

    if (n < 30) return especiales[n];
    if (n < 100) {
        const d = Math.floor(n / 10) * 10;
        const u = n % 10;
        return decenas[d] + (u ? ` Y ${especiales[u]}` : "");
    }
    if (n === 100) return "CIEN";
    const c = Math.floor(n / 100);
    const resto = n % 100;
    return centenas[c] + (resto ? ` ${grupoNumeroALetras(resto)}` : "");
}

function apocoparUno(texto) {
    return texto
        .replace(/VEINTIUNO$/u, "VEINTIÚN")
        .replace(/ Y UNO$/u, " Y UN")
        .replace(/ UNO$/u, " UN");
}

function enteroALetras(numero) {
    let n = Math.floor(Math.abs(numero));
    if (n === 0) return "CERO";
    const partes = [];

    const millones = Math.floor(n / 1000000);
    if (millones) {
        partes.push(millones === 1 ? "UN MILLÓN" : `${apocoparUno(enteroALetras(millones))} MILLONES`);
        n %= 1000000;
    }

    const miles = Math.floor(n / 1000);
    if (miles) {
        partes.push(miles === 1 ? "MIL" : `${apocoparUno(grupoNumeroALetras(miles))} MIL`);
        n %= 1000;
    }

    if (n) partes.push(grupoNumeroALetras(n));
    return partes.join(" ");
}

function dineroEnLetras(valor) {
    const centavosTotales = Math.round(Math.max(0, Number(valor) || 0) * 100);
    const enteros = Math.floor(centavosTotales / 100);
    const centavos = String(centavosTotales % 100).padStart(2, "0");
    return `${apocoparUno(enteroALetras(enteros))} ${centavos}/100 DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA`;
}

function textoAntiguedadDocumento(t) {
    const partes = [`${t.anios} año${t.anios === 1 ? "" : "s"}`, `${t.meses} mes${t.meses === 1 ? "" : "es"}`];
    if (t.dias) partes.push(`${t.dias} día${t.dias === 1 ? "" : "s"}`);
    return partes.join(", ");
}

function textoCausaDocumento() {
    if (tipoCierreInput.value === "renuncia") return "Renuncia voluntaria";
    if (tipoCierreInput.value === "despido") return "Despido sin causa justificada";
    return "Consulta general / relación laboral vigente";
}

// Aquí lleno las dos páginas que se imprimen con el formato entregado por la docente.
function actualizarReporteImpresion(datos) {
    const esAnonima = consultaAnonima.checked || (!nombreInput.value.trim() && !empresaInput.value.trim() && !cargoInput.value.trim());
    const trabajador = esAnonima ? "CONSULTA ANÓNIMA" : (nombreInput.value.trim() || "NO PROPORCIONADO");
    const patrono = esAnonima ? "NO PROPORCIONADO" : (empresaInput.value.trim() || "NO PROPORCIONADO");
    const cargo = esAnonima ? "NO PROPORCIONADO" : (cargoInput.value.trim() || "NO PROPORCIONADO");

    $("pdfTrabajador").textContent = trabajador;
    $("pdfPatrono").textContent = patrono;
    $("pdfCargo").textContent = cargo;
    $("pdfSalario").textContent = dinero(datos.salarioMensual);
    $("pdfFechaIngreso").textContent = fechaLarga(fechaInicioInput.value);
    $("pdfFechaTerminacion").textContent = fechaLarga(fechaFinInput.value);
    $("pdfAntiguedad").textContent = textoAntiguedadDocumento(datos.tiempo);
    $("pdfCausa").textContent = textoCausaDocumento();

    $("pdfVacacion").textContent = dinero(datos.vacacion.monto);
    $("pdfAguinaldo").textContent = dinero(datos.aguinaldo.monto);
    $("pdfDiurnas").textContent = dinero(datos.totalDiurnas);
    $("pdfNocturnas").textContent = dinero(datos.totalNocturnas);
    $("pdfAsuetos").textContent = dinero(datos.totalAsuetos);
    $("pdfDescansos").textContent = dinero(datos.totalDescansos);
    $("pdfTotalBruto").textContent = dinero(datos.totalBruto);

    if (datos.cierre?.tipo === "renuncia") {
        $("pdfConceptoCierre").textContent = "Prestación por renuncia voluntaria";
        $("pdfBaseCierre").textContent = "Ley de Renuncia Voluntaria, Arts. 2 y 4";
    } else if (datos.cierre?.tipo === "despido") {
        $("pdfConceptoCierre").textContent = "Indemnización por despido injustificado";
        $("pdfBaseCierre").textContent = "Art. 58 CT";
    } else {
        $("pdfConceptoCierre").textContent = "Indemnización / prestación por finalización";
        $("pdfBaseCierre").textContent = "No aplica";
    }
    $("pdfPrestacion").textContent = dinero(datos.montoCierre);

    $("pdfGravada").textContent = dinero(datos.remuneracionGravada);
    $("pdfExento").textContent = dinero(datos.montoExento);
    $("pdfTextoExento").textContent = datos.textoExento;
    $("pdfIsss").textContent = dineroDeduccion(datos.isss);
    $("pdfAfp").textContent = dineroDeduccion(datos.afp);
    $("pdfIsr").textContent = dineroDeduccion(datos.isr);
    $("pdfTotalDeducciones").textContent = dineroDeduccion(datos.totalDeducciones);
    $("pdfNeto").textContent = dinero(datos.totalNeto);
    $("pdfNetoLetras").textContent = dineroEnLetras(datos.totalNeto);

    $("pdfDeclaracionNombre").textContent = trabajador;
    const generado = `Generado el ${fechaHoraGeneracion()}`;
    $("pdfFechaGeneracion1").textContent = generado;
    $("pdfFechaGeneracion2").textContent = generado;
}

// Mensajes pequeños que aparecen en la parte de abajo.
function mostrarToast(mensaje, tipo = "correcto") {
    toast.textContent = mensaje;
    toast.classList.remove("visible", "toast-error", "toast-advertencia");
    if (tipo === "error") toast.classList.add("toast-error");
    if (tipo === "advertencia") toast.classList.add("toast-advertencia");
    void toast.offsetWidth;
    toast.classList.add("visible");
    clearTimeout(mostrarToast.timer);
    mostrarToast.timer = setTimeout(() => toast.classList.remove("visible"), 4200);
}

// Obtengo la fecha actual de El Salvador para bloquear días futuros.
function obtenerHoyElSalvador() {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/El_Salvador",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());
    const obj = Object.fromEntries(partes.map(p => [p.type, p.value]));
    return `${obj.year}-${obj.month}-${obj.day}`;
}

function fechaLegible(valor) {
    if (!valor) return "Sin seleccionar";
    return new Date(valor + "T12:00:00Z").toLocaleDateString("es-SV", {
        day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC"
    });
}

function parseFecha(valor) {
    if (!valor) return null;
    const [y, m, d] = valor.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function aISO(fecha) {
    return fecha.toISOString().slice(0, 10);
}

function diasEntreFechas(inicio, fin) {
    const a = parseFecha(inicio);
    const b = parseFecha(fin);
    if (!a || !b) return 0;
    return Math.floor((b - a) / 86400000);
}

// Para que el resultado coincida con el procedimiento usado en el material de clase,
// la antigüedad se expresa con meses de 30 días y años de 360 días.
// También cuento el último día trabajado, igual que en el ejemplo del documento.
function calcularAntiguedad(inicioTexto, finTexto) {
    if (!inicioTexto || !finTexto || finTexto < inicioTexto) {
        return { anios: 0, meses: 0, dias: 0 };
    }

    const totalDias = diasComercialesEntre(inicioTexto, finTexto, true);
    const anios = Math.floor(totalDias / 360);
    const resto = totalDias % 360;
    const meses = Math.floor(resto / 30);
    const dias = resto % 30;

    return { anios, meses, dias };
}

function textoAntiguedad(t) {
    return `${t.anios} año${t.anios === 1 ? "" : "s"}, ${t.meses} mes${t.meses === 1 ? "" : "es"} y ${t.dias} día${t.dias === 1 ? "" : "s"}`;
}

// Para varias fórmulas del material uso mes comercial de 30 días y año de 360.
function serialComercial(fechaTexto) {
    const [y, m, d] = fechaTexto.split("-").map(Number);
    return y * 360 + (m - 1) * 30 + Math.min(d, 30);
}

function diasComercialesEntre(inicio, fin, inclusivo = true) {
    if (!inicio || !fin || fin < inicio) return 0;
    return Math.max(0, serialComercial(fin) - serialComercial(inicio) + (inclusivo ? 1 : 0));
}

function limpiarErrores() {
    document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
}

function errorCampo(campo, mensaje) {
    campo.classList.add("input-error");
    campo.focus();
    mostrarToast(mensaje, "error");
    return false;
}

// DUI opcional: si se escribe, reviso únicamente que tenga 9 números.
function formatearDui() {
    const numeros = duiInput.value.replace(/\D/g, "").slice(0, 9);
    duiInput.value = numeros.length > 8 ? `${numeros.slice(0, 8)}-${numeros.slice(8)}` : numeros;
}

duiInput.addEventListener("input", formatearDui);

// La consulta anónima oculta los datos personales, pero no cambia ningún cálculo.
function actualizarModoAnonimo() {
    datosPersonales.hidden = consultaAnonima.checked;
}
consultaAnonima.addEventListener("change", () => {
    actualizarModoAnonimo();
    invalidarDatosGenerales();
});
actualizarModoAnonimo();

// Aquí muestro solamente los campos que corresponden a renuncia o despido.
function actualizarCamposCierre() {
    const tipo = tipoCierreInput.value;
    const necesitaSector = tipo === "renuncia" || tipo === "despido";
    campoSector.hidden = !necesitaSector;
    campoMinimoPersonalizado.hidden = !(necesitaSector && sectorLaboralInput.value === "otro");
    renunciaCampos.forEach(el => el.hidden = tipo !== "renuncia");
    campoFechaPreaviso.hidden = !(tipo === "renuncia" && dioPreavisoInput.value === "si");

    if (tipo === "renuncia") {
        avisoCierre.hidden = false;
        textoAvisoCierre.textContent = "La prestación por renuncia requiere por lo menos 2 años continuos, preaviso escrito de 15 o 30 días según el cargo y renuncia por escrito. La base tiene límite de 2 salarios mínimos del sector.";
    } else if (tipo === "despido") {
        avisoCierre.hidden = false;
        textoAvisoCierre.textContent = "Para el despido injustificado se calculan 30 días por cada año de servicio y la parte proporcional de la fracción de año. La base tiene límite de 4 salarios mínimos.";
    } else {
        avisoCierre.hidden = true;
    }
    actualizarCalendario();
}

// Aquí actualizo el resumen del calendario y los límites de las demás fechas.
function actualizarCalendario() {
    const hoy = obtenerHoyElSalvador();
    fechaInicioInput.max = hoy;
    fechaFinInput.max = hoy;

    if (fechaInicioInput.value) {
        fechaFinInput.min = fechaInicioInput.value;
        fechaPreavisoInput.min = fechaInicioInput.value;
        fechaUltimoAguinaldo.min = fechaInicioInput.value;
        fechaDescansoInput.min = fechaInicioInput.value;
    }
    if (fechaFinInput.value) {
        fechaPreavisoInput.max = fechaFinInput.value;
        fechaUltimoAguinaldo.max = fechaFinInput.value;
        fechaDescansoInput.max = fechaFinInput.value;
    } else {
        fechaPreavisoInput.max = hoy;
        fechaUltimoAguinaldo.max = hoy;
        fechaDescansoInput.max = hoy;
    }

    calFechaInicio.textContent = fechaLegible(fechaInicioInput.value);
    calFechaFin.textContent = fechaLegible(fechaFinInput.value);

    if (!fechaInicioInput.value || !fechaFinInput.value) {
        calAntiguedad.textContent = "Selecciona ambas fechas";
        periodoVacacion.textContent = "Se mostrará al completar las fechas.";
        notaAguinaldo.textContent = "La categoría se determinará con la antigüedad.";
        return;
    }

    if (fechaFinInput.value > hoy) {
        calAntiguedad.textContent = "Revisa la fecha final";
        calNotaCierre.textContent = "La fecha de finalización no puede estar en el futuro.";
        return;
    }
    if (fechaFinInput.value < fechaInicioInput.value) {
        calAntiguedad.textContent = "Revisa las fechas";
        calNotaCierre.textContent = "La fecha final no puede ser anterior a la fecha de ingreso.";
        return;
    }

    const tiempo = calcularAntiguedad(fechaInicioInput.value, fechaFinInput.value);
    calAntiguedad.textContent = textoAntiguedad(tiempo);

    if (tipoCierreInput.value === "renuncia") {
        const dias = Number(tipoCargoRenunciaInput.value || 15);
        const fin = parseFecha(fechaFinInput.value);
        fin.setUTCDate(fin.getUTCDate() - dias);
        calNotaCierre.textContent = `Para el preaviso de ${dias} días, una fecha de referencia sería ${fechaLegible(aISO(fin))} o antes.`;
    } else if (tipoCierreInput.value === "despido") {
        calNotaCierre.textContent = "Este tiempo se utilizará para calcular la indemnización y su parte proporcional.";
    } else {
        calNotaCierre.textContent = "El calendario también se utiliza para vacaciones y aguinaldo.";
    }

    const pVac = obtenerPeriodoVacacion();
    periodoVacacion.textContent = pVac ? `${fechaLegible(pVac.inicio)} al ${fechaLegible(fechaFinInput.value)} · ${pVac.dias} días comerciales` : "No disponible";

    const diasAguinaldo = diasCategoriaAguinaldo(tiempo.anios);
    notaAguinaldo.textContent = `Por la antigüedad actual, la categoría de aguinaldo corresponde a ${diasAguinaldo} días de salario.`;

    // Si ya se quitaron fechas del rango, también las quito de descansos.
    fechasDescanso = fechasDescanso.filter(f => f >= fechaInicioInput.value && f <= fechaFinInput.value);
    renderDescansos();
}

// Calculo desde qué aniversario se acumula la vacación proporcional actual.
function obtenerPeriodoVacacion() {
    if (!fechaInicioInput.value || !fechaFinInput.value || fechaFinInput.value < fechaInicioInput.value) return null;
    const inicio = parseFecha(fechaInicioInput.value);
    const fin = parseFecha(fechaFinInput.value);
    const tiempo = calcularAntiguedad(fechaInicioInput.value, fechaFinInput.value);

    let anioAniversario = fin.getUTCFullYear();
    let aniversario = new Date(Date.UTC(anioAniversario, inicio.getUTCMonth(), inicio.getUTCDate()));
    if (aniversario > fin) {
        anioAniversario--;
        aniversario = new Date(Date.UTC(anioAniversario, inicio.getUTCMonth(), inicio.getUTCDate()));
    }

    // Si termina exactamente en el aniversario y ya cumplió un año, tomo el período completo anterior.
    if (aISO(aniversario) === fechaFinInput.value && tiempo.anios >= 1) {
        aniversario = new Date(Date.UTC(anioAniversario - 1, inicio.getUTCMonth(), inicio.getUTCDate()));
    }

    if (aniversario < inicio) aniversario = inicio;
    const inicioPeriodo = aISO(aniversario);
    return { inicio: inicioPeriodo, dias: Math.min(360, diasComercialesEntre(inicioPeriodo, fechaFinInput.value, true)) };
}

function diasCategoriaAguinaldo(anios) {
    if (anios < 3) return 15;
    if (anios <= 10) return 19;
    return 21;
}

// Estos son los asuetos seleccionados en la lista.
function obtenerAsuetosSeleccionados() {
    return Array.from(asuetoChecks).filter(c => c.checked).map(c => c.value);
}

// Cálculo de Semana Santa para detectar coincidencias con descanso semanal.
function domingoPascua(anio) {
    const a = anio % 19;
    const b = Math.floor(anio / 100);
    const c = anio % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(anio, mes - 1, dia));
}

function fechaSemanaSanta(anio, diasAntes) {
    const fecha = domingoPascua(anio);
    fecha.setUTCDate(fecha.getUTCDate() - diasAntes);
    return aISO(fecha).slice(5);
}

function esAsuetoSeleccionado(fechaTexto) {
    const seleccionados = new Set(obtenerAsuetosSeleccionados());
    const [anio, mes, dia] = fechaTexto.split("-").map(Number);
    const md = `${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const fijos = {
        enero1: "01-01", mayo1: "05-01", mayo10: "05-10", junio17: "06-17",
        agosto6: "08-06", septiembre15: "09-15", noviembre2: "11-02",
        noviembre21: "11-21", diciembre25: "12-25"
    };
    for (const [clave, valor] of Object.entries(fijos)) {
        if (seleccionados.has(clave) && md === valor) return true;
    }
    if (seleccionados.has("juevesSanto") && md === fechaSemanaSanta(anio, 3)) return true;
    if (seleccionados.has("viernesSanto") && md === fechaSemanaSanta(anio, 2)) return true;
    if (seleccionados.has("sabadoSanto") && md === fechaSemanaSanta(anio, 1)) return true;
    return false;
}

function cantidadCoincidencias() {
    return fechasDescanso.filter(esAsuetoSeleccionado).length;
}

// Aquí agrego los descansos por fecha, tal como se explicó en la pizarra.
function agregarDescanso() {
    const fecha = fechaDescansoInput.value;
    if (!fecha) return mostrarToast("Selecciona la fecha del descanso trabajado.", "error");
    if (!fechaInicioInput.value || !fechaFinInput.value) return mostrarToast("Primero completa las fechas de ingreso y finalización.", "error");
    if (fecha < fechaInicioInput.value || fecha > fechaFinInput.value) return mostrarToast("La fecha del descanso debe estar dentro del período laboral.", "error");
    if (fecha > obtenerHoyElSalvador()) return mostrarToast("No puedes agregar una fecha futura.", "error");
    if (fechasDescanso.includes(fecha)) return mostrarToast("Esa fecha ya fue agregada.", "advertencia");
    fechasDescanso.push(fecha);
    fechasDescanso.sort();
    fechaDescansoInput.value = "";
    renderDescansos();
}

function quitarDescanso(fecha) {
    fechasDescanso = fechasDescanso.filter(f => f !== fecha);
    renderDescansos();
}

function renderDescansos() {
    listaDescansos.innerHTML = "";
    if (!fechasDescanso.length) {
        listaDescansos.innerHTML = '<span class="sin-fechas">Todavía no hay fechas agregadas.</span>';
    } else {
        fechasDescanso.forEach(fecha => {
            const chip = document.createElement("span");
            chip.className = "chip-fecha" + (esAsuetoSeleccionado(fecha) ? " coincide" : "");
            chip.innerHTML = `${fechaLegible(fecha)}${esAsuetoSeleccionado(fecha) ? " · coincide con asueto" : ""}<button type="button" aria-label="Quitar fecha">×</button>`;
            chip.querySelector("button").addEventListener("click", () => quitarDescanso(fecha));
            listaDescansos.appendChild(chip);
        });
    }
    const coincidencias = cantidadCoincidencias();
    rConteoDescansos.textContent = fechasDescanso.length;
    rCoincidencias.textContent = coincidencias;
    avisoCompensatorio.classList.toggle("oculto", fechasDescanso.length === 0);
    actualizarHorasEspeciales();
}

// Habilito horas de asueto y descanso solamente cuando realmente corresponden.
function actualizarHorasEspeciales() {
    const hayAsueto = obtenerAsuetosSeleccionados().length > 0 && !noAplicaEspeciales.checked;
    const descansosIndependientes = Math.max(0, fechasDescanso.length - cantidadCoincidencias());
    const hayDescanso = descansosIndependientes > 0 && !noAplicaEspeciales.checked;

    horasAsuetoDiurnasInput.disabled = !hayAsueto;
    horasAsuetoNocturnasInput.disabled = !hayAsueto;
    horasDescansoDiurnasInput.disabled = !hayDescanso;
    horasDescansoNocturnasInput.disabled = !hayDescanso;
    if (!hayAsueto) { horasAsuetoDiurnasInput.value = 0; horasAsuetoNocturnasInput.value = 0; }
    if (!hayDescanso) { horasDescansoDiurnasInput.value = 0; horasDescansoNocturnasInput.value = 0; }
}

function limpiarEspeciales() {
    [horasDiurnasInput, horasNocturnasInput, horasAsuetoDiurnasInput, horasAsuetoNocturnasInput, horasDescansoDiurnasInput, horasDescansoNocturnasInput].forEach(i => i.value = 0);
    asuetoChecks.forEach(c => c.checked = false);
    fechasDescanso = [];
    renderDescansos();
}

noAplicaEspeciales.addEventListener("change", () => {
    contenidoEspeciales.classList.toggle("bloque-deshabilitado", noAplicaEspeciales.checked);

    if (noAplicaEspeciales.checked) {
        limpiarEspeciales();
        [horasDiurnasInput, horasNocturnasInput, horasAsuetoDiurnasInput, horasAsuetoNocturnasInput, horasDescansoDiurnasInput, horasDescansoNocturnasInput, fechaDescansoInput].forEach(el => el.disabled = true);
        asuetoChecks.forEach(el => el.disabled = true);
        btnAgregarDescanso.disabled = true;
        document.querySelectorAll(".mas, .menos").forEach(el => el.disabled = true);
        return;
    }

    horasDiurnasInput.disabled = false;
    horasNocturnasInput.disabled = false;
    fechaDescansoInput.disabled = false;
    asuetoChecks.forEach(el => el.disabled = false);
    btnAgregarDescanso.disabled = false;
    document.querySelectorAll(".mas, .menos").forEach(el => el.disabled = false);
    actualizarHorasEspeciales();
});

// Botones + y - para horas.
document.querySelectorAll(".mas, .menos").forEach(boton => {
    boton.addEventListener("click", () => {
        const input = $(boton.dataset.input);
        if (!input || input.disabled) return;
        const actual = Number(input.value || 0);
        const cambio = boton.classList.contains("mas") ? 0.5 : -0.5;
        input.value = Math.max(0, actual + cambio);
    });
});

// Evito números negativos aunque se escriban manualmente.
[salarioInput, minimoPersonalizadoInput, horasDiurnasInput, horasNocturnasInput, horasAsuetoDiurnasInput, horasAsuetoNocturnasInput, horasDescansoDiurnasInput, horasDescansoNocturnasInput].forEach(input => {
    input.addEventListener("input", () => {
        if (input.value !== "" && Number(input.value) < 0) {
            input.value = 0;
            mostrarToast("No se permiten valores negativos.", "error");
        }
    });
});

// Aquí valido solo lo necesario para avanzar. Los datos personales no son obligatorios.
function validarDatosGenerales() {
    limpiarErrores();
    const salario = Number(salarioInput.value);
    if (!salarioInput.value || !Number.isFinite(salario) || salario <= 0) return errorCampo(salarioInput, "Ingresa un salario mensual mayor que cero.");
    if (!fechaInicioInput.value) return errorCampo(fechaInicioInput, "Selecciona la fecha de ingreso.");
    if (!fechaFinInput.value) return errorCampo(fechaFinInput, "Selecciona la fecha de finalización o consulta.");
    if (fechaFinInput.value > obtenerHoyElSalvador()) return errorCampo(fechaFinInput, "La fecha final debe ser hoy o una fecha anterior.");
    if (fechaFinInput.value < fechaInicioInput.value) return errorCampo(fechaFinInput, "La fecha final no puede ser anterior a la fecha de ingreso.");

    // Si la consulta no es anónima, sí pido los datos de identificación.
    if (!consultaAnonima.checked) {
        if (!nombreInput.value.trim()) return errorCampo(nombreInput, "Ingresa el nombre de la persona trabajadora o activa la consulta anónima.");
        if (!duiInput.value) return errorCampo(duiInput, "Ingresa el DUI o activa la consulta anónima.");
        if (!/^\d{8}-\d$/.test(duiInput.value)) return errorCampo(duiInput, "Usa el formato de DUI 00000000-0.");
        if (!empresaInput.value.trim()) return errorCampo(empresaInput, "Ingresa el nombre del patrono o empresa.");
        if (!cargoInput.value.trim()) return errorCampo(cargoInput, "Ingresa el cargo desempeñado.");
    } else if (duiInput.value && !/^\d{8}-\d$/.test(duiInput.value)) {
        return errorCampo(duiInput, "Si escribes el DUI, usa el formato 00000000-0.");
    }

    if (["renuncia", "despido"].includes(tipoCierreInput.value)) {
        if (!sectorLaboralInput.value) return errorCampo(sectorLaboralInput, "Selecciona el sector para aplicar el límite salarial.");
        if (sectorLaboralInput.value === "otro" && Number(minimoPersonalizadoInput.value) <= 0) return errorCampo(minimoPersonalizadoInput, "Ingresa el salario mínimo diario que deseas aplicar.");
    }

    if (tipoCierreInput.value === "renuncia") {
        if (!dioPreavisoInput.value) return errorCampo(dioPreavisoInput, "Indica si se dio preaviso por escrito.");
        if (dioPreavisoInput.value === "si") {
            if (!fechaPreavisoInput.value) return errorCampo(fechaPreavisoInput, "Selecciona la fecha del preaviso.");
            if (fechaPreavisoInput.value < fechaInicioInput.value || fechaPreavisoInput.value > fechaFinInput.value) return errorCampo(fechaPreavisoInput, "La fecha del preaviso debe estar dentro del período laboral.");
        }
        if (!renunciaFormalInput.value) return errorCampo(renunciaFormalInput, "Indica cómo quedó presentada la renuncia por escrito.");
    }
    return true;
}

function invalidarDatosGenerales() {
    if (!datosGeneralesConfirmados) return;
    datosGeneralesConfirmados = false;
    bloqueEspeciales.hidden = true;
    bloquePrestaciones.hidden = true;
    bloqueDeducciones.hidden = true;
    accionesCalculo.hidden = true;
    detalleResultados.classList.add("oculto");
    sinCalculo.classList.remove("oculto");
    estadoGenerales.textContent = "Se modificaron los datos principales. Presiona Continuar para revisarlos.";
}

function continuarDatosGenerales() {
    if (!validarDatosGenerales()) return;
    datosGeneralesConfirmados = true;
    bloqueEspeciales.hidden = false;
    bloquePrestaciones.hidden = false;
    bloqueDeducciones.hidden = false;
    accionesCalculo.hidden = false;
    estadoGenerales.textContent = "Datos necesarios completos. Ya puedes continuar con el resto del cálculo.";
    mostrarToast("Datos revisados. Ya puedes continuar.");
    bloqueEspeciales.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Datos que cambian el cálculo principal vuelven a bloquear los demás bloques hasta confirmar.
[salarioInput, fechaInicioInput, fechaFinInput, tipoCierreInput, sectorLaboralInput, minimoPersonalizadoInput, tipoCargoRenunciaInput, dioPreavisoInput, fechaPreavisoInput, renunciaFormalInput].forEach(input => {
    input.addEventListener("input", () => { input.classList.remove("input-error"); invalidarDatosGenerales(); });
    input.addEventListener("change", () => { input.classList.remove("input-error"); invalidarDatosGenerales(); });
});

[fechaInicioInput, fechaFinInput, tipoCierreInput, tipoCargoRenunciaInput, dioPreavisoInput, fechaPreavisoInput].forEach(input => {
    input.addEventListener("change", actualizarCalendario);
});

tipoCierreInput.addEventListener("change", actualizarCamposCierre);
sectorLaboralInput.addEventListener("change", actualizarCamposCierre);
dioPreavisoInput.addEventListener("change", actualizarCamposCierre);
btnContinuar.addEventListener("click", continuarDatosGenerales);
btnAgregarDescanso.addEventListener("click", agregarDescanso);
asuetoChecks.forEach(c => c.addEventListener("change", renderDescansos));

aguinaldoPagado.addEventListener("change", () => {
    campoUltimoAguinaldo.hidden = aguinaldoPagado.value === "si";
});

// Vacaciones: primero pregunto si ya las gozó. Solo si responde que no
// aparecen las preguntas de alojamiento y alimentación.
function actualizarVacaciones() {
    const pendientes = vacacionesPagadas.value === "no";
    vacacionesPagadas.classList.remove("input-error");
    preguntasBeneficiosVacacion.hidden = !pendientes;
    alojamientoVacacion.disabled = !pendientes;
    alimentacionVacacion.disabled = !pendientes;

    if (!pendientes) {
        alojamientoVacacion.value = "";
        alimentacionVacacion.value = "";
        alojamientoVacacion.classList.remove("input-error");
        alimentacionVacacion.classList.remove("input-error");
    }
}

vacacionesPagadas.addEventListener("change", actualizarVacaciones);
alojamientoVacacion.addEventListener("change", () => alojamientoVacacion.classList.remove("input-error"));
alimentacionVacacion.addEventListener("change", () => alimentacionVacacion.classList.remove("input-error"));

// Obtengo el salario mínimo diario según el sector seleccionado.
function obtenerMinimoDiario() {
    if (sectorLaboralInput.value === "otro") return Number(minimoPersonalizadoInput.value || 0);
    return Number(sectorLaboralInput.value || 0);
}

// Prestación por renuncia o indemnización por despido.
function calcularPrestacionCierre(salarioMensual, salarioDiario, tiempo) {
    const tipo = tipoCierreInput.value;
    if (tipo === "solo") return null;
    const minimoDiario = obtenerMinimoDiario();

    if (tipo === "renuncia") {
        const diasRequeridos = Number(tipoCargoRenunciaInput.value || 15);
        const preavisoDado = dioPreavisoInput.value === "si";
        const diasPreaviso = preavisoDado && fechaPreavisoInput.value ? diasEntreFechas(fechaPreavisoInput.value, fechaFinInput.value) : 0;
        const formaCorrecta = ["si", "mtps"].includes(renunciaFormalInput.value);
        const cumpleTiempo = tiempo.anios >= 2;
        const cumplePreaviso = preavisoDado && diasPreaviso >= diasRequeridos;
        const baseDiaria = Math.min(salarioDiario, minimoDiario * 2);

        if (!cumpleTiempo || !cumplePreaviso || !formaCorrecta) {
            const faltan = [];
            if (!cumpleTiempo) faltan.push("tener 2 años continuos");
            if (!cumplePreaviso) faltan.push(`cumplir el preaviso de ${diasRequeridos} días`);
            if (!formaCorrecta) faltan.push("presentar la renuncia por escrito en la forma indicada");
            return { tipo, monto: 0, sumar: false, detalle: "No cumple todos los requisitos", nota: `La prestación no se suma porque falta ${faltan.join(", ")}.`, baseDiaria };
        }

        const monto = baseDiaria * 15 * tiempo.anios;
        return { tipo, monto, sumar: true, detalle: `15 días × ${tiempo.anios} año(s) · base diaria ${dinero(baseDiaria)}`, nota: `Preaviso registrado con ${diasPreaviso} días de anticipación. Se aplicó el límite de 2 salarios mínimos diarios cuando correspondía.`, baseDiaria };
    }

    const baseMensual = Math.min(salarioMensual, minimoDiario * 30 * 4);
    const baseDiaria = baseMensual / 30;
    const diasFraccion = tiempo.meses * 30 + tiempo.dias;
    const porAnios = baseMensual * tiempo.anios;
    const porFraccion = (baseMensual / 360) * diasFraccion;
    const calculado = porAnios + porFraccion;
    const minimoLegal = baseDiaria * 15;
    const monto = Math.max(calculado, minimoLegal);
    return { tipo, monto, sumar: true, detalle: `30 días por año + fracción de ${diasFraccion} día(s) comerciales`, nota: `Se aplicó el límite de 4 salarios mínimos y el mínimo equivalente a 15 días cuando correspondía.`, baseDiaria };
}

// Vacaciones: si ya fueron gozadas, no vuelvo a calcularlas.
// Si están pendientes, calculo la vacación normal y agrego 25 % por alojamiento
// y otro 25 % por alimentación únicamente cuando corresponda según contrato.
function calcularVacacion(salarioDiario) {
    if (vacacionesPagadas.value === "si") {
        return {
            aplica: false,
            monto: 0,
            montoBase: 0,
            adicionalAlojamiento: 0,
            adicionalAlimentacion: 0,
            detalle: "Vacaciones ya gozadas"
        };
    }

    const periodo = obtenerPeriodoVacacion();
    if (!periodo) {
        return {
            aplica: true,
            monto: 0,
            montoBase: 0,
            adicionalAlojamiento: 0,
            adicionalAlimentacion: 0,
            detalle: "Sin período válido"
        };
    }

    const proporcion = periodo.dias / 360;
    const base15 = salarioDiario * 15;

    // Vacación normal: 15 días de salario más el 30 %.
    // Si el período ya está completo (360 días), uso directamente la vacación completa.
    // Si todavía es proporcional, sigo el ejemplo de clase y trabajo la cuota diaria
    // truncada a 3 decimales antes de multiplicarla por los días acumulados.
    const vacacionCompleta = base15 * 1.30;
    const cuotaVacacionDiaria = Math.floor((vacacionCompleta / 360) * 1000) / 1000;
    const montoBase = periodo.dias === 360
        ? vacacionCompleta
        : cuotaVacacionDiaria * periodo.dias;

    // Cada beneficio agrega por separado el 25 % de la base de 15 días.
    // Esto equivale a llevar esa base a 1.25 cuando aplica un beneficio,
    // sin volver a contar los 15 días que ya forman parte de la vacación.
    const adicionalAlojamiento = alojamientoVacacion.value === "si"
        ? base15 * 0.25 * proporcion
        : 0;

    const adicionalAlimentacion = alimentacionVacacion.value === "si"
        ? base15 * 0.25 * proporcion
        : 0;

    const monto = montoBase + adicionalAlojamiento + adicionalAlimentacion;

    return {
        aplica: true,
        monto,
        montoBase,
        adicionalAlojamiento,
        adicionalAlimentacion,
        detalle: `${periodo.dias}/360 del período · 15 días + 30 %`
    };
}

// Aguinaldo proporcional usando 15, 19 o 21 días según la antigüedad.
function calcularAguinaldo(salarioDiario, tiempo) {
    const diasCategoria = diasCategoriaAguinaldo(tiempo.anios);
    if (aguinaldoPagado.value === "si") return { monto: 0, detalle: `Ya fue pagado · categoría ${diasCategoria} días` };

    let inicioPeriodo = fechaUltimoAguinaldo.value;
    if (!inicioPeriodo) {
        const fin = parseFecha(fechaFinInput.value);
        const diciembreAnterior = `${fin.getUTCFullYear() - 1}-12-12`;
        inicioPeriodo = fechaInicioInput.value > diciembreAnterior ? fechaInicioInput.value : diciembreAnterior;
    }
    if (inicioPeriodo < fechaInicioInput.value) inicioPeriodo = fechaInicioInput.value;
    if (inicioPeriodo > fechaFinInput.value) inicioPeriodo = fechaInicioInput.value;

    const diasPeriodo = Math.min(360, diasComercialesEntre(inicioPeriodo, fechaFinInput.value, true));
    const aguinaldoCompleto = salarioDiario * diasCategoria;
    // En el material se muestra la cuota diaria proporcional con tres decimales.
    const cuotaDiaria = Math.floor((aguinaldoCompleto / 360) * 1000) / 1000;
    // Cuando ya se completaron 360 días, uso el aguinaldo completo para no perder centavos por el truncado.
    const monto = diasPeriodo === 360 ? aguinaldoCompleto : cuotaDiaria * diasPeriodo;
    return { monto, detalle: `${diasCategoria} días de categoría · ${diasPeriodo}/360 desde ${fechaLegible(inicioPeriodo)}` };
}

function validarFormulario() {
    if (!validarDatosGenerales()) return false;
    if (!datosGeneralesConfirmados) {
        mostrarToast("Primero presiona Continuar para confirmar los datos principales.", "error");
        return false;
    }

    if (!vacacionesPagadas.value) {
        return errorCampo(vacacionesPagadas, "Indica si la persona ya gozó de sus vacaciones.");
    }

    if (vacacionesPagadas.value === "no") {
        if (!alojamientoVacacion.value) return errorCampo(alojamientoVacacion, "Indica si recibe alojamiento según contrato.");
        if (!alimentacionVacacion.value) return errorCampo(alimentacionVacacion, "Indica si recibe alimentación según contrato.");
    }

    if (!aguinaldoPagado.value) {
        return errorCampo(aguinaldoPagado, "Indica si el aguinaldo de este período ya fue pagado completo.");
    }

    const numericos = [horasDiurnasInput, horasNocturnasInput, horasAsuetoDiurnasInput, horasAsuetoNocturnasInput, horasDescansoDiurnasInput, horasDescansoNocturnasInput];
    if (numericos.some(i => Number(i.value || 0) < 0)) {
        mostrarToast("No se permiten valores negativos.", "error");
        return false;
    }
    return true;
}

// Aquí hago todos los cálculos y lleno el panel de resultados.
function calcular() {
    if (!validarFormulario()) return false;

    const salarioMensual = Number(salarioInput.value);
    const salarioDiario = salarioMensual / 30;
    const salarioHora = salarioDiario / HORAS_JORNADA;
    const tiempo = calcularAntiguedad(fechaInicioInput.value, fechaFinInput.value);

    const hD = Number(horasDiurnasInput.value || 0);
    const hN = Number(horasNocturnasInput.value || 0);
    const hAD = Number(horasAsuetoDiurnasInput.value || 0);
    const hAN = Number(horasAsuetoNocturnasInput.value || 0);
    const hDD = Number(horasDescansoDiurnasInput.value || 0);
    const hDN = Number(horasDescansoNocturnasInput.value || 0);

    const asuetos = noAplicaEspeciales.checked ? 0 : obtenerAsuetosSeleccionados().length;
    const coincidencias = noAplicaEspeciales.checked ? 0 : cantidadCoincidencias();
    const descansos = noAplicaEspeciales.checked ? 0 : fechasDescanso.length;
    const descansosCalculables = Math.max(0, descansos - coincidencias);

    const diurnasNormales = salarioHora * hD * FACTOR_EXTRA_DIURNA;
    const nocturnasNormales = salarioHora * hN * FACTOR_EXTRA_NOCTURNA;

    const salarioAsuetoDiario = salarioDiario * FACTOR_ASUETO;
    const totalAsuetos = salarioAsuetoDiario * asuetos;
    const salarioHoraAsueto = salarioAsuetoDiario / HORAS_JORNADA;
    const diurnasAsueto = salarioHoraAsueto * hAD * FACTOR_EXTRA_DIURNA;
    const nocturnasAsueto = salarioHoraAsueto * hAN * FACTOR_EXTRA_NOCTURNA;

    const salarioDescansoDiario = salarioDiario * FACTOR_DESCANSO;
    const totalDescansos = salarioDescansoDiario * descansosCalculables;
    const salarioHoraDescanso = salarioDescansoDiario / HORAS_JORNADA;
    const diurnasDescanso = salarioHoraDescanso * hDD * FACTOR_EXTRA_DIURNA;
    const nocturnasDescanso = salarioHoraDescanso * hDN * FACTOR_EXTRA_NOCTURNA;

    const totalDiurnas = diurnasNormales + diurnasAsueto + diurnasDescanso;
    const totalNocturnas = nocturnasNormales + nocturnasAsueto + nocturnasDescanso;

    const vacacion = calcularVacacion(salarioDiario);
    const aguinaldo = calcularAguinaldo(salarioDiario, tiempo);
    const cierre = calcularPrestacionCierre(salarioMensual, salarioDiario, tiempo);
    const montoCierre = cierre && cierre.sumar ? cierre.monto : 0;

    const totalBruto = totalDiurnas + totalNocturnas + totalAsuetos + totalDescansos + vacacion.monto + aguinaldo.monto + montoCierre;

    // El modelo de PDF separa aguinaldo y la prestación de terminación como conceptos exentos.
    // El resto se toma como remuneración gravada para ISSS, AFP e ISR.
    const montoExento = aguinaldo.monto + montoCierre;
    const remuneracionGravada = Math.max(0, totalBruto - montoExento);

    const isss = aplicarDeducciones.checked ? Math.min(remuneracionGravada, ISSS_TOPE) * ISSS_TRABAJADOR : 0;
    const afp = aplicarDeducciones.checked ? remuneracionGravada * AFP_TRABAJADOR : 0;
    const baseISR = Math.max(0, remuneracionGravada - isss - afp);
    const isr = aplicarDeducciones.checked ? calcularISR(baseISR) : 0;
    const totalDeducciones = isss + afp + isr;
    const totalNeto = Math.max(0, totalBruto - totalDeducciones);

    const conceptosExentos = [];
    if (aguinaldo.monto > 0) conceptosExentos.push("aguinaldo");
    if (montoCierre > 0) conceptosExentos.push(cierre?.tipo === "renuncia" ? "prestación por renuncia" : "indemnización");
    const textoExento = conceptosExentos.length
        ? `(${conceptosExentos.join(" y ")}).`
        : "(sin conceptos exentos en este cálculo).";

    $("rSalarioMensual").textContent = dinero(salarioMensual);
    $("rSalarioDiario").textContent = dinero(salarioDiario);
    $("rHora").textContent = dinero(salarioHora);
    $("rAntiguedad").textContent = textoAntiguedad(tiempo);
    $("rDiurnas").textContent = dinero(totalDiurnas);
    $("rNocturnas").textContent = dinero(totalNocturnas);
    $("rAsuetos").textContent = dinero(totalAsuetos);
    $("rDescansos").textContent = dinero(totalDescansos);
    const filaVacacion = $("filaVacacion");
    const filaAlojamientoVacacion = $("filaAlojamientoVacacion");
    const filaAlimentacionVacacion = $("filaAlimentacionVacacion");

    filaVacacion.hidden = !vacacion.aplica;
    filaAlojamientoVacacion.hidden = !vacacion.aplica || vacacion.adicionalAlojamiento <= 0;
    filaAlimentacionVacacion.hidden = !vacacion.aplica || vacacion.adicionalAlimentacion <= 0;

    $("rVacacion").textContent = dinero(vacacion.montoBase);
    $("rDetalleVacacion").textContent = vacacion.detalle;
    $("rAlojamientoVacacion").textContent = dinero(vacacion.adicionalAlojamiento);
    $("rAlimentacionVacacion").textContent = dinero(vacacion.adicionalAlimentacion);
    $("rAguinaldo").textContent = dinero(aguinaldo.monto);
    $("rDetalleAguinaldo").textContent = aguinaldo.detalle;

    const filaCierre = $("filaCierre");
    const notaCierre = $("rNotaCierre");
    if (cierre) {
        filaCierre.hidden = false;
        $("etiquetaPrestacion").textContent = cierre.tipo === "renuncia" ? "Prestación por renuncia voluntaria" : "Indemnización por despido injustificado";
        $("rDetalleCierre").textContent = cierre.detalle;
        $("rPrestacion").textContent = cierre.sumar ? dinero(cierre.monto) : "No se suma";
        notaCierre.hidden = false;
        notaCierre.textContent = cierre.nota;
    } else {
        filaCierre.hidden = true;
        notaCierre.hidden = true;
    }

    $("rTotalBruto").textContent = dinero(totalBruto);
    $("rIsss").textContent = dineroDeduccion(isss);
    $("rAfp").textContent = dineroDeduccion(afp);
    $("rIsr").textContent = dineroDeduccion(isr);
    $("rTotalDeducciones").textContent = dineroDeduccion(totalDeducciones);
    $("rTotalNeto").textContent = dinero(totalNeto);

    if (consultaAnonima.checked || (!nombreInput.value && !duiInput.value && !empresaInput.value && !cargoInput.value)) {
        $("resumenIdentidad").textContent = "Consulta anónima · No se incluyeron datos personales";
    } else {
        const datos = [nombreInput.value, duiInput.value && `DUI ${duiInput.value}`, empresaInput.value, cargoInput.value].filter(Boolean);
        $("resumenIdentidad").textContent = datos.join(" · ") || "Consulta sin identificación";
    }

    const notas = [];
    if (coincidencias > 0) notas.push(`${coincidencias} descanso(s) coincidieron con asueto y no se calcularon dos veces.`);
    if (aplicarDeducciones.checked) notas.push("Las deducciones ISSS, AFP e ISR se aplicaron a la remuneración gravada para completar el formato de liquidación.");
    else notas.push("Las deducciones ISSS, AFP e ISR están desactivadas.");
    notas.push("La herramienta no guarda los datos ingresados.");
    $("rNotaGeneral").textContent = notas.join(" ");

    sinCalculo.classList.add("oculto");
    detalleResultados.classList.remove("oculto");

    actualizarReporteImpresion({
        salarioMensual,
        tiempo,
        vacacion,
        aguinaldo,
        cierre,
        montoCierre,
        totalDiurnas,
        totalNocturnas,
        totalAsuetos,
        totalDescansos,
        totalBruto,
        remuneracionGravada,
        montoExento,
        textoExento,
        isss,
        afp,
        isr,
        totalDeducciones,
        totalNeto
    });

    if (coincidencias > 0) mostrarToast("Cálculo realizado. Se evitó el doble cálculo de los días coincidentes.", "advertencia");
    else mostrarToast("Cálculo realizado correctamente.");
    return true;
}

// Limpio toda la página para comenzar otra consulta.
function limpiarTodo() {
    consultaAnonima.checked = true;
    actualizarModoAnonimo();
    [nombreInput, duiInput, empresaInput, cargoInput, salarioInput, fechaInicioInput, fechaFinInput, minimoPersonalizadoInput, fechaPreavisoInput, fechaUltimoAguinaldo].forEach(i => i.value = "");
    tipoCierreInput.value = "solo";
    sectorLaboralInput.value = "";
    tipoCargoRenunciaInput.value = "15";
    dioPreavisoInput.value = "";
    renunciaFormalInput.value = "";
    vacacionesPagadas.value = "";
    alojamientoVacacion.value = "";
    alimentacionVacacion.value = "";
    actualizarVacaciones();
    aguinaldoPagado.value = "";
    aplicarDeducciones.checked = true;
    noAplicaEspeciales.checked = false;
    contenidoEspeciales.classList.remove("bloque-deshabilitado");
    // Si antes se marcó “No aplica”, vuelvo a habilitar los controles al limpiar.
    horasDiurnasInput.disabled = false;
    horasNocturnasInput.disabled = false;
    fechaDescansoInput.disabled = false;
    asuetoChecks.forEach(el => el.disabled = false);
    btnAgregarDescanso.disabled = false;
    document.querySelectorAll(".mas, .menos").forEach(el => el.disabled = false);
    limpiarEspeciales();
    datosGeneralesConfirmados = false;
    bloqueEspeciales.hidden = true;
    bloquePrestaciones.hidden = true;
    bloqueDeducciones.hidden = true;
    accionesCalculo.hidden = true;
    detalleResultados.classList.add("oculto");
    sinCalculo.classList.remove("oculto");
    estadoGenerales.textContent = "Completa el salario y las fechas. Los datos personales pueden quedar vacíos.";
    limpiarErrores();
    actualizarCamposCierre();
    actualizarCalendario();
    campoUltimoAguinaldo.hidden = false;
    mostrarToast("Formulario limpiado.");
}

btnCalcular.addEventListener("click", calcular);
btnLimpiar.addEventListener("click", limpiarTodo);
btnLimpiarGeneral.addEventListener("click", limpiarTodo);
btnExportar.addEventListener("click", () => {
    // Vuelvo a calcular antes de imprimir para que el PDF siempre tenga los datos más recientes.
    if (calcular()) setTimeout(() => window.print(), 80);
});

document.addEventListener("keydown", event => {
    if (event.key === "Enter" && event.target.tagName !== "BUTTON" && !event.target.closest("select")) {
        if (datosGeneralesConfirmados) calcular();
    }
});

// Estado inicial.
actualizarCamposCierre();
actualizarCalendario();
actualizarVacaciones();
renderDescansos();

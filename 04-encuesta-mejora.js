/* ==========================================================================
   ENCUESTA INICIATIVAS DE MEJORA — GRUPO JOCKEY
   Versión 3 pasos con multi-select de herramientas
   Auth: cookie de Entra ID (same-origin)
   Antiforgery: token CSRF de Power Pages
   ========================================================================== */

(function() {
  'use strict';

  const TOTAL = 3;
  const canvas = document.getElementById('jpCanvas');
  const nav = document.getElementById('jpNav');
  const back = document.getElementById('jpBack');
  const next = document.getElementById('jpNext');
  const tabs = canvas.querySelectorAll('.jp-tab');

  const apiEndpoint = canvas.dataset.apiEndpoint;
  const antiforgeryToken = canvas.dataset.antiforgeryToken;
  const userName = canvas.dataset.userName;
  const userEmail = canvas.dataset.userEmail;

  let current = 1;
  const formData = {
    // identificación
    nombre: userName,
    correo: userEmail,
    // paso 1
    clasificacion: '',
    proceso: '',
    alcance: '',
    // paso 2
    oportunidad: '',
    problematica: '',
    herramientas: [],  // multi-select
    // paso 3
    frecuencia: '',
    tiempo: '',
    volumen: null,
    personas: ''
  };

  /* ------------------------------------------------------------------------
     Mapeo a códigos de Choice en Dataverse
     IMPORTANTE: estos valores deben coincidir con los Option Set values
     que Dataverse asignó al crear las columnas. Verifica en make.powerapps.com.
     ------------------------------------------------------------------------ */
  const choiceMap = {
    clasificacion: { recurrente: 100000000, critico: 100000001, optimizacion: 100000002 },
    alcance: { solo: 100000000, equipo: 100000001, varias: 100000002 },
    frecuencia: {
      diaria: 100000000, interdiaria: 100000001, semanal: 100000002,
      mensual: 100000003, trimestral: 100000004
    },
    tiempo: { menos1h: 100000000, '1a3h': 100000001, '3a6h': 100000002, mas6h: 100000003 },
    personas: { solo: 100000000, '1a3': 100000001, masde3: 100000002 },
    herramientas: {
      outlook: 100000000, excel: 100000001, teams: 100000002, sap: 100000003,
      sharepoint: 100000004, papel: 100000005, otra: 100000006
    }
  };

  /* ------------------------------------------------------------------------
     Navegación entre pasos
     ------------------------------------------------------------------------ */
  function show(step) {
    canvas.querySelectorAll('.jp-section').forEach(s => s.classList.remove('active'));
    const target = canvas.querySelector('[data-section="' + step + '"]');
    if (target) target.classList.add('active');

    // Estados especiales: sending, done, error → ocultar nav
    if (typeof step === 'string') {
      nav.style.display = 'none';
      if (step === 'done') tabs.forEach(t => t.classList.add('done'));
      return;
    }

    nav.style.display = 'flex';
    tabs.forEach((t, i) => {
      t.classList.toggle('active', (i + 1) === step);
      t.setAttribute('aria-selected', (i + 1) === step ? 'true' : 'false');
      if ((i + 1) < step) t.classList.add('done'); else t.classList.remove('done');
    });
    back.disabled = (step === 1);
    next.innerHTML = (step === TOTAL) ? 'Enviar →' : 'Siguiente →';
  }

  // Navegación por click en tabs (solo a pasos ya visitados)
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      if ((i + 1) <= current) { current = i + 1; show(current); }
    });
  });

  /* ------------------------------------------------------------------------
     Validación por paso
     ------------------------------------------------------------------------ */
  function flashInvalid(el) {
    el.classList.add('invalid');
    el.focus();
    setTimeout(() => el.classList.remove('invalid'), 1500);
  }

  function validateStep(step) {
    if (step === 1) {
      if (!formData.clasificacion) { alert('Selecciona una clasificación para continuar.'); return false; }
      const proceso = document.getElementById('fProceso').value.trim();
      if (!proceso) { flashInvalid(document.getElementById('fProceso')); return false; }
      formData.proceso = proceso;
      if (!formData.alcance) { alert('Selecciona el alcance del proceso.'); return false; }
      return true;
    }
    if (step === 2) {
      const oportunidad = document.getElementById('fOportunidad').value.trim();
      if (!oportunidad) { flashInvalid(document.getElementById('fOportunidad')); return false; }
      formData.oportunidad = oportunidad;
      const problematica = document.getElementById('fProblematica').value.trim();
      if (problematica.length < 10) { flashInvalid(document.getElementById('fProblematica')); return false; }
      formData.problematica = problematica;
      if (formData.herramientas.length === 0) { alert('Selecciona al menos una herramienta utilizada.'); return false; }
      return true;
    }
    if (step === 3) {
      const frecuencia = document.getElementById('fFrecuencia').value;
      if (!frecuencia) { flashInvalid(document.getElementById('fFrecuencia')); return false; }
      formData.frecuencia = frecuencia;
      if (!formData.tiempo) { alert('Selecciona el tiempo que requiere el proceso.'); return false; }
      const volumen = parseInt(document.getElementById('fVolumen').value, 10);
      if (isNaN(volumen) || volumen <= 0) { flashInvalid(document.getElementById('fVolumen')); return false; }
      formData.volumen = volumen;
      const personas = document.getElementById('fPersonas').value;
      if (!personas) { flashInvalid(document.getElementById('fPersonas')); return false; }
      formData.personas = personas;
      return true;
    }
    return true;
  }

  /* ------------------------------------------------------------------------
     Handlers de botones
     ------------------------------------------------------------------------ */
  next.addEventListener('click', () => {
    if (!validateStep(current)) return;
    if (current < TOTAL) { current++; show(current); }
    else { submitForm(); }
  });

  back.addEventListener('click', () => {
    if (current > 1) { current--; show(current); }
  });

  /* ------------------------------------------------------------------------
     Selección single (cards y chips con data-q)
     ------------------------------------------------------------------------ */
  canvas.querySelectorAll('[data-q]').forEach(el => {
    el.addEventListener('click', function() {
      const group = this.getAttribute('data-q');
      const val = this.getAttribute('data-val');
      canvas.querySelectorAll('[data-q="' + group + '"]').forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      formData[group] = val;
    });
  });

  /* ------------------------------------------------------------------------
     Selección multi (chips de herramientas con data-multi)
     ------------------------------------------------------------------------ */
  canvas.querySelectorAll('[data-multi]').forEach(el => {
    el.addEventListener('click', function() {
      const group = this.getAttribute('data-multi');
      const val = this.getAttribute('data-val');
      this.classList.toggle('selected');
      const list = formData[group];
      const idx = list.indexOf(val);
      if (this.classList.contains('selected') && idx === -1) list.push(val);
      else if (!this.classList.contains('selected') && idx !== -1) list.splice(idx, 1);
    });
  });

  /* ------------------------------------------------------------------------
     Guardar borrador en localStorage
     ------------------------------------------------------------------------ */
  const DRAFT_KEY = 'jp_mejora_draft_' + userEmail;

  document.getElementById('jpDraft').addEventListener('click', () => {
    // Capturar valores actuales antes de guardar
    formData.proceso = document.getElementById('fProceso').value.trim();
    formData.oportunidad = document.getElementById('fOportunidad').value.trim();
    formData.problematica = document.getElementById('fProblematica').value.trim();
    formData.volumen = document.getElementById('fVolumen').value;
    formData.frecuencia = document.getElementById('fFrecuencia').value;
    formData.personas = document.getElementById('fPersonas').value;

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: formData, step: current, ts: Date.now() }));
      const btn = document.getElementById('jpDraft');
      btn.textContent = 'Borrador guardado ✓';
      setTimeout(() => { btn.textContent = 'Guardar borrador'; }, 1800);
    } catch (e) {
      console.warn('No se pudo guardar el borrador:', e);
    }
  });

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const { data, step } = JSON.parse(raw);
      Object.assign(formData, data);

      // Restaurar inputs
      if (data.proceso) document.getElementById('fProceso').value = data.proceso;
      if (data.oportunidad) document.getElementById('fOportunidad').value = data.oportunidad;
      if (data.problematica) document.getElementById('fProblematica').value = data.problematica;
      if (data.volumen) document.getElementById('fVolumen').value = data.volumen;
      if (data.frecuencia) document.getElementById('fFrecuencia').value = data.frecuencia;
      if (data.personas) document.getElementById('fPersonas').value = data.personas;

      // Restaurar single-select
      ['clasificacion', 'alcance', 'tiempo'].forEach(g => {
        if (data[g]) {
          const el = canvas.querySelector('[data-q="' + g + '"][data-val="' + data[g] + '"]');
          if (el) el.classList.add('selected');
        }
      });

      // Restaurar multi-select
      (data.herramientas || []).forEach(val => {
        const el = canvas.querySelector('[data-multi="herramientas"][data-val="' + val + '"]');
        if (el) el.classList.add('selected');
      });

      // Saltar al paso guardado
      if (step && typeof step === 'number' && step <= TOTAL) {
        current = step;
        show(current);
      }
    } catch (e) {
      console.warn('No se pudo restaurar el borrador:', e);
    }
  }

  /* ------------------------------------------------------------------------
     Envío a Dataverse Web API
     ------------------------------------------------------------------------ */
  async function submitForm() {
    show('sending');

    // Construir herramientas como string CSV (formato Multi-Select Choice de Dataverse)
    const herramientasCsv = formData.herramientas
      .map(h => choiceMap.herramientas[h])
      .filter(v => v !== undefined)
      .join(',');

    const payload = {
      jp_nombrecolaborador: formData.nombre,
      jp_correocolaborador: formData.correo,
      jp_clasificacion: choiceMap.clasificacion[formData.clasificacion],
      jp_nombreproceso: formData.proceso,
      jp_alcance: choiceMap.alcance[formData.alcance],
      jp_oportunidad: formData.oportunidad,
      jp_problematica: formData.problematica,
      jp_herramientas: herramientasCsv,
      jp_frecuencia: choiceMap.frecuencia[formData.frecuencia],
      jp_tiemporango: choiceMap.tiempo[formData.tiempo],
      jp_volumenejecuciones: formData.volumen,
      jp_personasinvolucradas: choiceMap.personas[formData.personas],
      jp_estado: 100000000  // "Nuevo"
    };

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          '__RequestVerificationToken': antiforgeryToken
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error('HTTP ' + response.status + ': ' + errText);
      }

      const result = await response.json();
      const code = result.jp_codigo || 'INI-PENDIENTE';
      document.getElementById('jpCode').textContent = code;

      // Limpiar borrador al enviar con éxito
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}

      show('done');

    } catch (err) {
      console.error('Error al enviar iniciativa:', err);
      document.getElementById('jpErrorMsg').textContent =
        'No pudimos registrar tu propuesta. Por favor inténtalo de nuevo en unos minutos. ' +
        'Si el problema persiste, contacta a mejoracontinua@grupojockey.com.';
      show('error');
    }
  }

  /* ------------------------------------------------------------------------
     Reset y reintentos
     ------------------------------------------------------------------------ */
  document.getElementById('jpRestart').addEventListener('click', resetForm);
  document.getElementById('jpRetry').addEventListener('click', () => show(current));

  function resetForm() {
    current = 1;
    Object.keys(formData).forEach(k => {
      if (k === 'nombre' || k === 'correo') return;
      if (k === 'herramientas') formData[k] = [];
      else if (k === 'volumen') formData[k] = null;
      else formData[k] = '';
    });
    canvas.querySelectorAll('.selected').forEach(e => e.classList.remove('selected'));
    canvas.querySelectorAll('input, textarea, select').forEach(e => e.value = '');
    tabs.forEach(t => t.classList.remove('done'));
    show(1);
  }

  /* ------------------------------------------------------------------------
     Inicialización
     ------------------------------------------------------------------------ */
  restoreDraft();
  show(current);
})();

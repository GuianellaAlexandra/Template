const response = await fetch("https://c9b00e1ba24ee8aaa60b8a38b3aa92.e9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/24f4df3d68d5436bb2993c64c2d30124/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=w_J9yOhsqqK0PGn0wt_MPrFUKQArWtsOYCpgQjUpyjs", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nombre: formData.nombre,
    correo: formData.correo,

    clasificacion: formData.clasificacion,
    proceso: formData.proceso,
    alcance: formData.alcance,

    oportunidad: formData.oportunidad,
    problematica: formData.problematica,

    herramientas: formData.herramientas.join(', '),

    frecuencia: formData.frecuencia,
    tiempo: formData.tiempo,
    volumen: formData.volumen,
    personas: formData.personas
  })
});

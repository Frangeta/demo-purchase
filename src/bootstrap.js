function showStartupError(error) {
  const root = document.getElementById('root');

  if (!root) {
    console.error('No se encontró #root para mostrar el error de arranque.', error);
    return;
  }

  const errorMessage = error?.message || '';
  const isMimeError =
    error instanceof TypeError &&
    /Failed to fetch dynamically imported module|module script/i.test(errorMessage);

  const isGithubPages = /\.github\.io$/i.test(window.location.hostname);

  const title = 'No se pudo iniciar la app';
  const details = isMimeError
    ? 'El navegador no pudo cargar módulos JSX como JavaScript. Esto pasa cuando se sirve el código fuente sin Vite/build.'
    : 'Ocurrió un error al cargar la aplicación.';

  const githubPagesHint =
    isMimeError && isGithubPages
      ? '<li>GitHub Pages: verifica que publiques la carpeta <code>dist/</code> (rama <code>gh-pages</code> o fuente <code>GitHub Actions</code>), no la rama <code>main</code> con <code>src/*.jsx</code>.</li>'
      : '';

  root.innerHTML = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 760px; margin: 2rem auto; padding: 1rem 1.25rem; border: 1px solid #f3c2c2; border-radius: 8px; background: #fff7f7; color: #7f1d1d;">
      <h1 style="margin: 0 0 .75rem; font-size: 1.25rem;">${title}</h1>
      <p style="margin: 0 0 .5rem;">${details}</p>
      <ol style="margin: .75rem 0 0 1.25rem;">
        <li>Desarrollo: ejecuta <code>npm install</code> y <code>npm run dev</code>.</li>
        <li>Producción: ejecuta <code>npm run build</code> y publica/serve la carpeta <code>dist/</code>.</li>
        <li>No publiques ni abras directamente <code>index.html</code> + <code>src/*.jsx</code> sin compilar.</li>
        ${githubPagesHint}
      </ol>
      <p style="margin-top: .75rem; font-size: .875rem; opacity: .9;">Detalle técnico: ${errorMessage || 'sin mensaje disponible'}</p>
    </div>
  `;
}

import('./main.jsx').catch((error) => {
  console.error('Error al arrancar la aplicación', error);
  showStartupError(error);
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function normalizeBase(baseValue) {
  if (!baseValue || baseValue === '/') {
    return '/';
  }

  return `/${baseValue.replace(/^\/+|\/+$/g, '')}/`;
}

function getGithubPagesBase() {
  const explicitBase = process.env.VITE_BASE_PATH;
  if (explicitBase) {
    return normalizeBase(explicitBase);
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    return '/';
  }

  const [, repoName] = repository.split('/');
  return normalizeBase(repoName);
}

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? getGithubPagesBase() : '/',
}));

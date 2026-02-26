import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function getGithubPagesBase() {
  const repository = process.env.GITHUB_REPOSITORY;

  if (!repository) {
    return '/';
  }

  const [, repoName] = repository.split('/');
  return repoName ? `/${repoName}/` : '/';
}

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? getGithubPagesBase() : '/',
}));

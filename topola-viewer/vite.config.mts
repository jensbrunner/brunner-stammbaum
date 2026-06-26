import {defineConfig} from 'vite';
import {execSync} from 'child_process';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';

let gitSha = '';
let gitTime = '';
try {
  gitSha = execSync('git rev-parse --short HEAD').toString().trim();
  gitTime = execSync('git log -1 --format=%ci').toString().trim();
} catch (e) {
  console.error('Failed to get git info', e);
}

export default defineConfig({
  base: '',
  define: {
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitSha),
    'import.meta.env.VITE_GIT_TIME': JSON.stringify(gitTime),
  },
  plugins: [react(), viteTsconfigPaths()],
  server: {
    open: true,
    port: 3000,
  },
});

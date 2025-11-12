import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Your repository name from the uploaded image:
const repoName = 'catch-the-mask-billions-network'; 

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // 🚀 CRITICAL LINE FOR GITHUB PAGES
      base: `/${repoName}/`, 
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
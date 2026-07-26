import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

const buildTimestamp = Date.now().toString();

export default defineConfig(() => {
  return {
    base: './',
    define: {
      'import.meta.env.VITE_APP_BUILD_TIME': JSON.stringify(buildTimestamp),
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'pwa-version-generator',
        transformIndexHtml(html) {
          return html.replace(
            '</head>',
            `  <meta name="app-version" content="${buildTimestamp}" />\n    <script>window.__APP_VERSION__="${buildTimestamp}";</script>\n  </head>`
          );
        },
        closeBundle() {
          const distDir = path.resolve(__dirname, 'dist');
          if (!fs.existsSync(distDir)) return;

          // Write version.json for version polling
          const versionData = JSON.stringify(
            {
              version: buildTimestamp,
              buildTime: new Date().toISOString(),
            },
            null,
            2
          );
          fs.writeFileSync(path.join(distDir, 'version.json'), versionData);

          // Inject unique cache name into dist/sw.js
          const swPath = path.join(distDir, 'sw.js');
          if (fs.existsSync(swPath)) {
            let swContent = fs.readFileSync(swPath, 'utf-8');
            swContent = swContent.replace(
              /const CACHE_NAME = ['"].*?['"];/,
              `const CACHE_NAME = 'grocery-pwa-${buildTimestamp}';`
            );
            swContent = swContent.replace(/__BUILD_TIMESTAMP__/g, buildTimestamp);
            fs.writeFileSync(swPath, swContent);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

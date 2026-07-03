import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: [
      {
        find: /^prop-types$/,
        replacement: path.resolve(__dirname, 'src/vendor/prop-types.js'),
      },
      {
        find: /^react-is$/,
        replacement: path.resolve(__dirname, 'src/vendor/react-is.js'),
      },
      {
        find: /^hoist-non-react-statics$/,
        replacement: path.resolve(__dirname, 'src/vendor/hoist-non-react-statics.js'),
      },
      {
        find: /^tiny-case$/,
        replacement: path.resolve(__dirname, 'src/vendor/tiny-case.js'),
      },
      {
        find: /^property-expr$/,
        replacement: path.resolve(__dirname, 'src/vendor/property-expr.js'),
      },
      {
        find: /^toposort$/,
        replacement: path.resolve(__dirname, 'src/vendor/toposort.js'),
      },
      {
        find: /^react-responsive-carousel$/,
        replacement: path.resolve(__dirname, 'src/vendor/react-responsive-carousel.js'),
      },
      {
        find: 'cookie',
        replacement: path.resolve(__dirname, 'src/vendor/cookie.js'),
      },
      {
        find: 'set-cookie-parser',
        replacement: path.resolve(__dirname, 'src/vendor/set-cookie-parser.js'),
      },
      {
        find: 'react/jsx-dev-runtime',
        replacement: path.resolve(__dirname, 'src/vendor/react-jsx-dev-runtime.js'),
      },
      {
        find: 'react/jsx-runtime',
        replacement: path.resolve(__dirname, 'src/vendor/react-jsx-runtime.js'),
      },
      {
        find: 'react-dom/client',
        replacement: path.resolve(__dirname, 'src/vendor/react-dom-client.js'),
      },
      {
        find: 'react-dom',
        replacement: path.resolve(__dirname, 'src/vendor/react-dom.js'),
      },
      {
        find: 'use-sync-external-store/with-selector.js',
        replacement: path.resolve(
          __dirname,
          'src/shims/use-sync-external-store-with-selector.js'
        ),
      },
      {
        find: 'react',
        replacement: path.resolve(__dirname, 'src/vendor/react.js'),
      },
    ],
  },
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5175,
    host: true,
    proxy: {
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    noDiscovery: true,
    exclude: [
      'react',
      'react/jsx-dev-runtime',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'cookie',
      'set-cookie-parser',
      'react-responsive-carousel',
      'tiny-case',
      'property-expr',
      'toposort',
      'hoist-non-react-statics',
      'prop-types',
      'react-is',
    ],
  },
  build: {
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@mui')) return 'mui'
          if (id.includes('react-router')) return 'router'
          if (id.includes('react-redux') || id.includes('@reduxjs')) return 'redux'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})

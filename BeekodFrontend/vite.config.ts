import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'vaul@1.1.2': 'vaul',
      'sonner@2.0.3': 'sonner',
      'recharts@2.15.2': 'recharts',
      'react-resizable-panels@2.1.7': 'react-resizable-panels',
      'react-hook-form@7.55.0': 'react-hook-form',
      'react-day-picker@8.10.1': 'react-day-picker',
      'next-themes@0.4.6': 'next-themes',
      'lucide-react@0.487.0': 'lucide-react',
      'input-otp@1.4.2': 'input-otp',
      'figma:asset/ff07eef6fed6afc5fbcd46f649305375382805c9.png': path.resolve(
        __dirname,
        './src/assets/ff07eef6fed6afc5fbcd46f649305375382805c9.png',
      ),
      'figma:asset/fbe0e199ceb6b21d8b5a00808093d52051b5787e.png': path.resolve(
        __dirname,
        './src/assets/fbe0e199ceb6b21d8b5a00808093d52051b5787e.png',
      ),
      'figma:asset/faa1458c5295db0f7e44f05d2570257e3b9ea5cc.png': path.resolve(
        __dirname,
        './src/assets/faa1458c5295db0f7e44f05d2570257e3b9ea5cc.png',
      ),
      'figma:asset/dbe268abcfed23a245a6570fcf378fa05c9db1cc.png': path.resolve(
        __dirname,
        './src/assets/dbe268abcfed23a245a6570fcf378fa05c9db1cc.png',
      ),
      'figma:asset/db66e26aa7224f7020be1ee7db35f0c2b3e94a26.png': path.resolve(
        __dirname,
        './src/assets/db66e26aa7224f7020be1ee7db35f0c2b3e94a26.png',
      ),
      'figma:asset/d9e7858ce1064fa81f9436bd9a9555bab0a0b90e.png': path.resolve(
        __dirname,
        './src/assets/d9e7858ce1064fa81f9436bd9a9555bab0a0b90e.png',
      ),
      'figma:asset/cb72f6dce201c666472dc8d32b9eedb482e1510e.png': path.resolve(
        __dirname,
        './src/assets/cb72f6dce201c666472dc8d32b9eedb482e1510e.png',
      ),
      'figma:asset/c30be34ff20097037fd4d5c68805466971f7cb08.png': path.resolve(
        __dirname,
        './src/assets/c30be34ff20097037fd4d5c68805466971f7cb08.png',
      ),
      'figma:asset/c0d82a7204c9fe75fd4e1885989d8780eea69d6e.png': path.resolve(
        __dirname,
        './src/assets/c0d82a7204c9fe75fd4e1885989d8780eea69d6e.png',
      ),
      'figma:asset/bb008c0bb03c26e978fab5b13ab8cd2e1da0615e.png': path.resolve(
        __dirname,
        './src/assets/bb008c0bb03c26e978fab5b13ab8cd2e1da0615e.png',
      ),
      'figma:asset/9d96f3bbf44d3ec04b17cf47ee8392a065d2b41b.png': path.resolve(
        __dirname,
        './src/assets/9d96f3bbf44d3ec04b17cf47ee8392a065d2b41b.png',
      ),
      'figma:asset/9b68cc0466e0009fad17ab706b6d2cbcaef51769.png': path.resolve(
        __dirname,
        './src/assets/9b68cc0466e0009fad17ab706b6d2cbcaef51769.png',
      ),
      'figma:asset/98dc71e13dc2d35d408fb6e3664ec78513edb19f.png': path.resolve(
        __dirname,
        './src/assets/98dc71e13dc2d35d408fb6e3664ec78513edb19f.png',
      ),
      'figma:asset/93b2295c6ddd5a8c10d08a31a7ba575178617577.png': path.resolve(
        __dirname,
        './src/assets/93b2295c6ddd5a8c10d08a31a7ba575178617577.png',
      ),
      'figma:asset/92e0e858a0272e479083d7ccf22ab26b72269d48.png': path.resolve(
        __dirname,
        './src/assets/92e0e858a0272e479083d7ccf22ab26b72269d48.png',
      ),
      'figma:asset/6d37b0c530cf33a8f55054e6c82ada5b31c1056e.png': path.resolve(
        __dirname,
        './src/assets/6d37b0c530cf33a8f55054e6c82ada5b31c1056e.png',
      ),
      'figma:asset/64dc6519a41c808e79b146fe45a387ef0feaa1e3.png': path.resolve(
        __dirname,
        './src/assets/64dc6519a41c808e79b146fe45a387ef0feaa1e3.png',
      ),
      'figma:asset/5fa5209c94af33a11d3aaaf2a174b2cb5272e14c.png': path.resolve(
        __dirname,
        './src/assets/5fa5209c94af33a11d3aaaf2a174b2cb5272e14c.png',
      ),
      'figma:asset/563328772dcd4f9d76dd21b5abc99b99a49e8f70.png': path.resolve(
        __dirname,
        './src/assets/563328772dcd4f9d76dd21b5abc99b99a49e8f70.png',
      ),
      'figma:asset/47763b5513f64acd986685a9d5e10bd4314defe9.png': path.resolve(
        __dirname,
        './src/assets/47763b5513f64acd986685a9d5e10bd4314defe9.png',
      ),
      'figma:asset/268194b97aa6db62a4c4195aacff1fcb0f19f11b.png': path.resolve(
        __dirname,
        './src/assets/268194b97aa6db62a4c4195aacff1fcb0f19f11b.png',
      ),
      'figma:asset/1230e43a58a5ec2cbca646dd9964cda0a5eb57b2.png': path.resolve(
        __dirname,
        './src/assets/1230e43a58a5ec2cbca646dd9964cda0a5eb57b2.png',
      ),
      'figma:asset/02f5b50387e462570178335f8c876e2f912235a6.png': path.resolve(
        __dirname,
        './src/assets/02f5b50387e462570178335f8c876e2f912235a6.png',
      ),
      'embla-carousel-react@8.6.0': 'embla-carousel-react',
      'cmdk@1.1.1': 'cmdk',
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
      '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
      '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
      '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
      '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
      '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
      '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
      '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
      '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
      '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
      '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
      '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
      '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
      '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
      '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'sonner', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
          // Feature chunks
          'analytics': [
            './src/pages/AnalyticsScreen.tsx',
            './src/pages/FinancialAnalyticsScreen.tsx',
            './src/pages/RevenueOptimizationScreen.tsx'
          ],
          'marketplace': [
            './src/pages/IntegrationsScreenV2.tsx',
            './src/pages/MarketplaceSyncScreen.tsx',
            './src/pages/MarketplaceInventoryScreen.tsx'
          ]
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Minification
    minify: 'esbuild',
    // Source maps for production debugging
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true,
  },
});

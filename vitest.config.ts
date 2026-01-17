import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        env: {
            DB_HOST: 'localhost',
            DB_USER: 'test',
            DB_NAME: 'test_db',
            GEMINI_API_KEY: 'test-key',
            REDIS_URL: 'redis://localhost:6379',
            JWT_SECRET: 'test-secret',
            OPENAI_API_KEY: 'test-key',
            SENTRY_DSN: 'https://examplePublicKey@o0.ingest.sentry.io/0',
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                'tests/',
                '**/*.test.ts'
            ]
        }
    }
});

import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/db',
              message:
                'Importing lib/db directly is restricted to lib/dal/* and lib/auth/*. Use lib/dal/* instead.',
            },
            {
              name: '@/lib/db.js',
              message:
                'Importing lib/db directly is restricted to lib/dal/* and lib/auth/*. Use lib/dal/* instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['lib/dal/**/*.js', 'lib/auth/**/*.js'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'prisma/migrations/**', 'storage/**'],
  },
];

import next from 'next';
import nextLintConfig from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default [
  // ✅ Base Next.js & TypeScript config
  ...tseslint.config({
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        SpeechRecognition: 'readonly',
        webkitSpeechRecognition: 'readonly',
        SpeechSynthesisUtterance: 'readonly',
        speechSynthesis: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // 👈 Optional: disable if needed
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  }),

  // ✅ Next.js specific rules
  next(),
  nextLintConfig,
];

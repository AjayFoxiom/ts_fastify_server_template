import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "uploads/**", "coverage/**", "prisma/**"],
  },
  // ── TypeScript source + tests ─────────────────────────────────────────────
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        // Type-aware rules (no-floating-promises) require a tsconfig reference.
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // TypeScript recommended baseline
      ...tsPlugin.configs["recommended"].rules,

      // Catch unawaited async calls — especially important in Fastify route handlers.
      // Unhandled rejections silently crash the process or leave requests hanging.
      "@typescript-eslint/no-floating-promises": "error",

      // Prefer explicit return types on exported functions / route handlers.
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],

      // Warn on any[] but don't error — some places (Prisma raw, Fastify internals) need it.
      "@typescript-eslint/no-explicit-any": "warn",

      // Keep unused vars as warnings; ignore leading-underscore params.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Require consistent use of type imports to avoid circular-dep false positives.
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
    },
  },
  // ── JS / CJS config files ─────────────────────────────────────────────────
  {
    files: ["**/*.js", "**/*.cjs"],
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];

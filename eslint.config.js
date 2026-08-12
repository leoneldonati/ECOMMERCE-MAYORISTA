// Configuración de ESLint (flat) minimal:
// - typescript-eslint recommended para el chequeo de tipos/reglas de TS
// - react-hooks con las dos reglas clásicas (no las nuevas de v7, que exigen
//   rewrites ajenos al scope del proyecto)
// - eslint-config-prettier al final: el estilo queda delegado a Prettier.
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["build", ".react-router", "node_modules", "data"] },
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // ignoreRestSiblings habilita el patrón de "omitir" campos al delegar en
    // el spread (`const { password_hash, ...publicUser } = user`).
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  eslintConfigPrettier,
];

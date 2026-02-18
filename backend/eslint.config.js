import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"

export default [
  {
    files: ["**/*.ts"],
    languageOptions: { parser: tsParser },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      quotes: ["error", "double"],          // o "single", elige uno
      semi: ["error", "never"],
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
]
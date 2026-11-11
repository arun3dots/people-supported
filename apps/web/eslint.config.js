import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "no-undef": "off",
      "react/no-unescaped-entities": "off",
      "prefer-const": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];

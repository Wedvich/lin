import { fixupPluginRules } from "@eslint/compat";
import eslint from "@eslint/js";
// @ts-expect-error - eslint-plugin-import doesn't have types
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    plugins: {
      ["import"]: fixupPluginRules(importPlugin),
    },
  },
  {
    ignores: [
      ".yarn/*",
      "**/.turbo/**",
      "**/coverage/**",
      "**/dist/**",
      "**/lib/**",
      "**/node_modules/**",
      "**/*.json",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/member-ordering": "warn",
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "parent", "sibling", "index", "type"],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "sort-imports": [
        "warn",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],
    },
  },
  {
    files: ["**/*.test.*"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
);

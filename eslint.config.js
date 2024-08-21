import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".yarn/*",
      "**/.turbo/**",
      "**/coverage/**",
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
    },
  },
  {
    files: ["**/*.test.*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
);

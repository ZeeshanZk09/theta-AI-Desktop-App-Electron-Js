import neostandard from "neostandard";
import tsParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tailwindCanonicalClasses from "eslint-plugin-tailwind-canonical-classes";

export default [
  // Base neostandard for sensible defaults
  ...neostandard({
    ts: true,
    noStyle: true,
  }),
  ...tailwindCanonicalClasses.configs["flat/recommended"],
  // TypeScript rules and parsing
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: ["./tsconfig.json", "./tsconfig.electron.json", "./tsconfig.node.json"],
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      import: importPlugin,
    },
    rules: {
      "tailwind-canonical-classes/tailwind-canonical-classes": [
        "warn",
        {
          cssPath: "./src/index.css", // Adjusted to the correct path in this project
          rootFontSize: 16, // Optional, default: 16
          calleeFunctions: ["cn", "clsx", "classNames", "twMerge", "cva", "tw"], // Optional, default: ['cn', 'clsx', 'classNames', 'twMerge', 'cva']
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling"], "index", "type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",
      "no-console": ["error", { allow: ["error"] }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // React rules
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: { react, "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    settings: { react: { version: "detect" } },
    rules: {
      "react/jsx-handler-names": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/self-closing-comp": "error",
      "react/jsx-no-target-blank": "error",
      "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error", // explain : It is used for avoiding stale closures.
    },
  },

  // Accessibility and JSX
  {
    files: ["**/*.tsx", "**/*.jsx"],
    rules: {
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/no-static-element-interactions": "off",
    },
  },

  // Global ignore patterns
  {
    ignores: ["qa/**", 
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.ts",
      "**/.agents/**",
      "**/scripts/**",
      "**/src/generated/**",
      "**/extra/**",
      "**/supabase/**",
      "**/*.mjs",
      "**/*.js",
    ],
  },
];

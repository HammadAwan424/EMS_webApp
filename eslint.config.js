import globals from "globals";
import { defineConfig } from 'eslint/config';
import pluginJs from "@eslint/js";
import pluginTs from 'typescript-eslint';
import { fixupPluginRules, fixupConfigRules } from "@eslint/compat";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh";
// import importPlugin from 'eslint-plugin-import';
// import unusedImports from "eslint-plugin-unused-imports"



export default defineConfig([
  // eslint for typescript (per file only) +
  // "TypeChecked" is appended after recommended to enable rules that 
  // requires the whole ts tree / type checking service for working
  pluginTs.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true, // enables ts type-checking service
        tsconfigRootDir: import.meta.dirname, // pats for tsconfig.ts
      },
    },
  },
  
  // pluginJs doesn't include a files field
  // matches only the files which eslint matches by default
  // **/*.{js,cs,mjs,cjs} but we need jsx also
  {
    files: ["**/*.{js,cs,mjs,cjs,jsx}"],
    extends: [pluginJs.configs.recommended],
  },

  // the files is required with these configurations as react doesn't 
  // include it by default by default, but the way eslint works is, it
  // auto applies these rules to any file matched by any other configuration
  // so we don't need it, the files configuration
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    plugins: {
      'react-hooks': fixupPluginRules(pluginReactHooks),
      "react-refresh": reactRefresh,
    },
  },
  {
    rules: {
    "@typescript-eslint/no-unused-vars": ["warn", {caughtErrors: "none"}],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-empty-object-type": "off"
    }
},

  // for the time being, all globals are available everywhere
  // except the ones from jest
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ["**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  },
])

// // Copied from stack overflow
// // TODO: have to change it acc to requirements and learn about it
// {
//   // All eslint-plugin-import config is here
//   languageOptions: {
//     parserOptions: {
//       // Eslint doesn't supply ecmaVersion in `parser.js` `context.parserOptions`
//       // This is required to avoid ecmaVersion < 2015 error or 'import' / 'export' error
//       ecmaVersion: "latest",
//       sourceType: "module",
//     },
//   },
//   plugins: { import: importPlugin },
//   settings: {
//     "import/parsers": {
//       espree: [".js", ".cjs", ".mjs", ".jsx"],
//     },
//     "import/resolver": {
//       "jsconfig": {
//         "config": "./jsconfig.json"
//       }
//     },
//   },
//   rules: {
//     ...importPlugin.configs["recommended"].rules,
//   },
// },
// // ... add other plugins like typescript-eslint etc
// {
//   // All my custom config
//   languageOptions: {
//     // This default get replaced by plugins, so I added back. Not related probably.
//     ecmaVersion: "latest",
//     sourceType: "module",
//     // ... globals etc
//   },
// },
// {
//   plugins: {
//     "unused-imports": unusedImports,
//   },
//   rules: {
//     "no-unused-vars": "off", // or "@typescript-eslint/no-unused-vars": "off",
//     "unused-imports/no-unused-imports": "error",
//     "unused-imports/no-unused-vars": [
//       "warn",
//       {
//         "vars": "all",
//         "varsIgnorePattern": "^_",
//         "args": "after-used",
//         "argsIgnorePattern": "^_",
//       },
//     ]
//   }
// }
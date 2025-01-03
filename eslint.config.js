import globals from "globals";
import pluginJs from "@eslint/js";
import { fixupPluginRules, fixupConfigRules } from "@eslint/compat";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from 'eslint-plugin-import';
import unusedImports from "eslint-plugin-unused-imports"



export default [
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  
  {
    plugins: {
      'react-hooks': fixupPluginRules(pluginReactHooks),
      "react-refresh": reactRefresh,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "no-unused-vars": "warn",
      "react/prop-types": "off"
    },
    languageOptions: {
      globals: {
        production: false
      }
    }
  }, 
  {
    files: ["**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  },


  // Copied from stack overflow
  // TODO: have to change it acc to requirements and learn about it
  {
    // All eslint-plugin-import config is here
    languageOptions: {
      parserOptions: {
        // Eslint doesn't supply ecmaVersion in `parser.js` `context.parserOptions`
        // This is required to avoid ecmaVersion < 2015 error or 'import' / 'export' error
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: { import: importPlugin },
    settings: {
      "import/parsers": {
        espree: [".js", ".cjs", ".mjs", ".jsx"],
      },
      "import/resolver": {
        "jsconfig": {
          "config": "./jsconfig.json"
        }
      },
    },
    rules: {
      ...importPlugin.configs["recommended"].rules,
    },
  },
  // ... add other plugins like typescript-eslint etc
  {
    // All my custom config
    languageOptions: {
      // This default get replaced by plugins, so I added back. Not related probably.
      ecmaVersion: "latest",
      sourceType: "module",
     // ... globals etc
    },
  },
  {
    plugins: {
        "unused-imports": unusedImports,
    },
    rules: {
        "no-unused-vars": "off", // or "@typescript-eslint/no-unused-vars": "off",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": [
            "warn",
            {
                "vars": "all",
                "varsIgnorePattern": "^_",
                "args": "after-used",
                "argsIgnorePattern": "^_",
            },
        ]
    }
  }
];
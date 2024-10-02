import globals from "globals";
import pluginJs from "@eslint/js";
import { fixupPluginRules, fixupConfigRules } from "@eslint/compat";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from 'eslint-plugin-import';



export default [
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  // importPlugin.flatConfigs.recommended,
  {
    plugins: {
      'react-hooks': fixupPluginRules(pluginReactHooks),
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": "warn",
      ...pluginReactHooks.configs.recommended.rules,
      "no-unused-vars": "warn"
    },
  }, 
  {
    files: ["**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  }
];
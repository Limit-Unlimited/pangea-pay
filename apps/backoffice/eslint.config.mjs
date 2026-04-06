import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Drizzle ORM's dynamic update patterns require explicit any in several places;
      // the type safety is enforced at the schema layer instead.
      "@typescript-eslint/no-explicit-any": "warn",
      // Unused vars are informational during active development.
      "@typescript-eslint/no-unused-vars": "warn",
      // The standard async-load pattern (setLoading(true) before first await inside a
      // function called from useEffect) triggers this rule. It is a known false positive
      // for data-fetching components; the cascading render concern does not apply here.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;

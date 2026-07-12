export default {
  // Type-check the whole project once (tsc ignores tsconfig — incl. path
  // aliases — when given individual files, so it must run project-wide, not
  // per staged file). The `() => ...` form tells lint-staged not to append
  // filenames. eslint & prettier still run only on the staged files.
  "*.{ts,tsx}": [() => "tsc --noEmit", "eslint --fix", "prettier --write"],
  "*.{js,cjs,mjs,json,css,md,yml,yaml}": "prettier --write",
};

export default {
  "*.{js,jsx,mjs,cjs,ts,tsx}": ["pprettier --write", "eslint --cache --fix"],
  "*.{json,md}": ["pprettier --write"],
};

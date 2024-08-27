/** @type {import('prettier').Config} */
export default {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindConfig: "./packages/app/tailwind.config.ts",
  tailwindFunctions: ["clsx", "tw"],
};

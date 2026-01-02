import { defineConfig } from "vite";
import { transform as esbuildTransform } from "esbuild";

const jsxForJs = {
  name: "jsx-for-js",
  enforce: "pre",
  async transform(code, id) {
    if (!id.includes("/src/") || !id.endsWith(".js")) return null;

    const result = await esbuildTransform(code, {
      loader: "jsx",
      jsx: "automatic",
      sourcemap: true,
    });

    return { code: result.code, map: result.map };
  },
};

export default defineConfig({
  plugins: [jsxForJs],
  build: {
    outDir: "build",
    // Avoid overwriting the Vite HTML with CRA's public/index.html.
    copyPublicDir: false,
  },
});

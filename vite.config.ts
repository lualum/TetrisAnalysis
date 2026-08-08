// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
	// GitHub Pages needs the repository subpath, while the local dev server
	// should serve the app from any path (including /TetrisAnalysis/).
	base: command === "serve" ? "/" : "/TetrisAnalysis/",
	root: ".",
	build: {
		outDir: "dist",
		rollupOptions: {
			input: {
				main: "./index.html",
			},
		},
	},
	server: {
		port: 3000,
	},
}));

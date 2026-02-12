// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
	base: "/TetrisAnalysis/",
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
});

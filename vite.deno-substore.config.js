import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { subStoreTransformPlugin } from './vite.substore-transform.js';
import { createSharedResolveConfig } from './vite.shared.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 需要强制加载的补丁文件，避免被 Rollup tree-shaking 漏掉
const FORCE_INCLUDE_FILES = [
    'sub-store/backend/src/core/proxy-utils/processors/index.js',
];

function forceIncludePlugin() {
    return {
        name: 'force-include-patch-targets',
        enforce: 'pre',
        async buildStart() {
            for (const rel of FORCE_INCLUDE_FILES) {
                const abs = path.join(__dirname, rel);
                try {
                    // 强制 Rollup 加载并解析该文件，触发 sub-store-transform 的 transform 钩子
                    await this.load({ id: abs });
                } catch (err) {
                    this.error(
                        `[force-include] 加载 ${rel} 失败: ${err?.message || err}`,
                    );
                }
            }
        },
    };
}

export default defineConfig({
    plugins: [
        forceIncludePlugin(),
        subStoreTransformPlugin(),
    ],
    resolve: createSharedResolveConfig(),
    build: {
        emptyOutDir: false,
        outDir: path.join(__dirname, 'dist/deno'),
        target: 'esnext',
        minify: false,
        sourcemap: true,
        lib: {
            entry: path.join(__dirname, 'sub-store/backend/src/main.js'),
            formats: ['es'],
            fileName: () => 'substore-runtime.js',
        },
        rollupOptions: {
            external: ['node:crypto'],
            output: {
                inlineDynamicImports: true,
            },
        },
    },
});

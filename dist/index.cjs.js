'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var rollup = require('rollup');
var integration = require('@vanilla-extract/integration');
var path = require('path');

const { relative: relative$1, normalize: normalize$1, dirname: dirname$1 } = path.posix;
function usePlugin(fileName) {
    if (typeof fileName === "string") {
        return /(\.css.ts)$/i.test(fileName);
    }
    return true;
}
function vanillaExtractRollupPlugin({ identifiers, cwd = process.cwd(), esbuildOptions, } = {}) {
    const emittedFiles = new Map();
    const isProduction = process.env.NODE_ENV === "production";
    return {
        name: "vanilla-extract",
        buildStart() {
            emittedFiles.clear();
        },
        async transform(_code, id) {
            if (!integration.cssFileFilter.test(id)) {
                return null;
            }
            const index = id.indexOf("?");
            const filePath = index === -1 ? id : id.substring(0, index);
            const { source, watchFiles } = await integration.compile({
                filePath,
                cwd,
                esbuildOptions,
            });
            for (const file of watchFiles) {
                this.addWatchFile(file);
            }
            let css = "";
            await integration.processVanillaFile({
                source,
                filePath,
                identOption: identifiers !== null && identifiers !== void 0 ? identifiers : (isProduction ? "short" : "debug"),
                serializeVirtualCssPath: async ({ source }) => {
                    css += source;
                    return "";
                },
            });
            return {
                code: `export default ${JSON.stringify(css)}`,
                map: { mappings: "" },
            };
        },
        async resolveId(id) {
            if (!integration.virtualCssFileFilter.test(id)) {
                return null;
            }
            // Emit an asset for every virtual css file
            const { fileName, source } = await integration.getSourceFromVirtualCssFile(id);
            if (!emittedFiles.get(fileName)) {
                const assetId = this.emitFile({
                    type: "asset",
                    name: fileName,
                    source,
                });
                emittedFiles.set(fileName, assetId);
            }
            // Resolve to a temporary external module
            return {
                id: fileName,
                external: true,
            };
        },
        renderChunk(code, chunkInfo) {
            var _a;
            const importsToReplace = chunkInfo.imports.filter((fileName) => emittedFiles.get(fileName));
            if (!importsToReplace.length) {
                return null;
            }
            const chunkPath = dirname$1(chunkInfo.fileName);
            const output = importsToReplace.reduce((codeResult, importPath) => {
                const assetId = emittedFiles.get(importPath);
                const assetName = this.getFileName(assetId);
                const fixedImportPath = `./${normalize$1(relative$1(chunkPath, assetName))}`;
                return codeResult.replace(importPath, fixedImportPath);
            }, code);
            return {
                code: output,
                map: (_a = chunkInfo.map) !== null && _a !== void 0 ? _a : null,
            };
        },
    };
}
async function compileVanillaExtract(fileName) {
    const bundle = await rollup.rollup({
        input: fileName,
        plugins: [vanillaExtractRollupPlugin()],
    });
    const { output } = await bundle.generate({
        format: "cjs",
        exports: "default",
    });
    return eval(output[0].code);
}

function vanillaExtract() {
    return {
        name: "vanilla-extract",
        pluginType: "css",
        async transform(sourceText, fileName, context) {
            if (!usePlugin(fileName)) {
                return null;
            }
            if (typeof sourceText !== "string") {
                return null;
            }
            const results = {
                id: fileName.endsWith(".css.ts") ? fileName.slice(0, -3) : fileName,
                dependencies: [],
            };
            if (sourceText.trim() === "") {
                results.code = "";
                return Promise.resolve(results);
            }
            try {
                results.code = await compileVanillaExtract(fileName);
                await context.fs.writeFile(results.id, results.code, {
                    inMemoryOnly: true,
                });
                return results;
            }
            catch (e) {
                const diagnostic = {
                    level: "error",
                    type: "css",
                    language: "css",
                    header: "vanilla-extract error",
                    relFilePath: null,
                    absFilePath: null,
                    messageText: e,
                    lines: [],
                };
                context.diagnostics.push(diagnostic);
                console.error(e);
                results.code = `/**  vanilla-extract error${e && e.message ? ": " + e.message : ""}  **/`;
                return results;
            }
        },
    };
}

const { relative, normalize, dirname } = path.posix;
function vanillaExtractPlugin({ identifiers, cwd = process.cwd(), esbuildOptions, } = {}) {
    const emittedFiles = new Map();
    const isProduction = process.env.NODE_ENV === "production";
    return {
        name: "vanilla-extract",
        buildStart() {
            emittedFiles.clear();
        },
        async transform(_code, id) {
            if (!integration.cssFileFilter.test(id)) {
                return null;
            }
            const index = id.indexOf("?");
            const filePath = index === -1 ? id : id.substring(0, index);
            const { source, watchFiles } = await integration.compile({
                filePath,
                cwd,
                esbuildOptions,
            });
            for (const file of watchFiles) {
                this.addWatchFile(file);
            }
            const output = await integration.processVanillaFile({
                source,
                filePath,
                identOption: identifiers !== null && identifiers !== void 0 ? identifiers : (isProduction ? "short" : "debug"),
            });
            return {
                code: output.replace(/import '.+\.css\.ts\.vanilla\.css.+';/g, ""),
                map: { mappings: "" },
            };
        },
        async resolveId(id) {
            if (!integration.virtualCssFileFilter.test(id)) {
                return null;
            }
            // Emit an asset for every virtual css file
            const { fileName, source } = await integration.getSourceFromVirtualCssFile(id);
            if (!emittedFiles.get(fileName)) {
                const assetId = this.emitFile({
                    type: "asset",
                    name: fileName,
                    source,
                });
                emittedFiles.set(fileName, assetId);
            }
            // Resolve to a temporary external module
            return {
                id: fileName,
                external: true,
            };
        },
        renderChunk(code, chunkInfo) {
            var _a;
            // For all imports in this chunk that we have emitted files for...
            const importsToReplace = chunkInfo.imports.filter((fileName) => emittedFiles.get(fileName));
            if (!importsToReplace.length) {
                return null;
            }
            // ...replace import paths with relative paths to emitted css files
            const chunkPath = dirname(chunkInfo.fileName);
            const output = importsToReplace.reduce((codeResult, importPath) => {
                const assetId = emittedFiles.get(importPath);
                const assetName = this.getFileName(assetId);
                const fixedImportPath = `./${normalize(relative(chunkPath, assetName))}`;
                return codeResult.replace(importPath, fixedImportPath);
            }, code);
            return {
                code: output,
                map: (_a = chunkInfo.map) !== null && _a !== void 0 ? _a : null,
            };
        },
    };
}

exports.vanillaExtractRollupPlugin = vanillaExtractPlugin;
exports.vanillaExtractStencilPlugin = vanillaExtract;

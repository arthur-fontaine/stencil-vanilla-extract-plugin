import { rollup, Plugin } from "rollup";
import {
  cssFileFilter,
  processVanillaFile,
  compile,
  IdentifierOption,
  getSourceFromVirtualCssFile,
  virtualCssFileFilter,
  CompileOptions,
} from "@vanilla-extract/integration";
import { posix } from "path";
const { relative, normalize, dirname } = posix;

export function usePlugin(fileName: string) {
  if (typeof fileName === "string") {
    return /(\.css.ts)$/i.test(fileName);
  }
  return true;
}

interface Options {
  identifiers?: IdentifierOption;
  cwd?: string;
  esbuildOptions?: CompileOptions["esbuildOptions"];
}

function vanillaExtractRollupPlugin({
  identifiers,
  cwd = process.cwd(),
  esbuildOptions,
}: Options = {}): Plugin {
  const emittedFiles = new Map<string, string>();
  const isProduction = process.env.NODE_ENV === "production";

  return {
    name: "vanilla-extract",
    buildStart() {
      emittedFiles.clear();
    },
    async transform(_code, id) {
      if (!cssFileFilter.test(id)) {
        return null;
      }

      const index = id.indexOf("?");
      const filePath = index === -1 ? id : id.substring(0, index);

      const { source, watchFiles } = await compile({
        filePath,
        cwd,
        esbuildOptions,
      });

      for (const file of watchFiles) {
        this.addWatchFile(file);
      }

      let css: string = "";

      await processVanillaFile({
        source,
        filePath,
        identOption: identifiers ?? (isProduction ? "short" : "debug"),
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
      if (!virtualCssFileFilter.test(id)) {
        return null;
      }

      // Emit an asset for every virtual css file
      const { fileName, source } = await getSourceFromVirtualCssFile(id);
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
      const importsToReplace = chunkInfo.imports.filter((fileName) =>
        emittedFiles.get(fileName)
      );
      if (!importsToReplace.length) {
        return null;
      }

      const chunkPath = dirname(chunkInfo.fileName);
      const output = importsToReplace.reduce((codeResult, importPath) => {
        const assetId = emittedFiles.get(importPath)!;
        const assetName = this.getFileName(assetId);
        const fixedImportPath = `./${normalize(
          relative(chunkPath, assetName)
        )}`;
        return codeResult.replace(importPath, fixedImportPath);
      }, code);
      return {
        code: output,
        map: chunkInfo.map ?? null,
      };
    },
  };
}

export async function compileVanillaExtract(fileName: string): Promise<string> {
  const bundle = await rollup({
    input: fileName,
    plugins: [vanillaExtractRollupPlugin()],
  });
  const { output } = await bundle.generate({
    format: "cjs",
    exports: "default",
  });
  return eval(output[0].code) as string;
}

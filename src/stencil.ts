import * as d from "./declarations";
import { compileVanillaExtract, usePlugin } from "./util";

export function vanillaExtract(): d.Plugin {
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

      const results: d.PluginTransformResults = {
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
      } catch (e) {
        const diagnostic: d.Diagnostic = {
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

        results.code = `/**  vanilla-extract error${
          e && e.message ? ": " + e.message : ""
        }  **/`;
        return results;
      }
    },
  };
}

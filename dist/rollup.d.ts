import type { Plugin } from "rollup";
import { IdentifierOption, CompileOptions } from "@vanilla-extract/integration";
interface Options {
    identifiers?: IdentifierOption;
    cwd?: string;
    esbuildOptions?: CompileOptions["esbuildOptions"];
}
export declare function vanillaExtractPlugin({ identifiers, cwd, esbuildOptions, }?: Options): Plugin;
export {};

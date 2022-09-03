import { IdentifierOption } from "@vanilla-extract/integration";

export * from '@stencil/core/internal';

// export interface PluginOptions {
//   root?: string;
//   data?: string;
//   identifiers?: IdentifierOption;
//
//   importer?: Importer | Importer[];
//   file?: string;
//   injectGlobalPaths?: string[];
//   includePaths?: string[];
//   indentedSyntax?: boolean;
// }

// export type ImporterReturnType = { file: string } | { contents: string } | Error | null;
//
// export type Importer = (
//   url: string,
//   prev: string,
//   done: (data: ImporterReturnType) => void
// ) => ImporterReturnType | void;

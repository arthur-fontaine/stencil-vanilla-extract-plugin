# stencil-vanilla-extract-plugin

[![npm (tag)](https://img.shields.io/npm/v/stencil-vanilla-extract-plugin/latest)](https://www.npmjs.com/package/stencil-vanilla-extract-plugin) [![npm](https://img.shields.io/npm/dw/stencil-vanilla-extract-plugin)](https://www.npmjs.com/package/stencil-vanilla-extract-plugin)

This plugin allows you to use [vanilla-extract](https://vanilla-extract.style/) in your Stencil components.

## Installation

```bash
npm install stencil-vanilla-extract-plugin
```

## Usage

This plugin is in fact two plugins, one Stencil plugin and one Rollup plugin. You need to add both to your Stencil config.

```ts 
import { Config } from '@stencil/core';
import { vanillaExtractRollupPlugin, vanillaExtractStencilPlugin } from 'stencil-vanilla-extract-plugin';

export const config: Config = {
  namespace: 'demo',
  plugins: [vanillaExtractStencilPlugin()],
  rollupPlugins: {
    before: [vanillaExtractRollupPlugin()],
  },
};
```

The Stencil plugin is responsible for generating the CSS files and the Rollup plugin is responsible for using generated class names in your components.

In your component, use the `styleUrls` properties on the `@Component` decorator to point to your CSS files. You also need to import your .css.ts files to use the generated class names.

```tsx
import { Component, h } from '@stencil/core';
import { button } from './button.css.ts';

@Component({
  tag: 'demo-button',
  styleUrls: ['button.css'],
})
export class Button {
  render() {
    return <button class={button}>Click me</button>;
  }
}
```

## Config Options

### `vanillaExtractStencilPlugin`

The Stencil plugin does not have any config options.

### `vanillaExtractRollupPlugin`

The Rollup plugin options are the same as the [@vanilla-extract/rollup-plugin](https://vanilla-extract.style/documentation/integrations/rollup/#configuration) options. Please refer to their documentation for more information.

## Notes

This package is very inspired by [@stencil/sass](https://github.com/ionic-team/stencil-sass/). It shares the same logic and the same configuration options.

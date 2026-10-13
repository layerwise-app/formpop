import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';

// Node-only test loader. The application continues to use Vite's compilation.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.endsWith('.ts') && !/\.[a-z]+$/.test(specifier)) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.ts') && !url.includes('/node_modules/')) {
      const source = stripTypeScriptTypes(readFileSync(new URL(url), 'utf8'), { mode: 'strip' });
      return { format: 'module', source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

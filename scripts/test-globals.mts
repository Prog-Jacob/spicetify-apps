// Build-time defines (injected by esbuild in real builds) for tests run under plain node.
Object.assign(globalThis, {
  __REPO__: 'test/repo',
  __APP_NAME__: 'test-app',
  __APP_DISPLAY_NAME__: 'Test App',
  __APP_VERSION__: '0.0.0',
  __BUNDLED_LOCALES__: {},
});

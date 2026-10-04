// Globals that Spotify and esbuild provide at runtime, for tests under plain node.
// Tests that hit the platform assign their own `Spicetify` with the APIs they need.
Object.assign(globalThis, {
  __REPO__: 'test/repo',
  __APP_NAME__: 'test-app',
  __APP_DISPLAY_NAME__: 'Test App',
  __APP_VERSION__: '0.0.0',
  __BUNDLED_LOCALES__: {},
  Spicetify: {
    Locale: { getLocale: () => 'en' },
    Platform: {},
    showNotification: () => {},
  },
});

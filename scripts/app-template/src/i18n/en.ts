const en = {
  'app.title': '{{NAME}}',
  'app.error': 'Something went wrong.',
} as const;

export default en;
export type AppMessages = typeof en;

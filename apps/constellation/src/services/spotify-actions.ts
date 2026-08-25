export const queueTrack = (uri: string): Promise<void> =>
  Spicetify.addToQueue([{ uri }] as Spicetify.ContextTrack[]).catch(() => {});

export default {
  async getAddMessage() {
    return '';
  },
  async getVersionMessage(releasePlan: { releases: { name: string; newVersion: string }[] }) {
    return releasePlan.releases
      .map((r) => `chore(${r.name.replace('@spicetify-apps/', '')}): release v${r.newVersion}`)
      .join('\n\n');
  },
};

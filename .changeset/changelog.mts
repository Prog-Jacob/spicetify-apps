export default {
  async getReleaseLine(changeset: { summary: string }) {
    return changeset.summary
      .split('\n')
      .filter((l: string) => l.trim())
      .map((l: string) => `\n- ${l}`)
      .join('');
  },
  async getDependencyReleaseLine() {
    return '';
  },
};

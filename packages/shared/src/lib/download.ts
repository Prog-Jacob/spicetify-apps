export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export const downloadJson = (data: unknown, filename?: string) =>
  downloadBlob(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    filename ?? `download-${new Date().toISOString().slice(0, 10)}.json`,
  );

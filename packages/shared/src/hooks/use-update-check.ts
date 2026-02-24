import { REPO_API } from '../lib/repo';
import { useState, useEffect } from 'react';

type GithubRelease = {
  tag_name: string;
  html_url: string;
};

const isNewer = (remoteTag: string, tagPrefix: string, localVersion: string): boolean => {
  const local = localVersion.split('.').map(Number);
  const remote = remoteTag.replace(tagPrefix, '').split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if ((remote[i] ?? 0) > (local[i] ?? 0)) return true;
    if ((remote[i] ?? 0) < (local[i] ?? 0)) return false;
  }

  return false;
};

export const useUpdateCheck = (appName: string, currentVersion: string): string | null => {
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  useEffect(() => {
    const tagPrefix = `${appName}-v`;
    const controller = new AbortController();

    fetch(`${REPO_API}/releases`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<unknown>) : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        const latest = (data as GithubRelease[]).find((r) => r.tag_name.startsWith(tagPrefix));
        if (latest && isNewer(latest.tag_name, tagPrefix, currentVersion)) {
          setUpdateUrl(latest.html_url);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [appName, currentVersion]);

  return updateUrl;
};

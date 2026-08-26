import { REPO_API } from '../lib/repo';
import { useState, useEffect } from 'react';

type GithubRelease = {
  tag_name: string;
  html_url: string;
};

export type UpdateInfo = { url: string; version: string };

const SEMVER_PARTS = 3;

const isNewer = (remoteVersion: string, localVersion: string): boolean => {
  const local = localVersion.split('.').map(Number);
  const remote = remoteVersion.split('.').map(Number);

  for (let i = 0; i < SEMVER_PARTS; i++) {
    if ((remote[i] ?? 0) > (local[i] ?? 0)) return true;
    if ((remote[i] ?? 0) < (local[i] ?? 0)) return false;
  }

  return false;
};

export const useUpdateCheck = (): UpdateInfo | null => {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const tagPrefix = `${__APP_NAME__}-v`;
    const controller = new AbortController();

    fetch(`${REPO_API}/releases`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<unknown>) : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        const latest = (data as GithubRelease[]).find(
          (r) => typeof r.tag_name === 'string' && r.tag_name.startsWith(tagPrefix),
        );
        if (!latest) return;
        const version = latest.tag_name.slice(tagPrefix.length);
        if (isNewer(version, __APP_VERSION__)) setUpdate({ url: latest.html_url, version });
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return update;
};

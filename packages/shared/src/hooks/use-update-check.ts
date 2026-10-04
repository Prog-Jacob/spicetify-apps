import { REPO_API } from '../lib/repo';
import { useState, useEffect } from 'react';

type GithubRelease = { tag_name: string; html_url: string };

export type UpdateInfo = { url: string; version: string };

// Dotted numeric versions compare correctly under numeric collation: 1.10.0 > 1.9.0.
const isNewer = (remote: string, local: string): boolean =>
  remote.localeCompare(local, undefined, { numeric: true }) > 0;

/** The newest `<app>-v*` GitHub release when it is ahead of this build, else null. */
export const useUpdateCheck = (): UpdateInfo | null => {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const tagPrefix = `${__APP_NAME__}-v`;
    const controller = new AbortController();

    // The repo holds several apps' releases, so one page of 30 can miss this app's latest.
    fetch(`${REPO_API}/releases?per_page=100`, { signal: controller.signal })
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

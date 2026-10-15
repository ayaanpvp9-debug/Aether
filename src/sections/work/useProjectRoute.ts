import { useCallback, useEffect, useRef, useState } from 'react';
import { PROJECTS, type ProjectId } from '../../content/projects';

const PARAM = 'project';

const isProjectId = (value: string | null): value is ProjectId => PROJECTS.some((p) => p.id === value);

function readParam(): ProjectId | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(PARAM);
  return isProjectId(value) ? value : null;
}

function writeParam(id: ProjectId | null, mode: 'push' | 'replace') {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(PARAM, id);
  else url.searchParams.delete(PARAM);
  const state = id ? { veltrixProject: id } : null;
  if (mode === 'push') window.history.pushState(state, '', url);
  else window.history.replaceState(state, '', url);
}

/**
 * Keeps the open project in the URL (?project=aurele) so detail views are
 * deep-linkable and the browser/OS back gesture closes the overlay.
 */
export function useProjectRoute() {
  const [openId, setOpenId] = useState<ProjectId | null>(readParam);
  const pushed = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      pushed.current = false;
      setOpenId(readParam());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const open = useCallback((id: ProjectId) => {
    writeParam(id, 'push');
    pushed.current = true;
    setOpenId(id);
  }, []);

  const navigate = useCallback((id: ProjectId) => {
    writeParam(id, 'replace');
    setOpenId(id);
  }, []);

  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      writeParam(null, 'replace');
    }
    setOpenId(null);
  }, []);

  return { openId, open, navigate, close };
}

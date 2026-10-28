import { t, useLanguage } from './i18n';
import React, { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

let pending = 0;
const listeners = new Set();
const publish = () => listeners.forEach(listener => listener(pending));
export async function trackRequest(run) {
  pending++;
  publish();
  try { return await run(); }
  finally { pending--; publish(); }
}

export function LoadingText({ text }) {
  useLanguage();
  return <span className="loading-text" role="status"><LoaderCircle size={16} className="loading-spinner" aria-hidden="true" />{t(text)}</span>;
}

export function RequestLoading() {
  const [count, setCount] = useState(pending);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    listeners.add(setCount);
    setCount(pending);
    return () => listeners.delete(setCount);
  }, []);
  const active = count > 0;
  useEffect(() => {
    if (!active) { setVisible(false); return; }
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, [active]);
  return active && visible ? <div className="request-loading"><LoadingText text="Server bilan almashinuv davom etmoqda..." /></div> : null;
}

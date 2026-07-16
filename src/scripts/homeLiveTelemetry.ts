// ── ANNEX D — LIVE TELEMETRY (homepage instrument strip) ─────────────────────
// Fills the server-rendered #live instrument cells with client-side live data:
//   1. STUDIO CLOCK — Asia/Ho_Chi_Minh wall clock, 1s tick (zero API),
//   2. ISS POSITION — wheretheiss.at, 5s poll,
//   3. LAST QUAKE — USGS 4.5_day feed (~11KB; 2.5_day fallback when empty),
//      refreshed every 5 min,
//   4. EUR → USD — Frankfurter (ECB reference), fetched once.
// Fetching starts only when the section scrolls into view (IntersectionObserver,
// once) and the timers pause while the tab is hidden — a visitor who never
// reaches the section costs zero requests. The DOM is fully server-rendered;
// this script only writes text and toggles .is-live / .is-off state classes
// (never creates elements — Astro scoped styles wouldn't match them).

interface Cell {
  el: Element;
  value: Element;
  sub: Element;
}

function getJson(url: string): Promise<any> {
  const signal =
    typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
      ? AbortSignal.timeout(8000)
      : undefined;
  return fetch(url, { signal }).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  });
}

export function initHomeLiveTelemetry() {
  const sec = document.getElementById('live');
  if (!sec) return;

  const cells: Record<string, Cell> = {};
  sec.querySelectorAll('[data-live-inst]').forEach((el) => {
    const key = el.getAttribute('data-live-inst')!;
    const value = el.querySelector('[data-live-value]');
    const sub = el.querySelector('[data-live-sub]');
    if (value && sub) cells[key] = { el, value, sub };
  });

  const setLive = (key: string, value: string, sub: string) => {
    const c = cells[key];
    if (!c) return;
    c.value.textContent = value;
    c.sub.textContent = sub;
    c.el.classList.add('is-live');
    c.el.classList.remove('is-off');
  };
  const setOff = (key: string) => {
    const c = cells[key];
    if (!c) return;
    c.value.textContent = '—';
    c.sub.textContent = 'OFFLINE';
    c.el.classList.add('is-off');
    c.el.classList.remove('is-live');
  };

  const tickClock = () => {
    try {
      const t = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date());
      setLive('clock', t, 'HANOI · UTC+7');
    } catch {
      setOff('clock');
    }
  };

  const pollIss = () => {
    getJson('https://api.wheretheiss.at/v1/satellites/25544')
      .then((d) => {
        setLive(
          'iss',
          `LAT ${d.latitude.toFixed(1)} · LON ${d.longitude.toFixed(1)}`,
          `${Math.round(d.velocity).toLocaleString('en-US')} KM/H`,
        );
      })
      .catch(() => setOff('iss'));
  };

  const loadQuake = () => {
    getJson('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')
      .then((d) => {
        if (!d.features || !d.features.length) throw new Error('empty');
        return d;
      })
      .catch(() =>
        getJson('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'),
      )
      .then((d) => {
        let best: any = null;
        (d.features || []).forEach((f: any) => {
          if (!best || (f.properties.mag || 0) > (best.properties.mag || 0)) best = f;
        });
        if (!best) {
          setOff('quake');
          return;
        }
        let place = String(best.properties.place || 'UNKNOWN').toUpperCase();
        if (place.length > 34) place = place.slice(0, 33) + '…';
        setLive('quake', `M ${Number(best.properties.mag).toFixed(1)}`, place);
      })
      .catch(() => setOff('quake'));
  };

  const loadFx = () => {
    getJson('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD')
      .then((d) => {
        setLive('fx', `1 EUR = ${d.rates.USD.toFixed(4)} USD`, `ECB REF · ${String(d.date).toUpperCase()}`);
      })
      .catch(() => setOff('fx'));
  };

  let clockTimer: ReturnType<typeof setInterval> | null = null;
  let issTimer: ReturnType<typeof setInterval> | null = null;
  let quakeTimer: ReturnType<typeof setInterval> | null = null;
  const startTimers = () => {
    if (clockTimer) return;
    tickClock();
    clockTimer = setInterval(tickClock, 1000);
    pollIss();
    issTimer = setInterval(pollIss, 5000);
    loadQuake();
    quakeTimer = setInterval(loadQuake, 300000);
  };
  const stopTimers = () => {
    if (clockTimer) clearInterval(clockTimer);
    if (issTimer) clearInterval(issTimer);
    if (quakeTimer) clearInterval(quakeTimer);
    clockTimer = issTimer = quakeTimer = null;
  };

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    loadFx();
    startTimers();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopTimers();
      else startTimers();
    });
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            io.disconnect();
            start();
          }
        });
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(sec);
  } else {
    start();
  }

  (window as any).__bpLive = { start }; // dev/verify handle
}

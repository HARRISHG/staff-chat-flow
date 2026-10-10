import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Deck } from '../slides/model';
import { SLIDE_W } from '../slides/model';
import { SlideView } from '../slides/SlideView';

type Zoom = 'fit' | 0.5 | 0.75 | 1;

export function Preview({ deck, logo, page, setPage }: { deck: Deck; logo: string; page: number; setPage: (n: number) => void }) {
  const [zoom, setZoom] = useState<Zoom>('fit');
  const [width, setWidth] = useState(800);
  const stageRef = useRef<HTMLDivElement>(null);
  const total = deck.slides.length;
  const current = Math.min(page, total - 1);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (page > total - 1) setPage(total - 1);
  }, [page, total, setPage]);

  const scale = zoom === 'fit' ? Math.max(0.2, (width - 2) / (SLIDE_W * 96)) : zoom;
  const slide = deck.slides[current];

  return (
    <section className="preview" aria-label="Proposal preview">
      <div className="preview-bar">
        <div className="pager">
          <button type="button" className="icon" onClick={() => setPage(Math.max(0, current - 1))} disabled={current === 0} aria-label="Previous slide">‹</button>
          <span aria-live="polite">Slide {current + 1} of {total}</span>
          <button type="button" className="icon" onClick={() => setPage(Math.min(total - 1, current + 1))} disabled={current === total - 1} aria-label="Next slide">›</button>
        </div>
        <label className="zoom">
          <span>Zoom</span>
          <select value={String(zoom)} onChange={(e) => setZoom(e.target.value === 'fit' ? 'fit' : (Number(e.target.value) as Zoom))}>
            <option value="fit">Fit width</option>
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
          </select>
        </label>
      </div>
      <div className="stage" ref={stageRef}>
        <div className="stage-inner">{slide && <SlideView slide={slide} scale={scale} logo={logo} />}</div>
      </div>
      <ol className="thumbs" aria-label="Slides">
        {deck.slides.map((s, i) => (
          <li key={i}>
            <button type="button" className={i === current ? 'active' : undefined} aria-current={i === current ? 'true' : undefined} onClick={() => setPage(i)}>
              <span className="thumb-n">{i + 1}</span> {s.title}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

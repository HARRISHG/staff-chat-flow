import type { CSSProperties } from 'react';
import type { Slide, SlideEl } from './model';
import { BULLET_INDENT_PT, SLIDE_H, SLIDE_W } from './model';
import { FONT_STACK } from './measure';

const PX = 96;

function Element({ el, s, logo }: { el: SlideEl; s: number; logo: string }) {
  const u = PX * s;
  switch (el.type) {
    case 'rect':
    case 'ellipse': {
      const bw = el.line ? Math.max(0.5, ((el.lineWidth ?? 0.75) / 72) * u) : 0;
      return (
        <div
          style={{
            position: 'absolute',
            left: el.x * u,
            top: el.y * u,
            width: el.w * u,
            height: el.h * u,
            background: el.fill ? `#${el.fill}` : 'transparent',
            boxShadow: el.line ? `inset 0 0 0 ${bw}px #${el.line}` : undefined,
            borderRadius: el.type === 'ellipse' ? '50%' : el.radius ? el.radius * u : 0,
          }}
        />
      );
    }
    case 'line': {
      const pad = 6 * s;
      const x = Math.min(el.x1, el.x2) * u - pad;
      const y = Math.min(el.y1, el.y2) * u - pad;
      const w = Math.abs(el.x2 - el.x1) * u + 2 * pad;
      const h = Math.abs(el.y2 - el.y1) * u + 2 * pad;
      const sw = Math.max(0.5, (el.width / 72) * u);
      const x1 = el.x1 * u - x, y1 = el.y1 * u - y, x2 = el.x2 * u - x, y2 = el.y2 * u - y;
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      const ah = Math.max(4, sw * 3.2);
      return (
        <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }} width={w} height={h}>
          <line x1={x1} y1={y1} x2={el.arrow ? x2 - ux * ah * 0.8 : x2} y2={el.arrow ? y2 - uy * ah * 0.8 : y2} stroke={`#${el.color}`} strokeWidth={sw} />
          {el.arrow && (
            <polygon
              fill={`#${el.color}`}
              points={`${x2},${y2} ${x2 - ux * ah - uy * ah * 0.6},${y2 - uy * ah + ux * ah * 0.6} ${x2 - ux * ah + uy * ah * 0.6},${y2 - uy * ah - ux * ah * 0.6}`}
            />
          )}
        </svg>
      );
    }
    case 'image':
      return <img src={logo} alt="Patientcurve" style={{ position: 'absolute', left: el.x * u, top: el.y * u, width: el.w * u, height: el.h * u }} />;
    case 'text': {
      const pt = (v: number) => (v / 72) * u;
      const style: CSSProperties = {
        position: 'absolute',
        left: el.x * u,
        top: el.y * u,
        width: el.w * u,
        height: el.h * u,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: el.valign === 'top' ? 'flex-start' : el.valign === 'middle' ? 'center' : 'flex-end',
        fontFamily: FONT_STACK,
        fontSize: pt(el.size),
        lineHeight: `${pt(el.lineHeight)}px`,
        color: `#${el.color}`,
        fontWeight: el.bold ? 700 : 400,
        textAlign: el.align,
        letterSpacing: el.charSpacing ? pt(el.charSpacing) : undefined,
        whiteSpace: 'pre',
      };
      return (
        <div style={style}>
          {el.paras.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                paddingLeft: p.bullet ? pt(BULLET_INDENT_PT) : 0,
                marginBottom: i < el.paras.length - 1 ? pt(el.paraSpace) : 0,
                fontWeight: (p.bold ?? el.bold) ? 700 : 400,
                color: p.color ? `#${p.color}` : undefined,
              }}
            >
              {p.bullet && <span style={{ position: 'absolute', left: 0 }}>•</span>}
              {(el.lines[i] ?? [p.text]).map((l, j) => (
                <div key={j}>{l || ' '}</div>
              ))}
            </div>
          ))}
        </div>
      );
    }
  }
}

export function SlideView({ slide, scale, logo }: { slide: Slide; scale: number; logo: string }) {
  return (
    <div
      className="slide"
      style={{ width: SLIDE_W * PX * scale, height: SLIDE_H * PX * scale, position: 'relative', overflow: 'hidden', background: '#fff' }}
    >
      {slide.elements.map((el, i) => (
        <Element key={i} el={el} s={scale} logo={logo} />
      ))}
    </div>
  );
}

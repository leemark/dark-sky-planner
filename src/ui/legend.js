/**
 * Render the Bortle scale color legend for the light pollution overlay.
 */
export function renderLegend() {
  const el = document.getElementById('lp-legend');
  if (!el) return;

  const bortleScale = [
    { bortle: 1, label: '1 – Excellent', color: '#000033' },
    { bortle: 2, label: '2 – Truly Dark', color: '#000066' },
    { bortle: 3, label: '3 – Rural', color: '#003300' },
    { bortle: 4, label: '4 – Rural/Suburban', color: '#006600' },
    { bortle: 5, label: '5 – Suburban', color: '#ffff00' },
    { bortle: 6, label: '6 – Bright Suburban', color: '#ff9900' },
    { bortle: 7, label: '7 – Suburban/Urban', color: '#ff6600' },
    { bortle: 8, label: '8 – City', color: '#ff0000' },
    { bortle: 9, label: '9 – Inner City', color: '#ffffff' },
  ];

  el.innerHTML = `
    <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
      Bortle Scale
    </div>
    <div style="font-size:9px;color:var(--text-muted);margin-bottom:4px;">Light Pollution Atlas 2022 (VIIRS)</div>
    <div style="display:flex;flex-direction:column;gap:2px;">
      ${bortleScale.map(b => `
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:12px;height:12px;border-radius:2px;background:${b.color};border:1px solid rgba(255,255,255,0.15);flex-shrink:0;"></div>
          <span style="font-size:10px;color:var(--text-secondary);">${b.label}</span>
        </div>
      `).join('')}
    </div>
  `;
}

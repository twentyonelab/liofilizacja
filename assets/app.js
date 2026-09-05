/* Liofilizacja 21 zmysłów – warstwa prezentacji.
   Silnik (model, P, GROUPS, LEVERS, GRADES, PRODUCTS…) pochodzi z assets/model.js bez zmian. */
(function () {
  "use strict";

  /* ---------- zestaw odniesienia: punkt projektowy linii ---------- */
  const REF = Object.assign(JSON.parse(JSON.stringify(P)), { pCham: 69, frzMode: "iqf", shiftD: 0 });
  const KOMORY = 6;

  /* ---------- narzędzia ---------- */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
  const f = (v, d = 0) => (isFinite(v) ? v : 0).toLocaleString("pl-PL", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/-/g, "−");
  const NS = "http://www.w3.org/2000/svg";
  function el(t, a, kids) {
    const n = document.createElementNS(NS, t);
    for (const k in (a || {})) n.setAttribute(k, a[k]);
    (kids || []).forEach(c => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  }
  const txt = (x, y, s, cls, extra) => el("text", Object.assign({ x, y, class: cls }, extra || {}), [String(s)]);
  const CSSV = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C = { s1: "--s1", s2: "--s2", s3: "--s3", s4: "--s4", s5: "--s5", s6: "--s6", cold: "--cold", hot: "--hot", ink: "--ink", ink3: "--ink-3" };

  const tipEl = $("#tip");
  function bindTip(node, html) {
    node.addEventListener("pointerenter", e => { tipEl.innerHTML = html; tipEl.classList.add("on"); moveTip(e); });
    node.addEventListener("pointermove", moveTip);
    node.addEventListener("pointerleave", () => tipEl.classList.remove("on"));
  }
  function moveTip(e) {
    const r = tipEl.getBoundingClientRect();
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
    tipEl.style.left = x + "px"; tipEl.style.top = y + "px";
  }
  const row = (a, b) => '<div class="r"><span>' + a + '</span><span>' + b + '</span></div>';
  function legend(id, items) {
    const box = document.querySelector('[data-legend="' + id + '"]');
    if (!box) return;
    box.innerHTML = items.map(it => '<span class="li"><span class="sw" style="background:' + it.c + '"></span>' + it.n +
      (it.v !== undefined ? '<span class="lv">' + it.v + '</span>' : '') + '</span>').join("");
  }
  function prep(svg, W, H) { svg.textContent = ""; svg.setAttribute("viewBox", "0 0 " + W + " " + H); return svg; }

  /* ---------- serie ---------- */
  const SER = [
    { k: "Eice", n: "Sprężarki, kondensator lodu", c: C.s1 },
    { k: "Esh", n: "Grzanie elektryczne półek", c: C.s2 },
    { k: "Efrz", n: "Stopień wysoki i mrożenie", c: C.s3 },
    { k: "Evac", n: "Zespół próżniowy", c: C.s4 },
    { k: "Eaux", n: "Urządzenia pomocnicze", c: C.s5 },
    { k: "Eoth", n: "Odrzut, booster, odszranianie", c: C.s6 }
  ];
  const COGS = [
    { k: "surowiec", n: "Surowiec", c: C.s1 }, { k: "energia", n: "Energia", c: C.s2 },
    { k: "robocizna", n: "Robocizna", c: C.s3 }, { k: "opakowanie", n: "Opakowanie", c: C.s4 },
    { k: "ogolne", n: "Kontrola jakości i ogólne", c: C.s5 }, { k: "amortyzacja", n: "Amortyzacja", c: C.s6 }
  ];
  const KS = ["A", "B", "C", "D"];

  /* ---------- wykres: energia na cykl A–D ---------- */
  function drawEnergy(svg, M, sel, legId) {
    const W = 900, rowH = 34, gap = 22, mL = 150, mR = 120, top = 26;
    const H = top + KS.length * (rowH + gap) + 30;
    prep(svg, W, H);
    const max = Math.max(...KS.map(k => M.R[k].el)) * 1.02, plot = W - mL - mR, sx = v => v / max * plot;
    const step = max > 1200 ? 400 : (max > 600 ? 200 : 100);
    for (let v = 0; v <= max; v += step) {
      svg.appendChild(el("line", { x1: mL + sx(v), y1: top - 6, x2: mL + sx(v), y2: H - 26, class: "ax" }));
      svg.appendChild(txt(mL + sx(v), H - 10, f(v, 0), "m", { "text-anchor": "middle" }));
    }
    svg.appendChild(txt(0, 12, "KWH ENERGII ELEKTRYCZNEJ NA CYKL JEDNEJ KOMORY", "m"));
    KS.forEach((k, i) => {
      const s = M.R[k], y = top + i * (rowH + gap);
      svg.appendChild(txt(0, y + 14, "WARIANT " + k, "m"));
      svg.appendChild(txt(0, y + 30, SCEN.find(x => x.k === k).nm, "t", { style: "font-size:12px" + (k === sel ? "" : ";fill:#525252") }));
      let x = mL;
      SER.forEach(se => {
        const v = s.parts[se.k] || 0; if (v <= 0) return;
        const w = Math.max(0, sx(v) - 2);
        const r = el("rect", { x, y, width: w, height: rowH, fill: CSSV(se.c), rx: 2 });
        bindTip(r, '<div class="t">' + se.n + '</div>' + row("Wariant " + k, f(v, 0) + " kWh") + row("Udział", f(v / s.el * 100, 1) + " %"));
        svg.appendChild(r);
        if (w > 44) svg.appendChild(txt(x + 7, y + rowH / 2 + 4, f(v, 0), "v vw"));
        x += sx(v);
      });
      svg.appendChild(txt(x + 10, y + 14, f(s.el, 0) + " kWh", "v"));
      if (k !== "A") {
        const d = (s.el - M.R.A.el) / M.R.A.el * 100;
        svg.appendChild(txt(x + 10, y + 30, (d > 0 ? "+" : "") + f(d, 0) + " % wobec A", "v", { style: "fill:" + CSSV(d < 0 ? "--good" : "--bad") }));
      }
    });
    legend(legId, SER.map(se => ({ n: se.n, c: CSSV(se.c), v: f(M.R[sel].parts[se.k] || 0, 0) + " kWh" })));
  }

  /* ---------- wykres: struktura kosztu kg ---------- */
  function drawCost(svg, M, sel, legId) {
    const s = M.R[sel], p = M.p, W = 900, H = 150, mL = 0;
    prep(svg, W, H);
    const maxV = Math.max(s.cogs, p.salePrice) * 1.04, X = v => mL + v / maxV * (W - mL);
    const step = maxV > 400 ? 100 : (maxV > 160 ? 50 : 20);
    for (let v = 0; v <= maxV; v += step) {
      svg.appendChild(el("line", { x1: X(v), y1: 24, x2: X(v), y2: 100, class: "ax" }));
      svg.appendChild(txt(X(v), 116, f(v, 0), "m", { "text-anchor": v === 0 ? "start" : "middle" }));
    }
    svg.appendChild(txt(0, 12, "ZŁ NA KILOGRAM PRODUKTU", "m"));
    let x = 0;
    COGS.forEach(c => {
      const v = s.cost5[c.k] || 0; if (v <= 0.01) return;
      const w = Math.max(0, X(x + v) - X(x) - 2);
      const r = el("rect", { x: X(x), y: 32, width: w, height: 46, fill: CSSV(c.c), rx: 2 });
      bindTip(r, '<div class="t">' + c.n + '</div>' + row("Koszt", f(v, 2) + " zł/kg") + row("Udział w koszcie", f(v / s.cogs * 100, 1) + " %"));
      svg.appendChild(r);
      if (w > 40) svg.appendChild(txt(X(x) + w / 2, 60, f(v, 0), "v vw", { "text-anchor": "middle" }));
      x += v;
    });
    if (p.salePrice > s.cogs) {
      svg.appendChild(el("rect", { x: X(s.cogs) + 2, y: 32, width: Math.max(0, X(p.salePrice) - X(s.cogs) - 2), height: 46, fill: "none", stroke: CSSV("--good"), "stroke-width": 1.2, "stroke-dasharray": "5 3", rx: 2 }));
      svg.appendChild(txt((X(s.cogs) + X(p.salePrice)) / 2, 60, "marża " + f(s.marza, 2) + " zł", "v", { "text-anchor": "middle", style: "fill:" + CSSV("--good") }));
    } else {
      svg.appendChild(txt(X(s.cogs) - 6, 60, "strata " + f(-s.marza, 2) + " zł", "v", { "text-anchor": "end", style: "fill:#fff" }));
    }
    svg.appendChild(el("line", { x1: X(p.salePrice), y1: 24, x2: X(p.salePrice), y2: 100, stroke: "#000", "stroke-width": 2 }));
    svg.appendChild(txt(X(p.salePrice), 136, "cena sprzedaży " + f(p.salePrice, 0) + " zł/kg", "v", { "text-anchor": X(p.salePrice) > W * .8 ? "end" : "middle" }));
    svg.appendChild(txt(0, 136, "koszt wytworzenia " + f(s.cogs, 2) + " zł/kg", "v"));
    legend(legId, COGS.filter(c => (s.cost5[c.k] || 0) > 0.01).map(c => ({ n: c.n, c: CSSV(c.c), v: f(s.cost5[c.k], 2) + " zł · " + f(s.cost5[c.k] / s.cogs * 100, 0) + " %" })));
  }

  /* ---------- wykres: dźwignie ---------- */
  function drawLevers(svg, M, sel, legId, limit) {
    const base = M.R[sel].costKg, prodYr = M.mProd * M.cyclesYr;
    let rows = LEVERS.map(L => {
      let dL = 0, dG = 0;
      try { dL = model(Object.assign({}, M.p, L.lepiej(M.p)), true).R[sel].costKg - base; } catch (e) { }
      try { dG = model(Object.assign({}, M.p, L.gorzej(M.p)), true).R[sel].costKg - base; } catch (e) { }
      return { n: L.n, z: L.z, t: L.t, inv: L.inv, dL, dG };
    }).sort((a, b) => a.dL - b.dL);
    if (limit) rows = rows.slice(0, limit);
    const W = 900, rowH = 48, nameW = 320, RM = 150, top = 22, H = top + rows.length * rowH + 8;
    prep(svg, W, H);
    const zero = nameW + Math.round((W - nameW - RM) * .45), half = Math.min(zero - nameW - 10, W - RM - zero - 10);
    const spans = rows.map(r => Math.max(Math.abs(r.dL), Math.abs(r.dG))).sort((a, b) => b - a);
    const mx = Math.max(spans[1] || spans[0] || .01, .01) * 1.05, sx = v => Math.min(Math.abs(v), mx) / mx * half;
    svg.appendChild(el("line", { x1: zero, y1: top - 8, x2: zero, y2: H - 4, stroke: "#000", "stroke-width": 1 }));
    svg.appendChild(txt(zero - 8, 12, "TANIEJ", "m", { "text-anchor": "end" }));
    svg.appendChild(txt(zero + 8, 12, "DROŻEJ", "m"));
    rows.forEach((r, i) => {
      const y = top + i * rowH;
      svg.appendChild(txt(0, y + 16, r.n, "t", { style: "font-size:12.5px" }));
      svg.appendChild(txt(0, y + 31, r.z + " · " + (r.inv ? "WYMAGA NAKŁADU" : "NASTAWA LUB UMOWA"), "m"));
      [[r.dL, CSSV("--good"), "Poprawa"], [r.dG, CSSV("--bad"), "Zaniedbanie"]].forEach(a => {
        const v = a[0]; if (Math.abs(v) < .0005) return;
        const w = sx(v), clip = Math.abs(v) > mx, x0 = v < 0 ? zero - w : zero + 1;
        const rect = el("rect", { x: x0, y: y + 6, width: Math.max(1, w - 1), height: 20, fill: a[1], "fill-opacity": .9, rx: 2 });
        bindTip(rect, '<div class="t">' + r.n + ' · ' + a[2].toLowerCase() + '</div>' + row("Zmiana", r.z) + row("Koszt na kg", (v > 0 ? "+" : "") + f(v, 3) + " zł") +
          row("W skali roku", (v > 0 ? "+" : "") + f(v * prodYr / 1000, 1) + " tys. zł") + '<div style="margin-top:6px;color:#525252">' + r.t + '</div>');
        svg.appendChild(rect);
        if (clip) svg.appendChild(txt(v < 0 ? x0 + 5 : x0 + w - 5, y + 20, "»", "v vw", { "text-anchor": v < 0 ? "start" : "end" }));
      });
      svg.appendChild(txt(W, y + 16, (r.dL < 0 ? f(r.dL, 2) : "±0") + " zł/kg", "v", { "text-anchor": "end" }));
      svg.appendChild(txt(W, y + 31, r.dL < -.0005 ? f(-r.dL * prodYr / 1000, 1) + " tys. zł/rok" : "bez zysku", "m", { "text-anchor": "end" }));
      if (i < rows.length - 1) svg.appendChild(el("line", { x1: 0, y1: y + rowH - 6, x2: W, y2: y + rowH - 6, class: "ax" }));
    });
    legend(legId, [{ n: "Oszczędność po poprawie", c: CSSV("--good") }, { n: "Koszt zaniedbania", c: CSSV("--bad") }, { n: "» wartość poza skalą", c: "#fff" }]);
  }

  /* ---------- wykres: taryfy ---------- */
  function drawTariff(svg, M, sel, legId) {
    const s = M.R[sel], ts = ["flat", "zone", "dyn"], W = 900, mL = 150, mR = 90, rowH = 17, gapIn = 4, gapOut = 22, top = 24;
    const H = top + ts.length * (rowH * 2 + gapIn + gapOut);
    prep(svg, W, H);
    const vals = ts.flatMap(t => [s.byTariff[t].noPv, s.byTariff[t].pv]), max = Math.max(...vals) * 1.02 || 1, plot = W - mL - mR;
    svg.appendChild(txt(mL, 12, "TYSIĘCY ZŁOTYCH ROCZNIE · JEDNA KOMORA", "m"));
    ts.forEach((t, i) => {
      const y = top + i * (rowH * 2 + gapIn + gapOut);
      svg.appendChild(txt(0, y + rowH, TARIFFS[t].n.split(" (")[0], "t", { style: "font-size:12.5px" }));
      if (t === M.p.tariff) svg.appendChild(txt(0, y + rowH + 15, "WYBRANA", "m"));
      [["noPv", "#c9c9c9", "bez PV"], ["pv", CSSV(C.s1), "z instalacją PV"]].forEach((L, j) => {
        const v = s.byTariff[t][L[0]], w = Math.max(1, v / max * plot), yy = y + j * (rowH + gapIn);
        const r = el("rect", { x: mL, y: yy, width: w, height: rowH, fill: L[1], rx: 2 });
        bindTip(r, '<div class="t">' + TARIFFS[t].n + '</div>' + row(L[2], f(v / 1000, 1) + " tys. zł/rok") + row("Średnia cena", f(v / Math.max(1, s.eDay * 365), 3) + " zł/kWh"));
        svg.appendChild(r);
        svg.appendChild(txt(mL + w + 7, yy + rowH - 4, f(v / 1000, 1), "v"));
      });
    });
    const best = ts.reduce((a, b) => s.byTariff[b].pv < s.byTariff[a].pv ? b : a);
    legend(legId, [{ n: "Bez fotowoltaiki", c: "#c9c9c9" }, { n: "Z instalacją " + f(M.p.pvKwp, 0) + " kWp", c: CSSV(C.s1) }, { n: "Najtaniej: " + TARIFFS[best].n.split(" (")[0].toLowerCase(), c: "#fff" }]);
  }

  /* ---------- wykres: profil mocy ---------- */
  function drawProfile(svg, M, sel, legId) {
    const s = M.R[sel], pr = s.prof, W = 900, H = 270, mL = 50, mR = 16, mT = 22, mB = 56;
    prep(svg, W, H);
    const pw = W - mL - mR, ph = H - mT - mB;
    const maxP = Math.max(...KS.map(k => Math.max(...M.R[k].prof.map(x => x.tot)))) * 1.1;
    const X = t => mL + t / M.tCyc * pw, Y = v => mT + ph - v / maxP * ph;
    const stepY = maxP > 150 ? 50 : (maxP > 60 ? 20 : 10);
    for (let v = 0; v <= maxP; v += stepY) {
      svg.appendChild(el("line", { x1: mL, y1: Y(v), x2: W - mR, y2: Y(v), class: "ax" }));
      svg.appendChild(txt(mL - 8, Y(v) + 3.5, f(v, 0), "m", { "text-anchor": "end" }));
    }
    svg.appendChild(txt(0, 12, "KW", "m"));
    const lay = [{ k: "ref", n: "Sprężarki", c: C.s1 }, { k: "sh", n: "Grzanie półek", c: C.s2 }, { k: "vac", n: "Zespół próżniowy", c: C.s4 }, { k: "aux", n: "Pomocnicze", c: C.s5 }];
    pr.forEach(ph2 => {
      let acc = 0; const x0 = X(ph2.t0), w = Math.max(1, X(ph2.t1) - x0 - 2);
      lay.forEach(L => {
        const v = ph2[L.k] || 0; if (v <= .02) return;
        const h = Math.max(0, (v / maxP * ph) - 1.5);
        const r = el("rect", { x: x0, y: Y(acc + v), width: w, height: h, fill: CSSV(L.c), rx: 1 });
        bindTip(r, '<div class="t">' + ph2.n + '</div>' + row(L.n, f(v, 1) + " kW") + row("Moc łączna", f(ph2.tot, 1) + " kW") + row("Czas", f(ph2.t0, 1) + "–" + f(ph2.t1, 1) + " h"));
        svg.appendChild(r); acc += v;
      });
      const short = { "Odszranianie i rozładunek": "Rozładunek" }[ph2.n] || ph2.n;
      if (w > 60) svg.appendChild(txt(x0 + w / 2, H - 34, short.toUpperCase(), "m", { "text-anchor": "middle" }));
      if (w > 30) svg.appendChild(txt(x0 + w / 2, H - 20, f(ph2.t1 - ph2.t0, 1) + " h", "m", { "text-anchor": "middle" }));
    });
    svg.appendChild(el("line", { x1: mL, y1: Y(s.peak), x2: W - mR, y2: Y(s.peak), stroke: CSSV(C.hot), "stroke-width": 1.5 }));
    svg.appendChild(txt(W - mR - 6, Y(s.peak) - 6, "szczyt " + f(s.peak, 0) + " kW", "v", { "text-anchor": "end", style: "fill:" + CSSV(C.hot) }));
    if (sel !== "A") {
      svg.appendChild(el("line", { x1: mL, y1: Y(M.R.A.peak), x2: W - mR, y2: Y(M.R.A.peak), stroke: "#737373", "stroke-width": 1, "stroke-dasharray": "4 4" }));
      svg.appendChild(txt(W - mR - 6, Y(M.R.A.peak) - 6, "WARIANT A · " + f(M.R.A.peak, 0) + " KW", "m", { "text-anchor": "end" }));
    }
    svg.appendChild(txt(W - mR, H - 4, "CYKL " + f(M.tCyc, 1) + " H", "m", { "text-anchor": "end" }));
    legend(legId, lay.map(L => ({ n: L.n, c: CSSV(L.c) })).concat([{ n: "Szczyt wybranego wariantu", c: CSSV(C.hot) }]));
  }

  /* ---------- wykres: próżnia ---------- */
  function drawVac(svg, M, legId) {
    const p = M.p, P0v = 6, P1v = 250, N = 123, pts = [];
    for (let i = 0; i <= N; i++) { const pp = P0v + (P1v - P0v) * i / N; pts.push(fluxAt(pp, p.tShelf, p.kC, p.kG, p.pHalf, p.dTdrive)); }
    const qMax = Math.max(...pts.map(x => x.q)) || 1;
    const W = 900, mL = 50, mR = 16, HA = 124, GAP = 30, HB = 130, H = HA + GAP + HB + 34, pw = W - mL - mR;
    prep(svg, W, H);
    const X = v => mL + (v - P0v) / (P1v - P0v) * pw;
    const tLo = Math.min(-55, M.tCollapse - 6), tHi = Math.max(0, p.tShelf > 0 ? 2 : p.tShelf);
    const YA = t => 16 + (tHi - t) / (tHi - tLo) * (HA - 22);
    for (let t = Math.ceil(tLo / 10) * 10; t <= tHi; t += 10) {
      svg.appendChild(el("line", { x1: mL, y1: YA(t), x2: W - mR, y2: YA(t), class: "ax" }));
      svg.appendChild(txt(mL - 8, YA(t) + 3.5, f(t, 0), "m", { "text-anchor": "end" }));
    }
    svg.appendChild(txt(0, 10, "°C · TEMPERATURA FRONTU SUBLIMACJI", "m"));
    svg.appendChild(el("rect", { x: mL, y: YA(tHi), width: pw, height: Math.max(0, YA(M.tCollapse) - YA(tHi)), fill: CSSV("--bad"), "fill-opacity": .08 }));
    svg.appendChild(el("line", { x1: mL, y1: YA(M.tCollapse), x2: W - mR, y2: YA(M.tCollapse), stroke: CSSV("--bad"), "stroke-width": 1.5, "stroke-dasharray": "5 3" }));
    svg.appendChild(txt(mL + 8, YA(M.tCollapse) - 6, "zapadanie struktury powyżej " + f(M.tCollapse, 0) + " °C", "v", { style: "fill:" + CSSV("--bad") }));
    svg.appendChild(el("path", { d: pts.map((x, i) => (i ? "L" : "M") + X(x.p) + "," + YA(x.tFront)).join(" "), fill: "none", stroke: CSSV(C.cold), "stroke-width": 2 }));
    const top = HA + GAP, YB = v => top + HB - v / 1.06 * HB;
    for (let v = 0; v <= 1; v += .25) {
      svg.appendChild(el("line", { x1: mL, y1: YB(v), x2: W - mR, y2: YB(v), class: "ax" }));
      svg.appendChild(txt(mL - 8, YB(v) + 3.5, f(v * 100, 0), "m", { "text-anchor": "end" }));
    }
    svg.appendChild(txt(0, top - 10, "% · SZYBKOŚĆ SUBLIMACJI WZGLĘDEM OPTIMUM", "m"));
    const d = pts.map((x, i) => (i ? "L" : "M") + X(x.p) + "," + YB(x.q / qMax)).join(" ");
    svg.appendChild(el("path", { d: d + " L" + X(P1v) + "," + YB(0) + " L" + X(P0v) + "," + YB(0) + " Z", fill: CSSV(C.hot), "fill-opacity": .1 }));
    svg.appendChild(el("path", { d, fill: "none", stroke: CSSV(C.hot), "stroke-width": 2 }));
    if (M.pSafe < P1v - 2) {
      svg.appendChild(el("rect", { x: X(M.pSafe), y: 16, width: Math.max(0, X(P1v) - X(M.pSafe)), height: top + HB - 16, fill: CSSV("--bad"), "fill-opacity": .04 }));
      svg.appendChild(el("line", { x1: X(M.pSafe), y1: 16, x2: X(M.pSafe), y2: top + HB, stroke: CSSV("--bad"), "stroke-width": 1.5 }));
      svg.appendChild(txt(X(M.pSafe) - 7, top + 50, "granica jakości " + f(M.pSafe, 0) + " Pa", "v", { "text-anchor": "end", style: "fill:" + CSSV("--bad") }));
    }
    const mark = (v, col, lab, dash, yo) => {
      svg.appendChild(el("line", { x1: X(v.p), y1: 16, x2: X(v.p), y2: top + HB, stroke: col, "stroke-width": 1.5, "stroke-dasharray": dash || "0" }));
      svg.appendChild(el("circle", { cx: X(v.p), cy: YA(v.tFront), r: 4.5, fill: col, stroke: "#fff", "stroke-width": 2 }));
      svg.appendChild(el("circle", { cx: X(v.p), cy: YB(v.q / qMax), r: 4.5, fill: col, stroke: "#fff", "stroke-width": 2 }));
      svg.appendChild(txt(X(v.p) + (X(v.p) > W * .7 ? -7 : 7), top + (yo || 16), lab, "v", { style: "fill:" + col, "text-anchor": X(v.p) > W * .7 ? "end" : "start" }));
    };
    mark(M.vacOpt, CSSV("--good"), "optimum szybkości " + f(M.vacOpt.p, 0) + " Pa", "4 3", 32);
    mark(M.vac, "#000", "nastawa " + f(p.pCham, 0) + " Pa · front " + f(M.vac.tFront, 1) + " °C", null, 16);
    for (let v = P0v; v <= P1v; v += (P1v - P0v) / 8) svg.appendChild(txt(X(v), H - 12, f(v, 0), "m", { "text-anchor": "middle" }));
    svg.appendChild(txt(W - mR, H - 2, "CIŚNIENIE W KOMORZE, PA", "m", { "text-anchor": "end" }));
    legend(legId, [{ n: "Temperatura frontu", c: CSSV(C.cold) }, { n: "Szybkość sublimacji", c: CSSV(C.hot) }, { n: "Strefa zapadania struktury", c: "rgba(208,59,59,.3)" }, { n: "Optimum ciśnienia", c: CSSV("--good") }]);
  }

  /* ---------- tabele ---------- */
  const td = (v, d, u) => '<td class="n">' + f(v, d) + (u ? '<span class="sub"> ' + u + '</span>' : '') + '</td>';
  function tableBilans(box, M, sel) {
    const R = M.R;
    const r = (lab, fn, d, u) => '<tr><td>' + lab + '</td>' + KS.map(k => '<td class="n' + (k === sel ? ' sel' : '') + '">' + f(fn(R[k]), d) + (u ? '<span class="sub"> ' + u + '</span>' : '') + '</td>').join("") + '</tr>';
    const one = (lab, v, d, u) => '<tr><td>' + lab + '</td><td class="n" colspan="4" style="text-align:right">' + f(v, d) + '<span class="sub"> ' + u + '</span></td></tr>';
    const sec = t => '<tr class="sec"><td colspan="5">' + t + '</td></tr>';
    box.innerHTML = '<table><thead><tr><th>Wielkość</th>' + KS.map(k => '<th class="n' + (k === sel ? ' sel' : '') + '">Wariant ' + k + '</th>').join("") + '</tr></thead><tbody>' +
      sec("Bilans masowy") + one("Masa wsadu", M.mIn, 0, "kg") + one("Masa produktu", M.mProd, 1, "kg") + one("Woda odparowana", M.mWat, 0, "kg") +
      one("Uzysk", M.yieldR, 2, ": 1") + one("Czas cyklu", M.tCyc, 1, "h") + one("Cykli w roku", M.cyclesYr, 0, "") +
      sec("Zapotrzebowanie cieplne, wspólne") + one("Ciepło sublimacji i desorpcji", M.Qsubl, 0, "kWh") + one("Ciepło na półki", M.Qshelf, 0, "kWh") +
      one("Obciążenie kondensatora lodu", M.Qice, 0, "kWh") + one("Zamrażanie w komorze", M.Qfreeze, 0, "kWh") + one("Chłód z odszraniania", M.Qdefr, 0, "kWh") +
      sec("Energia elektryczna na cykl") +
      r("Sprężarki, kondensator lodu", s => s.parts.Eice, 0) + r("Stopień wysoki i mrożenie", s => s.parts.Efrz, 0) + r("Odrzut, booster, odszranianie", s => s.parts.Eoth, 0) +
      r("Grzanie elektryczne półek", s => s.parts.Esh, 0) + r("Zespół próżniowy", s => s.parts.Evac, 0) + r("Urządzenia pomocnicze", s => s.parts.Eaux, 0) +
      '<tr class="tot"><td>Razem liofilizator</td>' + KS.map(k => '<td class="n' + (k === sel ? ' sel' : '') + '">' + f(R[k].el, 0) + '<span class="sub"> kWh</span></td>').join("") + '</tr>' +
      r("Na kilogram odparowanej wody", s => s.perKgW, 2, "kWh") +
      sec("Wynik") + r("Moc szczytowa", s => s.peak, 0, "kW") + r("Koszt energii na kg produktu", s => s.costKg, 2, "zł") +
      r("Koszt wytworzenia na kg", s => s.cogs, 2, "zł") + r("Emisja CO₂ na kg produktu", s => s.co2Kg, 1, "kg") +
      r("Koszt energii w roku", s => s.costYr / 1000, 1, "tys. zł") + r("Nakład inwestycyjny (założony)", s => s.capex / 1000, 0, "tys. zł") +
      '</tbody></table>';
  }
  function tableGrades(box, M, sel) {
    const rows = Object.keys(GRADES).map(k => { const m = model(Object.assign({}, M.p, { grade: k }), true); return { k, n: GRADES[k].n, s: m.R[sel] }; });
    box.innerHTML = '<table><thead><tr><th>Gatunek surowca</th><th class="n">Surowiec w koszcie</th><th class="n">Koszt wytworzenia</th><th class="n">Marża</th></tr></thead><tbody>' +
      rows.map(r => '<tr' + (r.k === M.p.grade ? ' style="background:var(--soft)"' : '') + '><td>' + r.n + (r.k === M.p.grade ? ' <span class="sub">· wybrany</span>' : '') + '</td>' +
        td(r.s.cost5.surowiec, 2, "zł") + td(r.s.cogs, 2, "zł") + td(r.s.marza, 2, "zł") + '</tr>').join("") + '</tbody></table>';
  }
  function tableRefParams(box) {
    const rows = [["Surowiec", PRODUCTS[REF.product].n], ["Postać", FORMATS[REF.format].n], ["Wsad na cykl", f(REF.batch, 0) + " kg na " + f(REF.trayArea, 0) + " m² tac"],
      ["Zamrażanie", FRZMODE[REF.frzMode].n], ["Ciśnienie w komorze", f(REF.pCham, 0) + " Pa, zalecana nastawa z granicy jakości"],
      ["Temperatura półek", f(REF.tShelf, 0) + " °C"], ["Kondensator lodu", f(REF.tIceSurf, 0) + " °C"], ["Wilgotność końcowa", f(REF.wEnd, 1) + " %"],
      ["Wariant układu", "D, zintegrowany: kaskada CO₂ / R290, booster, magazyny"], ["Taryfa", TARIFFS[REF.tariff].n], ["Fotowoltaika", f(REF.pvKwp, 0) + " kWp na komorę odniesienia"],
      ["Gatunek surowca", GRADES[REF.grade].n + ", " + f(REF.rawPrice, 1) + " zł/kg"], ["Cena sprzedaży", f(REF.salePrice, 0) + " zł/kg"], ["Linia", KOMORY + " komór, wielkości roczne to sześciokrotność jednej komory"]];
    box.innerHTML = '<table><tbody>' + rows.map(r => '<tr><td>' + r[0] + '</td><td class="sub">' + r[1] + '</td></tr>').join("") + '</tbody></table>';
  }

  /* ---------- liczby na stronach 01–03 ---------- */
  function fillK(M) {
    const s = M.R.D, a = M.R.A, b = M.R.B;
    const hot50 = (s.levels || []).find(l => l.T === M.p.tCondHT);
    const K = {
      kgW_D: f(s.perKgW, 2), kgW_A: f(a.perKgW, 2), costKg_D: f(s.costKg, 2), costKg_A: f(a.costKg, 2),
      cogs: f(s.cogs, 2), marza: f(s.marza, 2), sale: f(M.p.salePrice, 0), peak_D: f(s.peak, 0), peak_A: f(a.peak, 0),
      Qshelf: f(M.Qshelf, 0), Qice: f(M.Qice, 0), Qsubl: f(M.Qsubl, 0), Qiqf: f(M.QiqfTh + M.Qfreeze, 0), Qhot50: f(hot50 ? hot50.q : 0, 0),
      el_A: f(a.el, 0), el_D: f(s.el, 0), Esh_A: f(a.parts.Esh, 0), Eice_A: f(a.parts.Eice, 0), Eice_D: f(s.parts.Eice, 0),
      yield: f(M.yieldR, 1), tCyc: f(M.tCyc, 1), subl: f(M.subl, 1), cykli: f(M.cyclesYr, 0),
      tLinia: f(KOMORY * M.mProd * M.cyclesYr / 1000, 0), tSurowiec: f(KOMORY * M.mTunel * M.cyclesYr / 1000, 0),
      saveA: f((a.costYr - s.costYr) / 1000, 0), saveB: f((b.costYr - s.costYr) / 1000, 0),
      surowiecPct: f(s.cost5.surowiec / s.cogs * 100, 0), energiaPct: f(s.cost5.energia / s.cogs * 100, 0),
      pokrycie: f(s.yr.pokrycie, 0), autok: f(s.yr.autok, 0), pvKwp: f(M.p.pvKwp, 0), pWork: f(M.pWork, 0), tCollapse: f(M.tCollapse, 0)
    };
    $$("[data-k]").forEach(n => { const v = K[n.getAttribute("data-k")]; if (v !== undefined) n.textContent = v; });
  }

  /* ---------- harmonogram 6 komór (rys. statyczny, kolory) ---------- */
  function drawGantt(M) {
    const g = document.getElementById("gantt"); if (!g) return;
    const T = M.tCyc, X = h => 76 + h / 24 * 823, shift = T / KOMORY;
    const ph = [["load", .5, "#c9c9c9"], ["temp", M.tFrzEff, CSSV(C.cold)], ["vac", .5, CSSV(C.s5)], ["subl", M.subl, CSSV(C.hot)], ["des", M.p.tDes, CSSV(C.s4)], ["unl", 1, "#c9c9c9"]];
    for (let k = 0; k < KOMORY; k++) {
      const y = 28 + k * 36;
      g.appendChild(txt(0, y + 15, "Komora K" + (k + 1), "t", { style: "font-size:11.5px" }));
      let t = -k * shift;
      for (let rep = 0; rep < 2; rep++) {
        let tt = t + rep * T;
        ph.forEach(p => {
          const a = Math.max(0, tt), b = Math.min(24, tt + p[1]);
          if (b > a) {
            g.appendChild(el("rect", { x: X(a), y, width: Math.max(0, X(b) - X(a) - 1), height: 22, fill: p[2], rx: 2 }));
            if (p[0] === "subl" && X(b) - X(a) > 120) g.appendChild(txt(X(a) + 8, y + 15, "Sublimacja " + f(M.subl, 1) + " h", "v vw", { style: "font-size:10.5px" }));
            if (p[0] === "des" && X(b) - X(a) > 70) g.appendChild(txt(X(a) + 8, y + 15, "Desorpcja", "v vw", { style: "font-size:10px" }));
          }
          tt += p[1];
        });
      }
    }
  }

  /* ---------- strony 01–03 ---------- */
  const M0 = model(REF);
  fillK(M0);
  drawGantt(M0);
  drawEnergy($("#refEnergy"), M0, "D", "refEnergy");
  tableBilans($("#refBilansTable"), M0, "D");
  drawCost($("#refCost"), M0, "D", "refCost");
  tableGrades($("#refGrades"), M0, "D");
  drawLevers($("#refLevers"), M0, "D", "refLevers", 6);
  drawTariff($("#refTariff"), M0, "D", "refTariff");
  tableRefParams($("#refParamsTable"));

  /* ---------- symulator ---------- */
  const SIMPLE = ["product", "format", "trayArea", "batch", "wEnd", "pCham", "tShelf", "tIceSurf", "frzMode", "grade", "tariff", "pvKwp"];
  const VARIANT = { k: "_variant", l: "Wariant układu", type: "select", opts: { D: { n: "D · zintegrowany" }, C: { n: "C · kaskada CO₂ / R290" }, B: { n: "B · tradycyjny z odzyskiem" }, A: { n: "A · tradycyjny" } } };
  const FIELDS = {}; GROUPS.forEach(g => g.f.forEach(fd => { FIELDS[fd.k] = fd; }));
  let SP = JSON.parse(JSON.stringify(REF)), SEL = "D", SM = null, raf = 0, curTab = "tEnergy";

  function fieldVisible(fd) {
    if (!fd.showIf) return true;
    const F = SP.format;
    return ({ mielone: F !== "kawalki", warstwa: F === "warstwa", warstwaLub: F === "warstwa" || F === "plyta", plyta: F === "plyta",
      mrozona: F === "plyta" && SP.cutStage === "mrozona", sucha: F === "plyta" && SP.cutStage === "sucha", formy: F === "formy", iqf: SP.frzMode === "iqf" })[fd.showIf] !== false;
  }
  function densOf() {
    const pr = PRODUCTS[SP.product];
    if (SP.format === "warstwa" || SP.format === "plyta") return SP.layerMm * SP.pureeDens;
    if (SP.format === "formy") return SP.moldDepth * SP.pureeDens * (SP.moldCover / 100);
    return pr.d || 10;
  }
  function autoBatch() { SP.batch = Math.max(25, Math.floor(SP.trayArea * densOf() / 25) * 25); }

  function buildField(fd, box) {
    const wrap = document.createElement("div"); wrap.className = "fld"; wrap.dataset.k = fd.k;
    const lab = document.createElement("label"); lab.textContent = fd.l; lab.htmlFor = "sim_" + fd.k;
    const val = document.createElement("span"); val.className = "val";
    wrap.append(lab, val);
    if (fd.type === "select") {
      const s = document.createElement("select"); s.id = "sim_" + fd.k;
      const groups = {};
      for (const key in fd.opts) { const gg = fd.opts[key].g || ""; (groups[gg] = groups[gg] || []).push(key); }
      for (const gn in groups) {
        const parent = gn ? document.createElement("optgroup") : s; if (gn) parent.label = gn;
        groups[gn].forEach(key => { const o = document.createElement("option"); o.value = key; o.textContent = fd.opts[key].n; parent.appendChild(o); });
        if (gn) s.appendChild(parent);
      }
      s.value = fd.k === "_variant" ? SEL : SP[fd.k];
      s.addEventListener("change", () => {
        if (fd.k === "_variant") { SEL = s.value; refresh(); return; }
        SP[fd.k] = s.value;
        if (fd.k === "product") {
          const pr = PRODUCTS[s.value]; SP.tCycle = pr.t; if (pr.sp) SP.salePrice = pr.sp; if (pr.rp) SP.rawPrice = pr.rp;
          if (pr.liq && SP.format === "kawalki") SP.format = "warstwa";
        }
        if (fd.k === "cutShape") SP.cutYield = SHAPES[s.value].y;
        if (fd.k === "product" || fd.k === "format") autoBatch();
        syncControls(); refresh();
      });
      wrap.appendChild(s); val.textContent = "";
    } else {
      const r = document.createElement("input"); r.type = "range"; r.id = "sim_" + fd.k;
      r.min = fd.min; r.max = fd.max; r.step = fd.step; r.value = SP[fd.k];
      r.addEventListener("input", () => {
        SP[fd.k] = parseFloat(r.value);
        if (["layerMm", "moldDepth", "moldCover", "pureeDens", "trayArea"].indexOf(fd.k) >= 0) autoBatch();
        syncControls(); refresh();
      });
      wrap.appendChild(r);
    }
    if (fd.h) { const h = document.createElement("span"); h.className = "hint"; h.textContent = fd.h; wrap.appendChild(h); }
    box.appendChild(wrap);
  }
  function buildControls() {
    const simple = $("#simSimple"), full = $("#simFull"); simple.innerHTML = ""; full.innerHTML = "";
    SIMPLE.forEach(k => { if (k === "grade") buildField(VARIANT, simple); buildField(FIELDS[k], simple); });
    GROUPS.forEach(g => {
      const d = document.createElement("details"); d.className = "grp"; if (g.open) d.open = true;
      const sm = document.createElement("summary"); sm.textContent = g.t; d.appendChild(sm);
      const b = document.createElement("div"); b.className = "grp__b";
      g.f.forEach(fd => { if (fd.type === "info") return; buildField(fd, b); });
      d.appendChild(b); full.appendChild(d);
    });
  }
  function syncControls() {
    $$(".fld").forEach(w => {
      const k = w.dataset.k, fd = k === "_variant" ? VARIANT : FIELDS[k]; if (!fd) return;
      w.style.display = fieldVisible(fd) ? "" : "none";
      const inp = w.querySelector("input,select"), val = w.querySelector(".val");
      if (fd.type === "select") { inp.value = k === "_variant" ? SEL : SP[k]; return; }
      if (parseFloat(inp.value) !== SP[k]) inp.value = SP[k];
      val.textContent = f(SP[k], fd.step < 1 ? (fd.step < .1 ? 2 : 1) : 0) + " " + (fd.u || "");
    });
  }

  function renderInfo(M) {
    const box = $("#simInfo"), p = M.p, over = M.trayNeed / p.trayArea;
    const pr = (a, b) => '<div class="pr"><span>' + a + '</span><span>' + b + '</span></div>';
    let html = pr("Uzysk", f(M.yieldR, 1) + " : 1 → " + f(M.mProd, 1) + " kg") + pr("Woda do odparowania", f(M.mWat, 0) + " kg") +
      pr("Czas cyklu", f(M.tCyc, 1) + " h → " + f(M.cyclesYr, 0) + " cykli/rok") + pr("Powierzchnia tac", f(M.trayNeed, 0) + " z " + f(p.trayArea, 0) + " m²");
    let cls = "ok", msg = "Komora wykorzystana. Zmiana surowca lub postaci dobiera wsad do tac.";
    if (M.pr.w < .4) { cls = "bad"; msg = "Mieszanka ma tylko " + f(M.pr.w * 100, 0) + " % wody, nie ma tu czego liofilizować."; }
    else if (p.frzMode === "kupny" && p.tIn > -1.5) { cls = "bad"; msg = "Surowiec kupowany mrożony nie może wchodzić w " + f(p.tIn, 0) + " °C. Obniż temperaturę wejścia."; }
    else if (over > 1) { cls = "bad"; msg = "Wsad nie mieści się w komorze: " + f(p.trayArea, 0) + " m² przyjmie " + f(M.trayFit, 0) + " kg."; }
    else if (over < .94) { cls = "warn"; msg = "Zostaje " + f(p.trayArea - M.trayNeed, 0) + " m² wolnych tac, wsad można zwiększyć do " + f(M.trayFit, 0) + " kg."; }
    if (M.collapse) { cls = "bad"; msg = "Front sublimacji " + f(M.vac.tFront, 1) + " °C przekracza temperaturę zapadania " + f(M.tCollapse, 0) + " °C. Obniż ciśnienie do " + f(M.pWork, 0) + " Pa."; }
    box.innerHTML = html + '<div class="pw ' + cls + '">' + msg + '</div>';
  }
  function renderKPI(M) {
    const s = M.R[SEL], a = M.R.A, base = SEL === "A";
    const d = (cur, ref) => { const x = (cur - ref) / ref * 100; return { t: (x > 0 ? "+" : "") + f(x, 0) + " % wobec A", c: x < -.5 ? "down" : (x > .5 ? "up" : "") }; };
    const rows = [
      { k: "Energia na kg wody", v: f(s.perKgW, 2), u: "kWh", d: base ? null : d(s.perKgW, a.perKgW), sub: "sam liofilizator" },
      { k: "Koszt energii na kg", v: f(s.costKg, 2), u: "zł", d: base ? null : d(s.costKg, a.costKg), sub: "produktu" },
      { k: "Koszt wytworzenia", v: f(s.cogs, 0), u: "zł/kg", d: null, sub: "marża " + f(s.marza, 0) + " zł przy " + f(M.p.salePrice, 0) + " zł" },
      { k: "Moc szczytowa", v: f(s.peak, 0), u: "kW", d: base ? null : d(s.peak, a.peak), sub: "opłata mocowa" },
      { k: "Emisja CO₂ na kg", v: f(s.co2Kg, 1), u: "kg", d: base ? null : d(s.co2Kg, a.co2Kg), sub: "produktu" },
      { k: "Ciepło odzyskane", v: f(s.Qhot, 0), u: "kWh", d: null, sub: s.Qhot > 0 ? f(s.Qhot / (M.Qshelf + M.hSum) * 100, 0) + " % zapotrzebowania" : "brak odzysku" },
      { k: "Pokrycie z PV", v: f(s.yr.pokrycie, 0), u: "%", d: null, sub: M.p.pvKwp > 0 ? "autokonsumpcja " + f(s.yr.autok, 0) + " %" : "instalacja wyłączona" },
      { k: "Koszt energii w roku", v: f(s.costYr / 1000, 0), u: "tys. zł", d: base ? null : d(s.costYr, a.costYr), sub: f(M.cyclesYr, 0) + " cykli · jedna komora" }
    ];
    $("#simKpi").innerHTML = rows.map(r => '<div class="kpi"><div class="k">' + r.k + '</div><div class="v">' + r.v + '<small>' + r.u + '</small></div><div class="d ' + (r.d ? r.d.c : "") + '">' + (r.d ? r.d.t : r.sub) + '</div></div>').join("");
  }
  function renderScen(M) {
    const box = $("#simScen"); box.innerHTML = "";
    SCEN.forEach(sc => {
      const s = M.R[sc.k], b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-pressed", String(sc.k === SEL));
      const rel = sc.k === "A" ? null : (s.costKg - M.R.A.costKg) / M.R.A.costKg * 100;
      b.innerHTML = '<span class="tag">WARIANT ' + sc.k + '</span><span class="nm">' + sc.nm + '</span><span class="fig">' + f(s.perKgW, 2) + ' kWh/kg · ' + f(s.costKg, 2) + ' zł/kg' +
        (rel === null ? '' : ' <span style="color:' + CSSV(rel < 0 ? "--good" : "--bad") + '">' + (rel > 0 ? "+" : "") + f(rel, 0) + ' %</span>') + '</span>';
      b.addEventListener("click", () => { SEL = sc.k; syncControls(); refresh(); });
      box.appendChild(b);
    });
  }
  function renderTab(M) {
    const s = M.R[SEL];
    if (curTab === "tEnergy") drawEnergy($("#simEnergy"), M, SEL, "simEnergy");
    if (curTab === "tProfile") { drawProfile($("#simProfile"), M, SEL, "simProfile"); $("#simProfileNote").innerHTML = "Sublimacja zajmuje " + f(M.subl / M.tCyc * 100, 0) + " % cyklu i to ona wyznacza moc. Szczyt wariantu " + SEL + ": <b>" + f(s.peak, 0) + " kW</b>" + (SEL !== "A" ? ", wariant A: " + f(M.R.A.peak, 0) + " kW." : "."); }
    if (curTab === "tVac") { drawVac($("#simVac"), M, "simVac"); $("#simVacNote").innerHTML = "Optimum szybkości wypada przy <b>" + f(M.vacOpt.p, 0) + " Pa</b>, granica jakości dla tego surowca to <b>" + f(M.pSafe, 0) + " Pa</b>. Zalecana nastawa: <b>" + f(M.pWork, 0) + " Pa</b>." + (Math.abs(M.p.pCham - M.pWork) < 6 ? " Obecna nastawa jest właściwa." : " Obecna nastawa " + f(M.p.pCham, 0) + " Pa odbiega od zalecanej" + (M.collapse ? " i <b>front przekracza granicę zapadania</b>." : "; strata na czasie cyklu " + f((M.pressPen - 1) * 100, 0) + " %.")); }
    if (curTab === "tCost") { drawCost($("#simCost"), M, SEL, "simCost"); $("#simCostNote").innerHTML = "Surowiec to <b>" + f(s.cost5.surowiec / s.cogs * 100, 0) + " %</b> kosztu wytworzenia, energia <b>" + f(s.cost5.energia / s.cogs * 100, 0) + " %</b>. Przy uzysku " + f(M.yieldR, 1) + " : 1 każda złotówka na kilogramie surowca to " + f(M.yieldR, 1) + " zł na kilogramie produktu."; }
    if (curTab === "tLevers") drawLevers($("#simLevers"), M, SEL, "simLevers");
    if (curTab === "tTariff") { drawTariff($("#simTariff"), M, SEL, "simTariff"); $("#simTariffNote").innerHTML = M.p.pvKwp > 0 ? "Instalacja " + f(M.p.pvKwp, 0) + " kWp pokrywa <b>" + f(s.yr.pokrycie, 0) + " %</b> zapotrzebowania, autokonsumpcja <b>" + f(s.yr.autok, 0) + " %</b>. Oszczędność wobec braku PV: <b>" + f((s.yrNoPv.C - s.yr.C) / 1000, 1) + " tys. zł</b> rocznie, prosty zwrot " + f(M.p.pvKwp * M.p.pvCapex / Math.max(1, s.yrNoPv.C - s.yr.C), 1) + " lat." : "Fotowoltaika wyłączona. Ustaw moc instalacji, żeby zobaczyć autokonsumpcję i zwrot."; }
    if (curTab === "tTable") tableBilans($("#simTable"), M, SEL);
  }
  function refresh() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { SM = model(SP); renderInfo(SM); renderKPI(SM); renderScen(SM); renderTab(SM); });
  }

  buildControls(); syncControls(); refresh();
  $$(".modes button").forEach(b => b.addEventListener("click", () => {
    $$(".modes button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    const full = b.dataset.mode === "pelny"; $("#simFull").hidden = !full; $("#simSimple").hidden = full;
  }));
  $$("#simTabs button").forEach(b => b.addEventListener("click", () => {
    $$("#simTabs button").forEach(x => { x.setAttribute("aria-selected", String(x === b)); const p = document.getElementById(x.dataset.panel); if (p) p.hidden = (x !== b); });
    curTab = b.dataset.panel; if (SM) renderTab(SM);
  }));
  $("#simReset").addEventListener("click", () => { SP = JSON.parse(JSON.stringify(REF)); SEL = "D"; buildControls(); syncControls(); refresh(); });

  /* ---------- router ---------- */
  const views = $$(".view"), links = $$("#navLinks a");
  const MAP = { "": "index", "/": "index", "/urzadzenie": "urzadzenie", "/linia": "linia", "/ekonomia": "ekonomia", "/symulator": "symulator", "/granty": "granty", "/metodyka": "metodyka" };
  function route() {
    const h = location.hash.replace(/^#/, ""), key = MAP[h] !== undefined ? MAP[h] : "index";
    views.forEach(v => { v.hidden = (v.id !== "view-" + key); });
    links.forEach(a => { const t = a.getAttribute("href").replace(/^#/, ""); if (MAP[t] === key) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();

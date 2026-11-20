// Show the current year in Illustrator folder paths (Adobe Illustrator 2026 → this year).
document.querySelectorAll('.ai-year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

// Simulated line breaking for the samples. Each .lay box holds plain text and
// data-* flags: nb (No Break on hyphenated words), kin (kinsoku), ah (English
// auto-hyphenation at soft hyphens), hang (hanging punctuation), align, ok
// (which flag to compare with, to highlight what moved). Lines are then spread
// like justified text: extra space between Hanji, punctuation and whole Roman
// words, never inside a word.
(function () {
  var R = 'A-Za-z0-9À-ɏḀ-ỿ̀-ͯⁿ';
  var H = '㐀-鿿豈-﫿';
  var SUR = '[\uD840-\uD87F][\uDC00-\uDFFF]';
  var TOK = '(?:[' + R + ']+|' + SUR + '|[' + H + '])';
  var reAtom = new RegExp('[' + R + ']+|-+|' + SUR + '|[' + H + ']|[\\s\\S]', 'g');
  var reHy = new RegExp(TOK + '(?:-+' + TOK + ')+', 'g');
  var reCJK = new RegExp('^(?:' + SUR + '|[' + H + '，。、；：？！「」（）])$');
  var CLOSE = '，。、；：？！」）,.;:?!', OPEN = '「（', HANG = '，。、．';

  function source(el) {
    if (el._src) return el._src;
    var s = { t: '', stuck: [] };
    el.childNodes.forEach(function (n) {
      var x = n.textContent;
      if (n.nodeType === 1 && n.classList.contains('stuck')) s.stuck.push([s.t.length, s.t.length + x.length]);
      s.t += x;
    });
    return (el._src = s);
  }
  function within(rs, a, b) {
    for (var i = 0; i < rs.length; i++) if (a >= rs[i][0] && b <= rs[i][1]) return rs[i];
    return null;
  }

  // break the text into lines; returns {lines:[{s,e,w}], atoms, t}
  function layout(src, f, W, measure) {
    var t = src.t, atoms = [], hw = [], m;
    reAtom.lastIndex = 0;
    while ((m = reAtom.exec(t))) atoms.push({ s: m.index, e: m.index + m[0].length, x: m[0] });
    reHy.lastIndex = 0;
    while ((m = reHy.exec(t))) hw.push([m.index, m.index + m[0].length]);
    function glue(a, b) {
      if (within(src.stuck, a.s, b.e)) return true;
      if (a.x === ' ' || b.x === ' ') return false;
      if (b.x === '­') return true;
      if (a.x === '­') return !f.ah;
      if (f.kin && (CLOSE.indexOf(b.x) >= 0 || OPEN.indexOf(a.x) >= 0)) return true;
      if (f.nb && within(hw, a.s, b.e)) return true;
      return a.x.charAt(0) === '-';      // "-" may not end a line, so it moves down
    }
    var segs = [], cur = null;
    atoms.forEach(function (a, i) {
      if (cur && glue(atoms[i - 1], a)) cur.e = a.e;
      else segs.push(cur = { s: a.s, e: a.e, sp: a.x === ' ' });
    });
    var spW = measure(' '), hyW = measure('-'), lines = [], line = null, pend = 0;
    segs.forEach(function (g) {
      if (g.sp) { if (line) pend = spW; return; }
      var x = t.slice(g.s, g.e), gw = measure(x), shy = /­$/.test(x) ? hyW : 0;
      var last = x.charAt(x.length - 1), hw2 = f.hang && HANG.indexOf(last) >= 0 ? measure(last) : 0;
      if (!line) { line = { s: g.s, e: g.e, w: gw }; return; }
      var nw = line.w + pend + gw;
      if (nw + shy <= W + 0.5 || (hw2 && nw - hw2 <= W + 0.5)) { line.e = g.e; line.w = nw; }
      else { lines.push(line); line = { s: g.s, e: g.e, w: gw }; }
      pend = 0;
    });
    if (line) lines.push(line);
    return { lines: lines, atoms: atoms, hw: hw, t: t, spW: spW };
  }

  function flags(d) {
    return { nb: d.nb !== 'off', kin: d.kin !== 'off', ah: d.ah === 'on', hang: d.hang === 'on' };
  }
  function esc(s) { return s.replace(/­/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function render(el) {
    var src = source(el), d = el.dataset, f = flags(d);
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:0;top:0';
    el.innerHTML = '';
    el.appendChild(probe);
    var cache = {};
    function measure(s) {
      s = s.replace(/­/g, '');
      if (!(s in cache)) { probe.textContent = s; cache[s] = probe.getBoundingClientRect().width; }
      return cache[s];
    }
    var W = el.clientWidth, L = layout(src, f, W, measure), t = L.t, marks = [];
    src.stuck.forEach(function (r) { marks.push({ s: r[0], e: r[1], c: 'hit' }); });
    // faults in this layout: a line that starts with "-" or closing punctuation
    L.lines.forEach(function (ln, i) {
      if (!i) return;
      var c = t.charAt(ln.s);
      if (c === '-' || CLOSE.indexOf(c) >= 0) {
        var e = ln.s + 1;
        L.hw.forEach(function (r) { if (r[0] < ln.s && r[1] > ln.s) e = r[1]; });
        marks.push({ s: ln.s, e: e, c: 'hit' });
      }
    });
    // what moved compared with the option switched off
    if (d.ok) {
      var g = {}; g[d.ok] = false;
      var off = layout(src, Object.assign({}, f, g), W, measure);
      off.lines.forEach(function (ln, i) {
        if (!i) return;
        if (d.ok === 'nb') {
          L.hw.forEach(function (r) { if (r[0] < ln.s && r[1] > ln.s) marks.push({ s: r[0], e: r[1], c: 'ok' }); });
        } else if (CLOSE.indexOf(t.charAt(ln.s)) >= 0) marks.push({ s: ln.s, e: ln.s + 1, c: 'ok' });
      });
    }
    function piece(s, e) {
      var o = '', i = s;
      while (i < e) {
        var mk = null, j = e;
        marks.forEach(function (k) { if (i >= k.s && i < k.e) mk = k; });
        marks.forEach(function (k) { if (k.s > i && k.s < j) j = k.s; });
        if (mk && mk.e < j) j = mk.e;
        o += mk ? '<span class="' + mk.c + '">' + esc(t.slice(i, j)) + '</span>' : esc(t.slice(i, j));
        i = j;
      }
      return o;
    }
    var html = '';
    L.lines.forEach(function (ln, i) {
      var last = i === L.lines.length - 1 || d.align === 'left' || ln.w > W + 0.5;
      var units = [], u = null;
      L.atoms.forEach(function (a) {
        if (a.s < ln.s || a.e > ln.e) return;
        if (a.x === ' ') { units.push({ sp: true }); u = null; return; }
        var cjk = reCJK.test(a.x), hy = a.x.charAt(0) === '-';
        var join = u && !u.sp && (hy || u.hy || (!cjk && !u.cjk) || (CLOSE.indexOf(a.x) >= 0 && !cjk));
        if (join) { u.e = a.e; u.hy = hy; u.cjk = cjk; }
        else units.push(u = { s: a.s, e: a.e, cjk: cjk, hy: hy });
      });
      var endShy = t.charAt(ln.e - 1) === '­';
      var hangs = f.hang && ln.w > W + 0.5 && HANG.indexOf(t.charAt(ln.e - 1)) >= 0;
      if (hangs) { marks.push({ s: ln.e - 1, e: ln.e, c: 'ok' }); last = i === L.lines.length - 1; }
      html += '<div class="ln' + (last ? ' last' : '') + '">' + units.map(function (x, k) {
        if (x.sp) return '<span style="width:' + L.spW.toFixed(2) + 'px"></span>';
        var inner = piece(x.s, x.e);
        if (endShy && k === units.length - 1) inner += '<span class="hit">-</span>';
        return '<span>' + inner + '</span>';
      }).join('') + '</div>';
    });
    el.innerHTML = html;
  }

  // in the other samples, keep hyphenated words whole as Illustrator would
  document.querySelectorAll('.box.free').forEach(function (box) {
    var walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walk.nextNode())) nodes.push(n);
    nodes.forEach(function (n) {
      var parts = n.textContent.split(/([^\s\u00B7]*-[^\s\u00B7]*)/);
      if (parts.length < 2) return;
      var frag = document.createDocumentFragment();
      parts.forEach(function (p, i) {
        if (!p) return;
        if (i % 2) { var w = document.createElement('span'); w.className = 'nw'; w.textContent = p; frag.appendChild(w); }
        else frag.appendChild(document.createTextNode(p));
      });
      n.parentNode.replaceChild(frag, n);
    });
  });
  function run() { document.querySelectorAll('.lay').forEach(render); }
  window.PLS = { layout: layout, source: source, render: render, run: run };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(run._t);
    run._t = setTimeout(run, 150);
  });
})();

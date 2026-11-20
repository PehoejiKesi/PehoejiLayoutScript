// Pe̍h-ōe-jī Layout Script.jsx — Adobe Illustrator script
// Version 0.9.0 · https://pehoejikesi.github.io/PehoejiLayoutScript/
// Made by Tâi-bûn Ke-si Mī · https://linktr.ee/taibunkesimi
//
// Han-Lo (Hanji + Taigi Roman Orthography) layout for the whole document.
// A dialog lets you turn each option on or off and change its numbers;
// your last choices are remembered. Unticked options leave that setting
// as it is in the document.
//
//   A. Line breaking   1 Hard kinsoku rules · 2 No Break on hyphenated words
//                      (2a clear first) · 3 Middle Eastern & South Asian
//                      Every-line Composer · 4 auto-hyphenation off
//   B. Justification   5 alignment · 6 word spacing · 7 letter spacing · 8 auto leading
//   C. Punctuation     9 hanging punctuation · 10 mojikumi set
//   D. Spacing         11 kerning Auto · 12 Roman tracking · 13 Han–Lo space
//                      · 14 hyphen tightening (14a reset tracking first)
//   E. Check           15 report problem lines (saved to the Desktop)
//
// Running it again is safe; run it again after adding text.
// Run: File › Scripts › Pe̍h-ōe-jī Layout Script  (save a copy of the document first)

#target illustrator

var PEHOEJI_LAYOUT_VERSION = '0.9.0';   // also in CHANGELOG.md, README.md and index.html

(function () {
    if (app.documents.length === 0) { alert('Open the document first.'); return; }
    var doc = app.activeDocument;

    // ---- selection: text frames the user picked (selected frames, frames in selected
    // groups, or the story of text selected with the Type tool) ---------------
    function selectedFrames() {
        var out = [], sel;
        try { sel = doc.selection; } catch (e) { return out; }
        if (!sel) return out;
        function walk(it) {
            try {
                if (it.typename === 'TextFrame') out.push(it);
                else if (it.typename === 'GroupItem') for (var g = 0; g < it.pageItems.length; g++) walk(it.pageItems[g]);
                else if (it.typename === 'TextRange' || it.typename === 'InsertionPoint') {
                    var st = it.story.textFrames; for (var h = 0; h < st.length; h++) out.push(st[h]);
                }
            } catch (e) {}
        }
        if (sel.typename) {   // text selection or insertion point inside one story
            try { var tfs = sel.story.textFrames; for (var t = 0; t < tfs.length; t++) out.push(tfs[t]); } catch (e) {}
            return out;
        }
        for (var i = 0; i < sel.length; i++) walk(sel[i]);
        return out;
    }
    function frameKey(tf) { try { return tf.uuid || null; } catch (e) { return null; } }
    var SEL = selectedFrames(), nSel = SEL.length, selKeys = {}, keyed = true;
    for (var q0 = 0; q0 < nSel; q0++) { var k0 = frameKey(SEL[q0]); if (k0 === null) keyed = false; else selKeys[k0] = true; }
    function storySelected(story) {
        try {
            var tfs = story.textFrames;
            for (var j = 0; j < tfs.length; j++) {
                if (keyed) { if (selKeys[frameKey(tfs[j])]) return true; }
                else for (var k = 0; k < nSel; k++) if (SEL[k] == tfs[j]) return true;
            }
        } catch (e) {}
        return false;
    }

    // ---- defaults ------------------------------------------------------------
    var D = {
        kinsokuOn: true,
        noBreakOn: true,   noBreakReset: true,
        composerOn: true,
        hyphOffOn: true,
        alignOn: true,     alignPos: 3,   // 3 = Justify with last line aligned left (book body text)
        wordOn: true,      wordMin: 80,  wordDes: 150, wordMax: 200,
        letterOn: true,    letterMin: 0, letterDes: 10, letterMax: 50,
        leadOn: true,      leadPct: 133,   // 133% = 16 pt leading on 12 pt type
        burasagariOn: false,
        mojiOn: false,     mojiName: '',
        kernOn: true,
        romanOn: true,     romanTrack: 5,
        hanloOn: true,     hanloTrack: 100,
        hyphTightOn: true, hyphTrack: -30,
        trackReset: false,
        checkOn: true
    };
    // alignment, in the Paragraph panel's order; alignPos is the position in this list
    var ALIGN_ENUM = ['LEFT', 'CENTER', 'RIGHT', 'FULLJUSTIFYLASTLINELEFT', 'FULLJUSTIFYLASTLINECENTER',
        'FULLJUSTIFYLASTLINERIGHT', 'FULLJUSTIFY'];
    var ALIGN_NAMES = ['Align left', 'Align center', 'Align right', 'Justify with last line aligned left',
        'Justify with last line aligned center', 'Justify with last line aligned right', 'Justify all lines'];
    // alignment icons (20x16 PNG), drawn like the Paragraph panel; light set for dark UI, dark set for light UI
    var ALIGN_ICONS = {
        light: {
            LEFT: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x27\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB8\x76\xED\xDA\x7F\x6A\x62\xEA\x1B\x38\xF8\x01\xD5\xBD\x35\x4C\xC3\x69\x34\x1D\x0E\x8E\x30\x1C\x38\x03\xA9\x0D\x00\x29\xE5\xB9\x8E\x46\x4B\x29\x9B\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            CENTER: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x26\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB8\x76\xED\xDA\x7F\x6A\x62\xEA\x1B\x38\xF4\x00\xD5\xBD\x38\x1A\x66\xA3\xE9\x90\xC6\xE1\x3A\x70\x06\x52\x02\x00\x87\x21\xB2\x8C\x14\xEA\xF4\xC2\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            RIGHT: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x27\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB8\x76\xED\xDA\x7F\x6A\x62\xEA\x1B\x38\xB4\x01\xD5\xBD\x3C\x4C\xC3\x70\x34\x1D\x0E\xBE\xB0\x1E\x38\x03\x89\x05\x00\x3E\xB2\xB9\x8E\x46\x95\x40\xC7\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            FULLJUSTIFYLASTLINELEFT: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x24\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB8\x76\xED\xDA\x7F\x6A\x62\xEA\x1B\x38\xF8\xC1\x68\x18\x8E\x86\xE1\x50\x0A\xC3\x81\x33\x90\xDA\x00\x00\x6A\x32\xEA\x9C\xC6\x5D\xC8\xD3\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            FULLJUSTIFYLASTLINECENTER: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x24\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB8\x76\xED\xDA\x7F\x6A\x62\xEA\x1B\x38\xF8\xC1\x68\x18\x8E\x86\xE1\x50\x0F\xD7\x81\x33\x90\x12\x00\x00\xF0\x48\xEA\x9C\x34\xB8\x35\x20\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            FULLJUSTIFYLASTLINERIGHT: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x24\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB8\x76\xED\xDA\x7F\x6A\x62\xEA\x1B\x38\xF8\xC1\x68\x18\x8E\x86\xE1\x50\x02\x54\xF7\xF2\x80\x85\x21\x00\x76\x6D\xEA\x9C\x7C\x6F\x47\x62\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            FULLJUSTIFY: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x22\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB8\x76\xED\xDA\x7F\x6A\x62\xEA\x1B\x38\xF8\xC1\x68\x18\x8E\x86\xE1\x68\x18\x0E\x44\x18\x02\x00\x46\xC5\x30\xBF\xC4\xA9\x0C\xAB\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82'
        },
        dark: {
            LEFT: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x27\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB0\xB1\xB1\xF9\x4F\x4D\x4C\x7D\x03\x07\x3F\xA0\xBA\xB7\x86\x69\x38\x8D\xA6\xC3\xC1\x11\x86\x03\x67\x20\xB5\x01\x00\x12\x9D\xD6\x1B\xB6\x51\x33\xC0\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            CENTER: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x26\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB0\xB1\xB1\xF9\x4F\x4D\x4C\x7D\x03\x87\x1E\xA0\xBA\x17\x47\xC3\x6C\x34\x1D\xD2\x38\x5C\x07\xCE\x40\x4A\x00\x00\x41\x06\xD2\xB5\x1F\x3B\x4E\x6F\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            RIGHT: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x27\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB0\xB1\xB1\xF9\x4F\x4D\x4C\x7D\x03\x87\x36\xA0\xBA\x97\x87\x69\x18\x8E\xA6\xC3\xC1\x17\xD6\x03\x67\x20\xB1\x00\x00\xED\x90\xD6\x1B\xD4\x1A\x23\xD3\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            FULLJUSTIFYLASTLINELEFT: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x24\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB0\xB1\xB1\xF9\x4F\x4D\x4C\x7D\x03\x07\x3F\x18\x0D\xC3\xD1\x30\x1C\x4A\x61\x38\x70\x06\x52\x1B\x00\x00\xE1\x76\xED\xE5\x9A\x64\x11\x97\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            FULLJUSTIFYLASTLINECENTER: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x23\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB0\xB1\xB1\xF9\x4F\x4D\x4C\x7D\x03\x07\x3F\x18\x0D\xC3\xD1\x30\x1C\xEA\xE1\x3A\x70\x06\x52\x02\x00\x39\xA8\xED\xE5\x95\xF5\x89\x2C\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            FULLJUSTIFYLASTLINERIGHT: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x24\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB0\xB1\xB1\xF9\x4F\x4D\x4C\x7D\x03\x07\x3F\x18\x0D\xC3\xD1\x30\x1C\x4A\x80\xEA\x5E\x1E\xB0\x30\x04\x00\x91\xCB\xED\xE5\x69\x8C\x1C\xD3\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82',
            FULLJUSTIFY: '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x14\x00\x00\x00\x10\x08\x06\x00\x00\x00\x16\x18\x5F\x1B\x00\x00\x00\x21\x49\x44\x41\x54\x78\xDA\x63\x60\xA0\x36\xB0\xB1\xB1\xF9\x4F\x4D\x4C\x7D\x03\x07\x3F\x18\x0D\xC3\xD1\x30\x1C\x0D\xC3\x81\x08\x43\x00\xA5\x81\x0F\xF0\x95\x6B\xF9\xBA\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82'
        }
    };

    var PREFS = new File(Folder.userData + '/peh-oe-ji-layout.prefs');

    function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }
    function loadPrefs() {
        var S = copy(D);
        try {
            if (PREFS.exists) {
                PREFS.encoding = 'UTF-8';
                if (!PREFS.open('r')) return S;
                var lines = PREFS.read().split(/\r\n|\r|\n/);
                PREFS.close();
                for (var i = 0; i < lines.length; i++) {
                    var p = lines[i].indexOf('=');
                    if (p < 0) continue;
                    var k = lines[i].substring(0, p), v = lines[i].substring(p + 1);
                    if (!(k in D)) continue;
                    if (typeof D[k] === 'boolean') S[k] = (v === 'true');
                    else if (typeof D[k] === 'number') { var n = parseFloat(v); if (!isNaN(n)) S[k] = n; }
                    else S[k] = v;
                }
            }
        } catch (e) {}
        return S;
    }
    function savePrefs(S) {
        try {
            var out = [];
            for (var k in D) out.push(k + '=' + S[k]);
            PREFS.encoding = 'UTF-8'; PREFS.lineFeed = 'Unix';   // ExtendScript writes CR line ends on macOS otherwise
            if (!PREFS.open('w')) return;
            PREFS.write(out.join('\n'));
            PREFS.close();
        } catch (e) {}
    }

    var S = loadPrefs();
    if (!(S.alignPos >= 0 && S.alignPos < ALIGN_NAMES.length && Math.floor(S.alignPos) === S.alignPos)) S.alignPos = D.alignPos;

    // ---- dialog --------------------------------------------------------------
    var ctl = {};      // key -> checkbox, edittext or dropdownlist

    // mojikumi set names as this Illustrator and document know them,
    // so the dialog works in any UI language (empty if unavailable: typed name instead)
    function setNames(prop) {
        var out = [];
        try { var a = doc[prop]; for (var i = 0; i < a.length; i++) if (a[i]) out.push(String(a[i])); } catch (e) {}
        return out;
    }
    var MOJIKUMI_SETS = setNames('mojikumiSet');
    var KINSOKU_FIRST = setNames('kinsokuSet')[0];   // Illustrator's built-in Hard set, whatever it is called
    var DESC_W = 330;  // description width in pixels

    var DARK_UI = true;
    try { DARK_UI = app.preferences.getRealPreference('uiBrightness') <= 0.5; } catch (e) {}
    function grey(t) {   // secondary text, readable on both dark and light Illustrator themes
        var c = DARK_UI ? [0.72, 0.72, 0.72] : [0.36, 0.36, 0.36];
        try { t.graphics.foregroundColor = t.graphics.newPen(t.graphics.PenType.SOLID_COLOR, c, 1); } catch (e) {}
    }
    // checkbox + optional value fields on one row, grey description below
    function option(parent, key, label, fields, desc, indent) {
        indent = indent || 0;
        var g = parent.add('group');
        g.orientation = 'column'; g.alignChildren = 'left'; g.spacing = 1; g.margins = [indent, 2, 0, 2];
        var row = g.add('group'); row.spacing = 4;
        var cb = row.add('checkbox', undefined, label);
        ctl[key] = cb;
        var eds = [];
        for (var i = 0; i < fields.length; i++) {
            var f = fields[i];
            if (f.pre) row.add('statictext', undefined, f.pre);
            var e;
            if (f.list && f.list.length) {
                e = row.add('dropdownlist', undefined, f.list);
                e.preferredSize.width = 120;
                e.pick = function (name) {   // saved or default name; otherwise the first set (built-in Hard)
                    for (var j = 0; j < this.items.length; j++) if (this.items[j].text === name) { this.selection = j; return; }
                    this.selection = 0;
                };
            } else {
                e = row.add('edittext', undefined, '');
                e.characters = f.chars || 4;
            }
            ctl[f.key] = e; e.owner = key; eds.push(e);
            if (f.unit) row.add('statictext', undefined, f.unit);
        }
        if (desc) {
            var t = g.add('statictext', undefined, desc, { multiline: true });
            t.preferredSize.width = DESC_W - indent;
            grey(t);
        }
        cb.syncFields = function () { for (var j = 0; j < eds.length; j++) eds[j].enabled = cb.value; };
        cb.onClick = function () { cb.syncFields(); if (cb.onChange2) cb.onChange2(); };
        return cb;
    }
    function panel(parent, title) {
        var p = parent.add('panel', undefined, title);
        p.orientation = 'column'; p.alignChildren = 'fill'; p.margins = [10, 14, 10, 8]; p.spacing = 2;
        return p;
    }
    function fill(S) {   // put values into the controls
        for (var k in ctl) {
            if (ctl[k].type === 'checkbox') ctl[k].value = S[k];
            else if (ctl[k].type === 'align') ctl[k].set(S[k]);
            else if (ctl[k].type === 'dropdownlist') ctl[k].pick(String(S[k]));
            else ctl[k].text = String(S[k]);
        }
        for (var k2 in ctl) if (ctl[k2].syncFields) ctl[k2].syncFields();
        ctl.noBreakReset.enabled = ctl.noBreakOn.value || ctl.kinsokuOn.value;
        ctl.alignPos.setEnabled(ctl.alignOn.value);
        syncTrackReset();
    }
    function syncTrackReset() {
        ctl.trackReset.enabled = ctl.romanOn.value || ctl.hanloOn.value || ctl.hyphTightOn.value;
    }

    var w = new Window('dialog', 'Pe\u030Dh-\u014De-j\u012B Layout Script ' + PEHOEJI_LAYOUT_VERSION);
    w.orientation = 'column'; w.alignChildren = 'fill';
    var scope = w.add('panel', undefined, 'Apply to');
    scope.orientation = 'row'; scope.alignChildren = 'left'; scope.margins = [10, 14, 10, 8]; scope.spacing = 16;
    var rDoc = scope.add('radiobutton', undefined, 'Whole document');
    var rSel = scope.add('radiobutton', undefined, nSel ? 'Selected text only (' + nSel + ' text frame' + (nSel > 1 ? 's' : '') + ')'
                                                        : 'Selected text only (nothing selected)');
    rSel.enabled = nSel > 0; rSel.value = nSel > 0; rDoc.value = !rSel.value;   // a selection means "just these"
    var cols = w.add('group'); cols.alignChildren = 'top'; cols.spacing = 10;
    var left = cols.add('group');  left.orientation = 'column';  left.alignChildren = 'fill';
    var right = cols.add('group'); right.orientation = 'column'; right.alignChildren = 'fill';

    var pA = panel(left, 'A. Line breaking');
    option(pA, 'kinsokuOn', '1  Kinsoku: Hard rules', [],
        'Punctuation such as \uFF0C\u3002\u3001\u300D\uFF09 cannot start a line, \u300C\uFF08 cannot end one. The script applies Illustrator\'s Hard rules itself with No Break, so it works in any language and ignores the document\'s kinsoku sets.');
    option(pA, 'noBreakOn', '2  No Break on hyphenated words', [],
        'Keeps \u0113-t\u00E0ng, chhut--l\u00E2i, \u51FA--\u4F86 together so "-" never starts or ends a line.');
    option(pA, 'noBreakReset', '2a  First clear No Break from all text', [],
        'Tick if a sentence will not break or spacing looks uneven after editing. Also removes No Break you set by hand.', 22);
    option(pA, 'composerOn', '3  Middle Eastern & South Asian Every-line Composer', [],
        'Places combining tone marks (a\u030D, o\u0358, \u01F9) correctly.');
    option(pA, 'hyphOffOn', '4  Turn auto-hyphenation off', [],
        'Stops Illustrator adding its own "-" that looks like a Taigi hyphen.');
    ctl.noBreakOn.onChange2 = ctl.kinsokuOn.onChange2 = function () { ctl.noBreakReset.enabled = ctl.noBreakOn.value || ctl.kinsokuOn.value; };

    var pB = panel(left, 'B. Justification & leading');
    option(pB, 'alignOn', '5  Alignment', [], '');
    (function () {   // seven toggle icons like the Paragraph panel; one is pressed at a time
        var row = ctl.alignOn.parent;
        var bar = row.add('group'); bar.spacing = 1; bar.margins = [6, 0, 0, 0];
        var set = DARK_UI ? ALIGN_ICONS.light : ALIGN_ICONS.dark;
        var btns = [];
        var nameLbl;
        var A = { type: 'align', index: 3 };
        A.set = function (n) {
            A.index = n;
            for (var j = 0; j < btns.length; j++) btns[j].value = (j === n);
            if (nameLbl) nameLbl.text = ALIGN_NAMES[n];
        };
        A.setEnabled = function (on) {
            for (var j = 0; j < btns.length; j++) btns[j].enabled = on;
            if (nameLbl) nameLbl.enabled = on;
        };
        for (var i = 0; i < ALIGN_ENUM.length; i++) {
            var b;
            try {
                b = bar.add('iconbutton', undefined, ScriptUI.newImage(set[ALIGN_ENUM[i]]), { style: 'toolbutton', toggle: true });
            } catch (e) {   // no image support: numbered radio buttons, which still show the choice
                b = bar.add('radiobutton', undefined, String(i + 1));
            }
            b.helpTip = ALIGN_NAMES[i];
            b.alignNo = i;
            b.onClick = function () { A.set(this.alignNo); };
            btns.push(b);
        }
        // name of the chosen alignment under the icons
        var g = ctl.alignOn.parent.parent;
        nameLbl = g.add('statictext', undefined, ALIGN_NAMES[3]);
        nameLbl.preferredSize.width = DESC_W;
        var d = g.add('statictext', undefined, 'Book body text usually uses "Justify with last line aligned left".', { multiline: true });
        d.preferredSize.width = DESC_W;
        grey(d);
        ctl.alignPos = A;
        ctl.alignOn.onChange2 = function () { A.setEnabled(ctl.alignOn.value); };
    })();
    option(pB, 'wordOn', '6  Word spacing', [
        { key: 'wordMin', pre: 'min' }, { key: 'wordDes', pre: 'desired' }, { key: 'wordMax', pre: 'max', unit: '%' }],
        'How far spaces may shrink or stretch in justified lines.');
    option(pB, 'letterOn', '7  Letter spacing', [
        { key: 'letterMin', pre: 'min' }, { key: 'letterDes', pre: 'desired' }, { key: 'letterMax', pre: 'max', unit: '%' }],
        'Keep small so Roman syllables and Hanji are not pulled apart.');
    option(pB, 'leadOn', '8  Auto leading', [{ key: 'leadPct', unit: '% of font size' }],
        '120% to 500%. 133% = 16 pt leading on 12 pt type. Applies to all text, including headings, and replaces any fixed leading.');

    var pC = panel(right, 'C. Punctuation');
    option(pC, 'burasagariOn', '9  Hanging punctuation (Burasagari)', [],
        '\u3001\u3002\uFF0C\uFF0E may sit past the right margin for a cleaner edge. Hanging needs a kinsoku set, so this also sets Illustrator\'s built-in Hard set.');
    option(pC, 'mojiOn', '10  Mojikumi set', [{ key: 'mojiName', chars: 10, list: MOJIKUMI_SETS }],
        'The list shows this document\'s sets. Built-in sets are made for Japanese punctuation; check centred Taiwan punctuation by eye.');

    var pD = panel(right, 'D. Spacing (tracking, 1/1000 em)');
    option(pD, 'kernOn', '11  Kerning: Auto (metrics)', [],
        'Optical kerning can misjudge letters with tone marks.');
    option(pD, 'romanOn', '12  Roman Orthography tracking', [{ key: 'romanTrack' }],
        'Every Roman letter. Try 0 to +10.');
    option(pD, 'hanloOn', '13  Han\u2013Lo space', [{ key: 'hanloTrack' }],
        'Where Hanji meets a Roman letter, either way round. +100 = 1/10 em, +125 = 1/8 em.');
    option(pD, 'hyphTightOn', '14  Hyphen tightening', [{ key: 'hyphTrack' }],
        'Around "-" and "--" inside Taigi words only (not in -5 or ----). Negative = tighter.');
    ctl.romanOn.onChange2 = ctl.hanloOn.onChange2 = ctl.hyphTightOn.onChange2 = function () { syncTrackReset(); };
    option(pD, 'trackReset', '14a  First reset all tracking to 0', [],
        'Fixes text that picked up spacing by typing next to a spaced character. Also removes tracking you set by hand.', 22);

    var pE = panel(right, 'E. Check');
    option(pE, 'checkOn', '15  Check report after running', [],
        'Lists lines starting or ending with "-", lines starting with \uFF0C\u3002\u3001\u300D\uFF09 or ending with \u300C\uFF08, and possibly loose justified lines. Saved to the Desktop when anything is found.');

    var btns = w.add('group'); btns.alignment = 'fill';
    var bDef = btns.add('button', undefined, 'Defaults');
    var spacer = btns.add('group'); spacer.alignment = 'fill';
    btns.add('button', undefined, 'Cancel', { name: 'cancel' });
    var bRun = btns.add('button', undefined, 'Run', { name: 'ok' });

    fill(S);
    bDef.onClick = function () { fill(D); };

    var NUM = {
        wordMin: [0, 1000], wordDes: [0, 1000], wordMax: [0, 1000],
        letterMin: [-100, 500], letterDes: [-100, 500], letterMax: [-100, 500],
        leadPct: [120, 500], romanTrack: [-1000, 10000], hanloTrack: [-1000, 10000], hyphTrack: [-1000, 10000]
    };
    function readDialog() {   // returns error text, or '' and fills S
        var R = {}, k;
        for (k in ctl) {
            if (ctl[k].type === 'checkbox') { R[k] = ctl[k].value; continue; }
            if (ctl[k].type === 'align') { R[k] = ctl[k].index; continue; }
            var txt = ctl[k].type === 'dropdownlist' ? (ctl[k].selection ? ctl[k].selection.text : '') : ctl[k].text;
            txt = String(txt).replace(/^\s+|\s+$/g, '');
            if (ctl[k].owner && !ctl[ctl[k].owner].value) { R[k] = S[k]; continue; }   // option off: keep last value
            if (typeof D[k] === 'number') {
                if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(txt)) return '"' + txt + '" is not a number.';
                var n = parseFloat(txt);
                if (n < NUM[k][0] || n > NUM[k][1]) return n + ' is out of range (' + NUM[k][0] + ' to ' + NUM[k][1] + ').';
                R[k] = n;
            } else R[k] = txt;
        }
        if (R.wordOn && !(R.wordMin <= R.wordDes && R.wordDes <= R.wordMax)) return 'Word spacing: min \u2264 desired \u2264 max.';
        if (R.letterOn && !(R.letterMin <= R.letterDes && R.letterDes <= R.letterMax)) return 'Letter spacing: min \u2264 desired \u2264 max.';
        if (R.mojiOn && !R.mojiName) return 'Choose or type a mojikumi set name.';
        for (k in R) S[k] = R[k];
        return '';
    }
    bRun.onClick = function () {
        var err = readDialog();
        if (err) { alert(err); return; }
        w.close(1);
    };
    if (w.show() !== 1) return;
    savePrefs(S);
    var onlySel = rSel.value && nSel > 0;
    var anyNoBreak = S.noBreakOn || S.kinsokuOn;
    var doNoBreakReset = anyNoBreak && S.noBreakReset;
    var anyTracking = S.romanOn || S.hanloOn || S.hyphTightOn;
    var doTrackReset = S.trackReset && anyTracking;

    // ---- character classes ---------------------------------------------------
    // Roman Orthography letters (Latin incl. tone-marked letters, ⁿ, ᴺ; not × or ÷)
    var LO_L = 'A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u024F\\u1E00-\\u1EFF\\u207F\\u1D3A';
    var MARK = '\\u0300-\\u036F';                    // combining tone marks, incl. U+030D and o\u0358
    var HAN = '\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF';
    var HAN_HI = '\\uD840-\\uD88F', LOW = '\\uDC00-\\uDFFF';   // Hanji outside the BMP (Ext. B and later)
    var BRK = '\\u300C-\\u3011\\u3008-\\u300B\\uFF08\\uFF09\\u2018\\u2019\\u201C\\u201D'; // brackets/quotes
    var reLoL = new RegExp('[' + LO_L + ']'), reMark = new RegExp('[' + MARK + ']');
    var reHan = new RegExp('[' + HAN + ']'), reHanHi = new RegExp('[' + HAN_HI + ']'), reLow = new RegExp('[' + LOW + ']');
    // Hanji first: ExtendScript's regex engine misses a Hanji token after "-" in the repeated
    // group when the Roman branch comes first (比--起-來 stopped at 比--起). The branches start
    // with different characters, so the order changes nothing in other engines.
    var TOK = '(?:[' + HAN + BRK + ']|[' + LO_L + MARK + '0-9]+|[' + HAN_HI + '][' + LOW + '])';
    var RE_HYPH = new RegExp(TOK + '(?:-+' + TOK + ')+', 'g');   // a hyphenated Taigi sequence

    // Illustrator's built-in "Hard" kinsoku set, copied once so the script applies the same rules
    // itself (with No Break) in any UI language and whatever kinsoku set the document uses
    var HARD_NO_START = '!),.:;?]}\u00A2\u2014\u2019\u201D\u2030\u2103\u2109\u3001\u3002\u3005\u3009\u300B\u300D\u300F\u3011\u3015\u3041\u3043\u3045\u3047\u3049\u3063\u3083\u3085\u3087\u308E\u309B\u309C\u309D\u309E\u30A1\u30A3\u30A5\u30A7\u30A9\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u30FB\u30FC\u30FD\u30FE\uFF01\uFF05\uFF09\uFF0C\uFF0E\uFF1A\uFF1B\uFF1F\uFF3D\uFF5D';   // cannot start a line
    var HARD_NO_END = '([{\u00A3\u00A7\u2018\u201C\u3008\u300A\u300C\u300E\u3010\u3012\u3014\uFF03\uFF04\uFF08\uFF20\uFF3B\uFF5B\uFFE5';   // cannot end a line
    var HARD_KEEP = '\u2014\u2025\u2026';   // two in a row cannot be split

    // ---- helpers -------------------------------------------------------------
    var stats = { stories: 0, partial: 0, skipped: 0, mismatch: 0, kinsoku: 0, moji: 0, chunks: 0, hanlo: 0, hyph: 0 };
    var canComposer = typeof ComposerEngineType !== 'undefined';
    var stories = doc.stories, nStories = stories.length;
    var targets = [];   // indexes of the stories to work on
    for (var t0 = 0; t0 < nStories; t0++) if (!onlySel || storySelected(stories[t0])) targets.push(t0);
    var errors = {};   // option name -> first error message
    var stepFailed;

    function tryDo(f) { try { f(); return true; } catch (e) { return false; } }
    function step(name, f) {   // run one option; a failure never stops the others
        try { f(); } catch (e) { stepFailed = true; if (!errors[name]) errors[name] = e.message || String(e); }
    }
    function spread(pa, name, lo, hi, min, des, max) {   // set min/desired/max in a safe order
        tryDo(function () { pa['maximum' + name] = hi; });
        tryDo(function () { pa['minimum' + name] = lo; });
        pa['desired' + name] = des; pa['minimum' + name] = min; pa['maximum' + name] = max;
    }
    // true if any frame of the story is locked, hidden or on a locked/hidden layer or group
    function blocked(story) {
        try {
            var tfs = story.textFrames, n = tfs.length;
            for (var i = 0; i < n; i++) {
                var tf = tfs[i];
                if (tf.editable === false || tf.locked || tf.hidden) return true;
                for (var p = tf.parent; p && p.typename === 'GroupItem'; p = p.parent) if (p.locked || p.hidden) return true;
                for (var L = tf.layer; L && L.typename === 'Layer'; L = L.parent) if (L.locked || !L.visible) return true;
            }
        } catch (e) {}
        return false;
    }
    // map each UTF-16 position of the text to an index in range.characters;
    // returns null when the two cannot be matched up safely
    function charMap(text, nChars) {
        var map = [], i, c = 0;
        if (nChars === text.length) { for (i = 0; i < text.length; i++) map.push(i); return map; }
        for (i = 0; i < text.length; i++) {
            var code = text.charCodeAt(i);
            map.push(c);
            if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) { map.push(c); i++; }
            c++;
        }
        return c === nChars ? map : null;
    }
    // write per-character values as runs: one DOM call per run of equal values
    function writeRuns(chars, vals, attr) {
        var n = vals.length, i = 0;
        while (i < n) {
            if (vals[i] === undefined) { i++; continue; }
            var j = i + 1;
            while (j < n && vals[j] === vals[i]) j++;
            var done = false;
            try {
                var r = chars[i];
                r.length = j - i;
                if (r.length === j - i) { r.characterAttributes[attr] = vals[i]; done = true; }
            } catch (e) {}
            if (!done) for (var k = i; k < j; k++) chars[k].characterAttributes[attr] = vals[i];
            i = j;
        }
    }

    // ---- apply ---------------------------------------------------------------
    for (var ti = 0; ti < targets.length; ti++) {
        var s = targets[ti], story = stories[s], range, text;
        try { range = story.textRange; text = range.contents; } catch (e) { stats.skipped++; continue; }
        if (!text) continue;
        if (blocked(story)) { stats.skipped++; continue; }
        stepFailed = false;
        var pa = range.paragraphAttributes, ca = range.characterAttributes;

        // A. line breaking
        if (S.composerOn && canComposer) step('3 Composer', function () {
            pa.composerEngine = ComposerEngineType.optycaComposer;
            pa.everyLineComposer = true;
        });
        if (S.hyphOffOn) step('4 Hyphenation off', function () { pa.hyphenation = false; });
        // B. justification & leading
        if (S.alignOn) step('5 Alignment', function () { pa.justification = Justification[ALIGN_ENUM[S.alignPos]]; });
        if (S.wordOn) step('6 Word spacing', function () { spread(pa, 'WordSpacing', 0, 1000, S.wordMin, S.wordDes, S.wordMax); });
        if (S.letterOn) step('7 Letter spacing', function () { spread(pa, 'LetterSpacing', -100, 500, S.letterMin, S.letterDes, S.letterMax); });
        if (S.leadOn) step('8 Auto leading', function () { ca.autoLeading = true; pa.autoLeadingAmount = S.leadPct; });
        // C. punctuation
        // hanging needs a kinsoku set for its list of marks: use the first built-in set (Hard, in any language)
        if (S.burasagariOn) step('9 Hanging punctuation', function () {
            if (KINSOKU_FIRST) pa.kinsoku = KINSOKU_FIRST;
            pa.burasagariType = BurasagariTypeEnum.Standard;
        });
        if (S.mojiOn) step('10 Mojikumi', function () {
            pa.mojikumi = S.mojiName;
            if (range.paragraphs.length && range.paragraphs[0].paragraphAttributes.mojikumi === S.mojiName) stats.moji++;
        });
        if (S.kernOn) step('11 Kerning', function () { ca.kerningMethod = AutoKernType.AUTO; });

        // character-level options (1, 2, 12, 13, 14 and their resets)
        if (anyNoBreak || anyTracking) {
            var chars = range.characters, map = null;
            try { map = charMap(text, chars.length); } catch (e) {}
            if (!map) { stats.mismatch++; stepFailed = true; }
            else step('1/2/12/13/14 Character-level options', function () {
                var n = text.length, i, m;
                // kind of each UTF-16 unit: H Hanji, L Roman letter, M tone mark, else other
                var kind = [], start = [];   // start = first unit of the cluster this unit belongs to
                for (i = 0; i < n; i++) {
                    var ch = text.charAt(i);
                    if (reHanHi.test(ch) && i + 1 < n && reLow.test(text.charAt(i + 1))) {
                        kind.push('H', 'H'); start.push(i, i); i++; continue;
                    }
                    // ExtendScript reads a ? b : c ? d : e left to right, so chained choices need parentheses
                    kind.push(reHan.test(ch) ? 'H' : (reLoL.test(ch) ? 'L' : (reMark.test(ch) ? 'M' : '')));
                    start.push(kind[i] === 'M' && i > 0 && (kind[i - 1] === 'L' || kind[i - 1] === 'M') ? start[i - 1] : i);
                }
                function base(i) { return kind[start[i]]; }               // H or L for the whole cluster
                function clusterEnd(i) { var e = i; while (e + 1 < n && start[e + 1] === start[i]) e++; return e; }
                function setCluster(arr, i, v) { for (var k = start[i], e = clusterEnd(i); k <= e; k++) arr[k] = v; }

                var nb = [], tr = [];
                // 2: No Break on every hyphenated sequence; 14: tighten its hyphens
                var inSeq = [];
                RE_HYPH.lastIndex = 0;
                while ((m = RE_HYPH.exec(text)) !== null) {
                    for (i = m.index; i < m.index + m[0].length; i++) { if (S.noBreakOn) nb[i] = true; inSeq[i] = true; }
                    if (S.noBreakOn) stats.chunks++;
                }
                // 1: Hard kinsoku rules, by keeping each character with its neighbour
                if (S.kinsokuOn) for (i = 0; i < n; i++) {
                    var c = text.charAt(i), glued = false;
                    if (i > 0 && HARD_NO_START.indexOf(c) >= 0 && !/\s/.test(text.charAt(i - 1))) {
                        setCluster(nb, i - 1, true); nb[i] = true; glued = true;
                    }
                    if (i + 1 < n && HARD_NO_END.indexOf(c) >= 0 && !/\s/.test(text.charAt(i + 1))) {
                        nb[i] = true; setCluster(nb, i + 1, true); glued = true;
                    }
                    if (i + 1 < n && HARD_KEEP.indexOf(c) >= 0 && HARD_KEEP.indexOf(text.charAt(i + 1)) >= 0) {
                        nb[i] = nb[i + 1] = true; glued = true;
                    }
                    if (glued) stats.kinsoku++;
                }
                // 12: Roman letters and their tone marks
                if (S.romanOn) for (i = 0; i < n; i++) if (base(i) === 'L') tr[i] = S.romanTrack;
                // 13: Han-Lo boundary: space after the whole cluster before the boundary
                if (S.hanloOn) for (i = 0; i < n - 1; i++) {
                    if (start[i + 1] === start[i]) continue;               // still inside one cluster
                    var a = base(i), b = base(i + 1);
                    if ((a === 'H' && b === 'L') || (a === 'L' && b === 'H')) { setCluster(tr, i, S.hanloTrack); stats.hanlo++; }
                }
                // 14: only hyphens inside a Taigi sequence
                if (S.hyphTightOn) for (i = 0; i < n; i++) {
                    if (text.charAt(i) !== '-' || !inSeq[i]) continue;
                    if (i > 0 && inSeq[i - 1]) setCluster(tr, i - 1, S.hyphTrack);
                    if (i + 1 < n && inSeq[i + 1]) tr[i] = S.hyphTrack;
                    stats.hyph++;
                }

                // UTF-16 positions -> character indexes (a surrogate pair is one character)
                var NB = [], TR = [], nc = chars.length;
                for (i = 0; i < n; i++) {
                    if (nb[i]) NB[map[i]] = true;
                    if (tr[i] !== undefined) TR[map[i]] = tr[i];
                }
                NB.length = TR.length = nc;
                if (anyNoBreak) {
                    if (doNoBreakReset) ca.noBreak = false;
                    writeRuns(chars, NB, 'noBreak');
                }
                if (anyTracking) {
                    if (doTrackReset) ca.tracking = 0;
                    writeRuns(chars, TR, 'tracking');
                }
            });
        }
        if (stepFailed) stats.partial++; else stats.stories++;
    }

    // ---- E. check ------------------------------------------------------------
    var issues = [];
    var REPORT = new File(Folder.desktop + '/peh-oe-ji-layout-report.txt');
    if (S.checkOn) {
        try { app.redraw(); } catch (e) {}
        var START_BAN = HARD_NO_START, END_BAN = HARD_NO_END;
        var JUSTIFIED = {};
        try {
            JUSTIFIED[Justification.FULLJUSTIFYLASTLINELEFT] = JUSTIFIED[Justification.FULLJUSTIFYLASTLINECENTER] =
            JUSTIFIED[Justification.FULLJUSTIFYLASTLINERIGHT] = JUSTIFIED[Justification.FULLJUSTIFY] = true;
        } catch (e) {}
        var reWide = new RegExp('[' + HAN + '\u3000-\u303F\uFF00-\uFFEF]|[' + HAN_HI + '][' + LOW + ']', 'g');
        var widthOf = function (t) {   // rough width: Hanji and full-width = 1, other = 0.55, marks = 0
            var wide = (t.match(reWide) || []).length;
            var rest = t.replace(reWide, '').replace(/[\u0300-\u036F]/g, '').length;
            return wide + rest * 0.55;
        };
        var clip = function (t, tail) { return t.length <= 16 ? t : (tail ? '\u2026' + t.slice(-16) : t.substring(0, 16) + '\u2026'); };
        for (ti = 0; ti < targets.length; ti++) {
            s = targets[ti];
            var paras;
            try { paras = stories[s].paragraphs; } catch (e) { continue; }
            var info = [], widths = [], lineNo = 0, nParas = paras.length;
            for (var p = 0; p < nParas; p++) {
                var pLines, just = false;
                try { pLines = paras[p].lines; just = !!JUSTIFIED[paras[p].paragraphAttributes.justification]; } catch (e) { continue; }
                var nl = pLines.length;
                for (var j = 0; j < nl; j++) {
                    lineNo++;
                    var t = String(pLines[j].contents).replace(/[\r\n\u0003\s\u3000]+$/, '');
                    var L = { t: t, no: lineNo, w: widthOf(t), loose: just && j < nl - 1 };   // last line of a paragraph is never loose
                    info.push(L);
                    if (L.loose && t) widths.push(L.w);
                }
            }
            widths.sort(function (x, y) { return x - y; });
            var median = widths.length ? widths[Math.floor(widths.length / 2)] : 0;
            for (var q = 0; q < info.length; q++) {
                var I = info[q], where = 'Text ' + (s + 1) + ', line ' + I.no + ': ';
                if (!I.t) continue;
                var first = I.t.charAt(0), last = I.t.charAt(I.t.length - 1);
                if (first === '-') issues.push('starts with "-"   ' + where + clip(I.t));
                if (last === '-') issues.push('ends with "-"     ' + where + clip(I.t, true));
                if (START_BAN.indexOf(first) >= 0) issues.push('starts with ' + first + '      ' + where + clip(I.t));
                if (END_BAN.indexOf(last) >= 0) issues.push('ends with ' + last + '        ' + where + clip(I.t, true));
                if (I.loose && widths.length >= 4 && I.w < median * 0.8) issues.push('possibly loose    ' + where + clip(I.t));
            }
        }
        try {
            if (issues.length) {
                REPORT.encoding = 'UTF-8'; REPORT.lineFeed = 'Unix';
                if (REPORT.open('w')) { REPORT.write(doc.name + ' \u2013 Pe\u030Dh-\u014De-j\u012B Layout Script ' + PEHOEJI_LAYOUT_VERSION + '\n' + issues.join('\n') + '\n'); REPORT.close(); }
            } else if (REPORT.exists) REPORT.remove();   // no stale report from an earlier run
        } catch (e) {}
    }

    // ---- summary -------------------------------------------------------------
    var msg = 'Pe\u030Dh-\u014De-j\u012B Layout Script ' + PEHOEJI_LAYOUT_VERSION +
              (onlySel ? '\n\nSelected text only.\nText blocks processed: ' : '\n\nText blocks processed: ') + stats.stories;
    if (stats.partial) msg += '\nText blocks with an option that failed: ' + stats.partial;
    if (stats.skipped) msg += '\nSkipped (locked or hidden): ' + stats.skipped;
    if (stats.mismatch) msg += '\nCharacter-level options skipped in ' + stats.mismatch +
                               ' text block(s): character count did not match the text.';
    for (var en in errors) msg += '\n  ! ' + en + ': ' + errors[en];
    if (S.kinsokuOn) msg += '\nKinsoku (Hard rules): ' + stats.kinsoku + ' places kept together';
    if (S.mojiOn) msg += '\nMojikumi "' + S.mojiName + '": ' + (stats.moji ? stats.moji + ' text blocks' : 'could NOT be set \u2013 check the name');
    if (S.composerOn && !canComposer) msg += '\nComposer NOT changed: needs Illustrator 2020 or later.';
    if (S.noBreakOn) msg += '\nHyphenated words kept together: ' + stats.chunks;
    if (S.hanloOn) msg += '\nHan\u2013Lo spaces set: ' + stats.hanlo + ' (' + S.hanloTrack + ')';
    if (S.hyphTightOn) msg += '\nHyphens tightened: ' + stats.hyph + ' (' + S.hyphTrack + ')';
    if (S.checkOn) {
        if (!issues.length) msg += '\n\nCheck: no problem lines found.';
        else {
            msg += '\n\nCheck: ' + issues.length + ' line(s) to look at' +
                   ' (full list: Desktop/peh-oe-ji-layout-report.txt)\n' + issues.slice(0, 12).join('\n');
            if (issues.length > 12) msg += '\n\u2026';
        }
    }
    alert(msg);
})();

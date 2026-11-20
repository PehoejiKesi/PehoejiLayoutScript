// Pe̍h-ōe-jī Layout Script (InDesign).jsx — Adobe InDesign script
// Version 0.9.0 · https://pehoejikesi.github.io/PehoejiLayoutScript/
// Made by Tâi-bûn Ke-si Mī · https://linktr.ee/taibunkesimi
//
// Han-Lo (Hanji + Taigi Roman Orthography) layout for the whole document:
// every story, table cell and footnote. A dialog lets you turn each option
// on or off and change its numbers; your last choices are remembered.
// Unticked options leave that setting as it is in the document.
//
//   A. Line breaking   1 kinsoku set · 2 No Break on hyphenated words
//                      (2a clear first) · 3 composer · 4 auto-hyphenation off
//   B. Justification   5 alignment · 6 word spacing · 7 letter spacing · 8 auto leading
//   C. Punctuation     9 hanging punctuation · 10 mojikumi set
//   D. Spacing         11 kerning Metrics (Roman only) · 12 Roman tracking · 13 Han–Lo space
//                      · 14 hyphen tightening (14a reset tracking first)
//   E. Check           15 report problem lines (saved to the Desktop)
//
// The option numbers match the Illustrator script. One Undo reverts the whole run.
// Differences from the Illustrator script: the kinsoku set defaults to Traditional Chinese;
// option 3 chooses a composer (all place tone marks correctly; World-Ready is the default and
// leaves the Han-Lo space to option 13); options 9 and 10 need a CJK composer; the check
// also reports overset text, and the report is saved as peh-oe-ji-layout-report-indesign.txt.
// Running it again is safe; run it again after adding text.
// Run: Window › Utilities › Scripts, then double-click the script.

#target indesign

var PEHOEJI_LAYOUT_VERSION = '0.9.0';   // also in CHANGELOG.md, README.md and index.html

(function () {
    var TEST = $.global.PEHOEJI_TEST || null;   // automated tests pass settings here and skip the dialog
    if (app.documents.length === 0) { if (!TEST) alert('Open the document first.'); return; }
    var doc = app.activeDocument;

    // ---- choices that depend on InDesign ---------------------------------------
    // kinsoku sets built into InDesign (locale-independent); document sets are added after these
    var KINSOKU_BUILTIN = [
        ['Traditional Chinese', 'TRADITIONAL_CHINESE_KINSOKU'],
        ['Hard (Japanese strict)', 'HARD_KINSOKU'],
        ['Soft (Japanese weak)', 'SOFT_KINSOKU'],
        ['Simplified Chinese', 'SIMPLIFIED_CHINESE_KINSOKU'],
        ['Korean', 'KOREAN_KINSOKU']
    ];
    var COMPOSERS = [   // [dialog name, InDesign key string]
        ['World-Ready Paragraph', '$ID/HL Composer Optyca'],
        ['World-Ready Single-line', '$ID/HL Single Optyca'],
        ['CJK Paragraph', '$ID/HL Composer J'],
        ['CJK Single-line', '$ID/HL Single J'],
        ['Adobe Paragraph', '$ID/HL Composer'],
        ['Adobe Single-line', '$ID/HL Single']
    ];
    var MOJIKUMI_BUILTIN = [
        ['Traditional Chinese default', 'TRAD_CHINESE_DEFAULT'],
        ['Simplified Chinese default', 'SIMP_CHINESE_DEFAULT']
    ];
    function listNames(builtin, coll, nBuiltin) {   // dropdown names: built-ins, then the document's own sets
        var r = [], i;
        for (i = 0; i < builtin.length; i++) r.push(builtin[i][0]);
        try { for (i = nBuiltin; i < coll.length; i++) r.push(coll[i].name); } catch (e) {}
        return r;
    }
    var KINSOKU_NAMES = listNames(KINSOKU_BUILTIN, doc.kinsokuTables, 5);      // InDesign has 5 built-in sets
    var MOJIKUMI_NAMES = listNames(MOJIKUMI_BUILTIN, doc.mojikumiTables, 16);  // and 16 built-in mojikumi sets
    var COMPOSER_NAMES = [];
    for (var ci = 0; ci < COMPOSERS.length; ci++) COMPOSER_NAMES.push(COMPOSERS[ci][0]);

    // ---- defaults ------------------------------------------------------------
    var D = {
        kinsokuOn: true,   kinsokuName: 'Traditional Chinese',
        noBreakOn: true,   noBreakReset: true,
        composerOn: true,  composerName: 'World-Ready Paragraph',
        hyphOffOn: true,
        alignOn: true,     alignPos: 3,   // 3 = Justify with last line aligned left (book body text)
        wordOn: true,      wordMin: 80,  wordDes: 150, wordMax: 200,
        letterOn: true,    letterMin: 0, letterDes: 10, letterMax: 50,
        leadOn: true,      leadPct: 133,   // 133% = 16 pt leading on 12 pt type
        burasagariOn: false,
        mojiOn: false,     mojiName: 'Traditional Chinese default',
        kernOn: true,
        romanOn: true,     romanTrack: 5,
        hanloOn: true,     hanloTrack: 100,
        hyphTightOn: true, hyphTrack: -30,
        trackReset: false,
        checkOn: true
    };
    var LISTS = { kinsokuName: KINSOKU_NAMES, composerName: COMPOSER_NAMES, mojiName: MOJIKUMI_NAMES };
    // alignment, in the Paragraph panel's order; alignPos is the position in this list
    var ALIGN_ENUM = ['LEFT_ALIGN', 'CENTER_ALIGN', 'RIGHT_ALIGN', 'LEFT_JUSTIFIED', 'CENTER_JUSTIFIED',
        'RIGHT_JUSTIFIED', 'FULLY_JUSTIFIED'];
    var ALIGN_NAMES = ['Align left', 'Align center', 'Align right', 'Justify with last line aligned left',
        'Justify with last line aligned center', 'Justify with last line aligned right', 'Justify all lines'];
    // alignment icons (20x16 PNG), drawn like the Paragraph panel; light set for dark UI, dark set for light UI
    // (keys are the Illustrator names, in the same order as ALIGN_ENUM)
    var ICON_KEYS = ['LEFT', 'CENTER', 'RIGHT', 'FULLJUSTIFYLASTLINELEFT', 'FULLJUSTIFYLASTLINECENTER',
        'FULLJUSTIFYLASTLINERIGHT', 'FULLJUSTIFY'];
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

    var PREFS = new File(Folder.userData + '/peh-oe-ji-layout-indesign.prefs');

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
            PREFS.encoding = 'UTF-8'; PREFS.lineFeed = 'Unix';
            if (!PREFS.open('w')) return;
            PREFS.write(out.join('\n'));
            PREFS.close();
        } catch (e) {}
    }
    function indexOf(arr, v) { for (var i = 0; i < arr.length; i++) if (arr[i] === v) return i; return -1; }
    function fixChoices(S) {   // a remembered name that no longer exists falls back to the default
        if (!(S.alignPos >= 0 && S.alignPos < ALIGN_NAMES.length && Math.floor(S.alignPos) === S.alignPos)) S.alignPos = D.alignPos;
        for (var k in LISTS) if (indexOf(LISTS[k], S[k]) < 0) S[k] = D[k];
    }

    var S;
    if (TEST) { S = copy(D); for (var tk in TEST.settings) S[tk] = TEST.settings[tk]; fixChoices(S); }
    else {
        S = loadPrefs();
        fixChoices(S);
        if (!showDialog()) return;
        savePrefs(S);
    }

    // ---- dialog --------------------------------------------------------------
    function showDialog() {
        var ctl = {};      // key -> checkbox, edittext or dropdownlist
        var DESC_W = 330;  // description width in pixels

        var DARK_UI = true;
        try { DARK_UI = app.generalPreferences.uiBrightnessPreference <= 0.5; } catch (e) {}
        function grey(t) {   // secondary text, readable on both dark and light InDesign themes
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
                var f = fields[i], e;
                if (f.pre) row.add('statictext', undefined, f.pre);
                if (f.list) { e = row.add('dropdownlist', undefined, f.list); e.preferredSize.width = f.width || 170; }
                else { e = row.add('edittext', undefined, ''); e.characters = f.chars || 4; }
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
            p.preferredSize.width = DESC_W + 40;   // room for the longest title
            return p;
        }
        function fill(V) {   // put values into the controls
            for (var k in ctl) {
                if (ctl[k].type === 'checkbox') ctl[k].value = V[k];
                else if (ctl[k].type === 'align') ctl[k].set(V[k]);
                else if (ctl[k].type === 'dropdownlist') { var ix = indexOf(LISTS[k], V[k]); ctl[k].selection = ix < 0 ? 0 : ix; }
                else ctl[k].text = String(V[k]);
            }
            for (var k2 in ctl) if (ctl[k2].syncFields) ctl[k2].syncFields();
            ctl.noBreakReset.enabled = ctl.noBreakOn.value;
            ctl.alignPos.setEnabled(ctl.alignOn.value);
            syncTrackReset();
        }
        function syncTrackReset() {
            ctl.trackReset.enabled = ctl.romanOn.value || ctl.hanloOn.value || ctl.hyphTightOn.value;
        }

        var w = new Window('dialog', 'Pe\u030Dh-\u014De-j\u012B Layout Script ' + PEHOEJI_LAYOUT_VERSION + ' for InDesign');
        w.orientation = 'column'; w.alignChildren = 'fill';
        var cols = w.add('group'); cols.alignChildren = 'top'; cols.spacing = 10;
        var left = cols.add('group');  left.orientation = 'column';  left.alignChildren = 'fill';
        var right = cols.add('group'); right.orientation = 'column'; right.alignChildren = 'fill';

        var pA = panel(left, 'A. Line breaking');
        option(pA, 'kinsokuOn', '1  Kinsoku set', [{ key: 'kinsokuName', list: KINSOKU_NAMES }],
            'Punctuation such as \uFF0C\u3002\u3001\u300D\uFF09\u2026 cannot start a line, \u300C\uFF08\u3010 cannot end one.');
        option(pA, 'noBreakOn', '2  No Break on hyphenated words', [],
            'Keeps hoe-thi\u00E2u, \u8457--lah, jiok--\u5165-\u4F86 together so "-" never starts or ends a line.');
        option(pA, 'noBreakReset', '2a  First clear No Break from all text', [],
            'Tick if a sentence will not break or spacing looks uneven after editing. Also removes No Break you set by hand.', 22);
        option(pA, 'composerOn', '3  Composer', [{ key: 'composerName', list: COMPOSER_NAMES, width: 190 }],
            'All composers place tone marks (a\u030D, o\u0358, \u01F9) correctly. World-Ready leaves the Han\u2013Lo space to option 13; the CJK composers add their own and are needed for options 9 and 10.');
        option(pA, 'hyphOffOn', '4  Turn auto-hyphenation off', [],
            'Stops InDesign adding its own "-" that looks like a Taigi hyphen.');
        ctl.noBreakOn.onChange2 = function () { ctl.noBreakReset.enabled = ctl.noBreakOn.value; };

        var pB = panel(left, 'B. Justification and leading');   // not "&": InDesign measures a panel title with & too short and cuts it
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
            for (var i = 0; i < ICON_KEYS.length; i++) {
                var b;
                try {
                    b = bar.add('iconbutton', undefined, ScriptUI.newImage(set[ICON_KEYS[i]]), { style: 'toolbutton', toggle: true });
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
            '\u3001\u3002\uFF0C\uFF0E may sit past the right margin for a cleaner edge. Needs a CJK composer (option 3).');
        option(pC, 'mojiOn', '10  Mojikumi set', [{ key: 'mojiName', list: MOJIKUMI_NAMES, width: 210 }],
            'Spacing around CJK punctuation. Needs a CJK composer (option 3); check centred Taiwan punctuation by eye.');

        var pD = panel(right, 'D. Spacing (tracking, 1/1000 em)');
        option(pD, 'kernOn', '11  Kerning: Metrics, Roman only', [],
            'Optical kerning can misjudge letters with tone marks. Hanji spacing is left alone.');
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
            'Lists lines starting or ending with "-", lines starting with \uFF0C\u3002\u3001\u300D\uFF09 or ending with \u300C\uFF08, possibly loose justified lines and overset text. Saved to the Desktop when anything is found.');

        var bg = w.add('group'); bg.alignment = 'fill';
        var bDef = bg.add('button', undefined, 'Defaults');
        var spacer = bg.add('group'); spacer.alignment = 'fill';
        bg.add('button', undefined, 'Cancel', { name: 'cancel' });
        var bRun = bg.add('button', undefined, 'Run', { name: 'ok' });

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
                if (ctl[k].type === 'dropdownlist') { R[k] = ctl[k].selection ? ctl[k].selection.text : D[k]; continue; }
                var txt = String(ctl[k].text).replace(/^\s+|\s+$/g, '');
                if (ctl[k].owner && !ctl[ctl[k].owner].value) { R[k] = S[k]; continue; }   // option off: keep last value
                if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(txt)) return '"' + txt + '" is not a number.';
                var n = parseFloat(txt);
                if (n < NUM[k][0] || n > NUM[k][1]) return n + ' is out of range (' + NUM[k][0] + ' to ' + NUM[k][1] + ').';
                R[k] = n;
            }
            if (R.wordOn && !(R.wordMin <= R.wordDes && R.wordDes <= R.wordMax)) return 'Word spacing: min \u2264 desired \u2264 max.';
            if (R.letterOn && !(R.letterMin <= R.letterDes && R.letterDes <= R.letterMax)) return 'Letter spacing: min \u2264 desired \u2264 max.';
            for (k in R) S[k] = R[k];
            return '';
        }
        bRun.onClick = function () {
            var err = readDialog();
            if (err) { alert(err); return; }
            w.close(1);
        };
        return w.show() === 1;
    }

    // ==== Pe̍h-ōe-jī core: BEGIN (identical in every host script; tools/test-core.js checks it) ====
    // Plain ES3 so it runs in ExtendScript (InDesign) and in Affinity's JavaScript alike.
    // Same rules as the Illustrator script: character classes, the hyphenated-word tokenizer,
    // letter + tone-mark clusters, and the check-report heuristics.
    var PehoejiCore = (function () {
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

        // Per UTF-16 unit of text: nb[i] = true for No Break, tr[i] = tracking (1/1000 em) or undefined.
        // o: { romanOn, romanTrack, hanloOn, hanloTrack, hyphTightOn, hyphTrack }
        function analyze(text, o) {
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

            var r = { nb: [], tr: [], chunks: 0, hanlo: 0, hyph: 0 };
            var nb = r.nb, tr = r.tr, inSeq = [];
            // No Break on every hyphenated sequence (hyphen tightening uses the same sequences)
            RE_HYPH.lastIndex = 0;
            while ((m = RE_HYPH.exec(text)) !== null) {
                for (i = m.index; i < m.index + m[0].length; i++) { nb[i] = true; inSeq[i] = true; }
                r.chunks++;
            }
            // Roman letters and their tone marks
            if (o.romanOn) for (i = 0; i < n; i++) if (base(i) === 'L') tr[i] = o.romanTrack;
            // Han-Lo boundary: space after the whole cluster before the boundary
            if (o.hanloOn) for (i = 0; i < n - 1; i++) {
                if (start[i + 1] === start[i]) continue;               // still inside one cluster
                var a = base(i), b = base(i + 1);
                if ((a === 'H' && b === 'L') || (a === 'L' && b === 'H')) { setCluster(tr, i, o.hanloTrack); r.hanlo++; }
            }
            // hyphens inside a Taigi sequence only
            if (o.hyphTightOn) for (i = 0; i < n; i++) {
                if (text.charAt(i) !== '-' || !inSeq[i]) continue;
                if (i > 0 && inSeq[i - 1]) setCluster(tr, i - 1, o.hyphTrack);
                if (i + 1 < n && inSeq[i + 1]) tr[i] = o.hyphTrack;
                r.hyph++;
            }
            return r;
        }

        // Maximal runs of equal, defined values: [{ begin, end, value }] with end exclusive.
        function runs(vals, n) {
            var out = [], i = 0;
            while (i < n) {
                if (vals[i] === undefined) { i++; continue; }
                var j = i + 1;
                while (j < n && vals[j] === vals[i]) j++;
                out.push({ begin: i, end: j, value: vals[i] });
                i = j;
            }
            return out;
        }

        // ---- check report heuristics ----
        var START_BAN = '\uFF0C\u3002\u3001\u300D\u300F\uFF09\u3011\u300B\u3009\uFF01\uFF1F\uFF1B\uFF1A\u2026\u201D\u2019)]';
        var END_BAN = '\u300C\u300E\uFF08\u3010\u300A\u3008\u201C\u2018([';
        var reWide = new RegExp('[' + HAN + '\u3000-\u303F\uFF00-\uFFEF]|[' + HAN_HI + '][' + LOW + ']', 'g');
        function widthOf(t) {   // rough width: Hanji and full-width = 1, other = 0.55, marks = 0
            var wide = (t.match(reWide) || []).length;
            var rest = t.replace(reWide, '').replace(/[\u0300-\u036F]/g, '').length;
            return wide + rest * 0.55;
        }
        function clip(t, tail) { return t.length <= 16 ? t : (tail ? '\u2026' + t.slice(-16) : t.substring(0, 16) + '\u2026'); }
        function trimLine(t) { return String(t).replace(/[\r\n\u0003\s\u3000]+$/, ''); }
        // lines: [{ t: line text (trimmed), where: 'Page 3, story 2, line 7: ', loose: justified and not a last line }]
        // returns problem lines as text, one per issue
        function checkLines(lines) {
            var issues = [], widths = [], q;
            for (q = 0; q < lines.length; q++) {
                lines[q].w = widthOf(lines[q].t);
                if (lines[q].loose && lines[q].t) widths.push(lines[q].w);
            }
            widths.sort(function (x, y) { return x - y; });
            var median = widths.length ? widths[Math.floor(widths.length / 2)] : 0;
            for (q = 0; q < lines.length; q++) {
                var I = lines[q];
                if (!I.t) continue;
                var first = I.t.charAt(0), last = I.t.charAt(I.t.length - 1);
                if (first === '-') issues.push('starts with "-"   ' + I.where + clip(I.t));
                if (last === '-') issues.push('ends with "-"     ' + I.where + clip(I.t, true));
                if (START_BAN.indexOf(first) >= 0) issues.push('starts with ' + first + '      ' + I.where + clip(I.t));
                if (END_BAN.indexOf(last) >= 0) issues.push('ends with ' + last + '        ' + I.where + clip(I.t, true));
                if (I.loose && widths.length >= 4 && I.w < median * 0.8) issues.push('possibly loose    ' + I.where + clip(I.t));
            }
            return issues;
        }

        return { analyze: analyze, runs: runs, checkLines: checkLines, trimLine: trimLine };
    })();
    // ==== Pe̍h-ōe-jī core: END ====

    // ---- helpers -------------------------------------------------------------
    var doNoBreakReset = S.noBreakOn && S.noBreakReset;
    var anyTracking = S.romanOn || S.hanloOn || S.hyphTightOn;
    var doTrackReset = S.trackReset && anyTracking;
    var stats = { stories: 0, partial: 0, skipped: 0, mismatch: 0, chunks: 0, hanlo: 0, hyph: 0, overset: 0 };
    var errors = {};   // option name -> first error message
    var stepFailed;

    function step(name, f) {   // run one option; a failure never stops the others
        try { f(); } catch (e) { stepFailed = true; if (!errors[name]) errors[name] = e.message || String(e); }
    }
    function tryDo(f) { try { f(); return true; } catch (e) { return false; } }
    function spread(t, name, lo, hi, min, des, max) {   // set min/desired/max in a safe order
        tryDo(function () { t['maximum' + name] = hi; });
        tryDo(function () { t['minimum' + name] = lo; });
        t['desired' + name] = des; t['minimum' + name] = min; t['maximum' + name] = max;
    }
    function pick(builtin, coll, nBuiltin, name) {   // dropdown name -> enum value or the document's own set
        for (var i = 0; i < builtin.length; i++) {
            if (builtin[i][0] !== name) continue;
            return builtin === KINSOKU_BUILTIN ? KinsokuSet[builtin[i][1]] : MojikumiTableDefaults[builtin[i][1]];
        }
        for (i = nBuiltin; i < coll.length; i++) if (coll[i].name === name) return coll[i];
        throw new Error('"' + name + '" is not in this document.');
    }
    function composerKey(name) {
        for (var i = 0; i < COMPOSERS.length; i++) if (COMPOSERS[i][0] === name) return app.translateKeyString(COMPOSERS[i][1]);
        return app.translateKeyString(COMPOSERS[0][1]);
    }
    var STOP = { Spread: 1, MasterSpread: 1, Page: 1, Document: 1, Application: 1 };
    var HOST = { Character: 1, InsertionPoint: 1, Text: 1, Word: 1, Paragraph: 1, Cell: 1 };
    // true if the story is locked (InCopy) or any of its frames is locked, hidden or on a locked/hidden
    // layer or group; an anchored frame or text on a path follows the frame or story that holds it
    function blocked(story, depth) {
        depth = depth || 0;
        if (depth > 8) return false;
        try {
            var ls = story.lockState;
            if (ls === LockStateValues.LOCKED_STORY || ls === LockStateValues.CHECKED_IN_STORY) return true;
        } catch (e) {}
        try {
            var tcs = story.textContainers;
            for (var i = 0; i < tcs.length; i++) {
                for (var p = tcs[i]; p; p = p.parent) {
                    var cn = p.constructor.name;
                    if (STOP[cn]) break;
                    if (HOST[cn]) { try { if (blocked(p.parentStory, depth + 1)) return true; } catch (e0) {} break; }
                    try { if (p.locked) return true; } catch (e1) {}
                    try { if (p.visible === false) return true; } catch (e2) {}
                    try { var L = p.itemLayer; if (L && (L.locked || !L.visible)) return true; } catch (e3) {}
                }
            }
        } catch (e) {}
        return false;
    }
    // map each UTF-16 position of the text to a character index;
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
        var rs = PehoejiCore.runs(vals, vals.length);
        for (var i = 0; i < rs.length; i++) chars.itemByRange(rs[i].begin, rs[i].end - 1)[attr] = rs[i].value;
    }

    // every text to work on: each story, then its table cells and footnotes
    var units = [];   // { t: Text, story: Story, label: 'Story 3' }
    var stories = doc.stories, nStories = stories.length, s, k;
    for (s = 0; s < nStories; s++) {
        var story = stories[s];
        if (blocked(story)) { stats.skipped++; continue; }
        var label = 'Story ' + (s + 1);
        units.push({ t: story.texts[0], story: story, label: label, main: true });
        var tables = [], fns = [];
        try { tables = story.tables; } catch (e) {}
        for (k = 0; k < tables.length; k++) {
            var cells = [];
            try { cells = tables[k].cells; } catch (e) {}
            for (var c = 0; c < cells.length; c++) {   // a graphic cell has no text; skip just that cell
                try { if (cells[c].texts.length) units.push({ t: cells[c].texts[0], story: story, label: label + ', table ' + (k + 1) + ' cell ' + (c + 1) }); } catch (e) {}
            }
        }
        try { fns = story.footnotes; } catch (e) {}
        for (k = 0; k < fns.length; k++) {
            try { units.push({ t: fns[k].texts[0], story: story, label: label + ', footnote ' + (k + 1) }); } catch (e) {}
        }
    }

    // ---- apply ---------------------------------------------------------------
    function applyUnit(u) {
        var t = u.t, text;
        try { text = t.contents; } catch (e) { return; }
        if (!text || typeof text !== 'string') return;
        stepFailed = false;

        // A. line breaking
        if (S.kinsokuOn) step('1 Kinsoku', function () { t.kinsokuSet = pick(KINSOKU_BUILTIN, doc.kinsokuTables, 5, S.kinsokuName); });
        if (S.composerOn) step('3 Composer', function () { t.composer = composerKey(S.composerName); });
        if (S.hyphOffOn) step('4 Hyphenation off', function () { t.hyphenation = false; });
        // B. justification & leading
        if (S.alignOn) step('5 Alignment', function () { t.justification = Justification[ALIGN_ENUM[S.alignPos]]; });
        if (S.wordOn) step('6 Word spacing', function () { spread(t, 'WordSpacing', 0, 1000, S.wordMin, S.wordDes, S.wordMax); });
        if (S.letterOn) step('7 Letter spacing', function () { spread(t, 'LetterSpacing', -100, 500, S.letterMin, S.letterDes, S.letterMax); });
        if (S.leadOn) step('8 Auto leading', function () { t.leading = Leading.AUTO; t.autoLeading = S.leadPct; });
        // C. punctuation
        if (S.burasagariOn) step('9 Hanging punctuation', function () { t.kinsokuHangType = KinsokuHangTypes.KINSOKU_HANG_REGULAR; });
        if (S.mojiOn) step('10 Mojikumi', function () { t.mojikumi = pick(MOJIKUMI_BUILTIN, doc.mojikumiTables, 16, S.mojiName); });
        if (S.kernOn) step('11 Kerning', function () {   // Roman only: Hanji keep their own spacing
            try { t.kerningMethod = app.translateKeyString('$ID/Metrics - Roman Only'); }
            catch (e) { t.kerningMethod = app.translateKeyString('$ID/Metrics'); }
        });

        // character-level options (2, 12, 13, 14 and their resets)
        if (S.noBreakOn || anyTracking) {
            var chars = t.characters, map = null;
            try { map = charMap(text, chars.length); } catch (e) {}
            if (!map) { stats.mismatch++; stepFailed = true; }
            else step('2/12/13/14 Character spacing', function () {
                var r = PehoejiCore.analyze(text, S), n = text.length, i;
                if (S.noBreakOn) stats.chunks += r.chunks;
                stats.hanlo += r.hanlo; stats.hyph += r.hyph;
                // UTF-16 positions -> character indexes (a surrogate pair is one character)
                var NB = [], TR = [], nc = chars.length;
                for (i = 0; i < n; i++) {
                    if (r.nb[i]) NB[map[i]] = true;
                    if (r.tr[i] !== undefined) TR[map[i]] = r.tr[i];
                }
                NB.length = TR.length = nc;
                if (S.noBreakOn) {
                    if (doNoBreakReset) t.noBreak = false;
                    writeRuns(chars, NB, 'noBreak');
                }
                if (anyTracking) {
                    if (doTrackReset) t.tracking = 0;
                    writeRuns(chars, TR, 'tracking');
                }
            });
        }
        if (stepFailed) stats.partial++;
        else if (u.main) stats.stories++;
    }
    function applyAll() { for (var i = 0; i < units.length; i++) applyUnit(units[i]); }

    var redraw = app.scriptPreferences.enableRedraw;
    try {
        app.scriptPreferences.enableRedraw = false;
        app.doScript(applyAll, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, 'Pe\u030Dh-\u014De-j\u012B Layout Script');
    } finally {
        app.scriptPreferences.enableRedraw = redraw;
    }

    // ---- E. check ------------------------------------------------------------
    var issues = [];
    var REPORT_NAME = 'peh-oe-ji-layout-report-indesign.txt';
    var REPORT = new File(Folder.desktop + '/' + REPORT_NAME);
    if (S.checkOn) {
        var JUSTIFIED = {};
        JUSTIFIED[Justification.LEFT_JUSTIFIED] = JUSTIFIED[Justification.CENTER_JUSTIFIED] =
        JUSTIFIED[Justification.RIGHT_JUSTIFIED] = JUSTIFIED[Justification.FULLY_JUSTIFIED] = true;
        for (var q = 0; q < units.length; q++) {
            var u = units[q];
            if (u.main) {
                try { u.story.recompose(); } catch (e) {}
                try { if (u.story.overflows) { issues.push('overset text      ' + u.label); stats.overset++; } } catch (e) {}
            }
            var lines = [], paras;
            try { paras = u.t.paragraphs; } catch (e) { continue; }
            var lineNo = 0, nParas = paras.length;
            for (var p = 0; p < nParas; p++) {
                var pLines, just = false;
                try { pLines = paras[p].lines; just = !!JUSTIFIED[paras[p].justification]; } catch (e) { continue; }
                var nl = pLines.length;
                for (var j = 0; j < nl; j++) {
                    lineNo++;
                    var L = pLines[j], page = '', lc;
                    try { lc = L.contents; } catch (e) { continue; }
                    if (typeof lc !== 'string' || !lc.replace(/[\u0016\uFFFC\uFEFF\r\n]/g, '')) continue;   // only a table or special character
                    try { page = 'Page ' + L.parentTextFrames[0].parentPage.name + ', '; } catch (e) {}
                    lines.push({ t: PehoejiCore.trimLine(lc), where: page + u.label + ', line ' + lineNo + ': ',
                                 loose: just && j < nl - 1 });   // last line of a paragraph is never loose
                }
            }
            var found = PehoejiCore.checkLines(lines);
            for (var f = 0; f < found.length; f++) issues.push(found[f]);
        }
        if (!TEST) try {   // tests never write to the Desktop
            if (issues.length) {
                REPORT.encoding = 'UTF-8'; REPORT.lineFeed = 'Unix';
                if (REPORT.open('w')) { REPORT.write(doc.name + ' \u2013 Pe\u030Dh-\u014De-j\u012B Layout Script ' + PEHOEJI_LAYOUT_VERSION + ' for InDesign\n' + issues.join('\n') + '\n'); REPORT.close(); }
            } else if (REPORT.exists) REPORT.remove();   // no stale report from an earlier run
        } catch (e) {}
    }

    // ---- summary -------------------------------------------------------------
    var msg = 'Pe\u030Dh-\u014De-j\u012B Layout Script ' + PEHOEJI_LAYOUT_VERSION + ' for InDesign\n\nStories processed: ' + stats.stories;
    if (stats.partial) msg += '\nTexts with an option that failed: ' + stats.partial;
    if (stats.skipped) msg += '\nSkipped (locked or hidden): ' + stats.skipped;
    if (stats.mismatch) msg += '\nCharacter-level options skipped in ' + stats.mismatch +
                               ' text(s): character count did not match the text.';
    for (var en in errors) msg += '\n  ! ' + en + ': ' + errors[en];
    if (S.kinsokuOn) msg += '\nKinsoku: ' + S.kinsokuName;
    if (S.composerOn) msg += '\nComposer: ' + S.composerName + ' Composer';
    if (S.noBreakOn) msg += '\nHyphenated words kept together: ' + stats.chunks;
    if (S.hanloOn) msg += '\nHan\u2013Lo spaces set: ' + stats.hanlo + ' (' + S.hanloTrack + ')';
    if (S.hyphTightOn) msg += '\nHyphens tightened: ' + stats.hyph + ' (' + S.hyphTrack + ')';
    if (S.checkOn) {
        if (!issues.length) msg += '\n\nCheck: no problem lines found.';
        else {
            msg += '\n\nCheck: ' + issues.length + ' line(s) to look at' +
                   ' (full list: Desktop/' + REPORT_NAME + ')\n' + issues.slice(0, 12).join('\n');
            if (issues.length > 12) msg += '\n\u2026';
        }
    }
    msg += '\n\nOne Undo reverts the whole run.';
    if (TEST) { $.global.PEHOEJI_RESULT = { msg: msg, stats: stats, issues: issues, errors: errors }; return; }
    alert(msg);
})();

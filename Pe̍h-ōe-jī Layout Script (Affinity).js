// Pe̍h-ōe-jī Layout Script (Affinity).js — Affinity script
// Version 0.9.0 · https://pehoejikesi.github.io/PehoejiLayoutScript/
// Made by Tâi-bûn Ke-si Mī · https://linktr.ee/taibunkesimi
//
// Han-Lo (Hanji + Taigi Roman Orthography) layout for every text object in the
// document: text frames, artistic text, text on a path and tables. A dialog lets you turn each option on or off
// and change its numbers. Unticked options leave that setting as it is.
//
//   A. Line breaking   2 No Break on hyphenated words (2a clear first)
//                      · 4 auto-hyphenation off
//   B. Justification   5 alignment · 6 word spacing · 7 letter spacing · 8 leading
//   D. Spacing         12 Roman tracking · 13 Han–Lo space · 14 hyphen tightening
//                      (14a reset tracking first)
//
// The option numbers match the Illustrator and InDesign scripts. Affinity's scripting
// has nothing for the others: it keeps ，。」 off the start of a line by itself (1),
// shapes tone marks without a composer choice (3), and has no hanging CJK punctuation
// (9), mojikumi (10), optical kerning (11) or access to composed lines for a check
// report (15).
//
// Affinity scripts cannot store settings between runs, so the dialog always opens with
// the defaults below; change them there if you want different ones.
// One Undo reverts the whole run. Running it again is safe; run it again after adding text.
// Install: in Affinity, open the Scripts panel, choose Import Script… from its menu and
// pick this file. Run it from the Scripts panel.

'use strict';

const { Document } = require('/document.js');
const { Dialog, DialogResult } = require('/dialog.js');
const { CompoundCommandBuilder, DocumentCommand } = require('/commands.js');
const { Selection, TextSelection } = require('/selections.js');
const { GlyphType, StoryIoFormat } = require('/story.js');
const { StoryDelta, GlyphAttDoubleType, LeadingOverrideType, ParagraphAttDoubleType, ParagraphAlignXType, ParagraphLeadingType } = require('/storydelta.js');
const { UnitType } = require('/units.js');

const PEHOEJI_LAYOUT_VERSION = '0.9.0';   // also in CHANGELOG.md, README.md and index.html

// ---- defaults: what the dialog shows each time ---------------------------------
const D = {
    noBreakOn: true,   noBreakReset: true,
    hyphOffOn: true,
    alignOn: true,     alignPos: 3,   // 3 = Justify with last line aligned left (book body text)
    wordOn: true,      wordMin: 80,  wordDes: 150, wordMax: 200,     // %
    letterOn: true,    letterMin: 0, letterDes: 10, letterMax: 50,   // %
    leadOn: true,      leadPct: 133,   // % of font size; 133% = 16 pt leading on 12 pt type
    romanOn: true,     romanTrack: 5,      // tracking in 1/1000 em, as in Illustrator and InDesign
    hanloOn: true,     hanloTrack: 100,
    hyphTightOn: true, hyphTrack: -30,
    trackReset: false
};
// alignment, in the Paragraph panel's order; alignPos is the position in this list
const ALIGN_ENUM = ['Left', 'Centre', 'Right', 'JustifyLeft', 'JustifyCentre', 'JustifyRight', 'JustifyAll'];
const ALIGN_NAMES = ['Align left', 'Align center', 'Align right', 'Justify with last line aligned left',
    'Justify with last line aligned center', 'Justify with last line aligned right', 'Justify all lines'];
const NUM = {
    wordMin: [0, 1000], wordDes: [0, 1000], wordMax: [0, 1000],
    letterMin: [-100, 500], letterDes: [-100, 500], letterMax: [-100, 500],
    leadPct: [120, 500], romanTrack: [-1000, 10000], hanloTrack: [-1000, 10000], hyphTrack: [-1000, 10000]
};

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

// ---- dialog --------------------------------------------------------------
function isOk(result) { return (result?.value ?? result) == DialogResult.Ok.value; }

function showDialog() {
    const dlg = Dialog.create('Pe\u030Dh-\u014De-j\u012B Layout Script ' + PEHOEJI_LAYOUT_VERSION + ' for Affinity');
    dlg.initialWidth = 720;
    const ctl = {};          // key -> control
    const owned = {};        // checkbox key -> controls it enables
    const colL = dlg.addColumn(), colR = dlg.addColumn();

    function check(group, key, label, desc) {
        const c = group.addCheckBox(label, D[key]).setIsFullWidth();
        if (desc) c.setDescription(desc);
        ctl[key] = c; owned[key] = [];
        return c;
    }
    function number(group, owner, key, label) {
        const e = group.addUnitValueEditor(label, UnitType.Number, UnitType.Number, D[key], NUM[key][0], NUM[key][1]).setPrecision(0);
        ctl[key] = e; owned[owner].push(e);
        return e;
    }
    function sync() {
        for (const k in owned) for (const e of owned[k]) e.isEnabled = ctl[k].value;
        ctl.noBreakReset.isEnabled = ctl.noBreakOn.value;
        ctl.trackReset.isEnabled = ctl.romanOn.value || ctl.hanloOn.value || ctl.hyphTightOn.value;
    }

    const gA = colL.addGroup('A. Line breaking');
    check(gA, 'noBreakOn', '2  No Break on hyphenated words',
        'Keeps hoe-thi\u00E2u, \u8457--lah, jiok--\u5165-\u4F86 together so "-" never starts or ends a line.');
    check(gA, 'noBreakReset', '    2a  First clear No Break from all text',
        'Tick if a sentence will not break or spacing looks uneven after editing. Also removes No Break you set by hand.');
    check(gA, 'hyphOffOn', '4  Turn auto-hyphenation off', 'Stops Affinity adding its own "-" that looks like a Taigi hyphen.');
    gA.addStaticText(null, 'Affinity keeps \uFF0C\u3002\u3001\u300D\uFF09 off the start of a line by itself.').setIsFullWidth();

    const gB = colL.addGroup('B. Justification & leading');
    check(gB, 'alignOn', '5  Alignment', 'Book body text usually uses "Justify with last line aligned left".');
    ctl.alignPos = gB.addComboBox(null, ALIGN_NAMES, D.alignPos).setIsFullWidth();
    owned.alignOn.push(ctl.alignPos);
    check(gB, 'wordOn', '6  Word spacing (%)', 'How far spaces may shrink or stretch in justified lines.');
    number(gB, 'wordOn', 'wordMin', '    min'); number(gB, 'wordOn', 'wordDes', '    desired'); number(gB, 'wordOn', 'wordMax', '    max');
    check(gB, 'letterOn', '7  Letter spacing (%)', 'Keep small so Roman syllables and Hanji are not pulled apart.');
    number(gB, 'letterOn', 'letterMin', '    min'); number(gB, 'letterOn', 'letterDes', '    desired'); number(gB, 'letterOn', 'letterMax', '    max');
    check(gB, 'leadOn', '8  Leading, % of font size',
        '120% to 500%. 133% = 16 pt leading on 12 pt type. Applies to all text, including headings, and replaces any fixed leading.');
    number(gB, 'leadOn', 'leadPct', '    leading');

    const gD = colR.addGroup('D. Spacing (tracking, 1/1000 em)');
    check(gD, 'romanOn', '12  Roman Orthography tracking', 'Every Roman letter. Try 0 to +10.');
    number(gD, 'romanOn', 'romanTrack', '    tracking');
    check(gD, 'hanloOn', '13  Han\u2013Lo space', 'Where Hanji meets a Roman letter, either way round. +100 = 1/10 em, +125 = 1/8 em.');
    number(gD, 'hanloOn', 'hanloTrack', '    tracking');
    check(gD, 'hyphTightOn', '14  Hyphen tightening', 'Around "-" and "--" inside Taigi words only (not in -5 or ----). Negative = tighter.');
    number(gD, 'hyphTightOn', 'hyphTrack', '    tracking');
    check(gD, 'trackReset', '    14a  First reset all tracking to 0',
        'Fixes text that picked up spacing by typing next to a spaced character. Also removes tracking you set by hand.');

    const gE = colR.addGroup('Not in Affinity');
    gE.addStaticText(null, 'Kinsoku set (1), composer (3), hanging punctuation (9), mojikumi (10), kerning (11) and the check report (15) have no Affinity scripting equivalent. Settings are not remembered between runs.').setIsFullWidth();
    const bDef = gE.addButton('Defaults');

    function fill(V) {
        for (const k in ctl) {
            if (k === 'alignPos') ctl[k].selectedIndex = V[k];
            else ctl[k].value = V[k];
        }
        sync();
    }
    bDef.setOnClickHandler(() => fill(D));
    for (const k in owned) ctl[k].onValueChangedHandler = sync;
    sync();

    while (isOk(dlg.runModal())) {
        const R = {};
        for (const k in ctl) R[k] = k === 'alignPos' ? ctl[k].selectedIndex : ctl[k].value;
        let err = '';
        if (R.wordOn && !(R.wordMin <= R.wordDes && R.wordDes <= R.wordMax)) err = 'Word spacing: min \u2264 desired \u2264 max.';
        else if (R.letterOn && !(R.letterMin <= R.letterDes && R.letterDes <= R.letterMax)) err = 'Letter spacing: min \u2264 desired \u2264 max.';
        if (!err) return R;
        alert(err);
    }
    return null;
}

// ---- apply ---------------------------------------------------------------
function main(testSettings) {
    const doc = Document.current;
    if (!doc) { alert('Open the document first.'); return null; }
    let S;
    if (testSettings) { S = Object.assign({}, D, testSettings); }
    else { S = showDialog(); if (!S) return null; }

    const doNoBreakReset = S.noBreakOn && S.noBreakReset;
    const anyTracking = S.romanOn || S.hanloOn || S.hyphTightOn;
    const doTrackReset = S.trackReset && anyTracking;
    const stats = { stories: 0, skipped: 0, failed: 0, error: '', undoSteps: false, fallback: 0, chunks: 0, hanlo: 0, hyph: 0 };

    // every text object, on normal and master spreads
    const nodes = doc.rootNode.children.all.toArray();
    for (const ms of doc.masterSpreads.toArray()) for (const n of ms.children.all.toArray()) nodes.push(n);
    function blockedNode(n) {   // locked or hidden, itself or any parent layer or group
        for (let p = n; p && !p.isSpreadNode && !p.isDocumentNode; p = p.parent) {
            try { if (p.isLocalEditable === false || !p.isVisible) return true; } catch (e) {}
        }
        return false;
    }
    // group the frames of one story (linked frames share it)
    const groups = new Map();
    for (const n of nodes) {
        if (!n.isTextNode) continue;
        let key = n.nodeId, frames = [n];
        try {
            if (n.storyInterface.isMultiFrameTextFlow) {
                const flow = n.textFrameInterface.textFlowNodes;   // a plain array
                if (flow.length) { frames = flow; key = flow[0].nodeId; }
            }
        } catch (e) {}
        if (!groups.has(key)) groups.set(key, frames);
    }

    // per story: text with one UTF-16 position per story position (a surrogate pair takes two)
    function storyText(story) {
        const len = story.length;
        let text = '';
        try { text = story.getText(0, -1, StoryIoFormat.Newlines); } catch (e) {}
        const map = [];
        let c = 0;
        for (let i = 0; i < text.length && c < len; i++) {
            const code = text.charCodeAt(i);
            map.push(c);
            const low = text.charCodeAt(i + 1);
            if (code >= 0xD800 && code <= 0xDBFF && low >= 0xDC00 && low <= 0xDFFF) { map.push(c); i++; }
            c++;
        }
        let plain = c === len && map.length === text.length;
        for (let p = 0; plain && p < len; p++) if (story.getGlyphType(p).value !== GlyphType.Char.value) plain = false;
        if (plain) return { text, map };
        // something in the story is not plain text (a field, for example): read it glyph by glyph
        stats.fallback++;
        let t = '';
        const m = [];
        for (let p = 0; p < len; p++) {
            const g = story.getGlyph(p);
            const s = g.isCharGlyph ? g.string : '\uFFFC';
            t += s;
            for (let k = 0; k < s.length; k++) m.push(p);
        }
        return { text: t, map: m };
    }

    const perStory = [];   // the format commands of each story
    let cmds = null;
    function format(node, ranges, delta) {
        if (!ranges.length) return;
        const sel = Selection.create(doc, node);
        sel.addSubSelectionForNode(node, TextSelection.create(ranges));
        cmds.push(DocumentCommand.createFormatText(sel, delta));
    }
    function compound(list) {
        const b = CompoundCommandBuilder.create();
        for (const c of list) b.addCommand(c);
        return b.createCommand();
    }

    // paragraph settings, one composite change per frame
    const para = [];
    if (S.hyphOffOn) para.push(StoryDelta.createIsAutoHyphenate(false));
    if (S.alignOn) para.push(StoryDelta.createAlignX(ParagraphAlignXType[ALIGN_ENUM[S.alignPos]]));
    if (S.wordOn) for (const [t, v] of [['MinWordSpacing', S.wordMin], ['DesiredWordSpacing', S.wordDes], ['MaxWordSpacing', S.wordMax]])
        para.push(StoryDelta.createParagraphDouble(ParagraphAttDoubleType[t], v / 100));
    if (S.letterOn) for (const [t, v] of [['MinLetterSpacing', S.letterMin], ['DesiredLetterSpacing', S.letterDes], ['MaxLetterSpacing', S.letterMax]])
        para.push(StoryDelta.createParagraphDouble(ParagraphAttDoubleType[t], v / 100));
    if (S.leadOn) {
        para.push(StoryDelta.createLeadingOverrideType(LeadingOverrideType.None));   // drop fixed leading set on characters
        para.push(StoryDelta.createLeadingType(ParagraphLeadingType.RelativeToHeight));
        para.push(StoryDelta.createParagraphDouble(ParagraphAttDoubleType.RelativeLeading, S.leadPct / 100));
    }

    for (const frames of groups.values()) {
        const head = frames[0];
        const story = head.storyInterface.story;
        const len = story.length;
        if (!len) continue;
        if (frames.some(blockedNode)) { stats.skipped++; continue; }
        // story positions: formatting the first frame reaches every linked frame and overset text
        const all = [{ begin: 0, end: len }];
        cmds = [];
        try {
            if (para.length) format(head, all, StoryDelta.createComposite(para));

            if (S.noBreakOn || anyTracking) {
                const { text, map } = storyText(story);
                const r = PehoejiCore.analyze(text, S);
                if (S.noBreakOn) stats.chunks += r.chunks;
                stats.hanlo += r.hanlo; stats.hyph += r.hyph;
                const NB = [], TR = [];
                for (let i = 0; i < text.length; i++) {
                    if (r.nb[i]) NB[map[i]] = true;
                    if (r.tr[i] !== undefined) TR[map[i]] = r.tr[i];
                }
                if (S.noBreakOn) {
                    if (doNoBreakReset) format(head, all, StoryDelta.createIsNoBreak(false));
                    format(head, PehoejiCore.runs(NB, len), StoryDelta.createIsNoBreak(true));
                }
                if (anyTracking) {
                    if (doTrackReset) format(head, all, StoryDelta.createGlyphDouble(GlyphAttDoubleType.CharacterSpacing, 0));
                    const byValue = new Map();   // one multi-range change per tracking value
                    for (const run of PehoejiCore.runs(TR, len)) {
                        if (!byValue.has(run.value)) byValue.set(run.value, []);
                        byValue.get(run.value).push({ begin: run.begin, end: run.end });
                    }
                    for (const [v, rs] of byValue)   // Affinity tracking is in em; the dialog uses 1/1000 em
                        format(head, rs, StoryDelta.createGlyphDouble(GlyphAttDoubleType.CharacterSpacing, v / 1000));
                }
            }
        } catch (e) { stats.failed++; if (!stats.error) stats.error = e.message || String(e); continue; }
        if (cmds.length) perStory.push(cmds);
        stats.stories++;
    }
    // one undo step for the whole run; if that fails, apply story by story so one bad object cannot block the rest
    if (perStory.length) {
        try { doc.executeCommand(compound([].concat(...perStory))); }
        catch (e) {
            for (const list of perStory) {
                try { doc.executeCommand(compound(list)); }
                catch (e2) { stats.failed++; stats.stories--; if (!stats.error) stats.error = e2.message || String(e2); }
            }
            stats.undoSteps = true;
        }
    }

    // ---- summary -------------------------------------------------------------
    let msg = 'Pe\u030Dh-\u014De-j\u012B Layout Script ' + PEHOEJI_LAYOUT_VERSION + ' for Affinity\n\nStories processed: ' + stats.stories;
    if (stats.skipped) msg += '\nSkipped (locked or hidden): ' + stats.skipped;
    if (stats.failed) msg += '\nText objects that could not be changed: ' + stats.failed + '\n  ! ' + stats.error;
    if (S.noBreakOn) msg += '\nHyphenated words kept together: ' + stats.chunks;
    if (S.hanloOn) msg += '\nHan\u2013Lo spaces set: ' + stats.hanlo + ' (' + S.hanloTrack + ')';
    if (S.hyphTightOn) msg += '\nHyphens tightened: ' + stats.hyph + ' (' + S.hyphTrack + ')';
    msg += stats.undoSteps ? '\n\nUndo reverts this run one text object at a time.' : '\n\nOne Undo reverts the whole run.';
    if (testSettings) return { msg, stats };
    alert(msg);
    return null;
}

if (!globalThis.PEHOEJI_TEST) main();

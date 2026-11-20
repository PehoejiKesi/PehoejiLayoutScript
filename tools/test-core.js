#!/usr/bin/env node
// Checks the shared Pe̍h-ōe-jī core in the InDesign and Affinity scripts:
//   1. the block between the "core: BEGIN" and "core: END" markers is identical in both files;
//   2. it gives the expected No Break and tracking values on known Taigi text;
//   3. it runs over samples/sample-text.txt without errors.
// Run: node tools/test-core.js   (exit code 1 on any failure)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const NAME = 'Pe̍h-ōe-jī Layout Script';
const FILES = [NAME + ' (InDesign).jsx', NAME + ' (Affinity).js'];
let failures = 0;
function fail(msg) { failures++; console.log('FAIL ' + msg); }
function ok(msg) { console.log('ok   ' + msg); }

function coreOf(file) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const a = src.indexOf('// ==== Pe̍h-ōe-jī core: BEGIN');
    const b = src.indexOf('// ==== Pe̍h-ōe-jī core: END');
    if (a < 0 || b < 0) throw new Error(file + ': core markers not found');
    return src.substring(a, b);
}
const cores = FILES.map(coreOf);
if (cores[0] === cores[1]) ok('core block is identical in both scripts');
else fail('core block differs between ' + FILES.join(' and '));

// ExtendScript reads a ? b : c ? d : e left to right; chained choices must be parenthesised
if (/\?[^():;]*:[^():;]*\?/.test(cores[0].replace(/\/\/.*$/gm, ''))) fail('core has an unparenthesised chained ?: (wrong in ExtendScript)');
else ok('no unparenthesised chained ?: in the core');

const ctx = {};
vm.runInNewContext(cores[0] + '\nthis.PehoejiCore = PehoejiCore;', ctx);
const Core = ctx.PehoejiCore;
const O = { romanOn: true, romanTrack: 5, hanloOn: true, hanloTrack: 100, hyphTightOn: true, hyphTrack: -30 };

// text -> 'char:tracking[N]' per UTF-16 unit, surrogate pairs shown once
function show(text, o) {
    const r = Core.analyze(text, o || O), out = [];
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        const ch = code >= 0xD800 && code <= 0xDBFF ? text.substr(i, 2) : text.charAt(i);
        out.push(ch + ':' + (r.tr[i] === undefined ? 0 : r.tr[i]) + (r.nb[i] ? 'N' : ''));
        if (ch.length === 2) {   // both halves of a surrogate pair must agree
            if (r.tr[i] !== r.tr[i + 1] || !r.nb[i] !== !r.nb[i + 1]) out.push('<pair halves differ>');
            i++;
        }
    }
    return out.join(' ');
}
const CASES = [
    // Han-Lo both ways, hyphen tightening on ē and "-", Roman tracking on t à n, Han-Lo on g
    ['伊ē-tàng完', '伊:100 e:-30N ̄:-30N -:-30N t:5N à:5N n:5N g:100N 完:0'],
    // Hanji after "-" in the repeated group (missed by ExtendScript when the Roman branch came first)
    ['比--起-來', '比:-30N -:-30N -:-30N 起:-30N -:-30N 來:0N'],
    ['a-起-來', 'a:-30N -:-30N 起:-30N -:-30N 來:0N'],
    // astral Hanji
    ['𪜶-ê 𪜶kap伊', '𪜶:-30N -:-30N ê:5N  :0 𪜶:100 k:5 a:5 p:100 伊:0'],
    // not Taigi words: no No Break, no tightening
    ['-5 ----', '-:0 5:0  :0 -:0 -:0 -:0 -:0'],
    // tone mark clusters move with their letter
    ['o͘-a̍', 'o:-30N ͘:-30N -:-30N a:5N ̍:5N'],
    ['chhut--lâi', 'c:5N h:5N h:5N u:5N t:-30N -:-30N -:-30N l:5N â:5N i:5N']
];
for (const [text, want] of CASES) {
    const got = show(text);
    if (got === want) ok(JSON.stringify(text));
    else fail(JSON.stringify(text) + '\n     want ' + want + '\n     got  ' + got);
}
// unticked options leave tracking alone
const off = Core.analyze('伊ē-tàng', { romanOn: false, hanloOn: false, hyphTightOn: false });
if (off.tr.every(v => v === undefined) && off.nb.filter(Boolean).length === 7) ok('options off: No Break only, no tracking');
else fail('options off changed tracking');

// runs
const rs = Core.runs([undefined, 5, 5, -30, undefined, 5], 6).map(r => r.begin + '-' + r.end + '=' + r.value).join(',');
if (rs === '1-3=5,3-4=-30,5-6=5') ok('runs'); else fail('runs: ' + rs);

// check report heuristics
const issues = Core.checkLines([
    { t: '-lâi', where: 'L1: ', loose: false }, { t: 'chhut-', where: 'L2: ', loose: false },
    { t: '。第二', where: 'L3: ', loose: false }, { t: '寫「', where: 'L4: ', loose: false }]);
if (issues.length === 4 && /^starts with "-"/.test(issues[0]) && /^ends with "-"/.test(issues[1]) &&
    /^starts with 。/.test(issues[2]) && /^ends with 「/.test(issues[3])) ok('check report finds the four kinds of problem line');
else fail('check report: ' + JSON.stringify(issues));

// sample text (permission-only; read from disk, never copied into tests)
const sample = path.join(ROOT, 'samples', 'sample-text.txt');
if (fs.existsSync(sample)) {
    const text = fs.readFileSync(sample, 'utf8');
    const r = Core.analyze(text, O);
    if (r.chunks > 50 && r.hanlo > 30 && r.hyph > 50) ok('sample text: ' + r.chunks + ' hyphenated words, ' + r.hanlo + ' Han-Lo spaces, ' + r.hyph + ' hyphens');
    else fail('sample text counts look wrong: ' + JSON.stringify({ chunks: r.chunks, hanlo: r.hanlo, hyph: r.hyph }));
}

console.log(failures ? '\n' + failures + ' failure(s)' : '\nall passed');
process.exit(failures ? 1 : 0);

# Changelog

All notable changes to the Pe̍h-ōe-jī Layout Script.
Versions follow [semantic versioning](https://semver.org/): bug fixes raise the
last number, new options the middle one, and changes that alter results for
existing users (such as new defaults) the first one.

## 0.9.0 — 2026-11-20

First public version (beta). Tested against a model of Illustrator's scripting
interface, with the character-level rules also run in ExtendScript, the engine
Illustrator uses; please report anything that behaves differently in Illustrator.

### Line breaking
- No Break on every hyphenated Taigi word in POJ and Han-Lo (`ē-tàng`,
  `chhut--lâi`, `出--來`, `比--起-來`, `3-ê`), so “-” never starts or ends a line. Option 2a first clears No Break
  picked up while typing.
- Kinsoku for punctuation: the script carries a copy of Illustrator's built-in
  *Hard* set and applies it with No Break, so it works in any UI language and
  whatever kinsoku set the document uses. Option 10 lists the document's
  mojikumi sets. Hanging punctuation (option 9) also sets the built-in Hard set,
  which it needs.
- Middle Eastern & South Asian Every-line Composer, so combining tone marks such
  as a̍ and o͘ are placed correctly.
- Illustrator's auto-hyphenation turned off.

### Justification and leading
- Alignment chosen with icons like the Paragraph panel (default: justify with
  last line aligned left).
- Word spacing (80 / 150 / 200%) and letter spacing (0 / 10 / 50%).
- Auto leading, 120–500% (default 133%).

### Punctuation
- Optional hanging punctuation (Burasagari) and mojikumi set.

### Spacing
- Kerning set to Auto (metrics).
- Roman Orthography tracking (+5), Han–Lo space (+100) and hyphen tightening
  (−30), applied to whole letter-plus-tone-mark clusters and only inside Taigi
  words. Hanji outside the basic character set (such as 𪜶) are supported.
- Option 14a resets tracking first.

### Check report
- Lists lines that start or end with “-”, start with ，。」, end with 「（, or look
  loose in justified text; saved to the Desktop when anything is found.

### Other
- Run on the whole document or on selected text only: select text frames, a
  group or text with the Type tool first, and the dialog offers both.
- Dialog remembers your settings; **Defaults** restores them.
- Text that is locked or hidden, or on a locked or hidden layer or group, is
  skipped and counted in the summary.

### InDesign and Affinity
- **`Pe̍h-ōe-jī Layout Script (InDesign).jsx`** for Adobe InDesign (tested with
  InDesign 2025): all 15 options with the same numbers and dialog. Kinsoku set
  (default: Traditional Chinese), composer (default: World-Ready Paragraph
  Composer) and mojikumi set are chosen from lists. Works on every story, table
  cell and footnote; kerning is Metrics, Roman only; the check report also lists
  overset text. One Undo reverts the whole run.
- **`Pe̍h-ōe-jī Layout Script (Affinity).js`** for Affinity (tested with 3.3.3):
  options 2, 2a, 4–8, 12–14 and 14a on text frames (linked frames and overset
  text included), artistic text, text on a path and tables. One Undo reverts the
  whole run. Affinity's scripting has nothing for options 1, 3, 9–11 and 15, and
  cannot store settings, so the dialog opens with the defaults at the top of the
  script.
- `tools/test-core.js` checks that the Taigi rules shared by both scripts are
  identical and give the expected spacing.

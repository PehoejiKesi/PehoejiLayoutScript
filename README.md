# Pe̍h-ōe-jī Layout Script

**Version 0.9.0 (beta)** · [Changelog](CHANGELOG.md) · Made by [Tâi-bûn Ke-si Mī](https://linktr.ee/taibunkesimi)

An Adobe Illustrator script for Taigi text in POJ and Han-Lo (Hanji mixed with Roman Orthography),
now also for [Adobe InDesign and Affinity](#indesign-and-affinity). One run sets up the whole document:

- **No “-” at the start or end of a line.** Every hyphenated word (`ē-tàng`, `chhut--lâi`, `出--來`, `比--起-來`) gets Illustrator's *No Break*.
- **Kinsoku for punctuation:** the script carries a copy of Illustrator's *Hard* set and applies it with No Break,
  so it works in any language and whatever kinsoku set the document uses. Illustrator's own hyphenation is turned off.
- **Tone marks in place** with the Middle Eastern & South Asian Every-line Composer.
- **Han–Lo spacing, hyphen tightening and Roman Orthography tracking**, applied character by character.
- **Alignment, word and letter spacing, auto leading.**
- **A check report** listing any line that still starts or ends with “-”, starts with ，。」, or looks loose.

A dialog lets you turn each option on or off and change its numbers; your choices are remembered.
Run it on the whole document, or select text frames first to change only those.

**Product page:** https://pehoejikesi.github.io/PehoejiLayoutScript/ ([中文](https://pehoejikesi.github.io/PehoejiLayoutScript/zh/))

## Install

1. Download [`Pe̍h-ōe-jī Layout Script.jsx`](https://raw.githubusercontent.com/PehoejiKesi/PehoejiLayoutScript/main/Pe%CC%8Dh-%C5%8De-j%C4%AB%20Layout%20Script.jsx) (or use the download button on the product page). The same file works on macOS and Windows.
2. To run it once, choose **File › Scripts › Other Script…** in Illustrator (⌘F12 on macOS, Ctrl+F12 on Windows) and pick the file.
3. To add it to the **File › Scripts** menu, copy it into Illustrator's Scripts folder and restart Illustrator.
   The folder belongs to the system, so copying asks for your password or administrator permission.

### macOS

In Finder, open **Applications › Adobe Illustrator 2026 › Presets › en_US › Scripts**, drag the file in,
click **Authenticate** and enter your password. Or in Terminal:

```bash
sudo cp ~/Downloads/*Layout\ Script.jsx "/Applications/Adobe Illustrator 2026/Presets.localized/en_US/Scripts/"
```

### Windows

In File Explorer, open `C:\Program Files\Adobe\Adobe Illustrator 2026\Presets\en_US\Scripts`, copy the file in,
and click **Continue** when Windows asks for administrator permission. Or in PowerShell opened with
**Run as administrator**:

```powershell
Copy-Item "$env:USERPROFILE\Downloads\*Layout Script.jsx" "C:\Program Files\Adobe\Adobe Illustrator 2026\Presets\en_US\Scripts\"
```

Change `2026` to your Illustrator version and `en_US` to your language folder (for example `zh_TW`).

Made for Adobe Illustrator 2020 or later (the composer option needs 2020+).

Save a copy of your document before the first run; undo can take several steps.
Text that is locked or hidden, or on a locked or hidden layer or group, is skipped.

**You still need a font that supports POJ.** The script fixes the layout, not the letters:
choose a font that has every POJ character, such as a̍, o͘ and ⁿ, or some words will show
boxes or misplaced tone marks.

## InDesign and Affinity

The same Taigi rules, with the same option numbers, in two more scripts. Each is one file.

| | InDesign | Affinity |
|---|---|---|
| File | [`Pe̍h-ōe-jī Layout Script (InDesign).jsx`](https://raw.githubusercontent.com/PehoejiKesi/PehoejiLayoutScript/main/Pe%CC%8Dh-%C5%8De-j%C4%AB%20Layout%20Script%20(InDesign).jsx) | [`Pe̍h-ōe-jī Layout Script (Affinity).js`](https://raw.githubusercontent.com/PehoejiKesi/PehoejiLayoutScript/main/Pe%CC%8Dh-%C5%8De-j%C4%AB%20Layout%20Script%20(Affinity).js) |
| Tested with | InDesign 2025 (20.5) | Affinity 3.3.3 |
| Options | all 15 | 2, 2a, 4–8, 12–14, 14a |
| Text covered | stories, table cells, footnotes | text frames (linked frames and overset text included), artistic text, text on a path, tables |
| Undo | one step | one step |
| Settings remembered | yes | no: edit the defaults at the top of the script |

**InDesign:** open **Window › Utilities › Scripts**, right-click the **User** folder, choose **Reveal in Finder**
(Windows: **Reveal in Explorer**), copy the file into the **Scripts Panel** folder, then double-click the script
in the panel. Kinsoku set, composer and mojikumi set are chosen from lists. All composers place tone marks
correctly; the default World-Ready Paragraph Composer leaves the Han–Lo space to option 13, while the CJK
composers add their own and are needed for hanging punctuation and mojikumi (options 9 and 10). The check
report also lists overset text and is saved as `peh-oe-ji-layout-report-indesign.txt`.

**Affinity:** open the **Scripts** panel, choose **Import Script…** from its menu and pick the file; run it from
the panel. Affinity keeps ，。」 off the start of a line by itself. Its scripting has no setting for a composer,
hanging punctuation, mojikumi or optical kerning and cannot read where lines break, so options 1, 3, 9–11 and
15 are not offered.

`node tools/test-core.js` checks that the Taigi rules shared by the InDesign and Affinity scripts are identical
in both files and give the expected spacing on known text.

## Product page

`index.html` (English) and `zh/index.html` (Chinese) are the GitHub Pages site; they share
`site.css` and `site.js`. Their web fonts in `fonts/` are subsets of
GenKiMin2 TW and GenKiGothic2 TW (SIL Open Font License 1.1, see `fonts/OFL.txt`).
After changing the page text, rebuild them with `python3 tools/subset-fonts.py`.

## Sample text copyright

The Taigi sample text in `samples/sample-text.txt` and on the product page
(`index.html`, `zh/index.html`) is © Tân Lûi (陳雷). It is used only under permission given to
Tá-káu Tâi-gí-bûn Chhiok-chìn Hia̍p-hōe (打狗台語文促進協會) and is not free to reuse.
**If you fork this repository, remove the sample text** from `samples/`,
`index.html` and `zh/index.html`.

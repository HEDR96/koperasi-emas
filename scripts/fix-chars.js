// Fix double-encoded mojibake in all TS/TSX source files.
//
// Cause: original UTF-8 bytes were once mis-decoded as Windows-1252 and then
// re-saved as UTF-8 (e.g. em-dash "—" -> "â€"", middle dot "·" -> "Â·").
//
// Reverse: for each maximal run of consecutive non-ASCII characters, encode it
// back to its cp1252 byte sequence and decode those bytes as UTF-8. If the run
// is genuine mojibake it round-trips to the intended character; if it is already
// a correct standalone character (e.g. a real "—") the cp1252 bytes are not
// valid UTF-8, so we detect that and leave the run untouched.

const fs = require('fs');
const path = require('path');

// Windows-1252 0x80-0x9F special codepoints -> byte
const CP1252 = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

function toCp1252Byte(cp) {
  if (cp >= 0x00 && cp <= 0xff && !(cp >= 0x80 && cp <= 0x9f)) return cp; // latin-1 region
  if (cp in CP1252) return CP1252[cp];
  return -1; // not representable in cp1252 -> not mojibake
}

// Decode bytes as strict UTF-8. Returns null if invalid.
function strictUtf8(bytes) {
  try {
    const dec = new TextDecoder('utf-8', { fatal: true });
    return dec.decode(Uint8Array.from(bytes));
  } catch {
    return null;
  }
}

function fixString(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const cp = s.codePointAt(i);
    if (cp < 0x80) { out += s[i]; i += 1; continue; }

    // collect a maximal run of non-ASCII chars that are cp1252-representable
    let run = '';
    const bytes = [];
    let j = i;
    let ok = true;
    while (j < s.length) {
      const c = s.codePointAt(j);
      if (c < 0x80) break;
      const b = toCp1252Byte(c);
      if (b < 0) { ok = false; break; }
      bytes.push(b);
      run += String.fromCodePoint(c);
      j += c > 0xffff ? 2 : 1;
    }

    if (run.length === 0) { out += s[i]; i += 1; continue; }

    const decoded = ok ? strictUtf8(bytes) : null;
    // Only accept if it produced a different, valid string (genuine mojibake).
    out += decoded !== null && decoded !== run ? decoded : run;
    i = j;
  }
  return out;
}

function fixFile(fp) {
  const orig = fs.readFileSync(fp, 'utf8');
  const fixed = fixString(orig);
  if (fixed !== orig) {
    fs.writeFileSync(fp, fixed, 'utf8');
    return true;
  }
  return false;
}

function walk(dir, files) {
  fs.readdirSync(dir).forEach((f) => {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(f)) walk(fp, files);
    } else if (stat.isFile() && (f.endsWith('.tsx') || f.endsWith('.ts'))) {
      files.push(fp);
    }
  });
}

const srcDir = path.join(__dirname, '..', 'src');
const files = [];
walk(srcDir, files);

let fixed = 0;
files.forEach((fp) => {
  if (fixFile(fp)) {
    fixed++;
    console.log('Fixed:', path.relative(path.join(__dirname, '..'), fp));
  }
});
console.log('\nTotal:', fixed, 'files fixed');

// Власний парсер аудіо-тегів. Без зовнішніх залежностей — усе на TS,
// працює лише з буфером у памʼяті (ідеально для serverless/Bun).
// Підтримка: MP3 (ID3v2.2/2.3/2.4), MP4/M4A (iTunes ilst), FLAC, OGG (Vorbis/Opus).

export interface AudioTags {
  title: string | null;
  artist: string | null;
  album: string | null;
  genre: string | null;
  year: number | null;
  duration_ms: number | null;
  bitrate: number | null;
  sample_rate: number | null;
  has_cover: boolean;
  cover_mime: string | null;
}

export interface Picture {
  data: Uint8Array;
  mime: string;
}

export interface ParsedAudio {
  tags: AudioTags;
  picture: Picture | null;
}

function emptyTags(): AudioTags {
  return {
    title: null,
    artist: null,
    album: null,
    genre: null,
    year: null,
    duration_ms: null,
    bitrate: null,
    sample_rate: null,
    has_cover: false,
    cover_mime: null,
  };
}

// ------------------------------------------------------------------ утиліти

const decoderLatin1 = new TextDecoder("latin1");
const decoderUtf8 = new TextDecoder("utf-8");

const u16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const u32 = (b: Uint8Array, o: number) =>
  ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const u32le = (b: Uint8Array, o: number) =>
  (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const u64 = (b: Uint8Array, o: number) => u32(b, o) * 0x100000000 + u32(b, o + 4);

function ascii(b: Uint8Array, o: number, len: number): string {
  let s = "";
  for (let i = 0; i < len && o + i < b.length; i++) s += String.fromCharCode(b[o + i]);
  return s;
}

function decodeUtf16(bytes: Uint8Array, little: boolean): string {
  let s = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    s += String.fromCharCode(
      little ? bytes[i] | (bytes[i + 1] << 8) : (bytes[i] << 8) | bytes[i + 1],
    );
  }
  return s;
}

function decodeText(bytes: Uint8Array, enc: number): string {
  if (bytes.length === 0) return "";
  if (enc === 0) return decoderLatin1.decode(bytes);
  if (enc === 1) {
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe)
      return decodeUtf16(bytes.subarray(2), true);
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff)
      return decodeUtf16(bytes.subarray(2), false);
    return decodeUtf16(bytes, true);
  }
  if (enc === 2) return decodeUtf16(bytes, false);
  return decoderUtf8.decode(bytes);
}

/** Знайти рядок з нульовим термінатором, враховуючи кодування. */
function readTerminated(
  b: Uint8Array,
  start: number,
  enc: number,
): { text: string; end: number } {
  const wide = enc === 1 || enc === 2;
  let i = start;
  if (wide) {
    while (i + 1 < b.length && !(b[i] === 0 && b[i + 1] === 0)) i += 2;
    const text = decodeText(b.subarray(start, i), enc);
    return { text, end: Math.min(i + 2, b.length) };
  }
  while (i < b.length && b[i] !== 0) i++;
  const text = decodeText(b.subarray(start, i), enc);
  return { text, end: Math.min(i + 1, b.length) };
}

function clean(s: string): string {
  return s.replace(/\u0000/g, "").replace(/^\uFEFF/, "").trim();
}

// Теги часто містять нестандартні MIME: "image/jpg", "JPG", "PNG".
function normalizeMime(m: string): string {
  const s = clean(m).toLowerCase();
  if (!s) return "image/jpeg";
  if (s === "image/jpg" || s === "jpg" || s === "jpeg") return "image/jpeg";
  if (s === "png") return "image/png";
  return s;
}

function yearFrom(s: string): number | null {
  const m = s.match(/\d{4}/);
  if (!m) return null;
  const y = Number(m[0]);
  return Number.isFinite(y) ? y : null;
}

const ID3_GENRES = [
  "Blues", "Classic Rock", "Country", "Dance", "Disco", "Funk", "Grunge",
  "Hip-Hop", "Jazz", "Metal", "New Age", "Oldies", "Other", "Pop", "R&B",
  "Rap", "Reggae", "Rock", "Techno", "Industrial", "Alternative", "Ska",
  "Death Metal", "Pranks", "Soundtrack", "Euro-Techno", "Ambient",
  "Trip-Hop", "Vocal", "Jazz+Funk", "Fusion", "Trance", "Classical",
  "Instrumental", "Acid", "House", "Game", "Sound Clip", "Gospel", "Noise",
  "Alternative Rock", "Bass", "Soul", "Punk", "Space", "Meditative",
  "Instrumental Pop", "Instrumental Rock", "Ethnic", "Gothic", "Darkwave",
  "Techno-Industrial", "Electronic", "Pop-Folk", "Eurodance", "Dream",
  "Southern Rock", "Comedy", "Cult", "Gangsta", "Top 40", "Christian Rap",
  "Pop/Funk", "Jungle", "Native US", "Cabaret", "New Wave", "Psychedelic",
  "Rave", "Showtunes", "Trailer", "Lo-Fi", "Tribal", "Acid Punk",
  "Acid Jazz", "Polka", "Retro", "Musical", "Rock & Roll", "Hard Rock",
  "Folk", "Folk-Rock", "National Folk", "Swing", "Fast Fusion", "Bebob",
  "Latin", "Revival", "Celtic", "Bluegrass", "Avantgarde", "Gothic Rock",
  "Progressive Rock", "Psychedelic Rock", "Symphonic Rock", "Slow Rock",
  "Big Band", "Chorus", "Easy Listening", "Acoustic", "Humour", "Speech",
  "Chanson", "Opera", "Chamber Music", "Sonata", "Symphony", "Booty Bass",
  "Primus", "Porn Groove", "Satire", "Slow Jam", "Club", "Tango", "Samba",
  "Folklore", "Ballad", "Power Ballad", "Rhythmic Soul", "Freestyle",
  "Duet", "Punk Rock", "Drum Solo", "A cappella", "Euro-House", "Dance Hall",
];

function genreFrom(raw: string): string | null {
  let s = clean(raw);
  if (!s) return null;
  // TCON часто містить числовий id жанру, інколи у дужках: "(17)" або "17"
  const m = s.match(/^\(?(\d{1,3})\)?$/);
  if (m) {
    const idx = Number(m[1]);
    return ID3_GENRES[idx] ?? s;
  }
  // "Dance|Pop" — залишаємо перший
  s = s.split("|")[0];
  // "(3)Dance" / "(3) Dance" — числовий id + текст. Беремо текст, якщо він є,
  // інакше розшифровуємо id (не дублюємо назву: було "DanceDance").
  const m2 = s.match(/^\((\d+)\)\s*(.*)$/);
  if (m2) {
    const rest = clean(m2[2]);
    return rest || ID3_GENRES[Number(m2[1])] || null;
  }
  return clean(s) || null;
}

function deUnsync(b: Uint8Array): Uint8Array {
  const out = new Uint8Array(b.length);
  let n = 0;
  for (let i = 0; i < b.length; i++) {
    out[n++] = b[i];
    if (b[i] === 0xff && b[i + 1] === 0x00) i++;
  }
  return out.subarray(0, n);
}

// ------------------------------------------------------------------ ID3v2 (MP3)

interface Mp3Header {
  version: 1 | 2 | 25; // MPEG 1, 2, 2.5
  layer: number;
  bitrate: number;
  sampleRate: number;
  channelMode: number;
  hasCrc: boolean;
}

const BITRATES: Record<string, number[]> = {
  "1-1": [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  "1-2": [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  "1-3": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  "2-1": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  "2-2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  "2-3": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};

const SAMPLE_RATES: Record<string, number[]> = {
  "1": [44100, 48000, 32000],
  "2": [22050, 24000, 16000],
  "25": [11025, 12000, 8000],
};

function parseMpegHeader(b: Uint8Array, o: number): Mp3Header | null {
  if (o + 4 > b.length) return null;
  if (b[o] !== 0xff || (b[o + 1] & 0xe0) !== 0xe0) return null;
  const verBits = (b[o + 1] >> 3) & 0x03;
  const layerBits = (b[o + 1] >> 1) & 0x03;
  if (verBits === 1 || layerBits === 0) return null;
  const version: 1 | 2 | 25 = verBits === 3 ? 1 : verBits === 2 ? 2 : 25;
  const layer = 4 - layerBits; // 1..3
  const brIdx = (b[o + 2] >> 4) & 0x0f;
  const srIdx = (b[o + 2] >> 2) & 0x03;
  if (brIdx === 0 || brIdx === 15 || srIdx === 3) return null;
  const verKey = version === 1 ? "1" : "2";
  const table = BITRATES[`${verKey}-${layer}`];
  const bitrate = table?.[brIdx];
  const sampleRate = SAMPLE_RATES[String(version)]?.[srIdx];
  if (!bitrate || !sampleRate) return null;
  return {
    version,
    layer,
    bitrate: bitrate * 1000,
    sampleRate,
    channelMode: (b[o + 3] >> 6) & 0x03,
    hasCrc: (b[o + 1] & 0x01) === 0,
  };
}

function mp3AudioInfo(
  b: Uint8Array,
  start: number,
  fileSize: number | null,
  tags: AudioTags,
) {
  let frameStart = -1;
  let header: Mp3Header | null = null;
  for (let i = start; i + 4 <= b.length && i < start + 512 * 1024; i++) {
    const h = parseMpegHeader(b, i);
    if (h) {
      frameStart = i;
      header = h;
      break;
    }
  }
  if (!header) return;
  tags.bitrate = header.bitrate;
  tags.sample_rate = header.sampleRate;

  // Xing / Info / VBRI — точна кількість кадрів => точна тривалість
  const sideInfo =
    header.version === 1
      ? header.channelMode === 3
        ? 17
        : 32
      : header.channelMode === 3
        ? 9
        : 17;
  const crc = header.hasCrc ? 2 : 0;
  const xingPos = frameStart + 4 + crc + sideInfo;
  const frames = readXingFrames(b, xingPos, frameStart);
  if (frames && frames > 0) {
    const spf = header.version === 1 ? 1152 : 576;
    tags.duration_ms = Math.round((frames * spf * 1000) / header.sampleRate);
    return;
  }
  // CBR-оцінка
  if (fileSize && fileSize > start) {
    tags.duration_ms = Math.round(((fileSize - start) * 8 * 1000) / header.bitrate);
  }
}

function readXingFrames(
  b: Uint8Array,
  xingPos: number,
  frameStart: number,
): number | null {
  if (xingPos + 12 <= b.length) {
    const tag = ascii(b, xingPos, 4);
    if (tag === "Xing" || tag === "Info") {
      const flags = u32(b, xingPos + 4);
      if (flags & 0x01) return u32(b, xingPos + 8);
    }
  }
  // VBRI — завжди на відступі 32 байти після заголовка кадру
  const vbri = frameStart + 4 + 32;
  if (vbri + 26 <= b.length && ascii(b, vbri, 4) === "VBRI") {
    return u32(b, vbri + 14);
  }
  return null;
}

function apicPicture(data: Uint8Array, isV22: boolean): Picture | null {
  if (data.length < 4) return null;
  const enc = data[0];
  if (isV22) {
    if (data.length < 6) return null;
    const fmt = ascii(data, 1, 3).toUpperCase();
    const mime = fmt === "PNG" ? "image/png" : "image/jpeg";
    const { end } = readTerminated(data, 5, enc);
    return { data: data.subarray(end), mime };
  }
  const mimeEnd = (() => {
    let i = 1;
    while (i < data.length && data[i] !== 0) i++;
    return i;
  })();
  const mime = decodeText(data.subarray(1, mimeEnd), 0) || "image/jpeg";
  const { end } = readTerminated(data, Math.min(mimeEnd + 2, data.length), enc);
  return { data: data.subarray(end), mime: normalizeMime(mime) };
}

function parseId3(
  b: Uint8Array,
  tags: AudioTags,
): { picture: Picture | null; audioStart: number } {
  let picture: Picture | null = null;
  if (!(b.length >= 10 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33)) {
    return { picture, audioStart: 0 };
  }
  const major = b[3];
  const flags = b[5];
  const size =
    ((b[6] & 0x7f) << 21) |
    ((b[7] & 0x7f) << 14) |
    ((b[8] & 0x7f) << 7) |
    (b[9] & 0x7f);
  const audioStart = 10 + size;
  let body = b.subarray(10, Math.min(audioStart, b.length));
  if (flags & 0x80) body = deUnsync(body);

  const isV22 = major === 2;
  const headerLen = isV22 ? 6 : 10;
  const idLen = isV22 ? 3 : 4;
  let pos = 0;
  if (!isV22 && flags & 0x40) {
    // extended header — трапляється рідко
    pos = major === 4 ? (((body[0] & 0x7f) << 21) | ((body[1] & 0x7f) << 14) | ((body[2] & 0x7f) << 7) | (body[3] & 0x7f)) : 4 + u32(body, 0);
  }

  while (pos + headerLen <= body.length) {
    const id = ascii(body, pos, idLen);
    if (!/^[A-Z0-9]+$/.test(id)) break;
    let fsize: number;
    if (isV22) fsize = (body[pos + 3] << 16) | (body[pos + 4] << 8) | body[pos + 5];
    else if (major === 4)
      fsize =
        ((body[pos + 4] & 0x7f) << 21) |
        ((body[pos + 5] & 0x7f) << 14) |
        ((body[pos + 6] & 0x7f) << 7) |
        (body[pos + 7] & 0x7f);
    else fsize = u32(body, pos + 4);
    if (fsize <= 0 || pos + headerLen + fsize > body.length) break;

    const fflags = isV22 ? 0 : u16(body, pos + 8);
    let fdata = body.subarray(pos + headerLen, pos + headerLen + fsize);
    pos += headerLen + fsize;

    if (!isV22) {
      const bad = major === 4 ? fflags & 0x000c : fflags & 0x00c0;
      if (bad) continue; // стиснутий/зашифрований кадр
      if (major === 4 && fflags & 0x0002) fdata = deUnsync(fdata);
      if (major === 4 && fflags & 0x0001) fdata = fdata.subarray(4);
    }
    if (fdata.length < 1) continue;

    const enc = fdata[0];
    if (id === "APIC" || id === "PIC") {
      if (!picture) picture = apicPicture(fdata, isV22);
      continue;
    }
    if (id[0] !== "T") continue;

    const text = clean(decodeText(fdata.subarray(1), enc));
    if (!text) continue;
    switch (id) {
      case "TIT2": case "TT2": case "TIT1": case "TT1":
        if (!tags.title) tags.title = text;
        break;
      case "TPE1": case "TP1": case "TPE2": case "TP2":
        if (!tags.artist) tags.artist = text;
        break;
      case "TALB": case "TAL":
        if (!tags.album) tags.album = text;
        break;
      case "TCON": case "TCO":
        if (!tags.genre) tags.genre = genreFrom(text);
        break;
      case "TYER": case "TYE": case "TDRC": case "TDRL": case "TORY": case "TDOR":
        if (tags.year === null) tags.year = yearFrom(text);
        break;
    }
  }
  return { picture, audioStart };
}

// ------------------------------------------------------------------ MP4 / M4A

function parseMp4(
  b: Uint8Array,
  tags: AudioTags,
): { picture: Picture | null; audioStart: number } {
  let picture: Picture | null = null;
  let durationSec: number | null = null;

  const applyIlst = (type: string, dataType: number, payload: Uint8Array) => {
    if (type === "covr") {
      if (!picture && payload.length) {
        picture = { data: payload, mime: dataType === 14 ? "image/png" : "image/jpeg" };
      }
      return;
    }
    if (type === "trkn" || type === "disk") return;
    const isText = dataType === 1 || dataType === 0;
    const text = isText ? clean(decoderUtf8.decode(payload)) : "";
    switch (type) {
      case "\u00a9nam": case "\u00a9NRT": if (!tags.title) tags.title = text || null; break;
      case "\u00a9ART": case "aART": if (!tags.artist) tags.artist = text || null; break;
      case "\u00a9alb": if (!tags.album) tags.album = text || null; break;
      case "\u00a9gen": if (!tags.genre) tags.genre = text || null; break;
      case "gnre": {
        if (!tags.genre && payload.length >= 2) {
          const idx = ((payload[payload.length - 2] << 8) | payload[payload.length - 1]) - 1;
          tags.genre = ID3_GENRES[idx] ?? null;
        }
        break;
      }
      case "\u00a9day": if (tags.year === null) tags.year = yearFrom(text); break;
    }
  };

  const parseItem = (type: string, start: number, end: number) => {
    let p = start;
    while (p + 8 <= end) {
      const size = u32(b, p);
      const dt = ascii(b, p + 4, 4);
      if (size < 8 || p + size > end) break;
      if (dt === "data" && p + 16 <= end) {
        const dataType = u32(b, p + 8);
        applyIlst(type, dataType, b.subarray(p + 16, p + size));
      }
      p += size;
    }
  };

  const walk = (start: number, end: number) => {
    let p = start;
    while (p + 8 <= end) {
      let size = u32(b, p);
      const type = ascii(b, p + 4, 4);
      let hdr = 8;
      if (size === 1) {
        if (p + 16 > end) break;
        size = u64(b, p + 8);
        hdr = 16;
      } else if (size === 0) {
        size = end - p;
      }
      if (size < hdr || p + size > end) break;
      const bs = p + hdr;
      const be = p + size;
      switch (type) {
        case "moov": case "trak": case "mdia": case "minf": case "stbl":
        case "udta": case "dinf": case "edts":
          walk(bs, be);
          break;
        case "meta":
          walk(bs + 4, be);
          break;
        case "ilst":
          {
            let q = bs;
            while (q + 8 <= be) {
              const isz = u32(b, q);
              const iname = ascii(b, q + 4, 4);
              if (isz < 8 || q + isz > be) break;
              parseItem(iname, q + 8, q + isz);
              q += isz;
            }
          }
          break;
        case "mvhd": case "mdhd": {
          if (!(type === "mdhd" || durationSec === null)) break;
          const v = b[bs];
          const ts = v === 1 ? u32(b, bs + 20) : u32(b, bs + 12);
          const dur = v === 1 ? u64(b, bs + 24) : u32(b, bs + 16);
          if (ts > 0) durationSec = dur / ts;
          break;
        }
        case "stsd": {
          let q = bs + 8;
          while (q + 8 <= be) {
            const esz = u32(b, q);
            const etype = ascii(b, q + 4, 4);
            if (esz < 8 || q + esz > be) break;
            if (
              (etype === "mp4a" || etype === "alac" || etype === "Opus") &&
              q + 28 <= be
            ) {
              const sr = u32(b, q + 24);
              if (sr) tags.sample_rate = sr >> 16;
            }
            q += esz;
          }
          break;
        }
      }
      p += size;
    }
  };

  walk(0, b.length);
  if (durationSec !== null && durationSec > 0) {
    tags.duration_ms = Math.round(durationSec * 1000);
  }
  return { picture, audioStart: 0 };
}

// ------------------------------------------------------------------ FLAC

function parseVorbisComment(
  b: Uint8Array,
  start: number,
  tags: AudioTags,
  onPicture: (mime: string, data: Uint8Array) => void,
) {
  let p = start;
  if (p + 4 > b.length) return;
  const vendorLen = u32le(b, p);
  p += 4 + vendorLen;
  if (p + 4 > b.length) return;
  const count = u32le(b, p);
  p += 4;
  for (let i = 0; i < count && p + 4 <= b.length; i++) {
    const len = u32le(b, p);
    p += 4;
    if (len <= 0 || p + len > b.length) break;
    const text = decoderUtf8.decode(b.subarray(p, p + len));
    p += len;
    const eq = text.indexOf("=");
    if (eq < 0) continue;
    const key = text.slice(0, eq).toUpperCase();
    const value = text.slice(eq + 1);
    switch (key) {
      case "TITLE": if (!tags.title) tags.title = clean(value); break;
      case "ARTIST": if (!tags.artist) tags.artist = clean(value); break;
      case "ALBUM": if (!tags.album) tags.album = clean(value); break;
      case "GENRE": if (!tags.genre) tags.genre = clean(value); break;
      case "DATE": case "YEAR":
        if (tags.year === null) tags.year = yearFrom(value);
        break;
      case "METADATA_BLOCK_PICTURE": {
        const pic = decodeFlacPicture(decodeBase64(value));
        if (pic) onPicture(pic.mime, pic.data);
        break;
      }
    }
  }
}

function decodeBase64(s: string): Uint8Array {
  try {
    const bin = atob(s.replace(/\s+/g, ""));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return new Uint8Array(0);
  }
}

function decodeFlacPicture(b: Uint8Array): Picture | null {
  if (b.length < 32) return null;
  const mimeLen = u32(b, 4);
  if (mimeLen > b.length - 8) return null;
  const mime = normalizeMime(decodeText(b.subarray(8, 8 + mimeLen), 0));
  let p = 8 + mimeLen;
  if (p + 4 > b.length) return null;
  p += 4 + u32(b, p); // description
  if (p + 20 > b.length) return null;
  p += 16; // width, height, depth, colors
  const dataLen = u32(b, p);
  p += 4;
  if (dataLen <= 0 || p + dataLen > b.length) return null;
  return { data: b.subarray(p, p + dataLen), mime };
}

function parseFlac(
  b: Uint8Array,
  fileSize: number | null,
  tags: AudioTags,
): { picture: Picture | null; audioStart: number } {
  let picture: Picture | null = null;
  let p = 4; // "fLaC"
  let lastSample = -1;
  while (p + 4 <= b.length) {
    const isLast = (b[p] & 0x80) !== 0;
    const type = b[p] & 0x7f;
    const len = (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3];
    const body = p + 4;
    if (body + len > b.length) break;
    if (type === 0 && len >= 34) {
      const o = body;
      tags.sample_rate =
        ((b[o + 10] << 12) | (b[o + 11] << 4) | (b[o + 12] >> 4)) || null;
      const total =
        (b[o + 13] & 0x0f) * 0x100000000 +
        u32(b, o + 14);
      if (tags.sample_rate && total > 0) {
        lastSample = total;
        tags.duration_ms = Math.round((total / tags.sample_rate) * 1000);
      }
    } else if (type === 4) {
      parseVorbisComment(b, body, tags, (mime, data) => {
        if (!picture) picture = { mime, data };
      });
    } else if (type === 6) {
      const pic = decodeFlacPicture(b.subarray(body, body + len));
      if (pic && !picture) picture = pic;
    }
    p = body + len;
    if (isLast) break;
  }
  if (fileSize && tags.duration_ms) {
    tags.bitrate = Math.round((fileSize * 8) / (tags.duration_ms / 1000));
  } else if (lastSample > 0 && fileSize) {
    tags.bitrate = Math.round((fileSize * 8) / (lastSample / (tags.sample_rate || 44100)));
  }
  return { picture, audioStart: 0 };
}

// ------------------------------------------------------------------ OGG

function parseOgg(
  b: Uint8Array,
  fileSize: number | null,
  tags: AudioTags,
): { picture: Picture | null; audioStart: number } {
  let picture: Picture | null = null;
  const pages: Uint8Array[] = [];
  let p = 0;
  while (p + 27 <= b.length && pages.length < 4) {
    if (!(b[p] === 0x4f && b[p + 1] === 0x67 && b[p + 2] === 0x67 && b[p + 3] === 0x53))
      break;
    const nseg = b[p + 26];
    let dataLen = 0;
    for (let i = 0; i < nseg; i++) dataLen += b[p + 27 + i];
    const dstart = p + 27 + nseg;
    if (dstart + dataLen > b.length) break;
    pages.push(b.subarray(dstart, dstart + dataLen));
    p = dstart + dataLen;
  }
  if (pages.length === 0) return { picture, audioStart: 0 };

  const first = pages[0];
  let nominalBitrate = 0;
  if (first.length >= 30 && ascii(first, 1, 6) === "vorbis") {
    tags.sample_rate = u32le(first, 12) || null;
    nominalBitrate = u32le(first, 20);
  } else if (first.length >= 19 && ascii(first, 0, 8) === "OpusHead") {
    tags.sample_rate = u32le(first, 12) || null;
  }

  // Коментарі: для Vorbis це 2-га сторінка, для Opus — теж 2-га
  const comment = pages.find(
    (pg) =>
      (pg.length >= 7 && pg[0] === 0x03 && ascii(pg, 1, 6) === "vorbis") ||
      (pg.length >= 8 && ascii(pg, 0, 8) === "OpusTags"),
  );
  if (comment) {
    const offset =
      comment[0] === 0x03 ? 7 : 8; // пропустити "\x03vorbis" або "OpusTags"
    parseVorbisComment(comment, offset, tags, (mime, data) => {
      if (!picture) picture = { mime, data };
    });
  }

  if (fileSize && nominalBitrate > 0) {
    tags.bitrate = nominalBitrate;
    tags.duration_ms = Math.round(((fileSize * 8) / nominalBitrate) * 1000);
  }
  return { picture, audioStart: 0 };
}

// ------------------------------------------------------------------ вхідна точка

export function parseAudio(b: Uint8Array, fileSize: number | null): ParsedAudio {
  const tags = emptyTags();
  let picture: Picture | null = null;

  if (b.length >= 4 && b[0] === 0x66 && b[1] === 0x4c && b[2] === 0x61 && b[3] === 0x43) {
    picture = parseFlac(b, fileSize, tags).picture;
  } else if (
    b.length >= 4 &&
    b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53
  ) {
    picture = parseOgg(b, fileSize, tags).picture;
  } else if (
    b.length >= 12 &&
    ascii(b, 4, 4) === "ftyp"
  ) {
    picture = parseMp4(b, tags).picture;
  } else {
    const res = parseId3(b, tags);
    picture = res.picture;
    mp3AudioInfo(b, res.audioStart, fileSize, tags);
  }

  tags.has_cover = picture !== null;
  tags.cover_mime = picture?.mime ?? null;
  return { tags, picture };
}

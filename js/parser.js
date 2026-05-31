/**
 * content-parser.js
 * Parses catsoop content.md format into segments for rendering.
 *
 * Segment types:
 *   { type: 'markdown',     text }
 *   { type: 'python',       code }
 *   { type: 'question',     qtype, code }
 *   { type: 'checkyourself', text, showhide? }
 */

/**
 * Split raw content.md text into an array of segments.
 * We handle: <python>…</python>, <question TYPE>…</question>,
 * <checkyourself>…</checkyourself>  (with optional <showhide>…</showhide> inside).
 */
export function parseSegments(raw) {
  const segments = [];

  // We'll walk through the string finding top-level tags.
  // Tags we care about (case-insensitive): python, question, checkyourself
  const TAG_RE = /<(python|question(?:\s+\w+)?|checkyourself|\/python|\/question|\/checkyourself)(\s[^>]*)?>|<showhide>|<\/showhide>/gi;

  let pos = 0;
  let match;
  TAG_RE.lastIndex = 0;

  while ((match = TAG_RE.exec(raw)) !== null) {
    const tagStart = match.index;
    const tagFull = match[0];
    const tagName = (match[1] || '').trim().toLowerCase();

    // Push any markdown text before this tag
    if (tagStart > pos) {
      const text = raw.slice(pos, tagStart);
      if (text.trim()) segments.push({ type: 'markdown', text });
    }

    if (tagName === 'python') {
      // Find </python>
      const closeIdx = findClose(raw, TAG_RE.lastIndex, '</python>');
      if (closeIdx === -1) break;
      const code = raw.slice(TAG_RE.lastIndex, closeIdx);
      segments.push({ type: 'python', code });
      pos = closeIdx + '</python>'.length;
      TAG_RE.lastIndex = pos;
    } else if (tagName.startsWith('question')) {
      // Extract question type from tag, e.g. "question multiplechoice" → "multiplechoice"
      const parts = tagName.split(/\s+/);
      const qtype = parts[1] || 'unknown';
      const closeIdx = findClose(raw, TAG_RE.lastIndex, '</question>');
      if (closeIdx === -1) break;
      const code = raw.slice(TAG_RE.lastIndex, closeIdx);
      segments.push({ type: 'question', qtype, code });
      pos = closeIdx + '</question>'.length;
      TAG_RE.lastIndex = pos;
    } else if (tagName === 'checkyourself') {
      const closeIdx = findClose(raw, TAG_RE.lastIndex, '</checkyourself>');
      if (closeIdx === -1) break;
      const inner = raw.slice(TAG_RE.lastIndex, closeIdx);
      // Check for <showhide>
      const showhideOpen = inner.toLowerCase().indexOf('<showhide>');
      let text, showhide;
      if (showhideOpen !== -1) {
        text = inner.slice(0, showhideOpen);
        const showhideClose = inner.toLowerCase().indexOf('</showhide>');
        showhide = showhideClose !== -1 ? inner.slice(showhideOpen + '<showhide>'.length, showhideClose) : '';
      } else {
        text = inner;
      }
      segments.push({ type: 'checkyourself', text, showhide });
      pos = closeIdx + '</checkyourself>'.length;
      TAG_RE.lastIndex = pos;
    } else {
      // Unrecognized or closing tag at top level — skip
      pos = TAG_RE.lastIndex;
    }
  }

  // Remaining text
  const tail = raw.slice(pos);
  if (tail.trim()) segments.push({ type: 'markdown', text: tail });

  return segments;
}

/** Find the (case-insensitive) closing tag, returning the index of its start. */
function findClose(str, from, closeTag) {
  const idx = str.toLowerCase().indexOf(closeTag.toLowerCase(), from);
  return idx;
}



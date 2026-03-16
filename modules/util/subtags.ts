//
// Detect related subtags for a preset field (check_date, note/description, source, conditional, numericCombo, other).
// Used to show category icons and tooltips in the field label row.
//

/** Key-value pair for a single tag */
export interface SubtagPair {
  key: string;
  value: string;
}

/** Result of subtag detection per category */
export interface SubtagResult {
  checkDate: SubtagPair[];
  noteDesc: SubtagPair[];
  source: SubtagPair[];
  conditional: SubtagPair[];
  numeric: SubtagPair[];
  other: SubtagPair[];
}

/** Numeric postfix range for numericCombo-style tags (e.g. panoramax:1, panoramax:2, ...). */
const NUMERIC_POSTFIX_MIN = 1;
const NUMERIC_POSTFIX_MAX = 10;

/** Minimal preset field shape used for subtag detection */
export interface PresetFieldLike {
  key?: string;
  keys?: string[];
  type?: string;
}

/** Function that returns the field's main tag keys (from field.js allKeys()) */
export type AllKeysFn = () => string[];

/** Known prefixes for "other" related tags (whitelist to avoid listing every random tag) */
const OTHER_PREFIXES: readonly string[] = ['mapillary', 'cycleway', 'footway', 'path'];

/**
 * Get the list of tag keys to consider for subtag detection for this field.
 * For simple fields: [field.key]. For multiCombo: [baseKey]. For directionalCombo: all keys.
 */
export function getSubtagKeys(field: PresetFieldLike, allKeysFn?: AllKeysFn): string[] {
  if (field.type === 'multiCombo' && field.key) {
    const baseKey = field.key.replace(/:$/, '');
    return [baseKey];
  }
  if (field.type === 'directionalCombo' && (field.keys || field.key)) {
    const keys = field.keys || (field.key ? [field.key] : []);
    const withBoth = keys.slice();
    if (field.key) {
      const baseKeyDir = field.key.replace(/:both$/, '');
      if (keys.indexOf(baseKeyDir) === -1) withBoth.push(baseKeyDir);
      if (keys.indexOf(baseKeyDir + ':both') === -1) withBoth.push(baseKeyDir + ':both');
    }
    return withBoth;
  }
  if (field.type === 'localized' && field.key) {
    return [field.key];
  }
  const keys = allKeysFn ? allKeysFn() : (field.keys || (field.key ? [field.key] : []));
  return Array.isArray(keys) ? keys : [keys];
}

/**
 * Detect which subtag categories have matches and collect key=value for tooltips.
 */
export function detectSubtags(
  field: PresetFieldLike,
  tags: Record<string, string | undefined> | null | undefined,
  allKeysFn?: AllKeysFn
): SubtagResult {
  const result: SubtagResult = {
    checkDate: [],
    noteDesc: [],
    source: [],
    conditional: [],
    numeric: [],
    other: []
  };

  if (!field || !tags || typeof tags !== 'object') return result;

  const keysToConsider = getSubtagKeys(field, allKeysFn);
  const matchedKeys = new Set<string>();

  const addCheckDate = (tagKey: string, value: string): void => {
    if (tagKey === 'source:date') return;
    result.checkDate.push({ key: tagKey, value });
    matchedKeys.add(tagKey);
  };
  const addNoteDesc = (tagKey: string, value: string): void => {
    result.noteDesc.push({ key: tagKey, value });
    matchedKeys.add(tagKey);
  };
  const addSource = (tagKey: string, value: string): void => {
    if (tagKey === 'source:date') return;
    result.source.push({ key: tagKey, value });
    matchedKeys.add(tagKey);
  };
  const addConditional = (tagKey: string, value: string): void => {
    result.conditional.push({ key: tagKey, value });
    matchedKeys.add(tagKey);
  };
  const addNumeric = (tagKey: string, value: string): void => {
    result.numeric.push({ key: tagKey, value });
    matchedKeys.add(tagKey);
  };
  const addOther = (tagKey: string, value: string): void => {
    result.other.push({ key: tagKey, value });
    matchedKeys.add(tagKey);
  };

  for (const tagKey of Object.keys(tags)) {
    const value = tags[tagKey];
    if (value === undefined || value === null) continue;

    for (const k of keysToConsider) {
      if (tagKey === 'check_date:' + k || tagKey === k + ':check_date') {
        addCheckDate(tagKey, value);
        break;
      }
      if (tagKey === 'note:' + k || tagKey === 'description:' + k || tagKey === k + ':note' || tagKey === k + ':description') {
        addNoteDesc(tagKey, value);
        break;
      }
      if (tagKey === 'source:' + k || tagKey === k + ':source') {
        if (tagKey !== 'source:date') addSource(tagKey, value);
        break;
      }
      if (tagKey === k + ':conditional') {
        addConditional(tagKey, value);
        break;
      }
      // numericCombo: base:1, base:2, ... base:10 (e.g. panoramax:1, panoramax:2)
      for (let n = NUMERIC_POSTFIX_MIN; n <= NUMERIC_POSTFIX_MAX; n++) {
        if (tagKey === k + ':' + n) {
          addNumeric(tagKey, value);
          break;
        }
      }
      if (matchedKeys.has(tagKey)) break;
    }

    if (matchedKeys.has(tagKey)) continue;
    let isOther = false;
    for (const base of keysToConsider) {
      if (tagKey === base) continue;
      for (const prefix of OTHER_PREFIXES) {
        if (tagKey === prefix + ':' + base) {
          addOther(tagKey, value);
          isOther = true;
          break;
        }
      }
      if (isOther) break;
      if (tagKey.indexOf(base + ':') === 0) {
        const suffix = tagKey.slice((base + ':').length);
        if (suffix !== 'check_date' && suffix !== 'note' && suffix !== 'description' && suffix !== 'source' && suffix !== 'conditional') {
          addOther(tagKey, value);
          isOther = true;
        }
      }
    }
  }

  return result;
}

/**
 * Build tooltip body: "explanation \n key=value" (one key=value per line).
 * @param groupBySide - for directionalCombo, prefix with "Left:", "Right:" etc.
 */
export function formatSubtagTooltip(
  explanation: string,
  pairs: SubtagPair[],
  groupBySide: boolean,
  field?: PresetFieldLike
): string {
  if (!pairs || pairs.length === 0) return explanation;
  const lines = [explanation];
  if (groupBySide && field?.keys && pairs.length > 1) {
    for (const p of pairs) {
      let label = '';
      if (p.key.indexOf(':left') !== -1) label = 'Left: ';
      else if (p.key.indexOf(':right') !== -1) label = 'Right: ';
      else if (p.key.indexOf(':both') !== -1) label = 'Both: ';
      lines.push(label + p.key + '=' + (p.value || ''));
    }
  } else {
    for (const p of pairs) {
      lines.push(p.key + '=' + (p.value || ''));
    }
  }
  return lines.join('\n');
}

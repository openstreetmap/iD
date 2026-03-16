/**
 * Preset-field config for subtag rows (check_date, note/description, source, etc.).
 * Builds objects compatible with presetField so they can be rendered with uiField
 * like regular preset fields (including the date field with "set today" button).
 * @module ui/field_subtag_preset_config
 */

import { presetField } from '../presets/field';
import { utilSafeClassName } from '../util';

/** Field type per subtag category (matches preset field types: date, textarea, text) */
const CATEGORY_FIELD_TYPE = Object.freeze({
  check_date: 'date',
  note_desc: 'textarea',
  source: 'text',
  conditional: 'text',
  numeric: 'text',
  other: 'text'
});

/**
 * Get display label for a subtag row (e.g. "Left", "Right", or the tag key).
 * @param {import('./field_subtag_icons').SubtagPair} pair
 * @param {Object} parentField - Parent preset field (for directionalCombo check)
 * @returns {string}
 */
function getSubtagRowLabel(pair, parentField) {
  if (parentField.type === 'directionalCombo') {
    if (pair.key.indexOf(':left') !== -1) return 'Left';
    if (pair.key.indexOf(':right') !== -1) return 'Right';
    if (pair.key.indexOf(':both') !== -1) return 'Both';
  }
  // numericCombo: show just the number (e.g. "1", "2") for keys like panoramax:1, panoramax:2
  const numericMatch = pair.key.match(/^.+:(\d+)$/);
  if (numericMatch) return numericMatch[1];
  return pair.key;
}

/**
 * Build a preset-field-like config for one subtag row so it can be passed to uiField
 * and rendered with the same logic as sidebar preset fields (text, textarea, date with set-today).
 * @param {string} category - Subtag category key (check_date, note_desc, source, conditional, other)
 * @param {import('./field_subtag_icons').SubtagPair} pair - { key, value }
 * @param {Object} parentField - Parent preset field
 * @returns {Object} Field object compatible with presetField (id, safeid, key, type, title(), label(), etc.)
 */
export function makeSubtagPresetFieldConfig(category, pair, parentField) {
  const fieldType = CATEGORY_FIELD_TYPE[category] || 'text';
  const safeid = utilSafeClassName(pair.key);
  const fieldId = 'subtag-' + safeid;
  const displayLabel = getSubtagRowLabel(pair, parentField);

  const raw = {
    key: pair.key,
    type: fieldType,
    overrideLabel: displayLabel
  };

  return presetField(fieldId, raw, {});
}

export { CATEGORY_FIELD_TYPE };

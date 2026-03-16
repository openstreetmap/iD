/**
 * UI for preset field subtag icons (check_date, note/description, source, conditional, other)
 * and the expandable block of editable sub-fields when an icon is clicked.
 * @module ui/field_subtag_icons
 */

import { select as d3_select } from 'd3-selection';
import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiTooltip } from './tooltip';
import { makeSubtagPresetFieldConfig } from './field_subtag_preset_config';
import { detectSubtags, formatSubtagTooltip } from '../util/subtags';

/**
 * @typedef {Object} SubtagPair
 * @property {string} key
 * @property {string} value
 */

/**
 * @typedef {Object} SubtagCategoryDatum
 * @property {string} key - Category key (e.g. 'check_date', 'note_desc')
 * @property {SubtagPair[]} pairs
 * @property {string} explanation - Localized explanation for tooltip
 * @property {string} iconId - SVG icon href (e.g. '#fas-calendar-days')
 */

/**
 * @typedef {Object} SubtagContext
 * @property {Object} field - Parent preset field object
 * @property {Object} _tags - Combined entity tags
 * @property {Function} allKeys - function(): string[]
 * @property {Set<string>} _expandedSubtagCategories - Keys of expanded category blocks
 * @property {string[]} entityIDs - Entity IDs for the selection (for uiField)
 * @property {Function} createFieldComponent - (config, entityIDs, options) => field component (avoids circular import)
 * @property {d3.Dispatch} dispatch - Field dispatch (change, revert, expandSubtag)
 */

/** Category key to icon ID mapping */
const CATEGORY_ICONS = Object.freeze({
  check_date: '#fas-calendar-days',
  note_desc: '#fas-comment',
  source: '#iD-icon-out-link',
  conditional: '#fas-code',
  numeric: '#fas-hashtag',
  other: '#iD-icon-more'
});

/** Category key to result property name */
const CATEGORY_TO_RESULT_KEY = Object.freeze({
  check_date: 'checkDate',
  note_desc: 'noteDesc',
  source: 'source',
  conditional: 'conditional',
  numeric: 'numeric',
  other: 'other'
});

/**
 * Build the list of category data for the current field/tags (for icon data join).
 * @param {{ checkDate: SubtagPair[], noteDesc: SubtagPair[], source: SubtagPair[], conditional: SubtagPair[], other: SubtagPair[] }} st - result of detectSubtags(field, tags, allKeysFn)
 * @returns {SubtagCategoryDatum[]}
 */
export function buildSubtagCategoryData(st) {
  const categories = [];
  if (st.checkDate.length) {
    categories.push({
      key: 'check_date',
      pairs: st.checkDate,
      explanation: t('inspector.subtag.check_date'),
      iconId: CATEGORY_ICONS.check_date
    });
  }
  if (st.noteDesc.length) {
    categories.push({
      key: 'note_desc',
      pairs: st.noteDesc,
      explanation: t('inspector.subtag.note_desc'),
      iconId: CATEGORY_ICONS.note_desc
    });
  }
  if (st.source.length) {
    categories.push({
      key: 'source',
      pairs: st.source,
      explanation: t('inspector.subtag.source'),
      iconId: CATEGORY_ICONS.source
    });
  }
  if (st.conditional.length) {
    categories.push({
      key: 'conditional',
      pairs: st.conditional,
      explanation: t('inspector.subtag.conditional'),
      iconId: CATEGORY_ICONS.conditional
    });
  }
  if (st.numeric?.length) {
    categories.push({
      key: 'numeric',
      pairs: st.numeric,
      explanation: t('inspector.subtag.numeric'),
      iconId: CATEGORY_ICONS.numeric
    });
  }
  if (st.other.length) {
    categories.push({
      key: 'other',
      pairs: st.other,
      explanation: t('inspector.subtag.other'),
      iconId: CATEGORY_ICONS.other
    });
  }
  return categories;
}

/**
 * Render subtag category icons into the given container (`.field-label .subtag-icons`).
 * @param {d3.Selection} container - selection containing `.form-field` (one element)
 * @param {SubtagContext} context
 * @param {(categoryKey: string) => void} setExpandedCategory - called with the category key to toggle expanded state
 */
export function renderSubtagIcons(container, context, setExpandedCategory) {
  const { field, _tags, allKeys, _expandedSubtagCategories, dispatch } = context;
  const st = detectSubtags(field, _tags, allKeys);
  const subtagData = buildSubtagCategoryData(st);

  const subtagIcons = container.selectAll('.field-label .subtag-icons')
    .selectAll('.subtag-icon')
    .data(subtagData, (d) => d.key);

  subtagIcons.exit().remove();

  const subtagIconEnter = subtagIcons.enter()
    .append('button')
    .attr('type', 'button')
    .attr('class', (d) => `subtag-icon subtag-icon-${d.key}`);

  subtagIconEnter
    .each(function () {
      const btn = d3_select(this);
      btn.call(uiTooltip()
        .title(() => {
          const d = btn.datum();
          return d ? formatSubtagTooltip(d.explanation, d.pairs, field.type === 'directionalCombo', field) : '';
        })
        .placement('top'));
    })
    .on('click', (d3_event, d) => {
      d3_event.preventDefault();
      d3_event.stopPropagation();
      setExpandedCategory(d.key);
      dispatch.call('expandSubtag', field);
    })
    .call((sel) => sel.each(function (d) {
      d3_select(this).call(svgIcon(d.iconId));
    }));

  subtagIcons.merge(subtagIconEnter)
    .classed('active', (d) => _expandedSubtagCategories.has(d.key))
    .on('click', (d3_event, d) => {
      d3_event.preventDefault();
      d3_event.stopPropagation();
      setExpandedCategory(d.key);
      dispatch.call('expandSubtag', field);
    })
    .select('use')
    .attr('xlink:href', (d) => d.iconId);
}

/**
 * Render the expanded block of sub-fields using the same preset field logic as the sidebar.
 * Each row is a full uiField (text, textarea, or date with "set today") so they look like preset fields.
 * @param {d3.Selection} selection - the form-field container (single element)
 * @param {SubtagContext} context
 */
export function renderSubtagExpanded(selection, context) {
  const { field, _tags, allKeys, _expandedSubtagCategories, entityIDs, createFieldComponent, dispatch } = context;
  const expandedKeys = Array.from(_expandedSubtagCategories);
  const hasExpanded = expandedKeys.length > 0;

  const outer = selection.selectAll('.subtag-expanded-outer')
    .data(hasExpanded ? [0] : []);

  outer.exit().remove();

  const outerEnter = outer.enter()
    .append('div')
    .attr('class', 'subtag-expanded-outer');

  const outerMerge = outer.merge(outerEnter);

  const expandedWrap = outerMerge.selectAll('.subtag-expanded-wrap')
    .data(expandedKeys, (d) => d);

  expandedWrap.exit().remove();

  const wrapEnter = expandedWrap.enter()
    .append('div')
    .attr('class', 'subtag-expanded-wrap');

  const wrapMerge = expandedWrap.merge(wrapEnter);

  wrapMerge.each(function (cat) {
    const wrap = d3_select(this);
    const st = detectSubtags(field, _tags, allKeys);
    const resultKey = CATEGORY_TO_RESULT_KEY[cat] || cat;
    const pairs = st[resultKey] || [];

    const rows = wrap.selectAll('.wrap-form-field.subtag-expanded-row')
      .data(pairs, (p) => p.key);

    rows.exit().remove();

    const rowEnter = rows.enter()
      .append('div')
      .attr('class', 'wrap-form-field subtag-expanded-row');

    rowEnter.each(function (pair) {
      const subfieldConfig = makeSubtagPresetFieldConfig(cat, pair, field);
      const fieldComponent = createFieldComponent(subfieldConfig, entityIDs || [], {
        wrap: true,
        remove: false,
        revert: false,
        info: false,
        showSubtagIcons: false
      });
      fieldComponent.on('change', (_changedField, t, onInput) => {
        dispatch.call('change', field, t, onInput);
      });
      this._subtagFieldComponent = fieldComponent;
    });

    const rowMerge = rows.merge(rowEnter);
    rowMerge.each(function () {
      const comp = this._subtagFieldComponent;
      if (comp) {
        comp.tags(_tags);
        d3_select(this).call(comp.render);
      }
    });
  });
}

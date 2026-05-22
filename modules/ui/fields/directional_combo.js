import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { geoWayStraightnessInViewport } from '../../geo';
import { DIRECTIONAL_COMBO_ARROW_UP_PATH, DIRECTIONAL_COMBO_ARROW_VIEWBOX } from '../../svg/directional_combo_arrow';
import { utilRebind } from '../../util';
import { uiFieldCombo } from './combo';


export function uiFieldDirectionalCombo(field, context) {
    var dispatch = d3_dispatch('change');
    var items = d3_select(null);
    var wrap = d3_select(null);
    var _activeIndicatorKey = null;
    var _baseIndicatorRotation = null;
    var _showLabelArrows = true;
    var _mapListenersInstalled = false;

    /** @type {Record<string, ReturnType<typeof uiFieldCombo>>} */
    const _combos = {};

    // fallback for schema-builder v5's cycleway field type: can be removed eventually
    if (field.type === 'cycleway') {
        field = {
            ...field,
            key: field.keys[0],
            keys: field.keys.slice(1)
        };
    }

    function directionalCombo(selection) {
        /**
         * Maps a directional combo key to renderer-facing indicator side.
         * @param {string} key
         * @returns {'left' | 'right' | null}
         */
        function keyToIndicatorSide(key) {
            if (/:left(:|$)/.test(key)) return 'left';
            if (/:right(:|$)/.test(key)) return 'right';
            return null;
        }

        /**
         * Returns selected editable linear entity IDs for indicator rendering.
         * @returns {string[]}
         */
        function selectedLinearEntityIDs() {
            const graph = context.graph();
            return context.selectedIDs().filter(function(id) {
                const entity = graph.hasEntity(id);
                return entity && entity.geometry(graph) === 'line';
            });
        }

        /**
         * True when every selected linear entity is straight enough in the current viewport
         * for left/right indicators to be meaningful.
         * @param {string[]} entityIDs
         * @returns {boolean}
         */
        function selectedWaysStraightEnough(entityIDs) {
            const graph = context.graph();
            const projection = context.projection;
            if (typeof projection !== 'function') return false;

            if (!entityIDs.length) return false;

            return entityIDs.every(function(id) {
                const entity = graph.hasEntity(id);
                if (!entity || entity.geometry(graph) !== 'line') return false;
                const nodes = graph.childNodes(entity);
                if (nodes.length < 2) return false;
                return geoWayStraightnessInViewport(projection, nodes, entity.isClosed()).isStraightEnough;
            });
        }

        /**
         * Refreshes label-arrow visibility from viewport straightness of selected ways.
         * @returns {void}
         */
        function refreshLabelArrowVisibility() {
            const entityIDs = selectedLinearEntityIDs();
            const straightEnough = selectedWaysStraightEnough(entityIDs);
            if (straightEnough === _showLabelArrows) return;

            _showLabelArrows = straightEnough;
            items.selectAll('.directionalcombo-label-arrow')
                .classed('directionalcombo-label-arrow-hidden', !_showLabelArrows);

            if (!_showLabelArrows && _activeIndicatorKey) {
                clearIndicator();
            }
        }

        /**
         * @returns {void}
         */
        function installMapListeners() {
            if (_mapListenersInstalled || !context.map) return;
            _mapListenersInstalled = true;
            context.map()
                .on('move.directionalcomboStraightness', refreshLabelArrowVisibility)
                .on('drawn.directionalcomboStraightness', refreshLabelArrowVisibility);
        }

        /**
         * @returns {void}
         */
        function uninstallMapListeners() {
            if (!_mapListenersInstalled || !context.map) return;
            _mapListenersInstalled = false;
            context.map()
                .on('move.directionalcomboStraightness', null)
                .on('drawn.directionalcomboStraightness', null);
        }

        /**
         * Compute base indicator rotation (degrees) from selected way direction.
         * The shared label arrow glyph points "up" at 0deg.
         * Left uses base heading, right uses base + 180deg.
         * @param {string[]} entityIDs
         * @returns {number}
         */
        function indicatorBaseRotation(entityIDs) {
            const graph = context.graph();
            const projection = context.projection;
            const fallback = 0;

            if (typeof projection !== 'function') return fallback;

            let bestDX = null;
            let bestDY = null;
            let bestLen = 0;

            for (let i = 0; i < entityIDs.length; i++) {
                const entity = graph.hasEntity(entityIDs[i]);
                if (!entity || entity.geometry(graph) !== 'line') continue;

                const points = graph.childNodes(entity)
                    .map(node => projection(node.loc))
                    .filter(Boolean);

                if (points.length < 2) continue;

                for (let j = 0; j < points.length - 1; j++) {
                    const dx = points[j + 1][0] - points[j][0];
                    const dy = points[j + 1][1] - points[j][1];
                    const len = Math.hypot(dx, dy);
                    if (len > bestLen) {
                        bestLen = len;
                        bestDX = dx;
                        bestDY = dy;
                    }
                }
            }

            if (!bestLen || bestDX === null || bestDY === null) return fallback;

            return Math.atan2(bestDY, bestDX) * 180 / Math.PI;
        }

        /**
         * Refreshes the base directional rotation from current selected linear entities.
         * @returns {void}
         */
        function refreshBaseIndicatorRotation() {
            _baseIndicatorRotation = indicatorBaseRotation(selectedLinearEntityIDs());
        }

        /**
         * Updates row hover class and directional side metadata.
         * @returns {void}
         */
        function updateIndicatorRowState() {
            items
                .attr('data-indicator-side', key => keyToIndicatorSide(key) || null)
                .style('--indicator-rotation', function(key) {
                    const side = keyToIndicatorSide(key);
                    if (!side || _baseIndicatorRotation === null) return null;
                    const deg = side === 'left' ? _baseIndicatorRotation : (_baseIndicatorRotation + 180);
                    return deg + 'deg';
                })
                .classed('is-active-indicator', function(key) {
                    return key === _activeIndicatorKey;
                });
        }

        /**
         * Activates map indicator for a directional combo row interaction.
         * @param {string} key
         * @returns {void}
         */
        function activateIndicatorForKey(key) {
            const side = keyToIndicatorSide(key);
            const entityIDs = selectedLinearEntityIDs();
            if (!side || !entityIDs.length || !selectedWaysStraightEnough(entityIDs)) {
                clearIndicator();
                return;
            }

            _baseIndicatorRotation = indicatorBaseRotation(entityIDs);
            _activeIndicatorKey = key;
            updateIndicatorRowState();
            context.setDirectionalComboIndicator({
                side: side,
                entityIDs: entityIDs
            });
        }

        /**
         * Deactivates the directional combo indicator and row highlight.
         * @returns {void}
         */
        function clearIndicator() {
            _activeIndicatorKey = null;
            updateIndicatorRowState();
            context.setDirectionalComboIndicator(null);
        }


        function stripcolon(s) {
            return s.replaceAll(':', '');
        }


        wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);


        var div = wrap.selectAll('ul')
            .data([0]);

        div = div.enter()
            .append('ul')
            .attr('class', 'rows rows-table')
            .merge(div);

        items = div.selectAll('li')
            .data(field.keys);

        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'labeled-input preset-directionalcombo-' + stripcolon(d); });

        enter
            .append('div')
            .attr('class', 'label preset-label-directionalcombo')
            .attr('for', function(d) { return 'preset-input-directionalcombo-' + stripcolon(d); })
            .each(function(d) {
                const label = d3_select(this);
                label.call(field.t.append('types.' + d));
                label
                    .append('svg')
                    .attr('class', 'directionalcombo-label-arrow')
                    .attr('viewBox', DIRECTIONAL_COMBO_ARROW_VIEWBOX)
                    .attr('aria-hidden', 'true')
                    .append('path')
                    .attr('d', DIRECTIONAL_COMBO_ARROW_UP_PATH);
            });

        enter
            .append('div')
            .attr('class', 'preset-input-directionalcombo-wrap form-field-input-wrap')
            .each(function(key) {
                const subField = {
                    ...field,
                    type: 'combo',
                    key
                };
                const combo = uiFieldCombo(subField, context);
                combo.on('change', t => change(key, t[key]));
                _combos[key] = combo;
                d3_select(this).call(combo);
            });

        items = items.merge(enter);
        installMapListeners();
        refreshBaseIndicatorRotation();
        refreshLabelArrowVisibility();
        updateIndicatorRowState();

        /**
         * True if pointer moved from row into the open combobox for that row.
         * @param {HTMLElement} row
         * @param {EventTarget | null} related
         * @returns {boolean}
         */
        function isRelatedTargetInsideOpenCombobox(row, related) {
            const input = row.querySelector('input');
            if (!input || !related || !(related instanceof Node)) return false;
            const comboEl = context.container().select('.combobox');
            return !comboEl.empty() &&
                comboEl.datum() === input &&
                comboEl.node().contains(/** @type {Node} */ (related));
        }

        items
            .on('mouseenter.indicator', function(d3_event, key) {
                activateIndicatorForKey(key);
            })
            .on('mouseleave.indicator', function(d3_event) {
                if (isRelatedTargetInsideOpenCombobox(this, d3_event.relatedTarget)) return;
                clearIndicator();
            });

        // Update
        wrap.selectAll('.preset-input-directionalcombo')
            .on('change', change)
            .on('blur', change);
    }


    function change(key, newValue) {
        const commonKey = field.key;
        // if commonKey contains ":both", this is the key without :both. and vice-versa
        const otherCommonKey = field.key.includes(':both')
            ? field.key.replace(/:both(:|$)/,'$1')
            : `${field.key}:both`;
        // this is the key that might contain the direction (e.g. left/right) as a tag value,
        // instead of the direction being part of the tag key
        const fallbackKey = commonKey.includes(':both') ? otherCommonKey : commonKey;

        const otherKey = key === field.keys[0] ? field.keys[1] : field.keys[0];

        dispatch.call('change', this, tags => {
            let otherValue = tags[otherKey] || tags[commonKey] || tags[otherCommonKey];

            if (tags[fallbackKey] === 'both' && !tags[otherKey]) {
                otherValue = 'yes';
            } else if (tags[fallbackKey] && !tags[otherKey]) {
                const directionalKeyRegExp = new RegExp(`:${tags[fallbackKey]}(:|$)`);
                if (directionalKeyRegExp.test(otherKey)) {
                    otherValue = 'yes';
                } else if (directionalKeyRegExp.test(key)) {
                    otherValue = 'no';
                }
            }

            if (newValue === otherValue) {
                // both tags match, use the common tag to tag both sides the same way
                tags[commonKey] = newValue;
                delete tags[key];
                delete tags[otherKey];
                delete tags[otherCommonKey];
            } else {
                // Always set both left and right as changing one can affect the other
                tags[key] = newValue;
                delete tags[commonKey];
                delete tags[otherCommonKey];
                tags[otherKey] = otherValue;
            }
            return tags;
        });
    }


    directionalCombo.tags = function(_ignored, __test_tags /* for unit tests only */) {
        const commonKey = field.key;
        // if commonKey contains ":both", this is the key without :both. and vice-versa
        const otherCommonKey = field.key.includes(':both')
            ? field.key.replace(/:both(:|$)/,'$1')
            : `${field.key}:both`;
        // this is the key that might contain the direction (e.g. left/right) as a tag value,
        // instead of the direction being part of the tag key
        const fallbackKey = commonKey.includes(':both') ? otherCommonKey : commonKey;
        // this is the key that is explicitly for ":both" directions
        const bothDirectionsKey = fallbackKey !== commonKey ? commonKey : otherCommonKey;

        // harmonize tags of selected entities
        const keys = Object.keys(_combos);
        const entityTags = Array.isArray(__test_tags)
            ? __test_tags // for unit tests only
            : context.selectedIDs().map(id => context.graph().hasEntity(id).tags);
        const combinedTags = {};
        for (const key of keys) combinedTags[key] = new Set();
        for (const tags of entityTags) {
            let hadCommonValue = false;
            if (tags[fallbackKey] === 'both') {
                // interpret key=both as key:*=yes
                for (const key of keys) combinedTags[key].add('yes');
                hadCommonValue = true;
            } else if (tags[fallbackKey]) {
                const directionalKeyRegExp = new RegExp(`:${tags[fallbackKey]}(:|$)`);
                if (keys.some(key => directionalKeyRegExp.test(key))) {
                    // tag value looks like a direction: interpret as key:<value>=yes, key:<other>=no
                    for (const key of keys) {
                        if (directionalKeyRegExp.test(key)) {
                            combinedTags[key].add('yes');
                        } else {
                            combinedTags[key].add('no');
                        }
                    }
                } else {
                    // tag does not look like a direction: handle like key:both=<value>
                    for (const key of keys) combinedTags[key].add(tags[fallbackKey]);
                }
                hadCommonValue = true;
            }
            if (tags[bothDirectionsKey]) {
                // handle ":both" key: set all tags to key:*=<value>
                for (const key of keys) combinedTags[key].add(tags[bothDirectionsKey]);
                hadCommonValue = true;
            }
            for (const key of keys) {
                if (tags[key] || !hadCommonValue) {
                    combinedTags[key].add(tags[key]);
                }
            }
        }
        for (const key in _combos) {
            const uniqueValues = [...combinedTags[key]];
            _combos[key].tags({ [key]: uniqueValues.length > 1 ? uniqueValues : uniqueValues[0] });
        }
    };


    directionalCombo.focus = function() {
        var node = wrap.selectAll('input').node();
        if (node) node.focus();
    };

    directionalCombo.off = function() {
        if (_mapListenersInstalled && context.map) {
            context.map()
                .on('move.directionalcomboStraightness', null)
                .on('drawn.directionalcomboStraightness', null);
            _mapListenersInstalled = false;
        }
        context.setDirectionalComboIndicator(null);
    };


    return utilRebind(directionalCombo, dispatch, 'on');
}

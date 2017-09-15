import * as d3 from 'd3';

import { t } from '../util/locale';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { dataShortcuts } from '../../data';
import { svgIcon } from '../svg';
import { uiCmd } from './cmd';
import { uiModal } from './modal';
import { utilDetect } from '../util/detect';


export function uiShortcuts() {
    var detected = utilDetect();
    var activeTab = 0;
    var modalSelection;
    var savedSelection;


    var keybinding = d3keybinding('shortcuts')
        .on(t('shortcuts.toggle.key'), function () {
            if (d3.selectAll('.modal-shortcuts').size()) {  // already showing
                if (modalSelection) {
                    modalSelection.close();
                    modalSelection = null;
                }
            } else {
                modalSelection = uiModal(savedSelection);
                shortcutsModal(modalSelection);
            }
        });

    d3.select(document)
        .call(keybinding);



    function shortcutsModal(modalSelection) {
        modalSelection.select('.modal')
            .classed('modal-shortcuts', true);

        var shortcutsModal = modalSelection.select('.content');

        shortcutsModal
            .append('div')
            .attr('class', 'modal-section')
            .append('h3')
            .text(t('shortcuts.title'));

        shortcutsModal
            .call(render);
    }


    function render(selection) {
        var wrapper = selection
            .selectAll('.wrapper')
            .data([0]);

        var wrapperEnter = wrapper
            .enter()
            .append('div')
            .attr('class', 'wrapper modal-section');

        var tabsBar = wrapperEnter
            .append('div')
            .attr('class', 'tabs-bar');

        var shortcutsList = wrapperEnter
            .append('div')
            .attr('class', 'shortcuts-list');

        wrapper = wrapper.merge(wrapperEnter);

        var tabs = tabsBar
            .selectAll('.tab')
            .data(dataShortcuts);

        var tabsEnter = tabs
            .enter()
            .append('div')
            .attr('class', 'tab')
            .on('click', function (d, i) {
                activeTab = i;
                render(selection);
            });

        tabsEnter
            .append('span')
            .text(function (d) { return t(d.text); });

        tabs = tabs
            .merge(tabsEnter);

        // Update
        wrapper.selectAll('.tab')
            .classed('active', function (d, i) {
                return i === activeTab;
            });


        var shortcuts = shortcutsList
            .selectAll('.shortcut-tab')
            .data(dataShortcuts);

        var shortcutsEnter = shortcuts
            .enter()
            .append('div')
            .attr('class', function(d) { return 'shortcut-tab shortcut-tab-' + d.tab; });

        var columnsEnter = shortcutsEnter
            .selectAll('.shortcut-column')
            .data(function (d) { return d.columns; })
            .enter()
            .append('table')
            .attr('class', 'shortcut-column');

        var rowsEnter = columnsEnter
            .selectAll('.shortcut-row')
            .data(function (d) { return d.rows; })
            .enter()
            .append('tr')
            .attr('class', 'shortcut-row');


        var sectionRows = rowsEnter
            .filter(function (d) { return !d.shortcuts; });

        sectionRows
            .append('td');

        sectionRows
            .append('td')
            .attr('class', 'shortcut-section')
            .append('h3')
            .text(function (d) { return t(d.text); });


        var shortcutRows = rowsEnter
            .filter(function (d) { return d.shortcuts; });

        var shortcutKeys = shortcutRows
            .append('td')
            .attr('class', 'shortcut-keys');

        var modifierKeys = shortcutKeys
            .filter(function (d) { return d.modifiers; });

        modifierKeys
            .selectAll('kbd.modifier')
            .data(function (d) {
                if (detected.os === 'win' && d.text === 'shortcuts.editing.commands.redo') {
                    return ['⌘'];
                } else if (detected.os !== 'mac' && d.text === 'shortcuts.browsing.display_options.fullscreen') {
                    return [];
                } else {
                    return d.modifiers;
                }
            })
            .enter()
            .each(function () {
                var selection = d3.select(this);

                selection
                    .append('kbd')
                    .attr('class', 'modifier')
                    .text(function (d) { return uiCmd.display(d); });

                selection
                    .append('span')
                    .text('+');
            });


        shortcutKeys
            .selectAll('kbd.shortcut')
            .data(function (d) {
                var arr = d.shortcuts;
                if (detected.os === 'win' && d.text === 'shortcuts.editing.commands.redo') {
                    arr = ['Y'];
                } else if (detected.os !== 'mac' && d.text === 'shortcuts.browsing.display_options.fullscreen') {
                    arr = ['F11'];
                }

                return arr.map(function(s) {
                    return {
                        shortcut: s,
                        separator: d.separator
                    };
                });
            })
            .enter()
            .each(function (d, i, nodes) {
                var selection = d3.select(this);
                var click = d.shortcut.toLowerCase().match(/(.*).click/);

                if (click && click[1]) {
                    selection
                        .call(svgIcon('#walkthrough-mouse', 'mouseclick', click[1]));
                } else {
                    selection
                        .append('kbd')
                        .attr('class', 'shortcut')
                        .text(function (d) {
                            var key = d.shortcut;
                            return key.indexOf('.') !== -1 ? uiCmd.display(t(key)) : uiCmd.display(key);
                        });
                }

                if (i < nodes.length - 1) {
                    selection
                        .append('span')
                        .text(d.separator || '\u00a0' + t('shortcuts.or') + '\u00a0');
                }
            });


        shortcutKeys
            .filter(function(d) { return d.gesture; })
            .each(function () {
                var selection = d3.select(this);

                selection
                    .append('span')
                    .text('+');

                selection
                    .append('span')
                    .attr('class', 'gesture')
                    .text(function (d) { return t(d.gesture); });
            });


        shortcutRows
            .append('td')
            .attr('class', 'shortcut-desc')
            .text(function (d) { return d.text ? t(d.text) : '\u00a0'; });


        shortcuts = shortcuts
            .merge(shortcutsEnter);

        // Update
        wrapper.selectAll('.shortcut-tab')
            .style('display', function (d, i) {
                return i === activeTab ? 'flex' : 'none';
            });
    }


    return function(selection, show) {
        savedSelection = selection;
        if (show) {
            modalSelection = uiModal(selection);
            shortcutsModal(modalSelection);
        }
    };
}

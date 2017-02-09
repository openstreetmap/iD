import * as d3 from 'd3';
import { uiCmd } from './cmd';
import { uiModal } from './modal';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';
import { shortcuts as shortcutsData } from '../../data';

export function uiShortcuts() {
    var key = uiCmd('⇧/');
    var activeTab = 0;

    function shortcuts(selection) {
        var modalSelection;

        function show() {
            modalSelection = uiModal(selection);

            modalSelection.select('.modal')
                .attr('class', 'modal fillL col6');

            var shortcutsModal = modalSelection.select('.content');

            shortcutsModal
                .attr('class', 'cf modal-shortcuts');

            shortcutsModal
                .append('div')
                .attr('class', 'modal-section')
                .append('h3')
                .text('Keyboard shortcuts');

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
                .attr('class', 'wrapper');

            var tabsBar = wrapperEnter
                .append('div')
                .attr('class', 'tabs-bar');

            var shortcutsList = wrapperEnter
                .append('div')
                .attr('class', 'shortcuts-list');

            wrapper = wrapper.merge(wrapperEnter);

            var tabs = tabsBar
                .selectAll('.tab')
                .data(shortcutsData);

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
                .text(function (d) { return t(d.desc); });

            tabs = tabs
                .merge(tabsEnter);

            // Update
            wrapper.selectAll('.tab')
                .classed('active', function (d, i) {
                    return i === activeTab;
                });


            var shortcuts = shortcutsList
                .selectAll('.shortcut-tab')
                .data(shortcutsData);

            var shortcutsEnter = shortcuts
                .enter()
                .append('div')
                .attr('class', 'shortcut-tab')
                .on('click', function (d, i) {
                    activeTab = i;
                    render(selection);
                });

            var row = shortcutsEnter
                .selectAll('.shortcut-row')
                .data(function (d) { return d.shortcuts; })
                .enter()
                .append('div')
                .attr('class', 'shortcut-row');

            var shortcutsRow = row
                .append('div')
                .attr('class', 'kbd-row col6');

            shortcutsRow
                .selectAll('kbd')
                .data(function (d) { return d.shortcut; })
                .enter()
                .append('kbd')
                .text(function (d) { return d; });

            row
                .append('div')
                .attr('class', 'shortcut-desc ')
                .text(function (d) { return t(d.key); });

            shortcuts = shortcuts
                .merge(shortcutsEnter);

            // Update
            wrapper.selectAll('.shortcut-tab')
                .style('display', function (d, i) {
                    return i === activeTab ? 'block' : 'none';
                });
        }

        var keybinding = d3keybinding('shortcuts')
            .on(key, function () {
                if (modalSelection) {
                    modalSelection.close();
                    modalSelection = null;
                    return;
                }
                show();
            });

        d3.select(document)
            .call(keybinding);
    }

    return shortcuts;
}

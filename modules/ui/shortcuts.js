import * as d3 from 'd3';
import { uiCmd } from './cmd';
import { uiModal } from './modal';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';
import { dataShortcuts } from '../../data';


export function uiShortcuts() {
    var key = '⇧/';
    var activeTab = 0;
    var modalSelection;
    var savedSelection;
    var keybinding = d3keybinding('shortcuts')
        .on(key, function () {
            if (modalSelection) {
                modalSelection.close();
                modalSelection = null;
                return;
            }
            modalSelection = uiModal(savedSelection);
            shortcutsModal(modalSelection);
        });

    d3.select(document)
        .call(keybinding);


    function shortcutsModal(modalSelection) {
        modalSelection.select('.modal')
        .attr('class', 'modal modal-shortcuts fillL col6');

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
            .attr('class', 'shortcut-tab');

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
            .filter(function (d) { return !d.shortcut; });

        sectionRows
            .append('td');

        sectionRows
            .append('td')
            .attr('class', 'shortcut-section')
            .append('h3')
            .text(function (d) { return t(d.text); });

        var shortcutRows = rowsEnter
            .filter(function (d) { return d.shortcut; });

        shortcutRows
            .append('td')
            .attr('class', 'shortcut-keys')
            .selectAll('kbd')
            .data(function (d) { return d.shortcut; })
            .enter()
            .append('kbd')
            .text(function (d) {
                return d.indexOf('.') !== -1 ? uiCmd(t(d)) : uiCmd(d);
            });

        shortcutRows
            .append('td')
            .attr('class', 'shortcut-desc')
            .text(function (d) { return t(d.text); });


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

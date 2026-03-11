import { select as d3_select } from 'd3-selection';
import { fileFetcher } from '../core/file_fetcher';
import { t } from '../core/localizer';
import { uiModal } from './modal';
import { uiCmdSequence } from './cmd_sequence';


export function uiShortcuts(context) {
    var _activeTab = 0;
    var _modalSelection;
    var _selection = d3_select(null);
    var _dataShortcuts;


    function shortcutsModal(_modalSelection) {
        _modalSelection.select('.modal')
            .classed('modal-shortcuts', true);

        var content = _modalSelection.select('.content');

        content
            .append('div')
            .attr('class', 'modal-section header')
            .append('h2')
            .call(t.append('shortcuts.title'));

        fileFetcher.get('shortcuts')
            .then(function(data) {
                _dataShortcuts = data;
                content.call(render);
            })
            .catch(function() { /* ignore */ });
    }


    function render(selection) {
        if (!_dataShortcuts) return;

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
            .data(_dataShortcuts);

        var tabsEnter = tabs
            .enter()
            .append('a')
            .attr('class', 'tab')
            .attr('href', '#')
            .on('click', function (d3_event, d) {
                d3_event.preventDefault();
                var i = _dataShortcuts.indexOf(d);
                _activeTab = i;
                render(selection);
            });

        tabsEnter
            .append('span')
            .html(function (d) { return t.html(d.text); });

        // Update
        wrapper.selectAll('.tab')
            .classed('active', function (d, i) {
                return i === _activeTab;
            });


        var shortcuts = shortcutsList
            .selectAll('.shortcut-tab')
            .data(_dataShortcuts);

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
            .html(function (d) { return t.html(d.text); });


        var shortcutRows = rowsEnter
            .filter(function (d) { return d.shortcuts; });

        shortcutRows
            .append('td')
            .attr('class', 'shortcut-keys')
            .each(function (d) {
                uiCmdSequence(d)(d3_select(this));
            });



        shortcutRows
            .append('td')
            .attr('class', 'shortcut-desc')
            .html(function (d) { return d.text ? t.html(d.text) : '\u00a0'; });


        // Update
        wrapper.selectAll('.shortcut-tab')
            .style('display', function (d, i) {
                return i === _activeTab ? 'flex' : 'none';
            });
    }


    return function(selection, show) {
        _selection = selection;
        if (show) {
            _modalSelection = uiModal(selection);
            _modalSelection.call(shortcutsModal);
        } else {
            context.keybinding()
                .on([t('shortcuts.toggle.key'), '?'], function () {
                    if (context.container().selectAll('.modal-shortcuts').size()) {  // already showing
                        if (_modalSelection) {
                            _modalSelection.close();
                            _modalSelection = null;
                        }
                    } else {
                        _modalSelection = uiModal(_selection);
                        _modalSelection.call(shortcutsModal);
                    }
                });
        }
    };
}

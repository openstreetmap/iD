import * as d3 from 'd3';
import { uiCmd } from './cmd';
import { uiModal } from './modal';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { dataShortcuts } from '../../data/shortcuts.json';

export function uiShortcuts(context) {
    var key = uiCmd('⇧/');

    function shortcuts(selection) {
        function show() {
            if (!d3.selectAll('.modal').empty()) return;

            var modalSelection = uiModal(selection);

            modalSelection.select('.modal')
                .attr('class', 'modal fillL col6');

            var shortcutsModal = modalSelection.select('.content');

            shortcutsModal
                .attr('class','cf');

            shortcutsModal
                .append('div')
                .attr('class', 'modal-section')
                .append('h3')
                .text('Keyboard shortcuts');

            var section = shortcutsModal
                .selectAll('section')
                .data(dataShortcuts)
                .enter().append('section')
                .attr('class', 'modal-section modal-shortcuts cf');

            section
                .append('h4')
                .text(function(d) { return d.desc; });

            var p = section
                .selectAll('p')
                .data(function(d) { return d.shortcuts; })
                .enter().append('p');

            var shortcuts = p
                .append('span')
                .attr('class', 'col4');

            shortcuts
                .selectAll('kbd')
                .data(function(d) { return d.keys; })
                .enter().append('kbd')
                .text(function(d) { return uiCmd(d); });

            var description  = p
                .append('span')
                .attr('class', 'col8')
                .text(function(d) { return d.desc });
        }

        var keybinding = d3keybinding('shortcuts')
            .on(key, show);

        d3.select(document)
            .call(keybinding);
    }

    return shortcuts;
}

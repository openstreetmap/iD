import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';


export function uiNoteHeader() {
    var _note;


    function noteHeader(selection) {
        var header = selection.selectAll('.note-header')
            .data(
                (_note ? [_note] : []),
                function(d) { return d.status + d.id; }
            );

        header.exit()
            .remove();

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'note-header');

        var iconEnter = headerEnter
            .append('div')
            .attr('class', function(d) { return 'note-header-icon ' + d.status; })
            .classed('new', function(d) { return d.id < 0; });

        iconEnter
            .append('div')
            .attr('class', 'preset-icon-28')
            .call(svgIcon('#iD-icon-note', 'note-fill'));

        iconEnter.each(function(d) {
            var statusIcon;
            if (d.id < 0) {
                statusIcon = '#iD-icon-plus';
            } else if (d.status === 'open') {
                statusIcon = '#iD-icon-close';
            } else {
                statusIcon = '#iD-icon-apply';
            }
            iconEnter
                .append('div')
                .attr('class', 'note-icon-annotation')
                .attr('title', t('icons.close'))
                .call(svgIcon(statusIcon, 'icon-annotation'));
        });

        headerEnter
            .append('div')
            .attr('class', 'note-header-label')
            .each(function(d) {
                const selection = d3_select(this);
                selection.text('');
                if (_note.isNew()) {
                    selection.call(t.append('note.new'));
                } else {
                    selection.call(t.append('note.note'));
                    selection
                        .append('span')
                        .text(` ${d.id} `);
                    if (d.status === 'closed') {
                        selection.call(t.append('note.closed'));
                    }
                }
            });
    }


    noteHeader.note = function(val) {
        if (!arguments.length) return _note;
        _note = val;
        return noteHeader;
    };


    return noteHeader;
}

import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';


export function uiNoteHeader() {
    let _note;


    function noteHeader(selection) {
        const header = selection.selectAll('.note-header')
            .data(
                (_note ? [_note] : []),
                function(d) { return d.status + d.id; }
            );

        header.exit()
            .remove();

        const headerEnter = header.enter()
            .append('div')
            .attr('class', 'note-header');

        const iconEnter = headerEnter
            .append('div')
            .attr('class', function(d) { return 'note-header-icon ' + d.status; })
            .classed('new', function(d) { return d.id < 0; });

        iconEnter
            .append('div')
            .attr('class', 'preset-icon-28')
            .call(svgIcon('#iD-icon-note', 'note-fill'));

        iconEnter.each(function(d) {
            let statusIcon;
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
            .html(function(d) {
                if (_note.isNew()) { return t.html('note.new'); }
                return t.html('note.note') + ' ' + d.id + ' ' +
                    (d.status === 'closed' ? t.html('note.closed') : '');
            });
    }


    noteHeader.note = function(val) {
        if (!arguments.length) return _note;
        _note = val;
        return noteHeader;
    };


    return noteHeader;
}

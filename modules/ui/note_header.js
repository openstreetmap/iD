import { t } from '../util/locale';
import { svgIcon } from '../svg';


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
            var statusIcon = '#iD-icon-' + (d.id < 0 ? 'plus' : (d.status === 'open' ? 'close' : 'apply'));
            iconEnter
                .append('div')
                .attr('class', 'note-icon-annotation')
                .call(svgIcon(statusIcon, 'note-annotation'));
        });

        headerEnter
            .append('div')
            .attr('class', 'note-header-label')
            .text(function(d) {
                if (_note.isNew()) { return t('note.new'); }
                return t('note.note') + ' ' + d.id + ' ' +
                    (d.status === 'closed' ? t('note.closed') : '');
            });
    }


    noteHeader.note = function(_) {
        if (!arguments.length) return _note;
        _note = _;
        return noteHeader;
    };


    return noteHeader;
}

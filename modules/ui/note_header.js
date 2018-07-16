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
            .attr('class', function(d) { return 'note-header-icon ' + d.status; });

        iconEnter
            .append('div')
            .attr('class', 'preset-icon-28')
            .call(svgIcon('#iD-icon-note', 'note-fill'));

        iconEnter.each(function(d) {
            if (d.comments.length > 1) {
                iconEnter
                    .append('div')
                    .attr('class', 'note-icon-annotation')
                    .call(svgIcon('#iD-icon-more', 'note-annotation'));
            }
        });

        headerEnter
            .append('div')
            .attr('class', 'note-header-label')
            .text(function(d) {
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

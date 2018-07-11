import { t } from '../util/locale';
import { svgIcon } from '../svg';


export function uiNoteHeader() {
    var _note;


    function noteHeader(selection) {
        selection.selectAll('.note-header')
            .data([_note], function(d) { return d.id; })
            .enter()
            .append('h3')
            .attr('class', 'note-header')
            .text(function(d) { return String(t('note.note') + ' ' + d.id); });
    }


    noteHeader.note = function(_) {
        if (!arguments.length) return _note;
        _note = _;
        return noteHeader;
    };


    return noteHeader;
}

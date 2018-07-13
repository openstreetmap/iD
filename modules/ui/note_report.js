import { t } from '../util/locale';
import { svgIcon } from '../svg';
import {
    osmNote
} from '../osm';


export function uiNoteReport() {
    var _note;
    var url = 'https://www.openstreetmap.org/reports/new?reportable_id=';

    function noteReport(selection) {

        if (!(_note instanceof osmNote)) return;

        url += _note.id + '&reportable_type=Note';

        var data = ((!_note || _note.isNew()) ? [] : [_note]);
        var link = selection.selectAll('.note-report')
            .data(data, function(d) { return d.id; });

        // exit
        link.exit()
            .remove();

        // enter
        var linkEnter = link.enter()
            .append('a')
            .attr('class', 'note-report')
            .attr('target', '_blank')
            .attr('href', url)
            .call(svgIcon('#iD-icon-out-link', 'inline'));

        linkEnter
            .append('span')
            .text(t('note.report'));
    }


    noteReport.note = function(_) {
        if (!arguments.length) return _note;
        _note = _;
        return noteReport;
    };

    return noteReport;
}

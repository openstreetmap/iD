import { t } from '../core/localizer';
import { osmNote } from '../osm';
import { services } from '../services';
import { svgIcon } from '../svg/icon';


export function uiNoteReport() {
    var _note;

    function noteReport(selection) {
        var url;
        if (services.osm && (_note instanceof osmNote) && (!_note.isNew())) {
            url = services.osm.noteReportURL(_note);
        }

        var link = selection.selectAll('.note-report')
            .data(url ? [url] : []);

        // exit
        link.exit()
            .remove();

        // enter
        var linkEnter = link.enter()
            .append('a')
            .attr('class', 'note-report')
            .attr('target', '_blank')
            .attr('href', function(d) { return d; })
            .call(svgIcon('#iD-icon-out-link', 'inline'));

        linkEnter
            .append('span')
            .text(t('note.report'));
    }


    noteReport.note = function(val) {
        if (!arguments.length) return _note;
        _note = val;
        return noteReport;
    };

    return noteReport;
}

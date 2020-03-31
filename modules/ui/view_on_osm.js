import { t } from '../core/localizer';
import { osmEntity, osmNote } from '../osm';
import { svgIcon } from '../svg/icon';


export function uiViewOnOSM(context) {
    var _what;   // an osmEntity or osmNote


    function viewOnOSM(selection) {
        var url;
        if (_what instanceof osmEntity) {
            url = context.connection().entityURL(_what);
        } else if (_what instanceof osmNote) {
            url = context.connection().noteURL(_what);
        }

        var data = ((!_what || _what.isNew()) ? [] : [_what]);
        var link = selection.selectAll('.view-on-osm')
            .data(data, function(d) { return d.id; });

        // exit
        link.exit()
            .remove();

        // enter
        var linkEnter = link.enter()
            .append('a')
            .attr('class', 'view-on-osm')
            .attr('target', '_blank')
            .attr('href', url)
            .call(svgIcon('#iD-icon-out-link', 'inline'));

        linkEnter
            .append('span')
            .text(t('inspector.view_on_osm'));
    }


    viewOnOSM.what = function(_) {
        if (!arguments.length) return _what;
        _what = _;
        return viewOnOSM;
    };

    return viewOnOSM;
}

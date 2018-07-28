import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { krError } from '../osm';


export function uiViewOnKeepRight(context) {
    var _error;   // a keepright error


    function viewOnKeepRight(selection) {
        var url;
        if (_error instanceof krError) {
            url = context.connection().keepRightURL(_error);
        }

        var data = ((!_error) ? [] : [_error]);
        var link = selection.selectAll('.view-on-keepRight')
            .data(data, function(d) { return d.id; });

        // exit
        link.exit()
            .remove();

        // enter
        var linkEnter = link.enter()
            .append('a')
            .attr('class', 'view-on-keepRight')
            .attr('target', '_blank')
            .attr('href', url)
            .call(svgIcon('#iD-icon-out-link', 'inline'));

        linkEnter
            .append('span')
            .text(t('inspector.view_on_keepRight'));
    }


    viewOnKeepRight.what = function(_) {
        if (!arguments.length) return _error;
        _error = _;
        return viewOnKeepRight;
    };

    return viewOnKeepRight;
}

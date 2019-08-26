import { t } from '../util/locale';
import { services } from '../services';
import { svgIcon } from '../svg/icon';
import { qaError } from '../osm';


export function uiViewOnKeepRight() {
    var _error;   // a keepright error


    function viewOnKeepRight(selection) {
        var url;
        if (services.keepRight && (_error instanceof qaError)) {
            url = services.keepRight.errorURL(_error);
        }

        var link = selection.selectAll('.view-on-keepRight')
            .data(url ? [url] : []);

        // exit
        link.exit()
            .remove();

        // enter
        var linkEnter = link.enter()
            .append('a')
            .attr('class', 'view-on-keepRight')
            .attr('target', '_blank')
            .attr('href', function(d) { return d; })
            .call(svgIcon('#iD-icon-out-link', 'inline'));

        linkEnter
            .append('span')
            .text(t('inspector.view_on_keepRight'));
    }


    viewOnKeepRight.what = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return viewOnKeepRight;
    };

    return viewOnKeepRight;
}
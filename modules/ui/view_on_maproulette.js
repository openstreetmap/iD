import { t } from '../core/localizer';
import { services } from '../services';
import { svgIcon } from '../svg/icon';
import { QAItem } from '../osm';

export function uiViewOnMapRoulette() {
    let _qaItem;

    function viewOnMapRoulette(selection) {
        let url;
        if (services.maproulette && _qaItem instanceof QAItem) {
            url = services.maproulette.issueURL(_qaItem);
        }

        const footer = selection
            .selectAll('.view-on-maproulette')
            .data(url ? [url] : []);

        // exit
        footer.exit().remove();

        // enter
        const linkEnter = footer
            .enter()
            .append('a')
            .attr('class', 'view-on-maproulette')
            .attr('target', '_blank')
            .attr('rel', 'noopener')
            .attr('href', (d) => d)
            .call(svgIcon('#iD-icon-out-link', 'inline'));

        linkEnter
            .append('span')
            .call(t.append('inspector.view_on_maproulette'));
    }

    viewOnMapRoulette.what = function (val) {
        if (!arguments.length) return _qaItem;
        _qaItem = val;
        return viewOnMapRoulette;
    };

    return viewOnMapRoulette;
}

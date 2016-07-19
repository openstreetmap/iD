import { t } from '../util/locale';
import { Icon } from '../svg/index';
export function ViewOnOSM(context) {
    var id;

    function viewOnOSM(selection) {
        var entity = context.entity(id);

        selection.style('display', entity.isNew() ? 'none' : null);

        var $link = selection.selectAll('.view-on-osm')
            .data([0]);

        $link.enter()
            .append('a')
            .attr('class', 'view-on-osm')
            .attr('target', '_blank')
            .call(Icon('#icon-out-link', 'inline'))
            .append('span')
            .text(t('inspector.view_on_osm'));

        $link
            .attr('href', context.connection().entityURL(entity));
    }

    viewOnOSM.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return viewOnOSM;
    };

    return viewOnOSM;
}

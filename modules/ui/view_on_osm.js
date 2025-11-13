import { t } from '../core/localizer';
import { osmEntity, osmNote, osmRelation, osmWay } from '../osm';
import { svgIcon } from '../svg/icon';
import { getRelativeDate } from '../util/date';


export function uiViewOnOSM(context) {
    let _what;   // an osmEntity or osmNote

    function viewOnOSM(selection) {
        let url;

        if (_what instanceof osmEntity) {
            url = context.connection().historyURL(_what);
        } else if (_what instanceof osmNote) {
            url = context.connection().noteURL(_what);
        }

        const data = (!_what || _what.isNew()) ? [] : [_what];
        const link = selection.selectAll('.view-on-osm')
            .data(data, d => d.id);

        link.exit().remove();

        const linkEnter = link.enter()
            .append('a')
            .attr('class', 'view-on-osm')
            .attr('target', '_blank')
            .attr('href', url)
            .attr('aria-label', t('inspector.view_on_osm'))
            .call(svgIcon('#iD-icon-out-link', 'inline'));

        if (_what && !(_what instanceof osmNote)) {
            const last = uiViewOnOSM.findLastModifiedChild(context.history().base(), _what);

            const user = last.user || t('inspector.unknown_user', 'unknown');
            const timeStr = last.timestamp ? getRelativeDate(new Date(last.timestamp)) : t('inspector.unknown_time', 'unknown time');

            linkEnter
                .append('span')
                .attr('class', 'view-on-osm__text')
                .text(`Edited ${timeStr} by ${user}`);

        } else {
            linkEnter
                .append('span')
                .attr('class', 'view-on-osm__text')
                .call(t.append('inspector.view_on_osm'));
        }
    }

    viewOnOSM.what = function(_) {
        if (!arguments.length) return _what;
        _what = _;
        return viewOnOSM;
    };

    return viewOnOSM;
}


/**
 * Finds the most recently modified child entity of a given OSM feature.
 *
 * @param {iD.Graph} graph
 * @param {iD.OsmEntity} feature
 */
uiViewOnOSM.findLastModifiedChild = (graph, feature) => {
    const visited = new Set();
    let latest = feature;

    function recurse(obj) {
        if (!obj || !obj.id || visited.has(obj.id)) return;
        visited.add(obj.id);

        // Compare timestamps safely
        const objTime = obj.timestamp ? new Date(obj.timestamp) : null;
        const latestTime = latest.timestamp ? new Date(latest.timestamp) : null;
        if (objTime && (!latestTime || objTime > latestTime)) {
            latest = obj;
        }

        // Traverse child entities
        if (obj instanceof osmWay && Array.isArray(obj.nodes)) {
            for (const nodeId of obj.nodes) {
                const node = graph.hasEntity(nodeId);
                if (node) recurse(node);
            }
        } else if (obj instanceof osmRelation && Array.isArray(obj.members)) {
            for (const member of obj.members) {
                const memberEntity = graph.hasEntity(member.id);
                if (memberEntity && (memberEntity instanceof osmWay || memberEntity instanceof osmRelation || memberEntity instanceof osmEntity)) {
                    recurse(memberEntity);
                }
            }
        }
    }

    recurse(feature);

    return latest;
};

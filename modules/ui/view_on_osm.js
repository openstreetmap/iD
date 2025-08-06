import { t } from '../core/localizer';
import { osmEntity, osmNote, osmRelation, osmWay } from '../osm';
import { svgIcon } from '../svg/icon';
import { getRelativeDate } from '../util/date';


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


        if (_what && !(_what instanceof osmNote)) {
            // node/way/relation
            const { user, timestamp } = uiViewOnOSM.findLastModifiedChild(context.history().base(), _what);

            linkEnter
                .append('span')
                .text(t('inspector.last_modified', {
                    timeago: getRelativeDate(new Date(timestamp)),
                    user
                }))
                .attr('title', t('inspector.view_on_osm'));
        } else {
            linkEnter
                .append('span')
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
 * @param {iD.Graph} graph
 * @param {iD.OsmEntity} feature
 */
uiViewOnOSM.findLastModifiedChild = (graph, feature) => {
    let latest = feature;

    /** @param {iD.OsmEntity} obj */
    function recurseChilds(obj) {
        if (obj.timestamp > latest.timestamp) {
            latest = obj;
        }
        if (obj instanceof osmWay) {
            obj.nodes
                .map(id => graph.hasEntity(id))
                .filter(Boolean)
                .forEach(recurseChilds);
        } else if (obj instanceof osmRelation) {
            obj.members
                .map(m => graph.hasEntity(m.id))
                .filter(e => e instanceof osmWay || e instanceof osmRelation)
                .forEach(recurseChilds);
        }
    }

    recurseChilds(feature);
    return latest;
};

import type { coreGraph } from '../core';
import { t } from '../core/localizer';
import { OsmAbstractEntity, osmNote, osmRelation, osmWay, type OsmEntity } from '../osm';
import { svgIcon } from '../svg/icon';
import { getRelativeDate } from '../util/date';

type osmNote = any;

type What = OsmEntity | osmNote;

export interface uiViewOnOSM extends d3.Selector {
    what: GetSet<uiViewOnOSM, What>;
}


export function uiViewOnOSM(context:iD.Context) {
    var _what: What;   // an osmEntity or osmNote


    function viewOnOSM(selection: d3.Selection) {
        var url!: string;
        if (_what instanceof OsmAbstractEntity) {
            url = context.connection().historyURL(_what);
        } else if (_what instanceof osmNote) {
            url = context.connection().noteURL(_what);
        }

        var data = ((!_what || _what.isNew()) ? [] : [_what]);
        var link = selection.selectAll<HTMLElement, What>('.view-on-osm')
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
                .call(t.append('inspector.last_touched', {
                    timeago: getRelativeDate(new Date(timestamp!)),
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
    } as uiViewOnOSM['what'];

    return viewOnOSM;
}


uiViewOnOSM.findLastModifiedChild = (graph: coreGraph, feature: OsmEntity) => {
    let latest = feature;

    function recurseChilds(obj: OsmEntity) {
        if (obj.timestamp! > latest.timestamp!) {
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

import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { event as d3_event } from 'd3-selection';
import { geoChooseEdge } from '../geo';
import { modeSelect } from '../modes';


export function uiKeepRightHeader(context) {
    var _error;


    function clickLink(datum) {
        var d = {};

        var entityType =
            datum.object_type === 'node' ? 'n' :
            datum.object_type === 'way' ? 'w' :
            datum.object_type === 'relation' ? 'r' :  null;

        // if an entity has been loaded in the graph, select the entity
        if (context.hasEntity(entityType + datum.object_id)) {
            d = context.hasEntity(entityType + datum.object_id);
        }

        d3_event.preventDefault();
        if (d.location) {
            context.map().centerZoom([d.location[1], d.location[0]], 19);
        }
        else if (d.entity) {
            if (d.entity.type === 'node') {
                context.map().center(d.entity.loc);
            } else if (d.entity.type === 'way') {
                var center = context.projection(context.map().center());
                var edge = geoChooseEdge(context.childNodes(d.entity), center, context.projection);
                context.map().center(edge.loc);
            }
            context.enter(modeSelect(context, [d.entity.id]));
        } else {
            context.layers().layer('osm').enabled(true);
            context.zoomToEntity(entityType + datum.object_id);
            // TODO: select entity that has been zoomed to
        }
    }


    function keepRightHeader(selection) {
        var header = selection.selectAll('.kr_error-header')
            .data(
                (_error ? [_error] : []),
                function(d) { return d.id; }
            );

        header.exit()
            .remove();

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'kr_error-header');

        var iconEnter = headerEnter
            .append('div')
            .attr('class', function(d) { return 'kr_error-header-icon '; })
            .classed('new', function(d) { return d.id < 0; });

        iconEnter
            .append('div')
            .attr('class', function(d) {
                return 'preset-icon-28 kr_error kr_error-' + d.id + ' kr_error_type_' + d.error_type;
            })

            .call(svgIcon('#iD-icon-bolt', 'kr_error-fill'));

        headerEnter
            .append('div')
            .attr('class', 'kr_error-header-label')
            .text(function(d) { return t('QA.keepRight.entities.' + d.object_type) + ' '; })
            .append('span')
            .append('a')
            .text(function(d) { return d.object_id; })
            .on('click', function(d) { clickLink(d); } );
    }


    keepRightHeader.error = function(_) {
        if (!arguments.length) return _error;
        _error = _;
        return keepRightHeader;
    };


    return keepRightHeader;
}

import {
    geoLength as d3_geoLength,
    geoPath as d3_geoPath
} from 'd3-geo';

import { t, localizer } from '../../core/localizer';
import { displayArea, displayLength, decimalCoordinatePair, dmsCoordinatePair } from '../../util/units';
import { geoExtent, geoSphericalDistance } from '../../geo';
import { services } from '../../services';
import { utilGetAllNodes } from '../../util';

export function uiPanelMeasurement(context) {

    function radiansToMeters(r) {
        // using WGS84 authalic radius (6371007.1809 m)
        return r * 6371007.1809;
    }

    function steradiansToSqmeters(r) {
        // http://gis.stackexchange.com/a/124857/40446
        return r / (4 * Math.PI) * 510065621724000;
    }


    function toLineString(feature) {
        if (feature.type === 'LineString') return feature;

        var result = { type: 'LineString', coordinates: [] };
        if (feature.type === 'Polygon') {
            result.coordinates = feature.coordinates[0];
        } else if (feature.type === 'MultiPolygon') {
            result.coordinates = feature.coordinates[0][0];
        }

        return result;
    }

    var _isImperial = !localizer.usesMetric();

    function redraw(selection) {
        var graph = context.graph();
        var selectedNoteID = context.selectedNoteID();
        var osm = services.osm;

        var localeCode = localizer.localeCode();

        var heading;
        var center, location, centroid;
        var closed, geometry;
        var totalNodeCount, length = 0, area = 0, distance;

        if (selectedNoteID && osm) {       // selected 1 note

            var note = osm.getNote(selectedNoteID);
            heading = t.html('note.note') + ' ' + selectedNoteID;
            location = note.loc;
            geometry = 'note';

        } else {                           // selected 1..n entities
            var selectedIDs = context.selectedIDs().filter(function(id) {
                return context.hasEntity(id);
            });
            var selected = selectedIDs.map(function(id) {
                return context.entity(id);
            });

            heading = selected.length === 1 ? selected[0].id :
                t.html('info_panels.selected', { n: selected.length });

            if (selected.length) {
                var extent = geoExtent();
                for (var i in selected) {
                    var entity = selected[i];
                    extent._extend(entity.extent(graph));

                    geometry = entity.geometry(graph);
                    if (geometry === 'line' || geometry === 'area') {
                        closed = (entity.type === 'relation') || (entity.isClosed() && !entity.isDegenerate());
                        var feature = entity.asGeoJSON(graph);
                        length += radiansToMeters(d3_geoLength(toLineString(feature)));
                        centroid = d3_geoPath(context.projection).centroid(entity.asGeoJSON(graph));
                        centroid = centroid && context.projection.invert(centroid);
                        if (!centroid  || !isFinite(centroid[0]) || !isFinite(centroid[1])) {
                            centroid = entity.extent(graph).center();
                        }
                        if (closed) {
                            area += steradiansToSqmeters(entity.area(graph));
                        }
                    }
                }

                if (selected.length > 1) {
                    geometry = null;
                    closed = null;
                    centroid = null;
                }

                if (selected.length === 2 &&
                    selected[0].type === 'node' &&
                    selected[1].type === 'node') {
                    distance = geoSphericalDistance(selected[0].loc, selected[1].loc);
                }

                if (selected.length === 1 && selected[0].type === 'node') {
                    location = selected[0].loc;
                } else {
                    totalNodeCount = utilGetAllNodes(selectedIDs, context.graph()).length;
                }

                if (!location && !centroid) {
                    center = extent.center();
                }
            }
        }

        selection.html('');

        if (heading) {
            selection
                .append('h4')
                .attr('class', 'measurement-heading')
                .html(heading);
        }

        var list = selection
            .append('ul');
        var coordItem;

        if (geometry) {
            list
                .append('li')
                .call(t.append('info_panels.measurement.geometry', { suffix: ':' }))
                .append('span')
                .html(
                    closed ? t.html('info_panels.measurement.closed_' + geometry) : t.html('geometry.' + geometry)
                );
        }

        if (totalNodeCount) {
            list
                .append('li')
                .call(t.append('info_panels.measurement.node_count', { suffix: ':' }))
                .append('span')
                .text(totalNodeCount.toLocaleString(localeCode));
        }

        if (area) {
            list
                .append('li')
                .call(t.append('info_panels.measurement.area', { suffix: ':' }))
                .append('span')
                .text(displayArea(area, _isImperial));
        }

        if (length) {
            list
                .append('li')
                .call(t.append('info_panels.measurement.' + (closed ? 'perimeter' : 'length'), { suffix: ':' }))
                .append('span')
                .text(displayLength(length, _isImperial));
        }

        if (typeof distance === 'number') {
            list
                .append('li')
                .call(t.append('info_panels.measurement.distance', { suffix: ':' }))
                .append('span')
                .text(displayLength(distance, _isImperial));
        }

        if (location) {
            coordItem = list
                .append('li')
                .call(t.append('info_panels.measurement.location', { suffix: ':' }));
            coordItem.append('span')
                .text(dmsCoordinatePair(location));
            coordItem.append('span')
                .text(decimalCoordinatePair(location));
        }

        if (centroid) {
            coordItem = list
                .append('li')
                .call(t.append('info_panels.measurement.centroid', { suffix: ':' }));
            coordItem.append('span')
                .text(dmsCoordinatePair(centroid));
            coordItem.append('span')
                .text(decimalCoordinatePair(centroid));
        }

        if (center) {
            coordItem = list
                .append('li')
                .call(t.append('info_panels.measurement.center', { suffix: ':' }));
            coordItem.append('span')
                .text(dmsCoordinatePair(center));
            coordItem.append('span')
                .text(decimalCoordinatePair(center));
        }

        if (length || area || typeof distance === 'number') {
            var toggle  = _isImperial ? 'imperial' : 'metric';
            selection
                .append('a')
                .call(t.append('info_panels.measurement.' + toggle))
                .attr('href', '#')
                .attr('class', 'button button-toggle-units')
                .on('click', function(d3_event) {
                    d3_event.preventDefault();
                    _isImperial = !_isImperial;
                    selection.call(redraw);
                });
        }
    }


    var panel = function(selection) {
        selection.call(redraw);

        context.map()
            .on('drawn.info-measurement', function() {
                selection.call(redraw);
            });

        context
            .on('enter.info-measurement', function() {
                selection.call(redraw);
            });
    };

    panel.off = function() {
        context.map().on('drawn.info-measurement', null);
        context.on('enter.info-measurement', null);
    };

    panel.id = 'measurement';
    panel.label = t.append('info_panels.measurement.title');
    panel.key = t('info_panels.measurement.key');


    return panel;
}

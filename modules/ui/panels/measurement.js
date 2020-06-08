import { event as d3_event } from 'd3-selection';

import {
    geoLength as d3_geoLength,
    geoCentroid as d3_geoCentroid
} from 'd3-geo';

import { t, localizer } from '../../core/localizer';
import { displayArea, displayLength, decimalCoordinatePair, dmsCoordinatePair } from '../../util/units';
import { geoExtent } from '../../geo';
import { services } from '../../services';
import { utilGetAllNodes } from '../../util';

export function uiPanelMeasurement(context) {
    var locale = localizer.localeCode();
    var isImperial = !localizer.usesMetric();


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


    function redraw(selection) {
        var graph = context.graph();
        var selectedNoteID = context.selectedNoteID();
        var osm = services.osm;

        var heading;
        var center, location, centroid;
        var closed, geometry;
        var totalNodeCount, length = 0, area = 0;

        if (selectedNoteID && osm) {       // selected 1 note

            var note = osm.getNote(selectedNoteID);
            heading = t('note.note') + ' ' + selectedNoteID;
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
                t('info_panels.measurement.selected', { n: selected.length.toLocaleString(locale) });

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
                        centroid = d3_geoCentroid(feature);
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
                .text(heading);
        }

        var list = selection
            .append('ul');
        var coordItem;

        if (geometry) {
            list
                .append('li')
                .text(t('info_panels.measurement.geometry') + ':')
                .append('span')
                .text(
                    closed ? t('info_panels.measurement.closed_' + geometry) : t('geometry.' + geometry)
                );
        }

        if (totalNodeCount) {
            list
                .append('li')
                .text(t('info_panels.measurement.node_count') + ':')
                .append('span')
                .text(totalNodeCount.toLocaleString(locale));
        }

        if (area) {
            list
                .append('li')
                .text(t('info_panels.measurement.area') + ':')
                .append('span')
                .text(displayArea(area, isImperial));
        }

        if (length) {
            var lengthLabel = t('info_panels.measurement.' + (closed ? 'perimeter' : 'length'));
            list
                .append('li')
                .text(lengthLabel + ':')
                .append('span')
                .text(displayLength(length, isImperial));
        }

        if (location) {
            coordItem = list
                .append('li')
                .text(t('info_panels.measurement.location') + ':');
            coordItem.append('span')
                .text(dmsCoordinatePair(location));
            coordItem.append('span')
                .text(decimalCoordinatePair(location));
        }

        if (centroid) {
            coordItem = list
                .append('li')
                .text(t('info_panels.measurement.centroid') + ':');
            coordItem.append('span')
                .text(dmsCoordinatePair(centroid));
            coordItem.append('span')
                .text(decimalCoordinatePair(centroid));
        }

        if (center) {
            coordItem = list
                .append('li')
                .text(t('info_panels.measurement.center') + ':');
            coordItem.append('span')
                .text(dmsCoordinatePair(center));
            coordItem.append('span')
                .text(decimalCoordinatePair(center));
        }

        if (length || area) {
            var toggle  = isImperial ? 'imperial' : 'metric';
            selection
                .append('a')
                .text(t('info_panels.measurement.' + toggle))
                .attr('href', '#')
                .attr('class', 'button button-toggle-units')
                .on('click', function() {
                    d3_event.preventDefault();
                    isImperial = !isImperial;
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
    panel.title = t('info_panels.measurement.title');
    panel.key = t('info_panels.measurement.key');


    return panel;
}

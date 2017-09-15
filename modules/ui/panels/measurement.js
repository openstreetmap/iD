import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';
import { geoExtent } from '../../geo';
import { utilDetect } from '../../util/detect';

import {
    geoLength as d3GeoLength,
    geoCentroid as d3GeoCentroid
} from 'd3';


export function uiPanelMeasurement(context) {
    var isImperial = (utilDetect().locale.toLowerCase() === 'en-us');
    var OSM_PRECISION = 7;


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


    function displayLength(m) {
        var d = m * (isImperial ? 3.28084 : 1),
            p, unit;

        if (isImperial) {
            if (d >= 5280) {
                d /= 5280;
                unit = 'mi';
            } else {
                unit = 'ft';
            }
        } else {
            if (d >= 1000) {
                d /= 1000;
                unit = 'km';
            } else {
                unit = 'm';
            }
        }

        // drop unnecessary precision
        p = d > 1000 ? 0 : d > 100 ? 1 : 2;

        return String(d.toFixed(p)) + ' ' + unit;
    }


    function displayArea(m2) {
        var d = m2 * (isImperial ? 10.7639111056 : 1),
            d1, d2, p1, p2, unit1, unit2;

        if (isImperial) {
            if (d >= 6969600) {     // > 0.25mi² show mi²
                d1 = d / 27878400;
                unit1 = 'mi²';
            } else {
                d1 = d;
                unit1 = 'ft²';
            }

            if (d > 4356 && d < 43560000) {   // 0.1 - 1000 acres
                d2 = d / 43560;
                unit2 = 'ac';
            }

        } else {
            if (d >= 250000) {    // > 0.25km² show km²
                d1 = d / 1000000;
                unit1 = 'km²';
            } else {
                d1 = d;
                unit1 = 'm²';
            }

            if (d > 1000 && d < 10000000) {   // 0.1 - 1000 hectares
                d2 = d / 10000;
                unit2 = 'ha';
            }
        }

        // drop unnecessary precision
        p1 = d1 > 1000 ? 0 : d1 > 100 ? 1 : 2;
        p2 = d2 > 1000 ? 0 : d2 > 100 ? 1 : 2;

        return String(d1.toFixed(p1)) + ' ' + unit1 +
            (d2 ? ' (' + String(d2.toFixed(p2)) + ' ' + unit2 + ')' : '');
    }


    function redraw(selection) {
        var resolver = context.graph(),
            selected = _.filter(context.selectedIDs(), function(e) { return context.hasEntity(e); }),
            singular = selected.length === 1 ? selected[0] : null,
            extent = geoExtent(),
            entity;

        selection.html('');

        selection
            .append('h4')
            .attr('class', 'measurement-heading')
            .text(singular || t('info_panels.measurement.selected', { n: selected.length }));

        if (!selected.length) return;

        var center;
        for (var i = 0; i < selected.length; i++) {
            entity = context.entity(selected[i]);
            extent._extend(entity.extent(resolver));
        }
        center = extent.center();


        var list = selection
            .append('ul');

        // multiple features, just display extent center..
        if (!singular) {
            list
                .append('li')
                .text(t('info_panels.measurement.center') + ': ' +
                    center[1].toFixed(OSM_PRECISION) + ', ' + center[0].toFixed(OSM_PRECISION)
                );
            return;
        }

        // single feature, display details..
        if (!entity) return;
        var geometry = entity.geometry(resolver);

        if (geometry === 'line' || geometry === 'area') {
            var closed = (entity.type === 'relation') || (entity.isClosed() && !entity.isDegenerate()),
                feature = entity.asGeoJSON(resolver),
                length = radiansToMeters(d3GeoLength(toLineString(feature))),
                lengthLabel = t('info_panels.measurement.' + (closed ? 'perimeter' : 'length')),
                centroid = d3GeoCentroid(feature);

            list
                .append('li')
                .text(t('info_panels.measurement.geometry') + ': ' +
                    (closed ? t('info_panels.measurement.closed') + ' ' : '') + t('geometry.' + geometry) );

            if (closed) {
                var area = steradiansToSqmeters(entity.area(resolver));
                list
                    .append('li')
                    .text(t('info_panels.measurement.area') + ': ' + displayArea(area));
            }

            list
                .append('li')
                .text(lengthLabel + ': ' + displayLength(length));

            list
                .append('li')
                .text(t('info_panels.measurement.centroid') + ': ' +
                    centroid[1].toFixed(OSM_PRECISION) + ', ' + centroid[0].toFixed(OSM_PRECISION)
                );


            var toggle  = isImperial ? 'imperial' : 'metric';

            selection
                .append('a')
                .text(t('info_panels.measurement.' + toggle))
                .attr('href', '#')
                .attr('class', 'button button-toggle-units')
                .on('click', function() {
                    d3.event.preventDefault();
                    isImperial = !isImperial;
                    selection.call(redraw);
                });

        } else {
            var centerLabel = t('info_panels.measurement.' + (entity.type === 'node' ? 'location' : 'center'));

            list
                .append('li')
                .text(t('info_panels.measurement.geometry') + ': ' + t('geometry.' + geometry));

            list
                .append('li')
                .text(centerLabel + ': ' +
                    center[1].toFixed(OSM_PRECISION) + ', ' + center[0].toFixed(OSM_PRECISION)
                );
        }
    }


    var panel = function(selection) {
        selection.call(redraw);

        context.map()
            .on('drawn.info-measurement', function() {
                selection.call(redraw);
            });
    };

    panel.off = function() {
        context.map()
            .on('drawn.info-measurement', null);
    };

    panel.id = 'measurement';
    panel.title = t('info_panels.measurement.title');
    panel.key = t('info_panels.measurement.key');


    return panel;
}

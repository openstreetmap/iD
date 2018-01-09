import _filter from 'lodash-es/filter';

import { event as d3_event } from 'd3-selection';

import {
    geoLength as d3_geoLength,
    geoCentroid as d3_geoCentroid
} from 'd3-geo';

import { t } from '../../util/locale';
import { geoExtent } from '../../geo';
import { utilDetect } from '../../util/detect';



export function uiPanelMeasurement(context) {
    var locale = utilDetect().locale,
        isImperial = (locale.toLowerCase() === 'en-us');
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

    function nodeCount(feature) {
      if (feature.type === 'LineString') return feature.coordinates.length;

      if (feature.type === 'Polygon') {
          return feature.coordinates[0].length - 1;
      }
    }


    function displayLength(m) {
        var d = m * (isImperial ? 3.28084 : 1),
            unit;

        if (isImperial) {
            if (d >= 5280) {
                d /= 5280;
                unit = 'miles';
            } else {
                unit = 'feet';
            }
        } else {
            if (d >= 1000) {
                d /= 1000;
                unit = 'kilometers';
            } else {
                unit = 'meters';
            }
        }

        return t('units.' + unit, {
            quantity: d.toLocaleString(locale, { maximumSignificantDigits: 4 })
        });
    }


    function displayArea(m2) {
        var d = m2 * (isImperial ? 10.7639111056 : 1),
            d1, d2, unit1, unit2, area;

        if (isImperial) {
            if (d >= 6969600) {     // > 0.25mi² show mi²
                d1 = d / 27878400;
                unit1 = 'square_miles';
            } else {
                d1 = d;
                unit1 = 'square_feet';
            }

            if (d > 4356 && d < 43560000) {   // 0.1 - 1000 acres
                d2 = d / 43560;
                unit2 = 'acres';
            }

        } else {
            if (d >= 250000) {    // > 0.25km² show km²
                d1 = d / 1000000;
                unit1 = 'square_kilometers';
            } else {
                d1 = d;
                unit1 = 'square_meters';
            }

            if (d > 1000 && d < 10000000) {   // 0.1 - 1000 hectares
                d2 = d / 10000;
                unit2 = 'hectares';
            }
        }

        area = t('units.' + unit1, {
            quantity: d1.toLocaleString(locale, { maximumSignificantDigits: 4 })
        });

        if (d2) {
            return t('info_panels.measurement.area_pair', {
                area1: area,
                area2: t('units.' + unit2, {
                    quantity: d2.toLocaleString(locale, { maximumSignificantDigits: 2 })
                })
            });
        } else {
            return area;
        }
    }


    function redraw(selection) {
        var resolver = context.graph();
        var selected = _filter(context.selectedIDs(), function(e) { return context.hasEntity(e); });
        var singular = selected.length === 1 ? selected[0] : null;
        var extent = geoExtent();
        var entity;

        selection.html('');

        selection
            .append('h4')
            .attr('class', 'measurement-heading')
            .text(singular || t('info_panels.measurement.selected', { n: selected.length.toLocaleString(locale) }));

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
                .text(t('info_panels.measurement.center') + ':')
                .append('span')
                .text(
                    t('info_panels.measurement.coordinate_pair', {
                        latitude: center[1].toLocaleString(locale, { maximumFractionDigits: OSM_PRECISION }),
                        longitude: center[0].toLocaleString(locale, { maximumFractionDigits: OSM_PRECISION })
                    })
                );
            return;
        }

        // single feature, display details..
        if (!entity) return;
        var geometry = entity.geometry(resolver);

        if (geometry === 'line' || geometry === 'area') {
            var closed = (entity.type === 'relation') || (entity.isClosed() && !entity.isDegenerate()),
                feature = entity.asGeoJSON(resolver),
                length = radiansToMeters(d3_geoLength(toLineString(feature))),
                lengthLabel = t('info_panels.measurement.' + (closed ? 'perimeter' : 'length')),
                centroid = d3_geoCentroid(feature);

            list
                .append('li')
                .text(t('info_panels.measurement.geometry') + ':')
                .append('span')
                .text(
                    (closed ? t('info_panels.measurement.closed') + ' ' : '') + t('geometry.' + geometry)
                );

            if (entity.type !== 'relation') {
                list
                    .append('li')
                    .text(t('info_panels.measurement.node_count') + ':')
                    .append('span')
                    .text(nodeCount(feature).toLocaleString(locale));
            }

            if (closed) {
                var area = steradiansToSqmeters(entity.area(resolver));
                list
                    .append('li')
                    .text(t('info_panels.measurement.area') + ':')
                    .append('span')
                    .text(displayArea(area));
            }


            list
                .append('li')
                .text(lengthLabel + ':')
                .append('span')
                .text(displayLength(length));

            list
                .append('li')
                .text(t('info_panels.measurement.centroid') + ':')
                .append('span')
                .text(
                    t('info_panels.measurement.coordinate_pair', {
                        latitude: centroid[1].toLocaleString(locale, { maximumFractionDigits: OSM_PRECISION }),
                        longitude: centroid[0].toLocaleString(locale, { maximumFractionDigits: OSM_PRECISION })
                    })
                );

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

        } else {
            var centerLabel = t('info_panels.measurement.' + (entity.type === 'node' ? 'location' : 'center'));

            list
                .append('li')
                .text(t('info_panels.measurement.geometry') + ':')
                .append('span')
                .text(t('geometry.' + geometry));

            list
                .append('li')
                .text(centerLabel + ':')
                .append('span')
                .text(
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

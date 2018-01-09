import _filter from 'lodash-es/filter';

import { event as d3_event } from 'd3-selection';

import {
    geoLength as d3_geoLength,
    geoCentroid as d3_geoCentroid
} from 'd3-geo';

import { t } from '../../util/locale';
import { displayArea, displayLength, decimalCoordinatePair, dmsCoordinatePair } from '../../util/units';
import { geoExtent } from '../../geo';
import { utilDetect } from '../../util/detect';



export function uiPanelMeasurement(context) {
    var locale = utilDetect().locale,
        isImperial = (locale.toLowerCase() === 'en-us');


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
        var coordItem;

        // multiple features, just display extent center..
        if (!singular) {
            coordItem = list
                .append('li')
                .text(t('info_panels.measurement.center') + ':');
            coordItem.append('span')
                .text(dmsCoordinatePair(center));
            coordItem.append('span')
                .text(decimalCoordinatePair(center));
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
                    closed ? t('info_panels.measurement.closed_' + geometry) : t('geometry.' + geometry)
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
                    .text(displayArea(area, isImperial));
            }


            list
                .append('li')
                .text(lengthLabel + ':')
                .append('span')
                .text(displayLength(length, isImperial));

            coordItem = list
                .append('li')
                .text(t('info_panels.measurement.centroid') + ':');
            coordItem.append('span')
                .text(dmsCoordinatePair(centroid));
            coordItem.append('span')
                .text(decimalCoordinatePair(centroid));

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

            coordItem = list
                .append('li')
                .text(centerLabel + ':');
            coordItem.append('span')
                .text(dmsCoordinatePair(center));
            coordItem.append('span')
                .text(decimalCoordinatePair(center));
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

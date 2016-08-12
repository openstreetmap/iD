import { d3keybinding } from '../../js/lib/d3.keybinding.js';
import * as d3 from 'd3';
import { t } from '../util/locale';
import _ from 'lodash';
import { Detect } from '../util/detect';
import { Extent } from '../geo/index';
import { cmd } from './cmd';

export function Info(context) {
    var key = cmd('⌘I'),
        imperial = (Detect().locale.toLowerCase() === 'en-us'),
        hidden = true;

    function info(selection) {
        function radiansToMeters(r) {
            // using WGS84 authalic radius (6371007.1809 m)
            return r * 6371007.1809;
        }

        function steradiansToSqmeters(r) {
            // http://gis.stackexchange.com/a/124857/40446
            return r / 12.56637 * 510065621724000;
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
            var d = m * (imperial ? 3.28084 : 1),
                p, unit;

            if (imperial) {
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
            var d = m2 * (imperial ? 10.7639111056 : 1),
                d1, d2, p1, p2, unit1, unit2;

            if (imperial) {
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


        function redraw() {
            if (hidden) return;

            var resolver = context.graph(),
                selected = _.filter(context.selectedIDs(), function(e) { return context.hasEntity(e); }),
                singular = selected.length === 1 ? selected[0] : null,
                extent = Extent(),
                entity;

            wrap.html('');
            wrap.append('h4')
                .attr('class', 'infobox-heading fillD')
                .text(singular || t('infobox.selected', { n: selected.length }));

            if (!selected.length) return;

            var center;
            for (var i = 0; i < selected.length; i++) {
                entity = context.entity(selected[i]);
                extent._extend(entity.extent(resolver));
            }
            center = extent.center();


            var list = wrap.append('ul');

            // multiple wrap, just display extent center..
            if (!singular) {
                list.append('li')
                    .text(t('infobox.center') + ': ' + center[0].toFixed(5) + ', ' + center[1].toFixed(5));
                return;
            }

            // single wrap, display details..
            if (!entity) return;
            var geometry = entity.geometry(resolver);

            if (geometry === 'line' || geometry === 'area') {
                var closed = (entity.type === 'relation') || (entity.isClosed() && !entity.isDegenerate()),
                    feature = entity.asGeoJSON(resolver),
                    length = radiansToMeters(d3.geoLength(toLineString(feature))),
                    lengthLabel = t('infobox.' + (closed ? 'perimeter' : 'length')),
                    centroid = d3.geoCentroid(feature);

                list.append('li')
                    .text(t('infobox.geometry') + ': ' +
                        (closed ? t('infobox.closed') + ' ' : '') + t('geometry.' + geometry) );

                if (closed) {
                    var area = steradiansToSqmeters(entity.area(resolver));
                    list.append('li')
                        .text(t('infobox.area') + ': ' + displayArea(area));
                }

                list.append('li')
                    .text(lengthLabel + ': ' + displayLength(length));

                list.append('li')
                    .text(t('infobox.centroid') + ': ' + centroid[0].toFixed(5) + ', ' + centroid[1].toFixed(5));


                var toggle  = imperial ? 'imperial' : 'metric';
                wrap.append('a')
                    .text(t('infobox.' + toggle))
                    .attr('href', '#')
                    .attr('class', 'button')
                    .on('click', function() {
                        d3.event.preventDefault();
                        imperial = !imperial;
                        redraw();
                    });

            } else {
                var centerLabel = t('infobox.' + (entity.type === 'node' ? 'location' : 'center'));

                list.append('li')
                    .text(t('infobox.geometry') + ': ' + t('geometry.' + geometry));

                list.append('li')
                    .text(centerLabel + ': ' + center[0].toFixed(5) + ', ' + center[1].toFixed(5));
            }
        }


        function toggle() {
            if (d3.event) d3.event.preventDefault();

            hidden = !hidden;

            if (hidden) {
                wrap
                    .style('display', 'block')
                    .style('opacity', 1)
                    .transition()
                    .duration(200)
                    .style('opacity', 0)
                    .each('end', function() {
                        d3.select(this).style('display', 'none');
                    });
            } else {
                wrap
                    .style('display', 'block')
                    .style('opacity', 0)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);

                redraw();
            }
        }


        var wrap = selection.selectAll('.infobox')
            .data([0]);

        wrap.enter()
            .append('div')
            .attr('class', 'infobox fillD2')
            .style('display', (hidden ? 'none' : 'block'));

        context.map()
            .on('drawn.info', redraw);

        redraw();

        var keybinding = d3keybinding('info')
            .on(key, toggle);

        d3.select(document)
            .call(keybinding);
    }

    return info;
}

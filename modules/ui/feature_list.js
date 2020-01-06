import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import * as sexagesimal from '@mapbox/sexagesimal';
import { t } from '../util/locale';
import { dmsCoordinatePair } from '../util/units';
import { coreGraph } from '../core/graph';
import { geoSphericalDistance } from '../geo/geo';
import { geoExtent, geoChooseEdge } from '../geo';
import { modeSelect } from '../modes/select';
import { osmEntity } from '../osm/entity';
import { services } from '../services';
import { svgIcon } from '../svg/icon';
import { uiCmd } from './cmd';

import {
    utilDisplayName,
    utilDisplayType,
    utilEntityOrMemberSelector,
    utilNoAuto
} from '../util';


export function uiFeatureList(context) {
    var _geocodeResults;


    function featureList(selection) {
        var header = selection
            .append('div')
            .attr('class', 'header fillL cf');

        header
            .append('h3')
            .text(t('inspector.feature_list'));

        var searchWrap = selection
            .append('div')
            .attr('class', 'search-header');

        var search = searchWrap
            .append('input')
            .attr('placeholder', t('inspector.search'))
            .attr('type', 'search')
            .call(utilNoAuto)
            .on('keypress', keypress)
            .on('keydown', keydown)
            .on('input', inputevent);

        searchWrap
            .call(svgIcon('#iD-icon-search', 'pre-text'));

        var listWrap = selection
            .append('div')
            .attr('class', 'inspector-body');

        var list = listWrap
            .append('div')
            .attr('class', 'feature-list cf');

        context
            .on('exit.feature-list', clearSearch);
        context.map()
            .on('drawn.feature-list', mapDrawn);

        context.keybinding()
            .on(uiCmd('⌘F'), focusSearch);


        function focusSearch() {
            var mode = context.mode() && context.mode().id;
            if (mode !== 'browse') return;

            d3_event.preventDefault();
            search.node().focus();
        }


        function keydown() {
            if (d3_event.keyCode === 27) {  // escape
                search.node().blur();
            }
        }


        function keypress() {
            var q = search.property('value'),
                items = list.selectAll('.feature-list-item');
            if (d3_event.keyCode === 13 && q.length && items.size()) {  // return
                click(items.datum());
            }
        }


        function inputevent() {
            _geocodeResults = undefined;
            drawList();
        }


        function clearSearch() {
            search.property('value', '');
            drawList();
        }


        function mapDrawn(e) {
            if (e.full) {
                drawList();
            }
        }


        function features() {
            var result = [];
            var graph = context.graph();
            var visibleCenter = context.map().extent().center();
            var q = search.property('value').toLowerCase();

            if (!q) return result;

            var idMatch = q.match(/^([nwr])([0-9]+)$/);

            if (idMatch) {
                result.push({
                    id: idMatch[0],
                    geometry: idMatch[1] === 'n' ? 'point' : idMatch[1] === 'w' ? 'line' : 'relation',
                    type: idMatch[1] === 'n' ? t('inspector.node') : idMatch[1] === 'w' ? t('inspector.way') : t('inspector.relation'),
                    name: idMatch[2]
                });
            }

            var locationMatch = sexagesimal.pair(q.toUpperCase()) || q.match(/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/);

            if (locationMatch) {
                var loc = [parseFloat(locationMatch[0]), parseFloat(locationMatch[1])];
                result.push({
                    id: -1,
                    geometry: 'point',
                    type: t('inspector.location'),
                    name: dmsCoordinatePair([loc[1], loc[0]]),
                    location: loc
                });
            }

            var allEntities = graph.entities;
            var localResults = [];
            for (var id in allEntities) {
                var entity = allEntities[id];
                if (!entity) continue;

                var name = utilDisplayName(entity) || '';
                if (name.toLowerCase().indexOf(q) < 0) continue;
                
                var matched = context.presets().match(entity, graph);
                var type = (matched && matched.name()) || utilDisplayType(entity.id);
                var extent = entity.extent(graph);
                var distance = extent ? geoSphericalDistance(visibleCenter, extent.center()) : 0;

                localResults.push({
                    id: entity.id,
                    entity: entity,
                    geometry: context.geometry(entity.id),
                    type: type,
                    name: name,
                    distance: distance
                });

                if (localResults.length > 100) break;
            }
            localResults = localResults.sort(function byDistance(a, b) {
                return a.distance - b.distance;
            });
            result = result.concat(localResults);

            (_geocodeResults || []).forEach(function(d) {
                if (d.osm_type && d.osm_id) {    // some results may be missing these - #1890

                    // Make a temporary osmEntity so we can preset match
                    // and better localize the search result - #4725
                    var id = osmEntity.id.fromOSM(d.osm_type, d.osm_id);
                    var tags = {};
                    tags[d.class] = d.type;

                    var attrs = { id: id, type: d.osm_type, tags: tags };
                    if (d.osm_type === 'way') {   // for ways, add some fake closed nodes
                        attrs.nodes = ['a','a'];  // so that geometry area is possible
                    }

                    var tempEntity = osmEntity(attrs);
                    var tempGraph = coreGraph([tempEntity]);
                    var matched = context.presets().match(tempEntity, tempGraph);
                    var type = (matched && matched.name()) || utilDisplayType(id);

                    result.push({
                        id: tempEntity.id,
                        geometry: tempEntity.geometry(tempGraph),
                        type: type,
                        name: d.display_name,
                        extent: new geoExtent(
                            [parseFloat(d.boundingbox[3]), parseFloat(d.boundingbox[0])],
                            [parseFloat(d.boundingbox[2]), parseFloat(d.boundingbox[1])])
                    });
                }
            });

            if (q.match(/^[0-9]+$/)) {
                // if query is just a number, possibly an OSM ID without a prefix
                result.push({
                    id: 'n' + q,
                    geometry: 'point',
                    type: t('inspector.node'),
                    name: q
                });
                result.push({
                    id: 'w' + q,
                    geometry: 'line',
                    type: t('inspector.way'),
                    name: q
                });
                result.push({
                    id: 'r' + q,
                    geometry: 'relation',
                    type: t('inspector.relation'),
                    name: q
                });
            }

            return result;
        }


        function drawList() {
            var value = search.property('value');
            var results = features();

            list.classed('filtered', value.length);

            var resultsIndicator = list.selectAll('.no-results-item')
                .data([0])
                .enter()
                .append('button')
                .property('disabled', true)
                .attr('class', 'no-results-item')
                .call(svgIcon('#iD-icon-alert', 'pre-text'));

            resultsIndicator.append('span')
                .attr('class', 'entity-name');

            list.selectAll('.no-results-item .entity-name')
                .text(t('geocoder.no_results_worldwide'));

            if (services.geocoder) {
              list.selectAll('.geocode-item')
                  .data([0])
                  .enter()
                  .append('button')
                  .attr('class', 'geocode-item')
                  .on('click', geocoderSearch)
                  .append('div')
                  .attr('class', 'label')
                  .append('span')
                  .attr('class', 'entity-name')
                  .text(t('geocoder.search'));
            }

            list.selectAll('.no-results-item')
                .style('display', (value.length && !results.length) ? 'block' : 'none');

            list.selectAll('.geocode-item')
                .style('display', (value && _geocodeResults === undefined) ? 'block' : 'none');

            list.selectAll('.feature-list-item')
                .data([-1])
                .remove();

            var items = list.selectAll('.feature-list-item')
                .data(results, function(d) { return d.id; });

            var enter = items.enter()
                .insert('button', '.geocode-item')
                .attr('class', 'feature-list-item')
                .on('mouseover', mouseover)
                .on('mouseout', mouseout)
                .on('click', click);

            var label = enter
                .append('div')
                .attr('class', 'label');

            label
                .each(function(d) {
                    d3_select(this)
                        .call(svgIcon('#iD-icon-' + d.geometry, 'pre-text'));
                });

            label
                .append('span')
                .attr('class', 'entity-type')
                .text(function(d) { return d.type; });

            label
                .append('span')
                .attr('class', 'entity-name')
                .text(function(d) { return d.name; });

            enter
                .style('opacity', 0)
                .transition()
                .style('opacity', 1);

            items.order();

            items.exit()
                .remove();
        }


        function mouseover(d) {
            if (d.id === -1) return;

            context.surface().selectAll(utilEntityOrMemberSelector([d.id], context.graph()))
                .classed('hover', true);
        }


        function mouseout() {
            context.surface().selectAll('.hover')
                .classed('hover', false);
        }


        function click(d) {
            d3_event.preventDefault();
            if (d.location) {
                context.map().centerZoomEase([d.location[1], d.location[0]], 19);
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
                context.zoomToEntity(d.id);
            }
        }


        function geocoderSearch() {
            services.geocoder.search(search.property('value'), function (err, resp) {
                _geocodeResults = resp || [];
                drawList();
            });
        }
    }


    return featureList;
}

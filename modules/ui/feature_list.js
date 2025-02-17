import {
    select as d3_select
} from 'd3-selection';
import * as sexagesimal from '@mapbox/sexagesimal';

import { presetManager } from '../presets';
import { t } from '../core/localizer';
import { dmsCoordinatePair, dmsMatcher } from '../util/units';
import { coreGraph } from '../core/graph';
import { geoSphericalDistance } from '../geo/geo';
import { geoExtent } from '../geo';
import { modeSelect } from '../modes/select';
import { osmEntity } from '../osm/entity';
import { isColourValid } from '../osm/tags';
import { services } from '../services';
import { svgIcon } from '../svg/icon';
import { uiCmd } from './cmd';

import {
    utilDisplayName,
    utilDisplayType,
    utilHighlightEntities,
    utilNoAuto
} from '../util';


export function uiFeatureList(context) {
    var _geocodeResults;


    function featureList(selection) {
        var header = selection
            .append('div')
            .attr('class', 'header fillL');

        header
            .append('h2')
            .call(t.append('inspector.feature_list'));

        var searchWrap = selection
            .append('div')
            .attr('class', 'search-header');

        searchWrap
            .call(svgIcon('#iD-icon-search', 'pre-text'));

        var search = searchWrap
            .append('input')
            .attr('placeholder', t('inspector.search'))
            .attr('type', 'search')
            .call(utilNoAuto)
            .on('keypress', keypress)
            .on('keydown', keydown)
            .on('input', inputevent);

        var listWrap = selection
            .append('div')
            .attr('class', 'inspector-body');

        var list = listWrap
            .append('div')
            .attr('class', 'feature-list');

        context
            .on('exit.feature-list', clearSearch);
        context.map()
            .on('drawn.feature-list', mapDrawn);

        context.keybinding()
            .on(uiCmd('⌘F'), focusSearch);


        function focusSearch(d3_event) {
            var mode = context.mode() && context.mode().id;
            if (mode !== 'browse') return;

            d3_event.preventDefault();
            search.node().focus();
        }


        function keydown(d3_event) {
            if (d3_event.keyCode === 27) {  // escape
                search.node().blur();
            }
        }


        function keypress(d3_event) {
            var q = search.property('value'),
                items = list.selectAll('.feature-list-item');
            if (d3_event.keyCode === 13 && // ↩ Return
                q.length &&
                items.size()) {
                click(d3_event, items.datum());
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

            var locationMatch = sexagesimal.pair(q.toUpperCase()) || dmsMatcher(q);

            if (locationMatch) {
                const latLon = [Number(locationMatch[0]), Number(locationMatch[1])];
                const lonLat = [latLon[1], latLon[0]];  // also try swapped order

                const isLatLonValid = latLon[0] >= -90 && latLon[0] <= 90 && latLon[1] >= -180 && latLon[1] <= 180;
                let   isLonLatValid = lonLat[0] >= -90 && lonLat[0] <= 90 && lonLat[1] >= -180 && lonLat[1] <= 180;
                isLonLatValid &&= !q.match(/[NSEW]/i);
                isLonLatValid &&= lonLat[0] !== lonLat[1];

                if (isLatLonValid) {
                    result.push({
                        id: latLon[0] + '/' + latLon[1],
                        geometry: 'point',
                        type: t('inspector.location'),
                        name: dmsCoordinatePair([latLon[1], latLon[0]]),
                        location: latLon
                    });
                }
                if (isLonLatValid) {
                    result.push({
                        id: lonLat[0] + '/' + lonLat[1],
                        geometry: 'point',
                        type: t('inspector.location'),
                        name: dmsCoordinatePair([lonLat[1], lonLat[0]]),
                        location: lonLat
                    });
                }
            }

            // A location search takes priority over an ID search
            var idMatch = !locationMatch && q.match(/(?:^|\W)(node|way|relation|note|[nwr])\W{0,2}0*([1-9]\d*)(?:\W|$)/i);

            if (idMatch) {
                var elemType = idMatch[1] === 'note' ? idMatch[1] : idMatch[1].charAt(0);
                var elemId = idMatch[2];
                result.push({
                    id: elemType + elemId,
                    geometry: elemType === 'n' ? 'point' : elemType === 'w' ? 'line' : elemType === 'note' ? 'note' : 'relation',
                    type: elemType === 'n' ? t('inspector.node') : elemType === 'w' ? t('inspector.way') : elemType === 'note' ? t('note.note') : t('inspector.relation'),
                    name: elemId
                });
            }

            var allEntities = graph.entities;
            var localResults = [];
            for (var id in allEntities) {
                var entity = allEntities[id];
                if (!entity) continue;

                var name = utilDisplayName(entity) || '';
                if (name.toLowerCase().indexOf(q) < 0) continue;

                var matched = presetManager.match(entity, graph);
                var type = (matched && matched.name()) || utilDisplayType(entity.id);
                var extent = entity.extent(graph);
                var distance = extent ? geoSphericalDistance(visibleCenter, extent.center()) : 0;

                localResults.push({
                    id: entity.id,
                    entity: entity,
                    geometry: entity.geometry(graph),
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
                    var matched = presetManager.match(tempEntity, tempGraph);
                    var type = (matched && matched.name()) || utilDisplayType(id);

                    result.push({
                        id: tempEntity.id,
                        geometry: tempEntity.geometry(tempGraph),
                        type: type,
                        name: d.display_name,
                        extent: new geoExtent(
                            [Number(d.boundingbox[3]), Number(d.boundingbox[0])],
                            [Number(d.boundingbox[2]), Number(d.boundingbox[1])])
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
                result.push({
                    id: 'note' + q,
                    geometry: 'note',
                    type: t('note.note'),
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
                .html('')
                .call(t.append('geocoder.no_results_worldwide'));

            if (services.geocoder) {
              list.selectAll('.geocode-item')
                  .data([0])
                  .enter()
                  .append('button')
                  .attr('class', 'geocode-item secondary-action')
                  .on('click', geocoderSearch)
                  .append('div')
                  .attr('class', 'label')
                  .append('span')
                  .attr('class', 'entity-name')
                  .call(t.append('geocoder.search'));
            }

            list.selectAll('.no-results-item')
                .style('display', (value.length && !results.length) ? 'block' : 'none');

            list.selectAll('.geocode-item')
                .style('display', (value && _geocodeResults === undefined) ? 'block' : 'none');

            var items = list.selectAll('.feature-list-item')
                .data(results, function(d) { return d.id; });

            var enter = items.enter()
                .insert('button', '.geocode-item')
                .attr('class', 'feature-list-item')
                .on('pointerenter', mouseover)
                .on('pointerleave', mouseout)
                .on('focus', mouseover)
                .on('blur', mouseout)
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
                .classed('has-colour', d => d.entity && d.entity.type === 'relation' && d.entity.tags.colour && isColourValid(d.entity.tags.colour))
                .style('border-color', d => d.entity && d.entity.type === 'relation' && d.entity.tags.colour)
                .text(function(d) { return d.name; });

            enter
                .style('opacity', 0)
                .transition()
                .style('opacity', 1);

            items.exit()
                .each(d => mouseout(undefined, d))
                .remove();

            items.merge(enter)
                .order();
        }


        function mouseover(d3_event, d) {
            if (d.location !== undefined) return;

            utilHighlightEntities([d.id], true, context);
        }


        function mouseout(d3_event, d) {
            if (d.location !== undefined) return;

            utilHighlightEntities([d.id], false, context);
        }


        function click(d3_event, d) {
            d3_event.preventDefault();

            if (d.location) {
                context.map().centerZoomEase([d.location[1], d.location[0]], 19);

            } else if (d.entity) {
                utilHighlightEntities([d.id], false, context);

                context.enter(modeSelect(context, [d.entity.id]));
                context.map().zoomToEase(d.entity);

            } else if (d.geometry  === 'note') {
                // note
                // get number part 'note12345'
                const noteId = d.id.replace(/\D/g, '');

                // load note
                context.zoomToNote(noteId);
            } else {
                // download, zoom to, and select the entity with the given ID
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

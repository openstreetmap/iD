import * as d3 from 'd3';
import _ from 'lodash';
import { osmNode, osmRelation, osmWay } from '../osm/index';

import { actionAddEntity, actionChangeTags } from '../actions/index';

// import { utilDetect } from '../util/detect';
import { t } from '../util/locale';

import fromEsri from 'esri-to-geojson';

import polygonArea from 'area-polygon';
import polygonIntersect from 'turf-intersect';
import polygonBuffer from 'turf-buffer';
import pointInside from 'turf-inside';

export function svgGeoService(projection, context, dispatch) {
    // var detected = utilDetect();

    function init() {
        if (svgGeoService.initialized) return;  // run once
        svgGeoService.initialized = true;
    }

    function drawGeoService() {
        var geojson = drawGeoService.geojson();
        // var enabled = drawGeoService.enabled();

        if (!geojson || !geojson.features) {
            return;
        }
        return this;
    }

    drawGeoService.processGeoFeature = function(selectfeature, preset) {
        // when importing an object, accept users' changes to keys
        var convertedKeys = Object.keys(this.fields());
        var additionalKeys = Object.keys(selectfeature.properties);
        for (var a = 0; a < additionalKeys.length; a++) {
            if (!this.fields()[additionalKeys[a]] && additionalKeys[a] !== 'OBJECTID') {
                convertedKeys.push(additionalKeys[a]);
            }
        }

        // keep the OBJECTID to make sure we don't download the same data multiple times
        var outprops = {
            OBJECTID: (selectfeature.properties.OBJECTID || (Math.random() + ''))
        };

        // convert the rest of the layer's properties
        for (var k = 0; k < convertedKeys.length; k++) {
            var osmk = null;
            var osmv = null;

            if (convertedKeys[k].indexOf('add_') === 0) {
                // user or preset has added a key:value pair to all objects
                osmk = convertedKeys[k].substring(4);
                osmv = this.fields()[convertedKeys[k]];
                if (this.fields()[osmk]) {
                    // this data will be imported from the GeoService and not from preset
                    continue;
                }
            } else {
                var originalKey = convertedKeys[k];
                var approval = this.fields()[originalKey];
                if (!approval) {
                    // left unchecked, do not import
                    continue;
                }

                // user checked or kept box checked, should be imported
                osmv = selectfeature.properties[originalKey];
                if (osmv) {
                    osmk = this.fields()[originalKey] || originalKey;
                }
            }

            if (osmk) {
                // user directs any transferred keys
                outprops[osmk] = osmv;
            }
        }
        selectfeature.properties = outprops;
        return selectfeature;
    };

    drawGeoService.pane = function() {
        if (!this.geoservicepane) {
            this.geoservicepane = d3.selectAll('.geoservice-pane');
        }
        return this.geoservicepane;
    };

    drawGeoService.enabled = function(_) {
        if (!arguments.length) return svgGeoService.enabled;
        svgGeoService.enabled = _;
        dispatch.call('change');
        return this;
    };

    drawGeoService.hasData = function() {
        var geojson = drawGeoService.geojson();
        return (!(_.isEmpty(geojson) || _.isEmpty(geojson.features)));
    };

    drawGeoService.preset = function(preset) {
        // get / set an individual preset, or reset to null
        var presetBox = this.pane().selectAll('.preset');
        if (preset) {
            // preset.tags { }
            // preset.fields[{ keys: [], strings: { placeholders: { } } }]
            var tag = [preset.icon || '', preset.id.split('/')[0], preset.id.replace('/', '-')];
            if (preset.id.indexOf('driveway') > -1) {
                tag = ['highway-service', 'tag-highway', 'tag-highway-service', 'tag-service', 'tag-service-driveway'];
            }

            var iconHolder = presetBox.select('.preset-icon-holder')
                .html('');

            if (!preset.icon) {
                preset.icon = 'marker-stroked';
            }
            if (preset.geometry && preset.geometry[preset.geometry.length - 1] === 'area') {
                // add background first
                var pair = iconHolder.append('div')
                    .attr('class', 'preset-icon preset-icon-24')
                    .append('svg')
                        .attr('class', ['icon', tag[0], tag[2], 'tag-' + tag[1], 'tag-' + tag[2]].join(' '));

                pair.append('use')
                    .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                    .attr('xlink:href', '#' + tag[0].replace('tag-', ''));
                pair.append('use')
                    .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                    .attr('xlink:href', '#' + tag[0].replace('tag-', '') + '-15');

                // add inner icon
                iconHolder.append('div')
                    .attr('class', 'preset-icon-frame')
                    .append('svg')
                        .attr('class', 'icon')
                        .append('use')
                            .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                            .attr('xlink:href', '#preset-icon-frame');


            } else if (preset.geometry && preset.geometry[preset.geometry.length - 1] === 'line') {
                iconHolder.append('div')
                    .attr('class', 'preset-icon preset-icon-60')
                    .append('svg')
                        .attr('class', ['icon', tag[0], tag[2], 'tag-' + tag[1], 'tag-' + tag[2]].join(' '))
                        .append('use')
                            .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                            .attr('xlink:href', '#' + tag[2].replace('tag-', ''));
            } else {
                iconHolder.append('div')
                    .attr('class', 'preset-icon preset-icon-28')
                    .append('svg')
                        .attr('class', 'icon ' + tag[0])
                        .append('use')
                            .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                            .attr('xlink:href', '#' + tag[0].replace('tag-', '') + '-15');
            }

            //presetBox.selectAll('label.preset-prompt').text('OSM preset: ');
            //presetBox.selectAll('span.preset-prompt').text(preset.id);
            presetBox.selectAll('.preset-prompt')
                .classed('hide', true);
            presetBox.selectAll('button, .preset-icon-fill, .preset-icon')
                .classed('hide', false);
            this.internalPreset = preset;

            // special geo circumstances
            if (preset.id === 'address') {
                return d3.selectAll('.point-in-polygon').classed('must-show', true);
            } else if (preset.id.indexOf('cycle') > -1) {
                return d3.selectAll('.merge-lines').classed('must-show', true);
            } else if (preset.id.indexOf('building') > -1) {
                return d3.selectAll('.overlap-buildings').classed('must-show', true);
            } else {
                //console.log(preset.id);
            }

        } else if (preset === null) {
            // removing preset status
            presetBox.selectAll('.preset label.preset-prompt')
                .text(t('geoservice.match_preset'));
            presetBox.selectAll('.preset-prompt')
                .classed('hide', false);
            presetBox.selectAll('.preset span.preset-prompt, .preset svg')
                .html('');
            presetBox.selectAll('.preset button, .preset-icon-fill, .preset-icon')
                .classed('hide', true);

            this.internalPreset = null;
        } else {
            return this.internalPreset;
        }

        // reset UI for point-in-polygon and merge-lines
        d3.selectAll('.point-in-polygon, .merge-lines, .overlap-buildings')
            .classed('must-show', false)
            .selectAll('input')
                .property('checked', false);
    };

    drawGeoService.geojson = function(gj) {
        if (!arguments.length) return drawGeoService.datastore;
        drawGeoService.datastore = gj;

        var gjids = {};
        var obj = this;
        var pointInPolygon = d3.selectAll('.point-in-polygon input').property('checked');
        var mergeLines = d3.selectAll('.merge-lines input').property('checked');
        var overlapBuildings = d3.selectAll('.overlap-buildings input').property('checked');

        function fetchVisibleBuildings(callback, selector) {
            var buildings = d3.selectAll(selector || 'path.tag-building');
            _.map(buildings, function (buildinglist2) {
                _.map(buildinglist2, function (buildinglist) {
                    _.map(buildinglist, function (building) {
                        callback(building);
                    });
                });
            });
        }

        function fetchVisibleRoads(callback) {
            return fetchVisibleBuildings(callback, 'path.tag-highway');
        }

        function linesMatch(importLine, roadLine) {
            var importPoly = polygonBuffer(importLine, 5, 'meters');
            var roadPoly = polygonBuffer(roadLine, 5, 'meters');

            var intersectPoly = polygonIntersect(importPoly, roadPoly);
            if (!intersectPoly) {
                return 0;
            }

            function areaFix(polygon) {
                var area = 0;
                if (polygon.geometry.type === 'MultiPolygon') {
                    _.map(polygon.geometry.coordinates, function(section) {
                        area += polygonArea(section[0]);
                    });
                } else {
                    area += polygonArea(polygon.geometry.coordinates[0]);
                }
                return area;
            }

            var intersect = areaFix(intersectPoly);
            var overlap1 = intersect / areaFix(importPoly);
            var overlap2 = intersect / areaFix(roadPoly);

            // how much of line 1 is in line 2?  how much of line 2 is in line 1?
            // either score could indicate a good fit

            return Math.max(overlap1, overlap2);
        }

        _.map(gj.features || [], function(d) {
            var props, nodes, ln, way, rel;
            function makeEntity(loc_or_nodes) {
                props = {
                    tags: d.properties,
                    visible: true
                };

                // store the OBJECTID as source_oid
                // props.tags['geoservice:objectid'] = d.properties.OBJECTID;
                delete props.tags.OBJECTID;

                // allows this helper method to work on nodes and ways
                if (loc_or_nodes.length && (typeof loc_or_nodes[0] === 'string')) {
                    props.nodes = loc_or_nodes;
                } else {
                    props.loc = loc_or_nodes;
                }
                return props;
            }

            function makeMiniNodes(pts) {
                // generates the nodes which make up a longer way
                var nodes = [];
                for (var p = 0; p < pts.length; p++) {
                    props = makeEntity(pts[p]);
                    props.tags = {};
                    var node = new osmNode(props);
                    context.perform(
                        actionAddEntity(node),
                        'adding node inside a way'
                    );
                    nodes.push(node.id);
                }
                return nodes;
            }

            function mapLine(d, coords, loop) {
                nodes = makeMiniNodes(coords);
                if (loop) {
                    nodes.push(nodes[0]);
                }
                props = makeEntity(nodes);
                way = new osmWay(props, nodes);
                way.approvedForEdit = 'pending';
                context.perform(
                    actionAddEntity(way),
                    'adding way'
                );
                return way;
            }

            function getBuildingPoly(building) {
                // retrieve GeoJSON for this building if it isn't already stored in gjids { }
                var wayid = d3.select(building).attr('class').split(' ')[4];
                var ent;
                if (!gjids[wayid]) {
                    var nodes = [];
                    ent = context.entity(wayid);
                    _.map(ent.nodes, function(nodeid) {
                        var node = context.entity(nodeid);
                        nodes.push(node.loc);
                    });

                    gjids[wayid] = {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [nodes]
                        }
                    };
                }
                return wayid;
            }

            function mapPolygon(d, coords) {
                var plotBuilding = function() {
                    d.properties.area = d.properties.area || 'yes';
                    if (coords.length > 1) {
                        // donut hole polygons (e.g. building with courtyard) must be a relation
                        // example data: Hartford, CT building footprints
                        // what about rings within rings?

                        // generate each ring
                        var componentRings = [];
                        for (var ring = 0; ring < coords.length; ring++) {
                            // props.tags = {};
                            coords[ring].pop();
                            way = mapLine(d, coords[ring], true);
                            componentRings.push({
                                id: way.id,
                                role: (ring === 0 ? 'outer' : 'inner')
                            });
                        }

                        // generate a relation
                        rel = new osmRelation({
                            tags: {
                                type: 'MultiPolygon'
                            },
                            members: componentRings
                        });
                        rel.approvedForEdit = 'pending';
                        context.perform(
                            actionAddEntity(rel),
                            'adding multiple-ring Polygon'
                        );
                        return rel;
                    } else {
                        // polygon with one single ring
                        coords[0].pop();
                        way = mapLine(d, coords[0], true);
                        return way;
                    }
                };

                if (overlapBuildings) {
                    var foundOverlap = false;
                    fetchVisibleBuildings(function(building) {
                        if (!foundOverlap) {
                            var buildingPoly = gjids[getBuildingPoly(building)];
                            var intersectPoly = polygonIntersect(d, buildingPoly);
                            if (intersectPoly) {
                                foundOverlap = true;
                            }
                        }
                    });
                    if (foundOverlap) {
                        return 0;
                    }
                }
                plotBuilding();
            }

            function mergeImportTags(wayid) {
                // merge the active import GeoJSON attributes (d.properties) into item with wayid
                var ent = context.entity(wayid);
                if (!ent.importOriginal) {
                    ent.importOriginal = _.clone(ent.tags);
                }

                var originalProperties = _.clone(ent.tags);

                var keys = Object.keys(d.properties);
                _.map(keys, function(key) {
                    originalProperties[key] = d.properties[key];
                });

                var adjustedFeature = obj.processGeoFeature({ properties: originalProperties });

                context.perform(
                    actionChangeTags(wayid, adjustedFeature.properties),
                    'merged import item tags'
                );
                setTimeout(function() {
                    d3.selectAll('.layer-osm .' + wayid).classed('import-edited', true);
                }, 250);
            }

            function matchingRoads(importLine) {
                var matches = [];
                fetchVisibleRoads(function(road) {
                    var wayid = d3.select(road).attr('class').split(' ')[3];
                    if (1 * wayid.substring(1) < 0) {
                        // don't apply to new drawn roads
                        return;
                    }
                    var ent;

                    // fetch existing, or load a GeoJSON representation of the road
                    if (!gjids[wayid]) {
                        var nodes = [];
                        ent = context.entity(wayid);
                        _.map(ent.nodes, function(nodeid) {
                            var node = context.entity(nodeid);
                            nodes.push(node.loc);
                        });
                        gjids[wayid] = {
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: nodes
                            }
                        };
                    }
                    var isAligned = linesMatch(importLine, gjids[wayid]);
                    if (isAligned > 0.75) {
                        matches.push(wayid);
                        //console.log('line match found: ' + wayid + ' (possible segment) val: ' + isAligned);
                        mergeImportTags(wayid);
                    }
                });
                return matches;
            }

            // importing different GeoJSON geometries
            if (d.geometry.type === 'Point') {
                props = makeEntity(d.geometry.coordinates);

                // user is merging points to polygons (example: addresses to buildings)
                if (pointInPolygon) {
                    var matched = false;
                    fetchVisibleBuildings(function(building) {
                        var wayid = getBuildingPoly(building);
                        var isInside = pointInside(d, gjids[wayid]);
                        if (isInside) {
                            matched = true;
                            mergeImportTags(wayid);
                        }
                    });

                    if (!matched) {
                        // add address point independently of existing buildings
                        var node = new osmNode(props);
                        node.approvedForEdit = 'pending';
                        context.perform(
                            actionAddEntity(node),
                            'adding point'
                        );
                    }

                } else {
                    var noded = new osmNode(props);
                    noded.approvedForEdit = 'pending';
                    context.perform(
                        actionAddEntity(noded),
                        'adding point'
                    );
                }

            } else if (d.geometry.type === 'LineString') {
                if (mergeLines) {
                    var mergeRoadsd = matchingRoads(d);
                    if (!mergeRoadsd.length) {
                        // none of the roads overlapped
                        mapLine(d, d.geometry.coordinates);
                    }
                } else {
                    mapLine(d, d.geometry.coordinates);
                }

            } else if (d.geometry.type === 'MultiLineString') {
                var lines = [];
                for (ln = 0; ln < d.geometry.coordinates.length; ln++) {
                    if (mergeLines) {
                        // test each part of the MultiLineString for merge-ability

                        // this fragment of the MultiLineString should be compared
                        var importPart = {
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: d.geometry.coordinates[ln]
                            }
                        };
                        var mergeRoads = matchingRoads(importPart);

                        /*
                        _.map(mergeRoads, function(mergeRoadWayId) {

                        });
                        */

                        if (!mergeRoads.length) {
                            // what if part or all of the MultiLineString does not have a place to merge to?
                        }
                    } else {
                        lines.push({
                            id: mapLine(d, d.geometry.coordinates[ln]).id,
                            role: '' // roles: this empty string assumes the lines make up a route
                        });
                    }
                }

                // don't add geodata if we are busy merging lines
                if (mergeLines) {
                    return;
                }

                // generate a relation
                rel = new osmRelation({
                    tags: {
                        type: 'route' // still need to tackle multilinestring and multipolygon types
                    },
                    members: lines
                });
                rel.approvedForEdit = 'pending';
                context.perform(
                    actionAddEntity(rel),
                    'adding multiple Lines as a Relation'
                );

            } else if (d.geometry.type === 'Polygon') {
                mapPolygon(d, d.geometry.coordinates);
            } else if (d.geometry.type === 'MultiPolygon') {
                var polygons = [];
                for (ln = 0; ln < d.geometry.coordinates.length; ln++) {
                    polygons.push({
                        id: mapPolygon(d, d.geometry.coordinates[ln]).id,
                        role: ''
                    });
                }

                // generate a relation
                rel = new osmRelation({
                    tags: {
                        type: 'MultiPolygon'
                    },
                    members: polygons
                });
                rel.approvedForEdit = 'pending';
                context.perform(
                    actionAddEntity(rel),
                    'adding multiple Polygons as a Relation'
                );
            } else {
                // console.log('Did not recognize Geometry Type: ' + d.geometry.type);
            }
        });

        dispatch.call('change');
        return this;
    };

    drawGeoService.format = function(fmt) {
        if (!arguments.length) return drawGeoService.fmt;
        drawGeoService.fmt = fmt;
        return this;
    };

    // importFields is an object with each key corresponding to true / false based on whether it should be imported
    drawGeoService.fields = function(fields) {
        if (!arguments.length) return (drawGeoService.importFields || {});
        drawGeoService.importFields = fields;
        return this;
    };

    drawGeoService.setField = function(geoservice_key, osm_tag) {
        var fields = drawGeoService.fields();
        fields[geoservice_key] = osm_tag;
        drawGeoService.fields(fields);
        return this;
    };

    drawGeoService.license = function(license_text) {
        if (!arguments.length) return (drawGeoService.license_text || '');
        drawGeoService.license_text = license_text;
        return this;
    };

    drawGeoService.metadata = function(metadata_url) {
        if (!arguments.length) return (drawGeoService.metadata_url || '');
        drawGeoService.metadata_url = metadata_url;
        return this;
    };

    drawGeoService.importPlan = function(plan_url) {
        if (!arguments.length) return (drawGeoService.plan_url || '');
        drawGeoService.planUrl = plan_url;
        return this;
    };

    drawGeoService.url = function(true_url, downloadMax) {
        if (!this.layerUrl) {
            drawGeoService.layerUrl = true_url;
        }
        var fmt = drawGeoService.format() || 'json';

        // add necessary URL parameters to the user's URL
        var url = true_url;
        if (url.indexOf('/query') === -1) {
            if (url[url.length - 1] !== '/') {
                url += '/';
            }
            url += 'query?';
        }
        if (url.indexOf('?') === -1) {
            url += '?';
        }
        if (downloadMax && url.indexOf('where') === -1) {
            // if there is no spatial query, need a SQL query here
            url += 'where=1>0';
        }
        if (url.indexOf('outSR') === -1) {
            url += '&outSR=4326';
        }
        if (url.indexOf('&f=') === -1) {
            url += '&f=' + fmt;
        }
        if (url.indexOf('maxAllowableOffset') === -1) {
            url += '&maxAllowableOffset=0.000005';
        }
        if (url.indexOf('outFields=') === -1) {
            var allFields = drawGeoService.fields();
            var selectFields = [];
            _.map(Object.keys(allFields), function (field) {
                if (allFields[field] && field.indexOf('add_') !== 0) {
                    selectFields.push(field);
                }
            });
            url += '&outFields=' + (selectFields.join(',') || '*');
        }

        // turn iD Editor bounds into a query
        var bounds = context.map().trimmedExtent().bbox();
        bounds = JSON.stringify({
            xmin: bounds.minX.toFixed(6) * 1,
            ymin: bounds.minY.toFixed(6) * 1,
            xmax: bounds.maxX.toFixed(6) * 1,
            ymax: bounds.maxY.toFixed(6) * 1,
            spatialReference: {
              wkid: 4326
            }
        });
        if (this.lastBounds === bounds) {
            // unchanged bounds, unchanged import parameters, so unchanged data
            return this;
        }

        // data has changed - make a query
        this.lastBounds = bounds;

        // make a spatial query within the user viewport (unless the user made their own spatial query)
        if (!downloadMax && (url.indexOf('spatialRel') === -1)) {
            url += '&geometry=' + this.lastBounds;
            url += '&geometryType=esriGeometryEnvelope';
            url += '&spatialRel=esriSpatialRelIntersects';
            url += '&inSR=4326';
        }

        var that = this;
        d3.json(url, function(err, data) {
            if (err) {
                // console.log('GeoService URL did not load');
                // console.error(err);
            } else {
                // convert EsriJSON text to GeoJSON object
                var jsondl = (fmt === 'geojson') ? data : fromEsri.fromEsri(data);

                // warn if went over server's maximum results count
                if (data.exceededTransferLimit) {
                    alert(t('geoservice.exceeded_limit') + data.features.length);
                }

                _.map(jsondl.features, function(selectfeature) {
                    return that.processGeoFeature(selectfeature, that.preset());
                });

                // send the modified geo-features to the draw layer
                drawGeoService.geojson(jsondl);
            }
        });

        return this;
    };

    init();
    return drawGeoService;
}

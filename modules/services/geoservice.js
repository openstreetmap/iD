import _clone from 'lodash-es/clone';

import { json as d3_json } from 'd3-request';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import fromEsri from 'esri-to-geojson';
import polygonArea from 'area-polygon';
import polygonIntersect from 'turf-intersect';
import polygonBuffer from 'turf-buffer';
import pointInside from 'turf-inside';

import { coreGraph } from '../core';
import { osmNode, osmRelation, osmWay } from '../osm';
import { utilRebind } from '../util';
import { t } from '../util/locale';


var dispatch = d3_dispatch('change');
var _gsFormat = 'geojson';
var _gsDownloadMax = null;
var _gsGraph = null;
var _gsImportFields = {};


export default {

    init: function() {
        this.reset();
        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        _gsGraph = coreGraph();
    },

    graph: function() {
        return _gsGraph;
    },

    entityIDs: function() {
        return Object.keys(_gsGraph.entities);
    },

    query: function(urlbase, context, options) {
        options = options || {};

        // add necessary URL parameters to the user's URL
        var url = urlbase;
        if (url.indexOf('/query') === -1) {
            if (url[url.length - 1] !== '/') {
                url += '/';
            }
            url += 'query?';
        }
        if (url.indexOf('?') === -1) {
            url += '?';
        }
        if (_gsDownloadMax && url.indexOf('where') === -1) {
            // if there is no spatial query, need a SQL query here
            url += 'where=1>0';
        }
        if (url.indexOf('outSR') === -1) {
            url += '&outSR=4326';
        }
        if (url.indexOf('&f=') === -1) {
            url += '&f=' + _gsFormat;
        }
        if (url.indexOf('maxAllowableOffset') === -1) {
            url += '&maxAllowableOffset=0.000005';
        }
        if (url.indexOf('outFields=') === -1) {
            var selectFields = [];
            Object.keys(_gsImportFields).map(function(field) {
                if (_gsImportFields[field] && field.indexOf('add_') !== 0) {
                    selectFields.push(field);
                }
            });
            url += '&outFields=' + (selectFields.join(',') || '*');
        }

        // turn iD Editor bounds into a query
        var bounds = context.map().trimmedExtent().bbox();
        bounds = JSON.stringify({
            xmin: +bounds.minX.toFixed(6),
            ymin: +bounds.minY.toFixed(6),
            xmax: +bounds.maxX.toFixed(6),
            ymax: +bounds.maxY.toFixed(6),
            spatialReference: { wkid: 4326 }
        });
        if (this.lastBounds === bounds) {
            // unchanged bounds, unchanged import parameters, so unchanged data
            return this;
        }

        // data has changed - make a query
        this.lastBounds = bounds;

        // make a spatial query within the user viewport (unless the user made their own spatial query)
        if (!_gsDownloadMax && (url.indexOf('spatialRel') === -1)) {
            url += '&geometry=' + this.lastBounds;
            url += '&geometryType=esriGeometryEnvelope';
            url += '&spatialRel=esriSpatialRelIntersects';
            url += '&inSR=4326';
        }

        var that = this;
        d3_json(url, function(err, data) {
            if (err || !data) return;

            // convert EsriJSON text to GeoJSON object
            var gj = (_gsFormat === 'geojson') ? data : fromEsri.fromEsri(data);

            // warn if went over server's maximum results count
            if (data.exceededTransferLimit) {
                alert(t('geoservice.exceeded_limit') + data.features.length);
            }

            gj.features.forEach(function(feature) {
                that.processFeature(feature);
            });

            that.processGeoJSON(gj, options);
        });
    },


    //
    // Accepts a single GeoJSON Feature and adjusts its properties
    // according to the user's import rules specified in `_gsImportFields`
    //
    processFeature: function(feature) {
        var propertyKeys = Object.keys(feature.properties);
        var importKeys = Object.keys(_gsImportFields);

        // keep the OBJECTID to make sure we don't download the same data multiple times
        var outProps = {
            OBJECTID: (feature.properties.OBJECTID || (Math.random() + ''))
        };

        var i, k;
        for (i = 0; i < propertyKeys.length; i++) {
            k = propertyKeys[i];
            if (!_gsImportFields[k] && k !== 'OBJECTID') {
                importKeys.push(k);
            }
        }

        for (i = 0; i < importKeys.length; i++) {
            k = importKeys[i];
            var osmk = null;
            var osmv = null;

            if (/^add\_/.test(k)) {      // user or preset has added a key:value pair to all objects
                osmk = k.substring(4);
                osmv = _gsImportFields[k];
                if (_gsImportFields[osmk]) continue;   // osmk already in import field list, skip

            } else {
                if (!_gsImportFields[k]) continue;   // not in import field list, skip
                osmv = feature.properties[k];
                if (osmv) {
                    osmk = _gsImportFields[k] || k;
                }
            }

            if (osmk && osmv) {
                outProps[osmk] = osmv;
            }
        }

        feature.properties = outProps;
        return feature;
    },


    //
    // Accepts a GeoJSON FeatureCollection and iterates over all features
    // importing them as OSM entities (Nodes, Ways, Relations) into `_gsGraph`
    //
    processGeoJSON: function(gj, options) {
        options = options || {};

        // possible options:
        //   pointInPolygon: false,
        //   mergeLines: false,
        //   overlapBuildings: false

        var gjids = {};
        var that = this;

        function fetchVisibleBuildings(callback, selector) {
            var buildings = d3_selectAll(selector || 'path.tag-building');
            buildings.map(function(buildinglist2) {
                buildinglist2.map(function(buildinglist) {
                    buildinglist.map(function(building) {
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
                    polygon.geometry.coordinates.map(function(section) {
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

        (gj.features || []).map(function(d) {
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
                    _gsGraph = _gsGraph.replace(node);
                    nodes.push(node.id);
                }
                return nodes;
            }

            function mapLine(d, coords, isClosed) {
                nodes = makeMiniNodes(coords);
                if (isClosed) {
                    nodes.push(nodes[0]);
                }
                props = makeEntity(nodes);
                way = new osmWay(props, nodes);
                way.importStatus = 'pending';
                _gsGraph = _gsGraph.replace(way);
                return way;
            }

            function getBuildingPoly(building) {
                // retrieve GeoJSON for this building if it isn't already stored in gjids { }
                var wayid = d3_select(building).attr('class').split(' ')[4];
                var ent;
                if (!gjids[wayid]) {
                    var nodes = [];
                    ent = _gsGraph.entity(wayid);
                    ent.nodes.map(function(nodeid) {
                        var node = _gsGraph.entity(nodeid);
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
                        var members = [];
                        for (var ring = 0; ring < coords.length; ring++) {
                            coords[ring].pop();
                            way = mapLine(d, coords[ring], true);
                            members.push({ id: way.id, role: (ring === 0 ? 'outer' : 'inner') });
                        }

                        // generate a relation
                        rel = new osmRelation({ tags: { type: 'multipolygon' }, members: members });
                        rel.importStatus = 'pending';
                        _gsGraph = _gsGraph.replace(rel);
                        return rel;

                    } else {
                        // polygon with one single ring
                        coords[0].pop();
                        way = mapLine(d, coords[0], true);
                        return way;
                    }
                };

                if (options.overlapBuildings) {
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
                var ent = _gsGraph.entity(wayid);
                if (!ent.importOriginal) {
                    ent.importOriginal = _clone(ent.tags);
                }

                var originalProperties = _clone(ent.tags);
                Object.keys(d.properties).map(function(key) {
                    originalProperties[key] = d.properties[key];
                });

                var adjustedFeature = that.processFeature({ properties: originalProperties });
                _gsGraph = _gsGraph.replace(ent.update({tags: adjustedFeature.properties}));

                setTimeout(function() {
                    d3_selectAll('.layer-osm .' + wayid).classed('import-edited', true);
                }, 250);
            }

            function matchingRoads(importLine) {
                var matches = [];
                fetchVisibleRoads(function(road) {
                    var wayid = d3_select(road).attr('class').split(' ')[3];
                    if (1 * wayid.substring(1) < 0) {
                        // don't apply to new drawn roads
                        return;
                    }

                    // fetch existing, or load a GeoJSON representation of the road
                    if (!gjids[wayid]) {
                        var nodes = [];
                        var ent = _gsGraph.entity(wayid);
                        ent.nodes.map(function(nodeid) {
                            var node = _gsGraph.entity(nodeid);
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
                if (options.pointInPolygon) {
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
                        node.importStatus = 'pending';
                        _gsGraph = _gsGraph.replace(node);
                    }

                } else {
                    var noded = new osmNode(props);
                    noded.importStatus = 'pending';
                    _gsGraph = _gsGraph.replace(noded);
                }

            } else if (d.geometry.type === 'LineString') {
                if (options.mergeLines) {
                    var mergeRoadsd = matchingRoads(d);
                    if (!mergeRoadsd.length) {
                        // none of the roads overlapped
                        mapLine(d, d.geometry.coordinates);
                    }
                } else {
                    mapLine(d, d.geometry.coordinates);
                }

            } else if (d.geometry.type === 'MultiLineString') {  // TODO: check
                var lines = [];
                for (ln = 0; ln < d.geometry.coordinates.length; ln++) {
                    if (options.mergeLines) {
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
                        mergeRoads.map(function(mergeRoadWayId) {
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
                if (options.mergeLines) {
                    return;
                }

                // generate a relation
                rel = new osmRelation({ tags: { type: 'route' }, members: lines });
                rel.importStatus = 'pending';
                _gsGraph = _gsGraph.replace(rel);

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
                rel = new osmRelation({ tags: { type: 'multipolygon' }, members: polygons });
                rel.importStatus = 'pending';
                _gsGraph = _gsGraph.replace(rel);
            } else {
                // console.log('Did not recognize Geometry Type: ' + d.geometry.type);
            }
        });

        dispatch.call('change');
        return this;
    },


    downloadMax: function(_) {
        if (!arguments.length) return _gsDownloadMax;
        _gsDownloadMax = _;
        return this;
    },

    format: function(_) {
        if (!arguments.length) return _gsFormat;
        _gsFormat = _;
        return this;
    },

    importFields: function(_) {
        if (!arguments.length) return _gsImportFields;
        _gsImportFields = _;
        return this;
    }

};

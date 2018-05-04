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

import { actionAddEntity, actionChangeTags, actionNoop } from '../actions';
import { osmNode, osmRelation, osmWay } from '../osm';
import { utilQsString, utilStringQs } from '../util';
import { utilRebind } from '../util';
import { t } from '../util/locale';


var dispatch = d3_dispatch('change');
var _gsFormat = 'geojson';
var _gsDownloadMax = null;
var _gsLastBounds = null;
var _gsLicenseText = null;
var _gsMetadataURL = null;
var _gsPlanURL = null;
var _gsImportFields = {};



// Accept a single GeoJSON Feature and modify its `properties`
// according to the user's import rules specified in `_gsImportFields`
function setProperties(feature) {
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
}


function getEsriGeometry(bbox) {
    return JSON.stringify({
        xmin: +bbox.minX.toFixed(6),
        ymin: +bbox.minY.toFixed(6),
        xmax: +bbox.maxX.toFixed(6),
        ymax: +bbox.maxY.toFixed(6),
        spatialReference: { wkid: 4326 }
    });
}

// todo these:

// function fetchVisibleBuildings(callback, selector) {
//     var buildings = d3_selectAll(selector || 'path.tag-building');
//     buildings.map(function(buildinglist2) {
//         buildinglist2.map(function(buildinglist) {
//             buildinglist.map(function(building) {
//                 callback(building);
//             });
//         });
//     });
// }

// function fetchVisibleRoads(callback) {
//     return fetchVisibleBuildings(callback, 'path.tag-highway');
// }

// function linesMatch(importLine, roadLine) {
//     var importPoly = polygonBuffer(importLine, 5, 'meters');
//     var roadPoly = polygonBuffer(roadLine, 5, 'meters');
//
//     var intersectPoly = polygonIntersect(importPoly, roadPoly);
//     if (!intersectPoly) {
//         return 0;
//     }
//
//     function areaFix(polygon) {
//         var area = 0;
//         if (polygon.geometry.type === 'MultiPolygon') {
//             polygon.geometry.coordinates.map(function(section) {
//                 area += polygonArea(section[0]);
//             });
//         } else {
//             area += polygonArea(polygon.geometry.coordinates[0]);
//         }
//         return area;
//     }
//
//     var intersect = areaFix(intersectPoly);
//     var overlap1 = intersect / areaFix(importPoly);
//     var overlap2 = intersect / areaFix(roadPoly);
//
//     // how much of line 1 is in line 2?  how much of line 2 is in line 1?
//     // either score could indicate a good fit
//
//     return Math.max(overlap1, overlap2);
// }

// retrieve GeoJSON for this building if it isn't already stored in gjids { }
// todo: use iD graph for this instead of d3_select
// function getGeoJSONPolygon(building) {
//     var wayid = d3_select(building).attr('class').split(' ')[4];
//     var ent;
//     if (!gjids[wayid]) {
//         var coords = [];
//         ent = context.entity(wayid);
//         ent.nodes.map(function(nodeid) {
//             var node = context.entity(nodeid);
//             coords.push(node.loc);
//         });
//
//         gjids[wayid] = {
//             type: 'Feature',
//             geometry: {
//                 type: 'Polygon',
//                 coordinates: [coords]
//             }
//         };
//     }
//     return wayid;
// }

// function mergeImportTags(wayid) {
//     // merge the active import GeoJSON attributes (d.properties) into item with wayid
//     var ent = context.entity(wayid);
//     if (!ent.importOriginal) {
//         ent.importOriginal = _clone(ent.tags);
//     }
//
//     var originalProperties = _clone(ent.tags);
//     Object.keys(d.properties).map(function(key) {
//         originalProperties[key] = d.properties[key];
//     });
//
//     var adjustedFeature = setProperties({ properties: originalProperties });
//     context.replace(actionChangeTags(ent.id, adjustedFeature.properties), annotation);
//
// //scary
//     // setTimeout(function() {
//     //     d3_selectAll('.layer-osm .' + wayid).classed('import-edited', true);
//     // }, 250);
// }

// function matchingRoads(importLine) {
//     var matches = [];
// todo: use iD graph for this instead of d3_select
//     fetchVisibleRoads(function(road) {
//         var wayid = d3_select(road).attr('class').split(' ')[3];
//         if (1 * wayid.substring(1) < 0) {
//             // don't apply to new drawn roads
//             return;
//         }
//
//         // fetch existing, or load a GeoJSON representation of the road
//         if (!gjids[wayid]) {
//             var nodes = [];
//             var ent = context.entity(wayid);
//             ent.nodes.map(function(nodeid) {
//                 var node = context.entity(nodeid);
//                 nodes.push(node.loc);
//             });
//             gjids[wayid] = {
//                 type: 'Feature',
//                 geometry: {
//                     type: 'LineString',
//                     coordinates: nodes
//                 }
//             };
//         }
//         var isAligned = linesMatch(importLine, gjids[wayid]);
//         if (isAligned > 0.75) {
//             matches.push(wayid);
//             //console.log('line match found: ' + wayid + ' (possible segment) val: ' + isAligned);
//             mergeImportTags(wayid);
//         }
//     });
//     return matches;
// }


export default {

    init: function() {
        this.reset();
        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        _gsLastBounds = null;
        _gsLicenseText = null;
        _gsMetadataURL = null;
        _gsPlanURL = null;
        _gsImportFields = {};
    },

    query: function(context, url, options) {
        options = options || {};

        var parts = url.split('?');
        var base = parts[0];
        var q = (parts.length > 1 && utilStringQs(parts[1])) || {};

        // make sure url ends in `/query`..
        if (!/\/query$/.test(base)) {
            if (!/\/$/.test(base)) {
                base += '/';
            }
            base += 'query';
        }

        // build url parameters..
        if (!q.where) {
            q.where = 'where=1>0';
        }
        if (!q.outSR) {
            q.outSR = '4326';
        }
        if (!q.f) {
            q.f = _gsFormat;
        }
        if (!q.maxAllowableOffset) {
            q.maxAllowableOffset = '0.000005';
        }
        if (!q.outFields) {
            var selectFields = [];
            Object.keys(_gsImportFields).forEach(function(k) {
                if (_gsImportFields[k] && !/^add\_/.test(k)) {
                    selectFields.push(k);
                }
            });
            q.outFields = (selectFields.join(',') || '*');
        }

        // make a bounds query
        var bounds = getEsriGeometry(context.map().trimmedExtent().bbox());
        if (_gsLastBounds === bounds) {
            return this;
        }
        _gsLastBounds = bounds;

        // make a spatial query within the user viewport (unless the user made their own spatial query)
        if (!_gsDownloadMax && !q.spatialRef) {
            q.geometry = bounds;
            q.geometryType = 'esriGeometryEnvelope';
            q.spatialRel = 'esriSpatialRelIntersects';
            q.inSR = '4326';
        }

        url = base + '?' + utilQsString(q);
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
                setProperties(feature);
            });

            that.importGeoJSON(context, gj, options);
        });
    },


    //
    // Accepts a GeoJSON FeatureCollection and iterates over all features
    // importing them as OSM entities (Nodes, Ways, Relations)
    //
    importGeoJSON: function(context, gj, options) {
        options = options || {};

        // possible options:
        //   pointInPolygon: false,
        //   mergeLines: false,
        //   skipOverlappingBuildings: false
        var i;
        var gjids = {};
        var that = this;
        var annotation = 'Prepared features for import';

        if (!gj.features || !gj.features.length) return this;
        context.perform(actionNoop(), annotation);


        (gj.features || []).map(function(d) {

// todo figure out this part?
            // store the OBJECTID as source_oid
            // props.tags['geoservice:objectid'] = d.properties.OBJECTID;
            delete d.properties.OBJECTID;

            // import different GeoJSON geometries
            if (d.geometry.type === 'Point') {
                var addPoint = true;

                // If the user is merging points to polygons (example: addresses to buildings)
                // we might not actually add a point, instead assign the tags to an existing polygon
// todo
                // if (options.pointInPolygon) {
                //     var matched = false;
                //     fetchVisibleBuildings(function(building) {
                //         var wayid = getGeoJSONPolygon(building);
                //         var isInside = pointInside(d, gjids[wayid]);
                //         if (isInside) {
                //             mergeImportTags(wayid);
                //             matched = true;
                //         }
                //     });
                //     addPoint = !matched;
                // }

                if (addPoint) {
                    makeNode(d.properties, d.geometry.coordinates);
                }

            } else if (d.geometry.type === 'MultiPoint') {
                for (i = 0; i < d.geometry.coordinates.length; i++) {
                    makeNode(d.properties, d.geometry.coordinates[i]);
                }

            } else if (d.geometry.type === 'LineString') {
// todo
                // if (options.mergeLines) {
                //     var mergeRoadsd = matchingRoads(d);
                //     if (!mergeRoadsd.length) {
                //         // none of the roads overlapped
                //         makeWay(d.properties, d.geometry.coordinates);
                //     }
                // } else {
                    makeWay(d.properties, d.geometry.coordinates);
                // }

            } else if (d.geometry.type === 'MultiLineString') {  // TODO: check
                var members = [];
                for (i = 0; i < d.geometry.coordinates.length; i++) {
// todo
                    // if (options.mergeLines) {
                    //     // test each part of the MultiLineString for merge-ability
                    //     // this fragment of the MultiLineString should be compared
                    //     var importPart = {
                    //         type: 'Feature',
                    //         geometry: {
                    //             type: 'LineString',
                    //             coordinates: d.geometry.coordinates[ln]
                    //         }
                    //     };
                    //     var mergeRoads = matchingRoads(importPart);
                    //
                    //     /*
                    //     mergeRoads.map(function(mergeRoadWayId) {
                    //     });
                    //     */
                    //
                    //     if (!mergeRoads.length) {
                    //         // what if part or all of the MultiLineString does not have a place to merge to?
                    //     }
                    // } else {
                        members.push({
                            id: makeWay(d.properties, d.geometry.coordinates[i]).id,
                            role: '' // roles: this empty string assumes the lines make up a route
                        });
                    // }
                }

                // don't add geodata if we are busy merging lines
                if (options.mergeLines) {
                    return;
                }
                makeRelation({ type: 'route' }, members);  // maybe?

            } else if (d.geometry.type === 'Polygon') {
                makePolygon(d.properties, d.geometry.coordinates);

            } else if (d.geometry.type === 'MultiPolygon') {
                for (i = 0; i < d.geometry.coordinates.length; i++) {
                    makePolygon(d.properties, d.geometry.coordinates[i]);
                }

            } else {
                // console.log('Did not recognize Geometry Type: ' + d.geometry.type);
            }
        });

        dispatch.call('change');
        return this;



        function makeNode(tags, coord) {
            var node = new osmNode({ tags: tags, loc: coord, status: 'pending' });
            context.replace(actionAddEntity(node), annotation);
            return node;
        }


        function makeWay(tags, coords, isClosed) {
            var nodeIDs = [];
            for (var i = 0; i < coords.length; i++) {
                var node = makeNode({}, coords[i]);
                nodeIDs.push(node.id);
            }
            if (isClosed) {
                nodeIDs.push(nodeIDs[0]);
            }
            var way = new osmWay({ tags: tags, nodes: nodeIDs, status: 'pending' });
            context.replace(actionAddEntity(way), annotation);
            return way;
        }


        function makeRelation(tags, members) {
            var relation = new osmRelation({ tags: tags, members: members, status: 'pending' });
            context.replace(actionAddEntity(relation), annotation);
            return relation;
        }


        function makePolygon(tags, coords) {
//todo
            // if (options.skipOverlappingBuildings) {
            //     var foundOverlap = false;
            //     fetchVisibleBuildings(function(building) {
            //         if (!foundOverlap) {
            //             var buildingPoly = gjids[getGeoJSONPolygon(building)];
            //             var intersectPoly = polygonIntersect(d, buildingPoly);
            //             if (intersectPoly) {
            //                 foundOverlap = true;
            //             }
            //         }
            //     });
            //     if (foundOverlap) {
            //         return null;
            //     }
            // }

            tags.area = tags.area || 'yes';

            if (coords.length > 1) {
                // generate a multipolygon relation (tags go on the relation, not the ways)
                // donut hole polygons (e.g. building with courtyard) must be a relation
                var members = [];
                for (var ring = 0; ring < coords.length; ring++) {
                    var way = makeWay({}, coords[ring], true);
                    members.push({ id: way.id, role: (ring === 0 ? 'outer' : 'inner') });
                }

                tags.type = 'multipolygon';
                return makeRelation(tags, members);

            } else {
                // polygon with one single ring
                return makeWay(tags, coords[0], true);
            }
        }

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
    },

    licenseText: function(_) {
        if (!arguments.length) return _gsLicenseText;
        _gsLicenseText = _;
        return this;
    },

    metadataURL: function(_) {
        if (!arguments.length) return _gsMetadataURL;
        _gsMetadataURL = _;
        return this;
    },

    planURL: function(_) {
        if (!arguments.length) return _gsPlanURL;
        _gsPlanURL = _;
        return this;
    }

};

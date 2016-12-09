import * as d3 from 'd3';
import _ from 'lodash';
import { geoExtent, geoPolygonIntersectsPolygon } from '../geo/index';
import { osmEntity, osmNode, osmRelation, osmWay } from '../osm/index';

import { actionAddEntity } from '../actions/index';
import { modeSelect } from '../modes/index';

import { utilDetect } from '../util/detect';
import toGeoJSON from 'togeojson';
import fromEsri from 'esri-to-geojson';

// dictionary matching geo-properties to OpenStreetMap tags 1:1
window.layerImports = {};

// prevent re-downloading and re-adding the same feature
window.knownObjectIds = {};

export function svgEsri(projection, context, dispatch) {
    var showLabels = true,
        detected = utilDetect(),
        layer;


    function init() {
        if (svgEsri.initialized) return;  // run once

        svgEsri.geojson = {};
        svgEsri.enabled = true;

        function over() {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            d3.event.dataTransfer.dropEffect = 'copy';
        }

        d3.select('body')
            .attr('dropzone', 'copy')
            .on('drop.localesri', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                if (!detected.filedrop) return;
                drawEsri.files(d3.event.dataTransfer.files);
            })
            .on('dragenter.localesri', over)
            .on('dragexit.localesri', over)
            .on('dragover.localesri', over);

        svgEsri.initialized = true;
    }


    function drawEsri(selection) {
        var geojson = svgEsri.geojson,
            enabled = svgEsri.enabled;

        (geojson.features || []).map(function(d) {
            // don't reload the same objects over again
            if (d.properties.OBJECTID && window.knownObjectIds[d.properties.OBJECTID]) {
                return;
            }
            window.knownObjectIds[d.properties.OBJECTID] = true;
        
            var props, nodes, ln, way;
            function makeEntity(loc_or_nodes) {
                props = {
                    tags: d.properties,
                    visible: true
                };
            
                // don't bring the service's OBJECTID any further
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
            
            // importing different GeoJSON geometries
            if (d.geometry.type === 'Point') {
                props = makeEntity(d.geometry.coordinates);
                var node = new osmNode(props);
                context.perform(
                    actionAddEntity(node),
                    'adding point'
                );
                  
            } else if (d.geometry.type === 'LineString') {
                nodes = makeMiniNodes(d.geometry.coordinates);
                props = makeEntity(nodes);
                way = new osmWay(props, nodes);
                context.perform(
                    actionAddEntity(way),
                    'adding way'
                );
                    
            } else if (d.geometry.type === 'MultiLineString') {
                // TODO: represent as a relation and not as multiple disconnected ways
                for (ln = 0; ln < d.geometry.coordinates.length; ln++) {
                    nodes = makeMiniNodes(d.geometry.coordinates[ln]);
                    props = makeEntity(nodes);
                    way = new osmWay(props);
                    context.perform(
                        actionAddEntity(way),
                        'adding way within MultiLineString'
                    );
                }
                    
            } else if (d.geometry.type === 'Polygon') {
                // TODO: allow donut hole polygons using relations and GeoJSON rings
                d.properties.area = d.properties.area || 'yes';
                nodes = makeMiniNodes(d.geometry.coordinates[0]);
                props = makeEntity(nodes);
                way = new osmWay(props);
                context.perform(
                    actionAddEntity(way),
                    'adding way within Polygon'
                );
                    
            } else if (d.geometry.type === 'MultiPolygon') {
                // TODO: allow donut hole polygons using relations and GeoJSON rings
                // TODO: represent as a relation and not as multiple disconnected Polygons
                d.properties.area = d.properties.area || 'yes';
                for (ln = 0; ln < d.geometry.coordinates.length; ln++) {
                    nodes = makeMiniNodes(d.geometry.coordinates[ln][0]);
                    props = makeEntity(nodes);
                    context.perform(
                        actionAddEntity(way),
                        'adding way within MultiPolygon'
                    );
                }
            }
        });
        
        return this;
    }
    
    // iterate through keys, adding a row describing each
    // user can set a new property name for each row
    function doKey(r, keys, samplefeature, esriTable) {
        if (r >= keys.length) {
            return;
        }
        var row = esriTable.append('tr');
        row.append('td').text(keys[r]);
        var outfield = row.append('td').append('input');
        outfield.attr('type', 'text')
            .attr('name', keys[r])
            .attr('placeholder', (window.layerImports[keys[r]] || samplefeature.properties[keys[r]]))
            .on('change', function() {
                // properties with this.name renamed to this.value
                window.layerImports[this.name] = this.value;
            });
        doKey(r + 1, keys, esriTable);
    }

    drawEsri.enabled = function(_) {
        if (!arguments.length) return svgEsri.enabled;
        svgEsri.enabled = _;
        dispatch.call('change');
        return this;
    };


    drawEsri.hasData = function() {
        var geojson = svgEsri.geojson;
        return (!(_.isEmpty(geojson) || _.isEmpty(geojson.features)));
    };


    drawEsri.geojson = function(gj) {
        if (!arguments.length) return svgEsri.geojson;
        if (_.isEmpty(gj) || _.isEmpty(gj.features)) return this;
        svgEsri.geojson = gj;
        dispatch.call('change');
        return this;
    };

    drawEsri.url = function(true_url) {
        // add necessary URL parameters to the user's URL
        var url = true_url;
        if (url.indexOf('outSR') === -1) {
            url += '&outSR=4326';
        }
        if (url.indexOf('&f=') === -1) {
            url += '&f=json';
        }        
        
        // turn iD Editor bounds into a query
        var bounds = context.map().trimmedExtent().bbox();
        bounds = JSON.stringify({
            xmin: bounds.minX.toFixed(6),
            ymin: bounds.minY.toFixed(6),
            xmax: bounds.maxX.toFixed(6),
            ymax: bounds.maxY.toFixed(6),
            spatialReference: {
              wkid: 4326
            }
        });
        if (this.lastBounds === bounds && this.lastProps === JSON.stringify(window.layerImports)) {
            // unchanged bounds, unchanged import parameters, so unchanged data
            return this;
        }
        
        // data has changed - make a query
        this.lastBounds = bounds;
        this.lastProps = JSON.stringify(window.layerImports);

        // make a spatial query within the user viewport (unless the user made their own spatial query)       
        if (url.indexOf('spatialRel') === -1) {
            url += '&geometry=' + this.lastBounds;
            url += '&geometryType=esriGeometryEnvelope';
            url += '&spatialRel=esriSpatialRelIntersects';
            url += '&inSR=4326';
        }
        
        d3.text(url, function(err, data) {
            if (err) {
                console.log('Esri service URL did not load');
                console.error(err);
            } else {
                var esriTable = d3.selectAll('.esri-table').html('');
                
                // convert EsriJSON to GeoJSON here
                var jsondl = fromEsri.fromEsri(JSON.parse(data));
                
                if (jsondl.features.length) {
                    // make a row for each GeoJSON property
                    // existing name appears as a label
                    // sample data appears as a text input placeholder
                    // adding text over the sample data makes it into an OSM tag
                    // TODO: target tags (addresses, roads, bike lanes)
                    var samplefeature = jsondl.features[0];
                    var keys = Object.keys(samplefeature.properties);
                    doKey(0, keys, samplefeature, esriTable);
                    
                    // if any import properties were added, make these mods and reject all other properties
                    var convertedKeys = Object.keys(window.layerImports);
                    if (convertedKeys.length) {
                        jsondl.features.map(function(selectfeature) {
                            // keep the OBJECTID to make sure we don't download the same data multiple times
                            var outprops = {
                                OBJECTID: selectfeature.properties.OBJECTID
                            };
                            for (var k = 0; k < convertedKeys.length; k++) {
                                var kv = selectfeature.properties[convertedKeys[k]];
                                if (kv) {
                                    outprops[window.layerImports[convertedKeys[k]]] = kv;
                                }
                            }
                            selectfeature.properties = outprops;
                            return selectfeature;
                        });
                    }
                } else {
                    console.log('no feature to build table from');
                }
                drawEsri.geojson(jsondl);
            }
        });
        
        // whenever map is moved, start 0.7s timer to re-download data from ArcGIS service
        context.map().on('move', function() {
            if (this.timeout) {
               clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(function() {
                this.url(true_url);
            }.bind(this), 700);
        }.bind(this));
        
        return this;
    };

    drawEsri.fitZoom = function() {
        // todo: implement
        if (!this.hasData()) return this;
        var geojson = svgEsri.geojson;

        var map = context.map(),
            viewport = map.trimmedExtent().polygon(),
            coords = _.reduce(geojson.features, function(coords, feature) {
                var c = feature.geometry.coordinates;
                return _.union(coords, feature.geometry.type === 'Point' ? [c] : c);
            }, []);

        if (!geoPolygonIntersectsPolygon(viewport, coords, true)) {
            var extent = geoExtent(d3.geoBounds(geojson));
            map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
        }

        return this;
    };


    init();
    return drawEsri;
}

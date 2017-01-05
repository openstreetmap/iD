import * as d3 from 'd3';
import _ from 'lodash';
import { geoExtent, geoCross } from '../geo/index';
import { osmEntity } from './entity';
import { osmLanes } from './lanes';
import { osmOneWayTags } from './tags';
import { areaKeys } from '../core/context';


export function osmWay() {
    if (!(this instanceof osmWay)) {
        return (new osmWay()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


osmEntity.way = osmWay;

osmWay.prototype = Object.create(osmEntity.prototype);


_.extend(osmWay.prototype, {
    type: 'way',
    nodes: [],


    copy: function(resolver, copies) {
        if (copies[this.id])
            return copies[this.id];

        var copy = osmEntity.prototype.copy.call(this, resolver, copies);

        var nodes = this.nodes.map(function(id) {
            return resolver.entity(id).copy(resolver, copies).id;
        });

        copy = copy.update({ nodes: nodes });
        copies[this.id] = copy;

        return copy;
    },


    extent: function(resolver) {
        return resolver.transient(this, 'extent', function() {
            var extent = geoExtent();
            for (var i = 0; i < this.nodes.length; i++) {
                var node = resolver.hasEntity(this.nodes[i]);
                if (node) {
                    extent._extend(node.extent());
                }
            }
            return extent;
        });
    },


    first: function() {
        return this.nodes[0];
    },


    last: function() {
        return this.nodes[this.nodes.length - 1];
    },


    contains: function(node) {
        return this.nodes.indexOf(node) >= 0;
    },


    affix: function(node) {
        if (this.nodes[0] === node) return 'prefix';
        if (this.nodes[this.nodes.length - 1] === node) return 'suffix';
    },


    layer: function() {
        // explicit layer tag, clamp between -10, 10..
        if (isFinite(this.tags.layer)) {
            return Math.max(-10, Math.min(+(this.tags.layer), 10));
        }

        // implied layer tag..
        if (this.tags.location === 'overground') return 1;
        if (this.tags.location === 'underground') return -1;
        if (this.tags.location === 'underwater') return -10;

        if (this.tags.power === 'line') return 10;
        if (this.tags.power === 'minor_line') return 10;
        if (this.tags.aerialway) return 10;
        if (this.tags.bridge) return 1;
        if (this.tags.cutting) return -1;
        if (this.tags.tunnel) return -1;
        if (this.tags.waterway) return -1;
        if (this.tags.man_made === 'pipeline') return -10;
        if (this.tags.boundary) return -10;
        return 0;
    },


    isOneWay: function() {
        // explicit oneway tag..
        if (['yes', '1', '-1'].indexOf(this.tags.oneway) !== -1) { return true; }
        if (['no', '0'].indexOf(this.tags.oneway) !== -1) { return false; }

        // implied oneway tag..
        for (var key in this.tags) {
            if (key in osmOneWayTags && (this.tags[key] in osmOneWayTags[key]))
                return true;
        }
        return false;
    },


    lanes: function() {
        return osmLanes(this);
    },


    isClosed: function() {
        return this.nodes.length > 0 && this.first() === this.last();
    },


    isConvex: function(resolver) {
        if (!this.isClosed() || this.isDegenerate()) return null;

        var nodes = _.uniq(resolver.childNodes(this)),
            coords = _.map(nodes, 'loc'),
            curr = 0, prev = 0;

        for (var i = 0; i < coords.length; i++) {
            var o = coords[(i+1) % coords.length],
                a = coords[i],
                b = coords[(i+2) % coords.length],
                res = geoCross(o, a, b);

            curr = (res > 0) ? 1 : (res < 0) ? -1 : 0;
            if (curr === 0) {
                continue;
            } else if (prev && curr !== prev) {
                return false;
            }
            prev = curr;
        }
        return true;
    },


    isArea: function() {
        if (this.tags.area === 'yes')
            return true;
        if (!this.isClosed() || this.tags.area === 'no')
            return false;
        for (var key in this.tags) {
            if (key in areaKeys && !(this.tags[key] in areaKeys[key])) {
                return true;
            }
        }
        return false;
    },


    isDegenerate: function() {
        return _.uniq(this.nodes).length < (this.isArea() ? 3 : 2);
    },


    areAdjacent: function(n1, n2) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i] === n1) {
                if (this.nodes[i - 1] === n2) return true;
                if (this.nodes[i + 1] === n2) return true;
            }
        }
        return false;
    },


    geometry: function(graph) {
        return graph.transient(this, 'geometry', function() {
            return this.isArea() ? 'area' : 'line';
        });
    },

    // Adds a node (id) in front of the node which is currently at position index.
    // If index equals length, the node (id) will be added at the end of the way.
    // If index is negative or > length, it will throw an error.
    // Generating consecutive duplicates is silently prevented
    
    addNode: function(id, index) {
        var nodes = this.nodes.slice(),
            spliceIndex = index === undefined ? nodes.length : index;
        if (spliceIndex > nodes.length || spliceIndex < 0) {
            throw new Error('addNode: index ' + spliceIndex + ' is invalid');
        }
        if (nodes[spliceIndex] !== id&& nodes[spliceIndex-1] !== id) {
            nodes.splice(spliceIndex, 0, id);
        }
        return this.update({nodes: nodes});
    },

    // Replaces the node which is currently at position index with the given node (id). 
    // If index is negative or >= length, it will throw an error.   
    // Consecutive duplicates are eliminated including existing ones.

    updateNode: function(id, index) {
        var nodes = [];
        
        if (index === undefined || index >= this.nodes.length || index < 0) {
            throw new Error('updateNode: index ' + index + ' is invalid');
        }

        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            if (i === index) {
                if (nodes[nodes.length - 1] !== id)
                    nodes.push(id);
            } else {
                if (nodes[nodes.length - 1] !== node)
                    nodes.push(node);
            }    
        }

        return this.update({nodes: nodes});
    },

    // Replaces each occurrence of node id needle with replacement. 
    // Consecutive duplicates are eliminated including existing ones.

    replaceNode: function(needle, replacement) {
        var nodes = [];

        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            if (node === needle) {
                if (nodes[nodes.length - 1] !== replacement)
                    nodes.push(replacement);
            } else {
                if (nodes[nodes.length - 1] !== node)
                    nodes.push(node);
            }    
        }

        return this.update({nodes: nodes});
    },

    // Removes each occurrence of node id needle with replacement. 
    // Consecutive duplicates are eliminated. Circularity is preserved.

    removeNode: function(id) {
        var nodes = [];

        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            if (node !== id && nodes[nodes.length - 1] !== node) {
                nodes.push(node);
            }
        }

        // Preserve circularity
        if (this.nodes.length > 1 && this.first() === id && this.last() === id && nodes[nodes.length - 1] !== nodes[0]) {
            nodes.push(nodes[0]);
        }

        return this.update({nodes: nodes});
    },


    asJXON: function(changeset_id) {
        var r = {
            way: {
                '@id': this.osmId(),
                '@version': this.version || 0,
                nd: _.map(this.nodes, function(id) {
                    return { keyAttributes: { ref: osmEntity.id.toOSM(id) } };
                }),
                tag: _.map(this.tags, function(v, k) {
                    return { keyAttributes: { k: k, v: v } };
                })
            }
        };
        if (changeset_id) r.way['@changeset'] = changeset_id;
        return r;
    },


    asGeoJSON: function(resolver) {
        return resolver.transient(this, 'GeoJSON', function() {
            var coordinates = _.map(resolver.childNodes(this), 'loc');
            if (this.isArea() && this.isClosed()) {
                return {
                    type: 'Polygon',
                    coordinates: [coordinates]
                };
            } else {
                return {
                    type: 'LineString',
                    coordinates: coordinates
                };
            }
        });
    },


    area: function(resolver) {
        return resolver.transient(this, 'area', function() {
            var nodes = resolver.childNodes(this);

            var json = {
                type: 'Polygon',
                coordinates: [_.map(nodes, 'loc')]
            };

            if (!this.isClosed() && nodes.length) {
                json.coordinates[0].push(nodes[0].loc);
            }

            var area = d3.geoArea(json);

            // Heuristic for detecting counterclockwise winding order. Assumes
            // that OpenStreetMap polygons are not hemisphere-spanning.
            if (area > 2 * Math.PI) {
                json.coordinates[0] = json.coordinates[0].reverse();
                area = d3.geoArea(json);
            }

            return isNaN(area) ? 0 : area;
        });
    }
});

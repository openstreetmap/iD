import * as d3 from 'd3';
import _ from 'lodash';
import { Extent, cross } from '../geo/index';
import { Entity } from './entity';
import { oneWayTags } from './tags';
import { areaKeys } from './context';

export function Way() {
    if (!(this instanceof Way)) {
        return (new Way()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

Entity.way = Way;

Way.prototype = Object.create(Entity.prototype);

_.extend(Way.prototype, {
    type: 'way',
    nodes: [],

    copy: function(resolver, copies) {
        if (copies[this.id])
            return copies[this.id];

        var copy = Entity.prototype.copy.call(this, resolver, copies);

        var nodes = this.nodes.map(function(id) {
            return resolver.entity(id).copy(resolver, copies).id;
        });

        copy = copy.update({nodes: nodes});
        copies[this.id] = copy;

        return copy;
    },

    extent: function(resolver) {
        return resolver.transient(this, 'extent', function() {
            var extent = Extent();
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
        if (this.tags.layer !== undefined) {
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
            if (key in oneWayTags && (this.tags[key] in oneWayTags[key]))
                return true;
        }
        return false;
    },

    lanes: function() {

        function makeLanesArray(metadata) {
            function createLaneItem(index, direction) {
                return {
                    index: index,
                    direction: direction
                };
            }
            var lanesArray = [];
            for (var i = 0; i < metadata.forward; i++) {
                lanesArray.push(createLaneItem(i, 'forward'));
            }
            for (i = 0; i < metadata.bothways; i++) {
                lanesArray.push(createLaneItem(metadata.forward + i, 'bothways'));
            }
            for (i = 0; i < metadata.backward; i++) {
                lanesArray.push(createLaneItem(metadata.forward + metadata.bothways + i, 'backward'));
            }
            return lanesArray;
        }

        function safeValue(n) {
            if (n < 0) return 0;
            if (n > metadata.count - metadata.bothways)
                return metadata.count - metadata.bothways;
            return n;
        }

        if (!this.tags.highway) return null;

        var metadata = {};

        // fill metadata.count with default count
        switch (this.tags.highway) {
            case 'trunk':
            case 'motorway':
                metadata.count = this.isOneWay() ? 2 : 4;
                break;
            default:
                metadata.count = this.isOneWay() ? 1 : 2;
                break;
        }

        if (this.tags.lanes) metadata.count = parseInt(this.tags.lanes);

        metadata.oneway = this.isOneWay();

        if (parseInt(this.tags.oneway) === -1) {
            metadata.forward = 0;
            metadata.bothways = 0;
            metadata.backward = metadata.count;
        }
        else if (metadata.oneway) {
            metadata.forward = metadata.count;
            metadata.bothways = 0;
            metadata.backward = 0;
        } else {
            metadata.bothways = parseInt(this.tags['lanes:both_ways']) > 0 ? 1 : 0;
            metadata.forward = parseInt(this.tags['lanes:forward']);
            metadata.backward = parseInt(this.tags['lanes:backward']);

            if (_.isNaN(metadata.forward) && _.isNaN(metadata.backward)) {
                metadata.forward = parseInt((metadata.count - metadata.bothways) / 2);
                metadata.backward = metadata.count - metadata.bothways - metadata.forward;
            }
            else if (_.isNaN(metadata.forward)) {
                metadata.backward = safeValue(metadata.backward);
                metadata.forward = metadata.count - metadata.bothways - metadata.backward;

            }
            else if (_.isNaN(metadata.backward)) {
                metadata.forward = safeValue(metadata.forward);
                metadata.backward = metadata.count - metadata.bothways - metadata.forward;
            }
        }

        return {
            metadata: metadata,
            lanes: makeLanesArray(metadata)
        };
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
                res = cross(o, a, b);

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

    addNode: function(id, index) {
        var nodes = this.nodes.slice();
        nodes.splice(index === undefined ? nodes.length : index, 0, id);
        return this.update({nodes: nodes});
    },

    updateNode: function(id, index) {
        var nodes = this.nodes.slice();
        nodes.splice(index, 1, id);
        return this.update({nodes: nodes});
    },

    replaceNode: function(needle, replacement) {
        if (this.nodes.indexOf(needle) < 0)
            return this;

        var nodes = this.nodes.slice();
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i] === needle) {
                nodes[i] = replacement;
            }
        }
        return this.update({nodes: nodes});
    },

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
                    return { keyAttributes: { ref: Entity.id.toOSM(id) } };
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

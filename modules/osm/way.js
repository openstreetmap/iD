import _extend from 'lodash-es/extend';
import _map from 'lodash-es/map';
import _uniq from 'lodash-es/uniq';

import { geoArea as d3_geoArea } from 'd3-geo';

import { geoExtent, geoVecCross } from '../geo';
import { osmEntity } from './entity';
import { osmLanes } from './lanes';
import { osmOneWayTags, osmRightSideIsInsideTags } from './tags';
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


_extend(osmWay.prototype, {
    type: 'way',
    nodes: [],


    copy: function(resolver, copies) {
        if (copies[this.id]) return copies[this.id];

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
        if (this.tags.covered === 'yes') return -1;
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
        var values = {
            'yes': true,
            '1': true,
            '-1': true,
            'reversible': true,
            'alternating': true,
            'no': false,
            '0': false
        };
        if (values[this.tags.oneway] !== undefined) {
            return values[this.tags.oneway];
        }

        // implied oneway tag..
        for (var key in this.tags) {
            if (key in osmOneWayTags && (this.tags[key] in osmOneWayTags[key]))
                return true;
        }
        return false;
    },

    // Some identifier for tag that implies that this way is "sided",
    // i.e. the right side is the 'inside' (e.g. the right side of a
    // natural=cliff is lower).
    sidednessIdentifier: function() {
        for (var key in this.tags) {
            var value = this.tags[key];
            if (key in osmRightSideIsInsideTags && (value in osmRightSideIsInsideTags[key])) {
                if (osmRightSideIsInsideTags[key][value] === true) {
                    return key;
                } else {
                    // if the map's value is something other than a
                    // literal true, we should use it so we can
                    // special case some keys (e.g. natural=coastline
                    // is handled differently to other naturals).
                    return osmRightSideIsInsideTags[key][value];
                }
            }
        }

        return null;
    },
    isSided: function() {
        if (this.tags.two_sided === 'yes') {
            return false;
        }

        return this.sidednessIdentifier() != null;
    },

    lanes: function() {
        return osmLanes(this);
    },


    isClosed: function() {
        return this.nodes.length > 1 && this.first() === this.last();
    },


    isConvex: function(resolver) {
        if (!this.isClosed() || this.isDegenerate()) return null;

        var nodes = _uniq(resolver.childNodes(this));
        var coords = _map(nodes, 'loc');
        var curr = 0;
        var prev = 0;

        for (var i = 0; i < coords.length; i++) {
            var o = coords[(i+1) % coords.length];
            var a = coords[i];
            var b = coords[(i+2) % coords.length];
            var res = geoVecCross(a, b, o);

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
        // `highway` and `railway` are typically linear features, but there
        // are a few exceptions that should be treated as areas, even in the
        // absence of a proper `area=yes` or `areaKeys` tag.. see #4194
        var lineKeys = {
            highway: {
                rest_area: true,
                services: true
            },
            railway: {
                roundhouse: true,
                station: true,
                traverser: true,
                turntable: true,
                wash: true
            }
        };

        if (this.tags.area === 'yes')
            return true;
        if (!this.isClosed() || this.tags.area === 'no')
            return false;
        for (var key in this.tags) {
            if (key in areaKeys && !(this.tags[key] in areaKeys[key])) {
                return true;
            }
            if (key in lineKeys && this.tags[key] in lineKeys[key]) {
                return true;
            }
        }
        return false;
    },


    isDegenerate: function() {
        return _uniq(this.nodes).length < (this.isArea() ? 3 : 2);
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


    // If this way is not closed, append the beginning node to the end of the nodelist to close it.
    close: function() {
        if (this.isClosed() || !this.nodes.length) return this;

        var nodes = this.nodes.slice();
        nodes = nodes.filter(noRepeatNodes);
        nodes.push(nodes[0]);
        return this.update({ nodes: nodes });
    },


    // If this way is closed, remove any connector nodes from the end of the nodelist to unclose it.
    unclose: function() {
        if (!this.isClosed()) return this;

        var nodes = this.nodes.slice();
        var connector = this.first();
        var i = nodes.length - 1;

        // remove trailing connectors..
        while (i > 0 && nodes.length > 1 && nodes[i] === connector) {
            nodes.splice(i, 1);
            i = nodes.length - 1;
        }

        nodes = nodes.filter(noRepeatNodes);
        return this.update({ nodes: nodes });
    },


    // Adds a node (id) in front of the node which is currently at position index.
    // If index is undefined, the node will be added to the end of the way for linear ways,
    //   or just before the final connecting node for circular ways.
    // Consecutive duplicates are eliminated including existing ones.
    // Circularity is always preserved when adding a node.
    addNode: function(id, index) {
        var nodes = this.nodes.slice();
        var isClosed = this.isClosed();
        var max = isClosed ? nodes.length - 1 : nodes.length;

        if (index === undefined) {
            index = max;
        }

        if (index < 0 || index > max) {
            throw new RangeError('index ' + index + ' out of range 0..' + max);
        }

        // If this is a closed way, remove all connector nodes except the first one
        // (there may be duplicates) and adjust index if necessary..
        if (isClosed) {
            var connector = this.first();

            // leading connectors..
            var i = 1;
            while (i < nodes.length && nodes.length > 2 && nodes[i] === connector) {
                nodes.splice(i, 1);
                if (index > i) index--;
            }

            // trailing connectors..
            i = nodes.length - 1;
            while (i > 0 && nodes.length > 1 && nodes[i] === connector) {
                nodes.splice(i, 1);
                if (index > i) index--;
                i = nodes.length - 1;
            }
        }

        nodes.splice(index, 0, id);
        nodes = nodes.filter(noRepeatNodes);

        // If the way was closed before, append a connector node to keep it closed..
        if (isClosed && (nodes.length === 1 || nodes[0] !== nodes[nodes.length - 1])) {
            nodes.push(nodes[0]);
        }

        return this.update({ nodes: nodes });
    },


    // Replaces the node which is currently at position index with the given node (id).
    // Consecutive duplicates are eliminated including existing ones.
    // Circularity is preserved when updating a node.
    updateNode: function(id, index) {
        var nodes = this.nodes.slice();
        var isClosed = this.isClosed();
        var max = nodes.length - 1;

        if (index === undefined || index < 0 || index > max) {
            throw new RangeError('index ' + index + ' out of range 0..' + max);
        }

        // If this is a closed way, remove all connector nodes except the first one
        // (there may be duplicates) and adjust index if necessary..
        if (isClosed) {
            var connector = this.first();

            // leading connectors..
            var i = 1;
            while (i < nodes.length && nodes.length > 2 && nodes[i] === connector) {
                nodes.splice(i, 1);
                if (index > i) index--;
            }

            // trailing connectors..
            i = nodes.length - 1;
            while (i > 0 && nodes.length > 1 && nodes[i] === connector) {
                nodes.splice(i, 1);
                if (index === i) index = 0;  // update leading connector instead
                i = nodes.length - 1;
            }
        }

        nodes.splice(index, 1, id);
        nodes = nodes.filter(noRepeatNodes);

        // If the way was closed before, append a connector node to keep it closed..
        if (isClosed && (nodes.length === 1 || nodes[0] !== nodes[nodes.length - 1])) {
            nodes.push(nodes[0]);
        }

        return this.update({nodes: nodes});
    },


    // Replaces each occurrence of node id needle with replacement.
    // Consecutive duplicates are eliminated including existing ones.
    // Circularity is preserved.
    replaceNode: function(needleID, replacementID) {
        var nodes = this.nodes.slice();
        var isClosed = this.isClosed();

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i] === needleID) {
                nodes[i] = replacementID;
            }
        }

        nodes = nodes.filter(noRepeatNodes);

        // If the way was closed before, append a connector node to keep it closed..
        if (isClosed && (nodes.length === 1 || nodes[0] !== nodes[nodes.length - 1])) {
            nodes.push(nodes[0]);
        }

        return this.update({nodes: nodes});
    },


    // Removes each occurrence of node id.
    // Consecutive duplicates are eliminated including existing ones.
    // Circularity is preserved.
    removeNode: function(id) {
        var nodes = this.nodes.slice();
        var isClosed = this.isClosed();

        nodes = nodes
            .filter(function(node) { return node !== id; })
            .filter(noRepeatNodes);

        // If the way was closed before, append a connector node to keep it closed..
        if (isClosed && (nodes.length === 1 || nodes[0] !== nodes[nodes.length - 1])) {
            nodes.push(nodes[0]);
        }

        return this.update({nodes: nodes});
    },


    asJXON: function(changeset_id) {
        var r = {
            way: {
                '@id': this.osmId(),
                '@version': this.version || 0,
                nd: _map(this.nodes, function(id) {
                    return { keyAttributes: { ref: osmEntity.id.toOSM(id) } };
                }),
                tag: _map(this.tags, function(v, k) {
                    return { keyAttributes: { k: k, v: v } };
                })
            }
        };
        if (changeset_id) {
            r.way['@changeset'] = changeset_id;
        }
        return r;
    },


    asGeoJSON: function(resolver) {
        return resolver.transient(this, 'GeoJSON', function() {
            var coordinates = _map(resolver.childNodes(this), 'loc');
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
                coordinates: [_map(nodes, 'loc')]
            };

            if (!this.isClosed() && nodes.length) {
                json.coordinates[0].push(nodes[0].loc);
            }

            var area = d3_geoArea(json);

            // Heuristic for detecting counterclockwise winding order. Assumes
            // that OpenStreetMap polygons are not hemisphere-spanning.
            if (area > 2 * Math.PI) {
                json.coordinates[0] = json.coordinates[0].reverse();
                area = d3_geoArea(json);
            }

            return isNaN(area) ? 0 : area;
        });
    }
});


// Filter function to eliminate consecutive duplicates.
function noRepeatNodes(node, i, arr) {
    return i === 0 || node !== arr[i - 1];
}

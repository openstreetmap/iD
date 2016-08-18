import _ from 'lodash';
import { Extent, cross } from '../geo/index';
import { Entity } from './entity';
import { oneWayTags } from './tags';

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

        function parsePipeString(key, n) {
            var str = tags[key];

            if (!str) return;

            var array = str.split('|')
                .filter(function(s, i) {
                    return i < n;
                })
                .map(function(s) {
                    if (s === '') s = 'none';
                    return s.split(';');
                });
            while (array.length < n) {
                array.push(['none']);
            }
            return array;
        }

        function parseTurnLanes(key, n){
            var validValues = [
                'left', 'slight_left', 'sharp_left', 'through', 'right', 'slight_right',
                'sharp_right', 'reverse', 'merge_to_left', 'merge_to_right', 'none'
            ];
            var parsedArray = parsePipeString(key, n);
            if (!parsedArray) return;

            return parsedArray.map(function(l) {
                return l.map(function(i) {
                    return validValues.indexOf(i) === -1 ? 'unknown': i;
                });
            });
        }

        function parseMaxspeed(key, n) {
            var str = tags[key];
            if (!str) return;
            return str.split('|')
                .filter(function(s, i) {
                    return i < n;
                })
                .map(function(s) {
                    if (s === '') return 'none';
                    var m = parseInt(s);
                    return _.isNaN(m) ? 'unknown': m;
                });
        }

        function parseLaneDirections() {
            var forward = parseInt(tags['lanes:forward']);
            var backward = parseInt(tags['lanes:backward']);
            var bothways = parseInt(tags['lanes:both_ways']) > 0 ? 1 : 0;

            if (parseInt(tags.oneway) === -1) {
                forward = 0;
                bothways = 0;
                backward = laneCount;
            }
            else if (oneway) {
                forward = laneCount;
                bothways = 0;
                backward = 0;
            }
            else if (_.isNaN(forward) && _.isNaN(backward)) {
                    backward = parseInt((laneCount - bothways) / 2);
                    forward = laneCount - bothways - backward;
            }
            else if (_.isNaN(forward)) {
                if (backward > laneCount - bothways) {
                    backward = laneCount - bothways;
                }
                forward = laneCount - bothways - backward;
            }
            else if (_.isNaN(backward)) {
                if (forward > laneCount - bothways) {
                    forward = laneCount - bothways;
                }
                backward = laneCount - bothways - forward;
            }
            return {
                forward: forward,
                backward: backward,
                bothways: bothways
            };
        }

        // smartly fills the undefined array.key elements with values
        function smartFill(array, key, values) {
            if (!array) return;
            // keeps track of elements filled with 'value'
            var counter = 0;
            array.forEach(function(o) {
                if (!o || counter === values.length) return;

                if (o[key] === undefined) {
                    o[key] = values[counter];
                    counter++;
                }
            });
        }

        function getLaneCount() {
            var count;
            // fill laneCount with defaults
            switch (tags.highway) {
                case 'trunk':
                case 'motorway':
                    count = oneway ? 2 : 4;
                    break;
                default:
                    count = oneway ? 1 : 2;
                    break;
            }

            if (tags.lanes) count = parseInt(tags.lanes);
            return count;
        }

        if (!this.tags.highway) return null;

        var tags = this.tags;
        var oneway = this.isOneWay();
        var laneCount = getLaneCount();

        var lanesArray = [];
        for (var i = 0; i < laneCount; i++) {
            lanesArray.push({ index: i});
        }

        var laneDirections = parseLaneDirections();
        var forward = laneDirections.forward;
        var backward = laneDirections.backward;
        var bothways = laneDirections.bothways;

        // parse the piped string 'x|y|z' format
        var turnLanes = parseTurnLanes('turn:lanes', laneCount);
        var turnLanesForward = parseTurnLanes('turn:lanes:forward', forward);
        var turnLanesBackward = parseTurnLanes('turn:lanes:backward', backward);

        var maxspeedLanes = parseMaxspeed('maxspeed:lanes', laneCount);
        var maxspeedLanesForward = parseMaxspeed('maxspeed:lanes:forward', forward);
        var maxspeedLanesBackward = parseMaxspeed('maxspeed:lanes:backward', backward);

        // fill each undefined lanesArray's direction element with 'forward/bothwats/backward'.
        smartFill(lanesArray, 'direction', _.fill(Array(forward), 'forward'));
        smartFill(lanesArray, 'direction', _.fill(Array(bothways), 'bothways'));
        smartFill(lanesArray, 'direction', _.fill(Array(backward), 'backward'));

        // parse turn:lanes:forward/backward first

        if (!oneway && this.tags['turn:lanes:forward'] && this.tags['turn:lanes:backward']) {
            smartFill(lanesArray, 'turnLane', turnLanesForward);
            // if both_ways fill it with null
            smartFill(lanesArray, 'turnLane', _.fill(Array(bothways), null));
            smartFill(lanesArray, 'turnLane', turnLanesBackward);
        }
        else if (this.tags['turn:lanes']) {
            smartFill(lanesArray, 'turnLane', turnLanes);
        }

        // parse max speed
        if (!oneway && this.tags['maxspeed:lanes:forward'] && this.tags['maxspeed:lanes:backward']) {
            smartFill(lanesArray, 'maxspeed', maxspeedLanesForward);
            smartFill(lanesArray, 'maxspeed', _.fill(Array(bothways), null));
            smartFill(lanesArray, 'maxspeed', maxspeedLanesBackward);
        }
        else if (this.tags['maxspeed:lanes']) {
            smartFill(lanesArray, 'maxspeed', maxspeedLanes);
        }

        return {
            metadata: {
                count: laneCount,
                oneway: oneway,
                forward: forward,
                backward: backward,
                bothways: bothways,
                turnLanes: turnLanes,
                turnLanesForward: turnLanesForward,
                turnLanesBackward: turnLanesBackward,
                maxspeedLanes: maxspeedLanes,
                maxspeedLanesForward: maxspeedLanesForward,
                maxspeedLanesBackward: maxspeedLanesBackward,
            },
            lanes: lanesArray
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
        for (var key in this.tags)
            if (key in iD.areaKeys && !(this.tags[key] in iD.areaKeys[key]))
                return true;
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

            var area = d3.geo.area(json);

            // Heuristic for detecting counterclockwise winding order. Assumes
            // that OpenStreetMap polygons are not hemisphere-spanning.
            if (area > 2 * Math.PI) {
                json.coordinates[0] = json.coordinates[0].reverse();
                area = d3.geo.area(json);
            }

            return isNaN(area) ? 0 : area;
        });
    }
});

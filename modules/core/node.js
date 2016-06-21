// iD.Node = iD.Entity.node;
import { Entity } from './entity';
import { Extent } from '../geo/index';

export function Node() {
    if (!(this instanceof Node)) {
        return (new Node()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

Entity.node = Node;

Node.prototype = Object.create(Entity.prototype);

_.extend(Node.prototype, {
    type: 'node',

    extent: function() {
        return new Extent(this.loc);
    },

    geometry: function(graph) {
        return graph.transient(this, 'geometry', function() {
            return graph.isPoi(this) ? 'point' : 'vertex';
        });
    },

    move: function(loc) {
        return this.update({loc: loc});
    },

    isIntersection: function(resolver) {
        return resolver.transient(this, 'isIntersection', function() {
            return resolver.parentWays(this).filter(function(parent) {
                return (parent.tags.highway ||
                    parent.tags.waterway ||
                    parent.tags.railway ||
                    parent.tags.aeroway) &&
                    parent.geometry(resolver) === 'line';
            }).length > 1;
        });
    },

    isHighwayIntersection: function(resolver) {
        return resolver.transient(this, 'isHighwayIntersection', function() {
            return resolver.parentWays(this).filter(function(parent) {
                return parent.tags.highway && parent.geometry(resolver) === 'line';
            }).length > 1;
        });
    },

    asJXON: function(changeset_id) {
        var r = {
            node: {
                '@id': this.osmId(),
                '@lon': this.loc[0],
                '@lat': this.loc[1],
                '@version': (this.version || 0),
                tag: _.map(this.tags, function(v, k) {
                    return { keyAttributes: { k: k, v: v } };
                })
            }
        };
        if (changeset_id) r.node['@changeset'] = changeset_id;
        return r;
    },

    asGeoJSON: function() {
        return {
            type: 'Point',
            coordinates: this.loc
        };
    }
});

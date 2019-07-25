import { entityEntity } from './entity';
import { geoExtent } from '../geo';


export function entityNode() {
    if (!(this instanceof entityNode)) {
        return (new entityNode()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

entityEntity.node = entityNode;

// inherit from entityEntity
entityNode.prototype = Object.create(entityEntity.prototype);

Object.assign(entityNode.prototype, {

    type: 'node',

    loc: [9999, 9999],

    extent: function() {
        return new geoExtent(this.loc);
    },

    geometry: function(graph) {
        return graph.transient(this, 'geometry', function() {
            return graph.isPoi(this) ? 'point' : 'vertex';
        });
    },

    move: function(loc) {
        return this.update({loc: loc});
    },

    isDegenerate: function() {
        return !(
            Array.isArray(this.loc) && this.loc.length === 2 &&
            this.loc[0] >= -180 && this.loc[0] <= 180 &&
            this.loc[1] >= -90 && this.loc[1] <= 90
        );
    },

    isEndpoint: function(resolver) {
        return resolver.transient(this, 'isEndpoint', function() {
            var id = this.id;
            return resolver.parentWays(this).filter(function(parent) {
                return !parent.isClosed() && !!parent.affix(id);
            }).length > 0;
        });
    },

    isConnected: function(resolver) {
        return resolver.transient(this, 'isConnected', function() {
            var parents = resolver.parentWays(this);

            function isLine(entity) {
                return entity.geometry(resolver) === 'line' &&
                    entity.hasInterestingTags();
            }

            // vertex is connected to multiple parent lines
            if (parents.length > 1 && parents.some(isLine)) {
                return true;

            } else if (parents.length === 1) {
                var way = parents[0];
                var nodes = way.nodes.slice();
                if (way.isClosed()) { nodes.pop(); }  // ignore connecting node if closed

                // return true if vertex appears multiple times (way is self intersecting)
                return nodes.indexOf(this.id) !== nodes.lastIndexOf(this.id);
            }

            return false;
        });
    },

    asJXON: function(changeset_id) {
        var r = {
            node: {
                '@id': this.untypedID(),
                '@lon': this.loc[0],
                '@lat': this.loc[1],
                '@version': (this.version || 0),
                tag: Object.keys(this.tags).map(function(k) {
                    return { keyAttributes: { k: k, v: this.tags[k] } };
                }, this)
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

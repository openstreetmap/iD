import { osmEntity } from './entity';
import { geoAngle, geoExtent } from '../geo';
import { utilArrayUniq } from '../util';

export const cardinal = {
    north: 0,               n: 0,
    northnortheast: 22,     nne: 22,
    northeast: 45,          ne: 45,
    eastnortheast: 67,      ene: 67,
    east: 90,               e: 90,
    eastsoutheast: 112,     ese: 112,
    southeast: 135,         se: 135,
    southsoutheast: 157,    sse: 157,
    south: 180,             s: 180,
    southsouthwest: 202,    ssw: 202,
    southwest: 225,         sw: 225,
    westsouthwest: 247,     wsw: 247,
    west: 270,              w: 270,
    westnorthwest: 292,     wnw: 292,
    northwest: 315,         nw: 315,
    northnorthwest: 337,    nnw: 337
};

/**
 * @typedef {typeof prototype & iD.AbstractEntity} OsmNode
 * @returns {OsmNode}
 */
export function osmNode() {
    if (!(this instanceof osmNode)) {
        return (new osmNode()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

osmEntity.node = osmNode;

osmNode.prototype = Object.create(osmEntity.prototype);

const prototype = {
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


    // Inspect tags and geometry to determine which direction(s) this node/vertex points
    directions: function(resolver, projection) {
        let val;
        let i;

        // which tag to use?
        if (this.isHighwayIntersection(resolver) && (this.tags.stop || '').toLowerCase() === 'all') {
            // all-way stop tag on a highway intersection
            val = 'all';
        } else {
            // generic direction tag
            val = (this.tags.direction || '').toLowerCase();

            // better suffix-style direction tag
            const re = /:direction$/i;
            const keys = Object.keys(this.tags);
            for (i = 0; i < keys.length; i++) {
                if (re.test(keys[i])) {
                    val = this.tags[keys[i]].toLowerCase();
                    break;
                }
            }
        }

        if (val === '') return [];


        const values = val.split(';');
        const results = [];

        values.forEach(function(v) {
            // swap cardinal for numeric directions
            if (cardinal[v] !== undefined) {
                v = cardinal[v];
            }

            // numeric direction - just add to results
            if (v !== '' && !isNaN(+v)) {
                results.push(+v);
                return;
            }

            // string direction - inspect parent ways
            const lookBackward =
                (this.tags['traffic_sign:backward'] || v === 'backward' || v === 'both' || v === 'all');
            const lookForward =
                (this.tags['traffic_sign:forward'] || v === 'forward' || v === 'both' || v === 'all');

            if (!lookForward && !lookBackward) return;

            const nodeIds = {};
            resolver.parentWays(this)
                .filter(p => (this.tags.highway || this.tags.traffic_sign || this.tags.traffic_calming || this.tags.barrier || this.tags.cycleway) ? p.tags.highway : true)
                .filter(p => (this.tags.railway) ? p.tags.railway : true)
                .filter(p => (this.tags.waterway) ? p.tags.waterway : true)
                .forEach(function(parent) {
                    const nodes = parent.nodes;
                    for (i = 0; i < nodes.length; i++) {
                        if (nodes[i] === this.id) {  // match current entity
                            if (lookForward && i > 0) {
                                nodeIds[nodes[i - 1]] = true;  // look back to prev node
                            }
                            if (lookBackward && i < nodes.length - 1) {
                                nodeIds[nodes[i + 1]] = true;  // look ahead to next node
                            }
                        }
                    }
                }, this);

            Object.keys(nodeIds).forEach(function(nodeId) {
                // +90 because geoAngle returns angle from X axis, not Y (north)
                results.push(
                    (geoAngle(this, resolver.entity(nodeId), projection) * (180 / Math.PI)) + 90
                );
            }, this);

        }, this);

        return utilArrayUniq(results);
    },

    isCrossing: function(){
        return this.tags.highway === 'crossing' ||
               this.tags.railway && this.tags.railway.indexOf('crossing') !== -1;
    },

    isEndpoint: function(resolver) {
        return resolver.transient(this, 'isEndpoint', function() {
            const id = this.id;
            return resolver.parentWays(this).filter(function(parent) {
                return !parent.isClosed() && !!parent.affix(id);
            }).length > 0;
        });
    },


    isConnected: function(resolver) {
        return resolver.transient(this, 'isConnected', function() {
            const parents = resolver.parentWays(this);

            if (parents.length > 1) {
                // vertex is connected to multiple parent ways
                for (const i in parents) {
                    if (parents[i].geometry(resolver) === 'line' &&
                        parents[i].hasInterestingTags()) return true;
                }
            } else if (parents.length === 1) {
                const way = parents[0];
                const nodes = way.nodes.slice();
                if (way.isClosed()) { nodes.pop(); }  // ignore connecting node if closed

                // return true if vertex appears multiple times (way is self intersecting)
                return nodes.indexOf(this.id) !== nodes.lastIndexOf(this.id);
            }

            return false;
        });
    },


    parentIntersectionWays: function(resolver) {
        return resolver.transient(this, 'parentIntersectionWays', function() {
            return resolver.parentWays(this).filter(function(parent) {
                return (parent.tags.highway ||
                    parent.tags.waterway ||
                    parent.tags.railway ||
                    parent.tags.aeroway) &&
                    parent.geometry(resolver) === 'line';
            });
        });
    },


    isIntersection: function(resolver) {
        return this.parentIntersectionWays(resolver).length > 1;
    },


    isHighwayIntersection: function(resolver) {
        return resolver.transient(this, 'isHighwayIntersection', function() {
            return resolver.parentWays(this).filter(function(parent) {
                return parent.tags.highway && parent.geometry(resolver) === 'line';
            }).length > 1;
        });
    },


    isOnAddressLine: function(resolver) {
        return resolver.transient(this, 'isOnAddressLine', function() {
            return resolver.parentWays(this).filter(function(parent) {
                return parent.tags.hasOwnProperty('addr:interpolation') &&
                    parent.geometry(resolver) === 'line';
            }).length > 0;
        });
    },


    asJXON: function(changeset_id) {
        const r = {
            node: {
                '@id': this.osmId(),
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
};
Object.assign(osmNode.prototype, prototype);

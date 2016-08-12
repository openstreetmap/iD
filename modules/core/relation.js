import * as d3 from 'd3';
import _ from 'lodash';
import { Extent, joinWays, polygonContainsPolygon, polygonIntersectsPolygon } from '../geo/index';
import { Entity } from './entity';

export function Relation() {
    if (!(this instanceof Relation)) {
        return (new Relation()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}
Entity.relation = Relation;

Relation.prototype = Object.create(Entity.prototype);

Relation.creationOrder = function(a, b) {
    var aId = parseInt(Entity.id.toOSM(a.id), 10);
    var bId = parseInt(Entity.id.toOSM(b.id), 10);

    if (aId < 0 || bId < 0) return aId - bId;
    return bId - aId;
};

_.extend(Relation.prototype, {
    type: 'relation',
    members: [],

    copy: function(resolver, copies) {
        if (copies[this.id])
            return copies[this.id];

        var copy = Entity.prototype.copy.call(this, resolver, copies);

        var members = this.members.map(function(member) {
            return _.extend({}, member, {id: resolver.entity(member.id).copy(resolver, copies).id});
        });

        copy = copy.update({members: members});
        copies[this.id] = copy;

        return copy;
    },

    extent: function(resolver, memo) {
        return resolver.transient(this, 'extent', function() {
            if (memo && memo[this.id]) return Extent();
            memo = memo || {};
            memo[this.id] = true;

            var extent = Extent();
            for (var i = 0; i < this.members.length; i++) {
                var member = resolver.hasEntity(this.members[i].id);
                if (member) {
                    extent._extend(member.extent(resolver, memo));
                }
            }
            return extent;
        });
    },

    geometry: function(graph) {
        return graph.transient(this, 'geometry', function() {
            return this.isMultipolygon() ? 'area' : 'relation';
        });
    },

    isDegenerate: function() {
        return this.members.length === 0;
    },

    // Return an array of members, each extended with an 'index' property whose value
    // is the member index.
    indexedMembers: function() {
        var result = new Array(this.members.length);
        for (var i = 0; i < this.members.length; i++) {
            result[i] = _.extend({}, this.members[i], {index: i});
        }
        return result;
    },

    // Return the first member with the given role. A copy of the member object
    // is returned, extended with an 'index' property whose value is the member index.
    memberByRole: function(role) {
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].role === role) {
                return _.extend({}, this.members[i], {index: i});
            }
        }
    },

    // Return the first member with the given id. A copy of the member object
    // is returned, extended with an 'index' property whose value is the member index.
    memberById: function(id) {
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].id === id) {
                return _.extend({}, this.members[i], {index: i});
            }
        }
    },

    // Return the first member with the given id and role. A copy of the member object
    // is returned, extended with an 'index' property whose value is the member index.
    memberByIdAndRole: function(id, role) {
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].id === id && this.members[i].role === role) {
                return _.extend({}, this.members[i], {index: i});
            }
        }
    },

    addMember: function(member, index) {
        var members = this.members.slice();
        members.splice(index === undefined ? members.length : index, 0, member);
        return this.update({members: members});
    },

    updateMember: function(member, index) {
        var members = this.members.slice();
        members.splice(index, 1, _.extend({}, members[index], member));
        return this.update({members: members});
    },

    removeMember: function(index) {
        var members = this.members.slice();
        members.splice(index, 1);
        return this.update({members: members});
    },

    removeMembersWithID: function(id) {
        var members = _.reject(this.members, function(m) { return m.id === id; });
        return this.update({members: members});
    },

    // Wherever a member appears with id `needle.id`, replace it with a member
    // with id `replacement.id`, type `replacement.type`, and the original role,
    // unless a member already exists with that id and role. Return an updated
    // relation.
    replaceMember: function(needle, replacement) {
        if (!this.memberById(needle.id))
            return this;

        var members = [];

        for (var i = 0; i < this.members.length; i++) {
            var member = this.members[i];
            if (member.id !== needle.id) {
                members.push(member);
            } else if (!this.memberByIdAndRole(replacement.id, member.role)) {
                members.push({id: replacement.id, type: replacement.type, role: member.role});
            }
        }

        return this.update({members: members});
    },

    asJXON: function(changeset_id) {
        var r = {
            relation: {
                '@id': this.osmId(),
                '@version': this.version || 0,
                member: _.map(this.members, function(member) {
                    return { keyAttributes: { type: member.type, role: member.role, ref: Entity.id.toOSM(member.id) } };
                }),
                tag: _.map(this.tags, function(v, k) {
                    return { keyAttributes: { k: k, v: v } };
                })
            }
        };
        if (changeset_id) r.relation['@changeset'] = changeset_id;
        return r;
    },

    asGeoJSON: function(resolver) {
        return resolver.transient(this, 'GeoJSON', function () {
            if (this.isMultipolygon()) {
                return {
                    type: 'MultiPolygon',
                    coordinates: this.multipolygon(resolver)
                };
            } else {
                return {
                    type: 'FeatureCollection',
                    properties: this.tags,
                    features: this.members.map(function (member) {
                        return _.extend({role: member.role}, resolver.entity(member.id).asGeoJSON(resolver));
                    })
                };
            }
        });
    },

    area: function(resolver) {
        return resolver.transient(this, 'area', function() {
            return d3.geoArea(this.asGeoJSON(resolver));
        });
    },

    isMultipolygon: function() {
        return this.tags.type === 'multipolygon';
    },

    isComplete: function(resolver) {
        for (var i = 0; i < this.members.length; i++) {
            if (!resolver.hasEntity(this.members[i].id)) {
                return false;
            }
        }
        return true;
    },

    isRestriction: function() {
        return !!(this.tags.type && this.tags.type.match(/^restriction:?/));
    },

    // Returns an array [A0, ... An], each Ai being an array of node arrays [Nds0, ... Ndsm],
    // where Nds0 is an outer ring and subsequent Ndsi's (if any i > 0) being inner rings.
    //
    // This corresponds to the structure needed for rendering a multipolygon path using a
    // `evenodd` fill rule, as well as the structure of a GeoJSON MultiPolygon geometry.
    //
    // In the case of invalid geometries, this function will still return a result which
    // includes the nodes of all way members, but some Nds may be unclosed and some inner
    // rings not matched with the intended outer ring.
    //
    multipolygon: function(resolver) {
        var outers = this.members.filter(function(m) { return 'outer' === (m.role || 'outer'); }),
            inners = this.members.filter(function(m) { return 'inner' === m.role; });

        outers = joinWays(outers, resolver);
        inners = joinWays(inners, resolver);

        outers = outers.map(function(outer) { return _.map(outer.nodes, 'loc'); });
        inners = inners.map(function(inner) { return _.map(inner.nodes, 'loc'); });

        var result = outers.map(function(o) {
            // Heuristic for detecting counterclockwise winding order. Assumes
            // that OpenStreetMap polygons are not hemisphere-spanning.
            return [d3.geoArea({type: 'Polygon', coordinates: [o]}) > 2 * Math.PI ? o.reverse() : o];
        });

        function findOuter(inner) {
            var o, outer;

            for (o = 0; o < outers.length; o++) {
                outer = outers[o];
                if (polygonContainsPolygon(outer, inner))
                    return o;
            }

            for (o = 0; o < outers.length; o++) {
                outer = outers[o];
                if (polygonIntersectsPolygon(outer, inner))
                    return o;
            }
        }

        for (var i = 0; i < inners.length; i++) {
            var inner = inners[i];

            if (d3.geoArea({type: 'Polygon', coordinates: [inner]}) < 2 * Math.PI) {
                inner = inner.reverse();
            }

            var o = findOuter(inners[i]);
            if (o !== undefined)
                result[o].push(inners[i]);
            else
                result.push([inners[i]]); // Invalid geometry
        }

        return result;
    }
});

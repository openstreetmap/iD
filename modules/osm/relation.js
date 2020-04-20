import { geoArea as d3_geoArea } from 'd3-geo';

import { osmEntity } from './entity';
import { osmJoinWays } from './multipolygon';
import { geoExtent, geoPolygonContainsPolygon, geoPolygonIntersectsPolygon } from '../geo';


export function osmRelation() {
    if (!(this instanceof osmRelation)) {
        return (new osmRelation()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


osmEntity.relation = osmRelation;

osmRelation.prototype = Object.create(osmEntity.prototype);


osmRelation.creationOrder = function(a, b) {
    var aId = parseInt(osmEntity.id.toOSM(a.id), 10);
    var bId = parseInt(osmEntity.id.toOSM(b.id), 10);

    if (aId < 0 || bId < 0) return aId - bId;
    return bId - aId;
};


Object.assign(osmRelation.prototype, {
    type: 'relation',
    members: [],


    copy: function(resolver, copies) {
        if (copies[this.id]) return copies[this.id];

        var copy = osmEntity.prototype.copy.call(this, resolver, copies);

        var members = this.members.map(function(member) {
            return Object.assign({}, member, { id: resolver.entity(member.id).copy(resolver, copies).id });
        });

        copy = copy.update({members: members});
        copies[this.id] = copy;

        return copy;
    },


    extent: function(resolver, memo) {
        return resolver.transient(this, 'extent', function() {
            if (memo && memo[this.id]) return geoExtent();
            memo = memo || {};
            memo[this.id] = true;

            var extent = geoExtent();
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
            result[i] = Object.assign({}, this.members[i], {index: i});
        }
        return result;
    },


    // Return the first member with the given role. A copy of the member object
    // is returned, extended with an 'index' property whose value is the member index.
    memberByRole: function(role) {
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].role === role) {
                return Object.assign({}, this.members[i], {index: i});
            }
        }
    },

    // Same as memberByRole, but returns all members with the given role
    membersByRole: function(role) {
        var result = [];
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].role === role) {
                result.push(Object.assign({}, this.members[i], {index: i}));
            }
        }
        return result;
    },

    // Return the first member with the given id. A copy of the member object
    // is returned, extended with an 'index' property whose value is the member index.
    memberById: function(id) {
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].id === id) {
                return Object.assign({}, this.members[i], {index: i});
            }
        }
    },


    // Return the first member with the given id and role. A copy of the member object
    // is returned, extended with an 'index' property whose value is the member index.
    memberByIdAndRole: function(id, role) {
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].id === id && this.members[i].role === role) {
                return Object.assign({}, this.members[i], {index: i});
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
        members.splice(index, 1, Object.assign({}, members[index], member));
        return this.update({members: members});
    },


    removeMember: function(index) {
        var members = this.members.slice();
        members.splice(index, 1);
        return this.update({members: members});
    },


    removeMembersWithID: function(id) {
        var members = this.members.filter(function(m) { return m.id !== id; });
        return this.update({members: members});
    },

    moveMember: function(fromIndex, toIndex) {
        var members = this.members.slice();
        members.splice(toIndex, 0, members.splice(fromIndex, 1)[0]);
        return this.update({members: members});
    },


    // Wherever a member appears with id `needle.id`, replace it with a member
    // with id `replacement.id`, type `replacement.type`, and the original role,
    // By default, adding a duplicate member (by id and role) is prevented.
    // Return an updated relation.
    replaceMember: function(needle, replacement, keepDuplicates) {
        if (!this.memberById(needle.id)) return this;

        var members = [];

        for (var i = 0; i < this.members.length; i++) {
            var member = this.members[i];
            if (member.id !== needle.id) {
                members.push(member);
            } else if (keepDuplicates || !this.memberByIdAndRole(replacement.id, member.role)) {
                members.push({ id: replacement.id, type: replacement.type, role: member.role });
            }
        }

        return this.update({ members: members });
    },


    asJXON: function(changeset_id) {
        var r = {
            relation: {
                '@id': this.osmId(),
                '@version': this.version || 0,
                member: this.members.map(function(member) {
                    return {
                        keyAttributes: {
                            type: member.type,
                            role: member.role,
                            ref: osmEntity.id.toOSM(member.id)
                        }
                    };
                }, this),
                tag: Object.keys(this.tags).map(function(k) {
                    return { keyAttributes: { k: k, v: this.tags[k] } };
                }, this)
            }
        };
        if (changeset_id) {
            r.relation['@changeset'] = changeset_id;
        }
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
                        return Object.assign({role: member.role}, resolver.entity(member.id).asGeoJSON(resolver));
                    })
                };
            }
        });
    },


    area: function(resolver) {
        return resolver.transient(this, 'area', function() {
            return d3_geoArea(this.asGeoJSON(resolver));
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


    hasFromViaTo: function() {
        return (
            this.members.some(function(m) { return m.role === 'from'; }) &&
            this.members.some(function(m) { return m.role === 'via'; }) &&
            this.members.some(function(m) { return m.role === 'to'; })
        );
    },


    isRestriction: function() {
        return !!(this.tags.type && this.tags.type.match(/^restriction:?/));
    },


    isValidRestriction: function() {
        if (!this.isRestriction()) return false;

        var froms = this.members.filter(function(m) { return m.role === 'from'; });
        var vias = this.members.filter(function(m) { return m.role === 'via'; });
        var tos = this.members.filter(function(m) { return m.role === 'to'; });

        if (froms.length !== 1 && this.tags.restriction !== 'no_entry') return false;
        if (froms.some(function(m) { return m.type !== 'way'; })) return false;

        if (tos.length !== 1 && this.tags.restriction !== 'no_exit') return false;
        if (tos.some(function(m) { return m.type !== 'way'; })) return false;

        if (vias.length === 0) return false;
        if (vias.length > 1 && vias.some(function(m) { return m.type !== 'way'; })) return false;

        return true;
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
        var outers = this.members.filter(function(m) { return 'outer' === (m.role || 'outer'); });
        var inners = this.members.filter(function(m) { return 'inner' === m.role; });

        outers = osmJoinWays(outers, resolver);
        inners = osmJoinWays(inners, resolver);

        var sequenceToLineString = function(sequence) {
            if (sequence.nodes.length > 2 &&
                sequence.nodes[0] !== sequence.nodes[sequence.nodes.length - 1]) {
                // close unclosed parts to ensure correct area rendering - #2945
                sequence.nodes.push(sequence.nodes[0]);
            }
            return sequence.nodes.map(function(node) { return node.loc; });
        };

        outers = outers.map(sequenceToLineString);
        inners = inners.map(sequenceToLineString);

        var result = outers.map(function(o) {
            // Heuristic for detecting counterclockwise winding order. Assumes
            // that OpenStreetMap polygons are not hemisphere-spanning.
            return [d3_geoArea({ type: 'Polygon', coordinates: [o] }) > 2 * Math.PI ? o.reverse() : o];
        });

        function findOuter(inner) {
            var o, outer;

            for (o = 0; o < outers.length; o++) {
                outer = outers[o];
                if (geoPolygonContainsPolygon(outer, inner))
                    return o;
            }

            for (o = 0; o < outers.length; o++) {
                outer = outers[o];
                if (geoPolygonIntersectsPolygon(outer, inner, false))
                    return o;
            }
        }

        for (var i = 0; i < inners.length; i++) {
            var inner = inners[i];

            if (d3_geoArea({ type: 'Polygon', coordinates: [inner] }) < 2 * Math.PI) {
                inner = inner.reverse();
            }

            var o = findOuter(inners[i]);
            if (o !== undefined) {
                result[o].push(inners[i]);
            } else {
                result.push([inners[i]]); // Invalid geometry
            }
        }

        return result;
    }
});

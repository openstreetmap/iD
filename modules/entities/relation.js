import { geoArea as d3_geoArea } from 'd3-geo';

import { entityEntity } from './entity';
import { geoExtent } from '../geo';


export function entityRelation() {
    if (!(this instanceof entityRelation)) {
        return (new entityRelation()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

entityEntity.relation = entityRelation;

// inherit from entityEntity
entityRelation.prototype = Object.create(entityEntity.prototype);

entityRelation.creationOrder = function(a, b) {
    var aId = parseInt(entityEntity.id.toUntyped(a.id), 10);
    var bId = parseInt(entityEntity.id.toUntyped(b.id), 10);

    if (aId < 0 || bId < 0) return aId - bId;
    return bId - aId;
};

Object.assign(entityRelation.prototype, {

    type: 'relation',

    members: [],

    copy: function(resolver, copies) {
        if (copies[this.id]) return copies[this.id];

        var copy = entityEntity.prototype.copy.call(this, resolver, copies);

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
                '@id': this.untypedID(),
                '@version': this.version || 0,
                member: this.members.map(function(member) {
                    return {
                        keyAttributes: {
                            type: member.type,
                            role: member.role,
                            ref: entityEntity.id.toUntyped(member.id)
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
        return false;
    },

    isComplete: function(resolver) {
        for (var i = 0; i < this.members.length; i++) {
            if (!resolver.hasEntity(this.members[i].id)) {
                return false;
            }
        }
        return true;
    }

});

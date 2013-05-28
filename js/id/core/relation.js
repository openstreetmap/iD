iD.Relation = iD.Entity.relation = function iD_Relation() {
    if (!(this instanceof iD_Relation)) {
        return (new iD_Relation()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
};

iD.Relation.prototype = Object.create(iD.Entity.prototype);

_.extend(iD.Relation.prototype, {
    type: "relation",
    members: [],

    extent: function(resolver) {
        return resolver.transient(this, 'extent', function() {
            return this.members.reduce(function(extent, member) {
                member = resolver.hasEntity(member.id);
                if (member) {
                    return extent.extend(member.extent(resolver));
                } else {
                    return extent;
                }
            }, iD.geo.Extent());
        });
    },

    geometry: function(graph) {
        return graph.transient(this, 'geometry', function() {
            return this.isMultipolygon() ? 'area' : 'relation';
        });
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
                    return { keyAttributes: { type: member.type, role: member.role, ref: iD.Entity.id.toOSM(member.id) } };
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
        if (this.isMultipolygon()) {
            return {
                type: 'Feature',
                properties: this.tags,
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: this.multipolygon(resolver)
                }
            };
        } else {
            return {
                type: 'FeatureCollection',
                properties: this.tags,
                features: this.members.map(function(member) {
                    return _.extend({role: member.role}, resolver.entity(member.id).asGeoJSON(resolver));
                })
            };
        }
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
        var members = this.members
            .filter(function(m) { return m.type === 'way' && resolver.hasEntity(m.id); })
            .map(function(m) { return { role: m.role || 'outer', id: m.id, nodes: resolver.childNodes(resolver.entity(m.id)) }; });

        function findOuter(inner) {
            var o, outer;

            for (o = 0; o < outers.length; o++) {
                outer = outers[o];
                if (iD.geo.polygonContainsPolygon(outer, inner))
                    return o;
            }

            for (o = 0; o < outers.length; o++) {
                outer = outers[o];
                if (iD.geo.polygonIntersectsPolygon(outer, inner))
                    return o;
            }
        }

        var outers = _.pluck(this.joinMemberWays(members.filter(function(m) { return m.role === 'outer'; })), 'locs'),
            inners = _.pluck(this.joinMemberWays(members.filter(function(m) { return m.role === 'inner'; })), 'locs'),
            result = outers.map(function(o) { return [o]; });

        for (var i = 0; i < inners.length; i++) {
            var o = findOuter(inners[i]);
            if (o !== undefined)
                result[o].push(inners[i]);
            else
                result.push([inners[i]]); // Invalid geometry
        }

        return result;
    },

    joinMemberWays: function(ways, resolver) {
        var joined = [], way, current, first, last, i, how, what;

        ways = ways || this.members.filter(function(m) {
            return m.type === 'way';
        }).map(function(m) {
            return {
                id: m.id,
                nodes: resolver.childNodes(resolver.entity(m.id))
            };
        });

        while (ways.length) {
            way = ways.pop();
            current = way.nodes.slice();
            current.ids = [way.id];
            joined.push(current);

            while (ways.length && _.first(current) !== _.last(current)) {
                first = _.first(current);
                last  = _.last(current);

                for (i = 0; i < ways.length; i++) {
                    what = ways[i].nodes;

                    if (last === _.first(what)) {
                        how  = current.push;
                        what = what.slice(1);
                        break;
                    } else if (last === _.last(what)) {
                        how  = current.push;
                        what = what.slice(0, -1).reverse();
                        break;
                    } else if (first == _.last(what)) {
                        how  = current.unshift;
                        what = what.slice(0, -1);
                        break;
                    } else if (first == _.first(what)) {
                        how  = current.unshift;
                        what = what.slice(1).reverse();
                        break;
                    } else {
                        what = how = null;
                    }
                }

                if (!what)
                    break; // Invalid geometry (unclosed ring)

                current.ids.push(ways[i].id);
                ways.splice(i, 1);
                how.apply(current, what);
            }
        }
        return joined.map(function(nodes) {
            return {
                ids: nodes.ids,
                locs: _.pluck(nodes, 'loc')
            };
        });
    }

});

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.iD = global.iD || {})));
}(this, function (exports) { 'use strict';

    function interestingTag(key) {
        return key !== 'attribution' &&
            key !== 'created_by' &&
            key !== 'source' &&
            key !== 'odbl' &&
            key.indexOf('tiger:') !== 0;

    }

    var oneWayTags = {
        'aerialway': {
            'chair_lift': true,
            'mixed_lift': true,
            't-bar': true,
            'j-bar': true,
            'platter': true,
            'rope_tow': true,
            'magic_carpet': true,
            'yes': true
        },
        'highway': {
            'motorway': true,
            'motorway_link': true
        },
        'junction': {
            'roundabout': true
        },
        'man_made': {
            'piste:halfpipe': true
        },
        'piste:type': {
            'downhill': true,
            'sled': true,
            'yes': true
        },
        'waterway': {
            'river': true,
            'stream': true
        }
    };

    var pavedTags = {
        'surface': {
            'paved': true,
            'asphalt': true,
            'concrete': true
        },
        'tracktype': {
            'grade1': true
        }
    };

    function Entity(attrs) {
        // For prototypal inheritance.
        if (this instanceof Entity) return;

        // Create the appropriate subtype.
        if (attrs && attrs.type) {
            return Entity[attrs.type].apply(this, arguments);
        } else if (attrs && attrs.id) {
            return Entity[Entity.id.type(attrs.id)].apply(this, arguments);
        }

        // Initialize a generic Entity (used only in tests).
        return (new Entity()).initialize(arguments);
    }

    Entity.id = function(type) {
        return Entity.id.fromOSM(type, Entity.id.next[type]--);
    };

    Entity.id.next = {node: -1, way: -1, relation: -1};

    Entity.id.fromOSM = function(type, id) {
        return type[0] + id;
    };

    Entity.id.toOSM = function(id) {
        return id.slice(1);
    };

    Entity.id.type = function(id) {
        return {'n': 'node', 'w': 'way', 'r': 'relation'}[id[0]];
    };

    // A function suitable for use as the second argument to d3.selection#data().
    Entity.key = function(entity) {
        return entity.id + 'v' + (entity.v || 0);
    };

    Entity.prototype = {
        tags: {},

        initialize: function(sources) {
            for (var i = 0; i < sources.length; ++i) {
                var source = sources[i];
                for (var prop in source) {
                    if (Object.prototype.hasOwnProperty.call(source, prop)) {
                        if (source[prop] === undefined) {
                            delete this[prop];
                        } else {
                            this[prop] = source[prop];
                        }
                    }
                }
            }

            if (!this.id && this.type) {
                this.id = Entity.id(this.type);
            }
            if (!this.hasOwnProperty('visible')) {
                this.visible = true;
            }

            if (iD.debug) {
                Object.freeze(this);
                Object.freeze(this.tags);

                if (this.loc) Object.freeze(this.loc);
                if (this.nodes) Object.freeze(this.nodes);
                if (this.members) Object.freeze(this.members);
            }

            return this;
        },

        copy: function(resolver, copies) {
            if (copies[this.id])
                return copies[this.id];

            var copy = Entity(this, {id: undefined, user: undefined, version: undefined});
            copies[this.id] = copy;

            return copy;
        },

        osmId: function() {
            return Entity.id.toOSM(this.id);
        },

        isNew: function() {
            return this.osmId() < 0;
        },

        update: function(attrs) {
            return Entity(this, attrs, {v: 1 + (this.v || 0)});
        },

        mergeTags: function(tags) {
            var merged = _.clone(this.tags), changed = false;
            for (var k in tags) {
                var t1 = merged[k],
                    t2 = tags[k];
                if (!t1) {
                    changed = true;
                    merged[k] = t2;
                } else if (t1 !== t2) {
                    changed = true;
                    merged[k] = _.union(t1.split(/;\s*/), t2.split(/;\s*/)).join(';');
                }
            }
            return changed ? this.update({tags: merged}) : this;
        },

        intersects: function(extent, resolver) {
            return this.extent(resolver).intersects(extent);
        },

        isUsed: function(resolver) {
            return _.without(Object.keys(this.tags), 'area').length > 0 ||
                resolver.parentRelations(this).length > 0;
        },

        hasInterestingTags: function() {
            return _.keys(this.tags).some(interestingTag);
        },

        isHighwayIntersection: function() {
            return false;
        },

        deprecatedTags: function() {
            var tags = _.toPairs(this.tags);
            var deprecated = {};

            iD.data.deprecated.forEach(function(d) {
                var match = _.toPairs(d.old)[0];
                tags.forEach(function(t) {
                    if (t[0] === match[0] &&
                        (t[1] === match[1] || match[1] === '*')) {
                        deprecated[t[0]] = t[1];
                    }
                });
            });

            return deprecated;
        }
    };

    function Way() {
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
                var extent = iD.geo.Extent();
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
                    res = iD.geo.cross(o, a, b);

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

    function Relation() {
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
                if (memo && memo[this.id]) return iD.geo.Extent();
                memo = memo || {};
                memo[this.id] = true;

                var extent = iD.geo.Extent();
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
                return d3.geo.area(this.asGeoJSON(resolver));
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

            outers = iD.geo.joinWays(outers, resolver);
            inners = iD.geo.joinWays(inners, resolver);

            outers = outers.map(function(outer) { return _.map(outer.nodes, 'loc'); });
            inners = inners.map(function(inner) { return _.map(inner.nodes, 'loc'); });

            var result = outers.map(function(o) {
                // Heuristic for detecting counterclockwise winding order. Assumes
                // that OpenStreetMap polygons are not hemisphere-spanning.
                return [d3.geo.area({type: 'Polygon', coordinates: [o]}) > 2 * Math.PI ? o.reverse() : o];
            });

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

            for (var i = 0; i < inners.length; i++) {
                var inner = inners[i];

                if (d3.geo.area({type: 'Polygon', coordinates: [inner]}) < 2 * Math.PI) {
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

    function Node() {
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
            return new iD.geo.Extent(this.loc);
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

    function Connection(useHttps) {
        if (typeof useHttps !== 'boolean') {
          useHttps = window.location.protocol === 'https:';
        }

        var event = d3.dispatch('authenticating', 'authenticated', 'auth', 'loading', 'loaded'),
            protocol = useHttps ? 'https:' : 'http:',
            url = protocol + '//www.openstreetmap.org',
            connection = {},
            inflight = {},
            loadedTiles = {},
            tileZoom = 16,
            oauth = osmAuth({
                url: protocol + '//www.openstreetmap.org',
                oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
                oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
                loading: authenticating,
                done: authenticated
            }),
            ndStr = 'nd',
            tagStr = 'tag',
            memberStr = 'member',
            nodeStr = 'node',
            wayStr = 'way',
            relationStr = 'relation',
            userDetails,
            off;


        connection.changesetURL = function(changesetId) {
            return url + '/changeset/' + changesetId;
        };

        connection.changesetsURL = function(center, zoom) {
            var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
            return url + '/history#map=' +
                Math.floor(zoom) + '/' +
                center[1].toFixed(precision) + '/' +
                center[0].toFixed(precision);
        };

        connection.entityURL = function(entity) {
            return url + '/' + entity.type + '/' + entity.osmId();
        };

        connection.userURL = function(username) {
            return url + '/user/' + username;
        };

        connection.loadFromURL = function(url, callback) {
            function done(err, dom) {
                return callback(err, parse(dom));
            }
            return d3.xml(url).get(done);
        };

        connection.loadEntity = function(id, callback) {
            var type = Entity.id.type(id),
                osmID = Entity.id.toOSM(id);

            connection.loadFromURL(
                url + '/api/0.6/' + type + '/' + osmID + (type !== 'node' ? '/full' : ''),
                function(err, entities) {
                    if (callback) callback(err, {data: entities});
                });
        };

        connection.loadEntityVersion = function(id, version, callback) {
            var type = Entity.id.type(id),
                osmID = Entity.id.toOSM(id);

            connection.loadFromURL(
                url + '/api/0.6/' + type + '/' + osmID + '/' + version,
                function(err, entities) {
                    if (callback) callback(err, {data: entities});
                });
        };

        connection.loadMultiple = function(ids, callback) {
            _.each(_.groupBy(_.uniq(ids), Entity.id.type), function(v, k) {
                var type = k + 's',
                    osmIDs = _.map(v, Entity.id.toOSM);

                _.each(_.chunk(osmIDs, 150), function(arr) {
                    connection.loadFromURL(
                        url + '/api/0.6/' + type + '?' + type + '=' + arr.join(),
                        function(err, entities) {
                            if (callback) callback(err, {data: entities});
                        });
                });
            });
        };

        function authenticating() {
            event.authenticating();
        }

        function authenticated() {
            event.authenticated();
        }

        function getLoc(attrs) {
            var lon = attrs.lon && attrs.lon.value,
                lat = attrs.lat && attrs.lat.value;
            return [parseFloat(lon), parseFloat(lat)];
        }

        function getNodes(obj) {
            var elems = obj.getElementsByTagName(ndStr),
                nodes = new Array(elems.length);
            for (var i = 0, l = elems.length; i < l; i++) {
                nodes[i] = 'n' + elems[i].attributes.ref.value;
            }
            return nodes;
        }

        function getTags(obj) {
            var elems = obj.getElementsByTagName(tagStr),
                tags = {};
            for (var i = 0, l = elems.length; i < l; i++) {
                var attrs = elems[i].attributes;
                tags[attrs.k.value] = attrs.v.value;
            }
            return tags;
        }

        function getMembers(obj) {
            var elems = obj.getElementsByTagName(memberStr),
                members = new Array(elems.length);
            for (var i = 0, l = elems.length; i < l; i++) {
                var attrs = elems[i].attributes;
                members[i] = {
                    id: attrs.type.value[0] + attrs.ref.value,
                    type: attrs.type.value,
                    role: attrs.role.value
                };
            }
            return members;
        }

        function getVisible(attrs) {
            return (!attrs.visible || attrs.visible.value !== 'false');
        }

        var parsers = {
            node: function nodeData(obj) {
                var attrs = obj.attributes;
                return new Node({
                    id: Entity.id.fromOSM(nodeStr, attrs.id.value),
                    loc: getLoc(attrs),
                    version: attrs.version.value,
                    user: attrs.user && attrs.user.value,
                    tags: getTags(obj),
                    visible: getVisible(attrs)
                });
            },

            way: function wayData(obj) {
                var attrs = obj.attributes;
                return new Way({
                    id: Entity.id.fromOSM(wayStr, attrs.id.value),
                    version: attrs.version.value,
                    user: attrs.user && attrs.user.value,
                    tags: getTags(obj),
                    nodes: getNodes(obj),
                    visible: getVisible(attrs)
                });
            },

            relation: function relationData(obj) {
                var attrs = obj.attributes;
                return new Relation({
                    id: Entity.id.fromOSM(relationStr, attrs.id.value),
                    version: attrs.version.value,
                    user: attrs.user && attrs.user.value,
                    tags: getTags(obj),
                    members: getMembers(obj),
                    visible: getVisible(attrs)
                });
            }
        };

        function parse(dom) {
            if (!dom || !dom.childNodes) return;

            var root = dom.childNodes[0],
                children = root.childNodes,
                entities = [];

            for (var i = 0, l = children.length; i < l; i++) {
                var child = children[i],
                    parser = parsers[child.nodeName];
                if (parser) {
                    entities.push(parser(child));
                }
            }

            return entities;
        }

        connection.authenticated = function() {
            return oauth.authenticated();
        };

        // Generate Changeset XML. Returns a string.
        connection.changesetJXON = function(tags) {
            return {
                osm: {
                    changeset: {
                        tag: _.map(tags, function(value, key) {
                            return { '@k': key, '@v': value };
                        }),
                        '@version': 0.6,
                        '@generator': 'iD'
                    }
                }
            };
        };

        // Generate [osmChange](http://wiki.openstreetmap.org/wiki/OsmChange)
        // XML. Returns a string.
        connection.osmChangeJXON = function(changeset_id, changes) {
            function nest(x, order) {
                var groups = {};
                for (var i = 0; i < x.length; i++) {
                    var tagName = Object.keys(x[i])[0];
                    if (!groups[tagName]) groups[tagName] = [];
                    groups[tagName].push(x[i][tagName]);
                }
                var ordered = {};
                order.forEach(function(o) {
                    if (groups[o]) ordered[o] = groups[o];
                });
                return ordered;
            }

            function rep(entity) {
                return entity.asJXON(changeset_id);
            }

            return {
                osmChange: {
                    '@version': 0.6,
                    '@generator': 'iD',
                    'create': nest(changes.created.map(rep), ['node', 'way', 'relation']),
                    'modify': nest(changes.modified.map(rep), ['node', 'way', 'relation']),
                    'delete': _.extend(nest(changes.deleted.map(rep), ['relation', 'way', 'node']), {'@if-unused': true})
                }
            };
        };

        connection.changesetTags = function(comment, imageryUsed) {
            var detected = iD.detect(),
                tags = {
                    created_by: 'iD ' + iD.version,
                    imagery_used: imageryUsed.join(';').substr(0, 255),
                    host: (window.location.origin + window.location.pathname).substr(0, 255),
                    locale: detected.locale
                };

            if (comment) {
                tags.comment = comment.substr(0, 255);
            }

            return tags;
        };

        connection.putChangeset = function(changes, comment, imageryUsed, callback) {
            oauth.xhr({
                    method: 'PUT',
                    path: '/api/0.6/changeset/create',
                    options: { header: { 'Content-Type': 'text/xml' } },
                    content: JXON.stringify(connection.changesetJXON(connection.changesetTags(comment, imageryUsed)))
                }, function(err, changeset_id) {
                    if (err) return callback(err);
                    oauth.xhr({
                        method: 'POST',
                        path: '/api/0.6/changeset/' + changeset_id + '/upload',
                        options: { header: { 'Content-Type': 'text/xml' } },
                        content: JXON.stringify(connection.osmChangeJXON(changeset_id, changes))
                    }, function(err) {
                        if (err) return callback(err);
                        // POST was successful, safe to call the callback.
                        // Still attempt to close changeset, but ignore response because #2667
                        // Add delay to allow for postgres replication #1646 #2678
                        window.setTimeout(function() { callback(null, changeset_id); }, 2500);
                        oauth.xhr({
                            method: 'PUT',
                            path: '/api/0.6/changeset/' + changeset_id + '/close',
                            options: { header: { 'Content-Type': 'text/xml' } }
                        }, d3.functor(true));
                    });
                });
        };

        connection.userDetails = function(callback) {
            if (userDetails) {
                callback(undefined, userDetails);
                return;
            }

            function done(err, user_details) {
                if (err) return callback(err);

                var u = user_details.getElementsByTagName('user')[0],
                    img = u.getElementsByTagName('img'),
                    image_url = '';

                if (img && img[0] && img[0].getAttribute('href')) {
                    image_url = img[0].getAttribute('href');
                }

                userDetails = {
                    display_name: u.attributes.display_name.value,
                    image_url: image_url,
                    id: u.attributes.id.value
                };

                callback(undefined, userDetails);
            }

            oauth.xhr({ method: 'GET', path: '/api/0.6/user/details' }, done);
        };

        connection.userChangesets = function(callback) {
            connection.userDetails(function(err, user) {
                if (err) return callback(err);

                function done(changesets) {
                    callback(undefined, Array.prototype.map.call(changesets.getElementsByTagName('changeset'),
                        function (changeset) {
                            return { tags: getTags(changeset) };
                        }));
                }

                d3.xml(url + '/api/0.6/changesets?user=' + user.id).get()
                    .on('load', done)
                    .on('error', callback);
            });
        };

        connection.status = function(callback) {
            function done(capabilities) {
                var apiStatus = capabilities.getElementsByTagName('status');
                callback(undefined, apiStatus[0].getAttribute('api'));
            }
            d3.xml(url + '/api/capabilities').get()
                .on('load', done)
                .on('error', callback);
        };

        function abortRequest(i) { i.abort(); }

        connection.tileZoom = function(_) {
            if (!arguments.length) return tileZoom;
            tileZoom = _;
            return connection;
        };

        connection.loadTiles = function(projection, dimensions, callback) {

            if (off) return;

            var s = projection.scale() * 2 * Math.PI,
                z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
                ts = 256 * Math.pow(2, z - tileZoom),
                origin = [
                    s / 2 - projection.translate()[0],
                    s / 2 - projection.translate()[1]];

            var tiles = d3.geo.tile()
                .scaleExtent([tileZoom, tileZoom])
                .scale(s)
                .size(dimensions)
                .translate(projection.translate())()
                .map(function(tile) {
                    var x = tile[0] * ts - origin[0],
                        y = tile[1] * ts - origin[1];

                    return {
                        id: tile.toString(),
                        extent: iD.geo.Extent(
                            projection.invert([x, y + ts]),
                            projection.invert([x + ts, y]))
                    };
                });

            function bboxUrl(tile) {
                return url + '/api/0.6/map?bbox=' + tile.extent.toParam();
            }

            _.filter(inflight, function(v, i) {
                var wanted = _.find(tiles, function(tile) {
                    return i === tile.id;
                });
                if (!wanted) delete inflight[i];
                return !wanted;
            }).map(abortRequest);

            tiles.forEach(function(tile) {
                var id = tile.id;

                if (loadedTiles[id] || inflight[id]) return;

                if (_.isEmpty(inflight)) {
                    event.loading();
                }

                inflight[id] = connection.loadFromURL(bboxUrl(tile), function(err, parsed) {
                    loadedTiles[id] = true;
                    delete inflight[id];

                    if (callback) callback(err, _.extend({data: parsed}, tile));

                    if (_.isEmpty(inflight)) {
                        event.loaded();
                    }
                });
            });
        };

        connection.switch = function(options) {
            url = options.url;
            oauth.options(_.extend({
                loading: authenticating,
                done: authenticated
            }, options));
            event.auth();
            connection.flush();
            return connection;
        };

        connection.toggle = function(_) {
            off = !_;
            return connection;
        };

        connection.flush = function() {
            userDetails = undefined;
            _.forEach(inflight, abortRequest);
            loadedTiles = {};
            inflight = {};
            return connection;
        };

        connection.loadedTiles = function(_) {
            if (!arguments.length) return loadedTiles;
            loadedTiles = _;
            return connection;
        };

        connection.logout = function() {
            userDetails = undefined;
            oauth.logout();
            event.auth();
            return connection;
        };

        connection.authenticate = function(callback) {
            userDetails = undefined;
            function done(err, res) {
                event.auth();
                if (callback) callback(err, res);
            }
            return oauth.authenticate(done);
        };

        return d3.rebind(connection, event, 'on');
    }

    /*
        iD.Difference represents the difference between two graphs.
        It knows how to calculate the set of entities that were
        created, modified, or deleted, and also contains the logic
        for recursively extending a difference to the complete set
        of entities that will require a redraw, taking into account
        child and parent relationships.
     */
    function Difference(base, head) {
        var changes = {}, length = 0;

        function changed(h, b) {
            return h !== b && !_.isEqual(_.omit(h, 'v'), _.omit(b, 'v'));
        }

        _.each(head.entities, function(h, id) {
            var b = base.entities[id];
            if (changed(h, b)) {
                changes[id] = {base: b, head: h};
                length++;
            }
        });

        _.each(base.entities, function(b, id) {
            var h = head.entities[id];
            if (!changes[id] && changed(h, b)) {
                changes[id] = {base: b, head: h};
                length++;
            }
        });

        function addParents(parents, result) {
            for (var i = 0; i < parents.length; i++) {
                var parent = parents[i];

                if (parent.id in result)
                    continue;

                result[parent.id] = parent;
                addParents(head.parentRelations(parent), result);
            }
        }

        var difference = {};

        difference.length = function() {
            return length;
        };

        difference.changes = function() {
            return changes;
        };

        difference.extantIDs = function() {
            var result = [];
            _.each(changes, function(change, id) {
                if (change.head) result.push(id);
            });
            return result;
        };

        difference.modified = function() {
            var result = [];
            _.each(changes, function(change) {
                if (change.base && change.head) result.push(change.head);
            });
            return result;
        };

        difference.created = function() {
            var result = [];
            _.each(changes, function(change) {
                if (!change.base && change.head) result.push(change.head);
            });
            return result;
        };

        difference.deleted = function() {
            var result = [];
            _.each(changes, function(change) {
                if (change.base && !change.head) result.push(change.base);
            });
            return result;
        };

        difference.summary = function() {
            var relevant = {};

            function addEntity(entity, graph, changeType) {
                relevant[entity.id] = {
                    entity: entity,
                    graph: graph,
                    changeType: changeType
                };
            }

            function addParents(entity) {
                var parents = head.parentWays(entity);
                for (var j = parents.length - 1; j >= 0; j--) {
                    var parent = parents[j];
                    if (!(parent.id in relevant)) addEntity(parent, head, 'modified');
                }
            }

            _.each(changes, function(change) {
                if (change.head && change.head.geometry(head) !== 'vertex') {
                    addEntity(change.head, head, change.base ? 'modified' : 'created');

                } else if (change.base && change.base.geometry(base) !== 'vertex') {
                    addEntity(change.base, base, 'deleted');

                } else if (change.base && change.head) { // modified vertex
                    var moved    = !_.isEqual(change.base.loc,  change.head.loc),
                        retagged = !_.isEqual(change.base.tags, change.head.tags);

                    if (moved) {
                        addParents(change.head);
                    }

                    if (retagged || (moved && change.head.hasInterestingTags())) {
                        addEntity(change.head, head, 'modified');
                    }

                } else if (change.head && change.head.hasInterestingTags()) { // created vertex
                    addEntity(change.head, head, 'created');

                } else if (change.base && change.base.hasInterestingTags()) { // deleted vertex
                    addEntity(change.base, base, 'deleted');
                }
            });

            return d3.values(relevant);
        };

        difference.complete = function(extent) {
            var result = {}, id, change;

            for (id in changes) {
                change = changes[id];

                var h = change.head,
                    b = change.base,
                    entity = h || b;

                if (extent &&
                    (!h || !h.intersects(extent, head)) &&
                    (!b || !b.intersects(extent, base)))
                    continue;

                result[id] = h;

                if (entity.type === 'way') {
                    var nh = h ? h.nodes : [],
                        nb = b ? b.nodes : [],
                        diff, i;

                    diff = _.difference(nh, nb);
                    for (i = 0; i < diff.length; i++) {
                        result[diff[i]] = head.hasEntity(diff[i]);
                    }

                    diff = _.difference(nb, nh);
                    for (i = 0; i < diff.length; i++) {
                        result[diff[i]] = head.hasEntity(diff[i]);
                    }
                }

                addParents(head.parentWays(entity), result);
                addParents(head.parentRelations(entity), result);
            }

            return result;
        };

        return difference;
    }

    function Graph(other, mutable) {
        if (!(this instanceof Graph)) return new Graph(other, mutable);

        if (other instanceof Graph) {
            var base = other.base();
            this.entities = _.assign(Object.create(base.entities), other.entities);
            this._parentWays = _.assign(Object.create(base.parentWays), other._parentWays);
            this._parentRels = _.assign(Object.create(base.parentRels), other._parentRels);

        } else {
            this.entities = Object.create({});
            this._parentWays = Object.create({});
            this._parentRels = Object.create({});
            this.rebase(other || [], [this]);
        }

        this.transients = {};
        this._childNodes = {};
        this.frozen = !mutable;
    }

    Graph.prototype = {
        hasEntity: function(id) {
            return this.entities[id];
        },

        entity: function(id) {
            var entity = this.entities[id];
            if (!entity) {
                throw new Error('entity ' + id + ' not found');
            }
            return entity;
        },

        transient: function(entity, key, fn) {
            var id = entity.id,
                transients = this.transients[id] ||
                (this.transients[id] = {});

            if (transients[key] !== undefined) {
                return transients[key];
            }

            transients[key] = fn.call(entity);

            return transients[key];
        },

        parentWays: function(entity) {
            var parents = this._parentWays[entity.id],
                result = [];

            if (parents) {
                for (var i = 0; i < parents.length; i++) {
                    result.push(this.entity(parents[i]));
                }
            }
            return result;
        },

        isPoi: function(entity) {
            var parentWays = this._parentWays[entity.id];
            return !parentWays || parentWays.length === 0;
        },

        isShared: function(entity) {
            var parentWays = this._parentWays[entity.id];
            return parentWays && parentWays.length > 1;
        },

        parentRelations: function(entity) {
            var parents = this._parentRels[entity.id],
                result = [];

            if (parents) {
                for (var i = 0; i < parents.length; i++) {
                    result.push(this.entity(parents[i]));
                }
            }
            return result;
        },

        childNodes: function(entity) {
            if (this._childNodes[entity.id]) return this._childNodes[entity.id];
            if (!entity.nodes) return [];

            var nodes = [];
            for (var i = 0; i < entity.nodes.length; i++) {
                nodes[i] = this.entity(entity.nodes[i]);
            }

            if (iD.debug) Object.freeze(nodes);

            this._childNodes[entity.id] = nodes;
            return this._childNodes[entity.id];
        },

        base: function() {
            return {
                'entities': iD.util.getPrototypeOf(this.entities),
                'parentWays': iD.util.getPrototypeOf(this._parentWays),
                'parentRels': iD.util.getPrototypeOf(this._parentRels)
            };
        },

        // Unlike other graph methods, rebase mutates in place. This is because it
        // is used only during the history operation that merges newly downloaded
        // data into each state. To external consumers, it should appear as if the
        // graph always contained the newly downloaded data.
        rebase: function(entities, stack, force) {
            var base = this.base(),
                i, j, k, id;

            for (i = 0; i < entities.length; i++) {
                var entity = entities[i];

                if (!entity.visible || (!force && base.entities[entity.id]))
                    continue;

                // Merging data into the base graph
                base.entities[entity.id] = entity;
                this._updateCalculated(undefined, entity, base.parentWays, base.parentRels);

                // Restore provisionally-deleted nodes that are discovered to have an extant parent
                if (entity.type === 'way') {
                    for (j = 0; j < entity.nodes.length; j++) {
                        id = entity.nodes[j];
                        for (k = 1; k < stack.length; k++) {
                            var ents = stack[k].entities;
                            if (ents.hasOwnProperty(id) && ents[id] === undefined) {
                                delete ents[id];
                            }
                        }
                    }
                }
            }

            for (i = 0; i < stack.length; i++) {
                stack[i]._updateRebased();
            }
        },

        _updateRebased: function() {
            var base = this.base(),
                i, k, child, id, keys;

            keys = Object.keys(this._parentWays);
            for (i = 0; i < keys.length; i++) {
                child = keys[i];
                if (base.parentWays[child]) {
                    for (k = 0; k < base.parentWays[child].length; k++) {
                        id = base.parentWays[child][k];
                        if (!this.entities.hasOwnProperty(id) && !_.includes(this._parentWays[child], id)) {
                            this._parentWays[child].push(id);
                        }
                    }
                }
            }

            keys = Object.keys(this._parentRels);
            for (i = 0; i < keys.length; i++) {
                child = keys[i];
                if (base.parentRels[child]) {
                    for (k = 0; k < base.parentRels[child].length; k++) {
                        id = base.parentRels[child][k];
                        if (!this.entities.hasOwnProperty(id) && !_.includes(this._parentRels[child], id)) {
                            this._parentRels[child].push(id);
                        }
                    }
                }
            }

            this.transients = {};

            // this._childNodes is not updated, under the assumption that
            // ways are always downloaded with their child nodes.
        },

        // Updates calculated properties (parentWays, parentRels) for the specified change
        _updateCalculated: function(oldentity, entity, parentWays, parentRels) {

            parentWays = parentWays || this._parentWays;
            parentRels = parentRels || this._parentRels;

            var type = entity && entity.type || oldentity && oldentity.type,
                removed, added, ways, rels, i;


            if (type === 'way') {

                // Update parentWays
                if (oldentity && entity) {
                    removed = _.difference(oldentity.nodes, entity.nodes);
                    added = _.difference(entity.nodes, oldentity.nodes);
                } else if (oldentity) {
                    removed = oldentity.nodes;
                    added = [];
                } else if (entity) {
                    removed = [];
                    added = entity.nodes;
                }
                for (i = 0; i < removed.length; i++) {
                    parentWays[removed[i]] = _.without(parentWays[removed[i]], oldentity.id);
                }
                for (i = 0; i < added.length; i++) {
                    ways = _.without(parentWays[added[i]], entity.id);
                    ways.push(entity.id);
                    parentWays[added[i]] = ways;
                }

            } else if (type === 'relation') {

                // Update parentRels
                if (oldentity && entity) {
                    removed = _.difference(oldentity.members, entity.members);
                    added = _.difference(entity.members, oldentity);
                } else if (oldentity) {
                    removed = oldentity.members;
                    added = [];
                } else if (entity) {
                    removed = [];
                    added = entity.members;
                }
                for (i = 0; i < removed.length; i++) {
                    parentRels[removed[i].id] = _.without(parentRels[removed[i].id], oldentity.id);
                }
                for (i = 0; i < added.length; i++) {
                    rels = _.without(parentRels[added[i].id], entity.id);
                    rels.push(entity.id);
                    parentRels[added[i].id] = rels;
                }
            }
        },

        replace: function(entity) {
            if (this.entities[entity.id] === entity)
                return this;

            return this.update(function() {
                this._updateCalculated(this.entities[entity.id], entity);
                this.entities[entity.id] = entity;
            });
        },

        remove: function(entity) {
            return this.update(function() {
                this._updateCalculated(entity, undefined);
                this.entities[entity.id] = undefined;
            });
        },

        revert: function(id) {
            var baseEntity = this.base().entities[id],
                headEntity = this.entities[id];

            if (headEntity === baseEntity)
                return this;

            return this.update(function() {
                this._updateCalculated(headEntity, baseEntity);
                delete this.entities[id];
            });
        },

        update: function() {
            var graph = this.frozen ? Graph(this, true) : this;

            for (var i = 0; i < arguments.length; i++) {
                arguments[i].call(graph, graph);
            }

            if (this.frozen) graph.frozen = true;

            return graph;
        },

        // Obliterates any existing entities
        load: function(entities) {
            var base = this.base();
            this.entities = Object.create(base.entities);

            for (var i in entities) {
                this.entities[i] = entities[i];
                this._updateCalculated(base.entities[i], this.entities[i]);
            }

            return this;
        }
    };

    function Tree(head) {
        var rtree = rbush(),
            rectangles = {};

        function entityRectangle(entity) {
            var rect = entity.extent(head).rectangle();
            rect.id = entity.id;
            rectangles[entity.id] = rect;
            return rect;
        }

        function updateParents(entity, insertions, memo) {
            head.parentWays(entity).forEach(function(way) {
                if (rectangles[way.id]) {
                    rtree.remove(rectangles[way.id]);
                    insertions[way.id] = way;
                }
                updateParents(way, insertions, memo);
            });

            head.parentRelations(entity).forEach(function(relation) {
                if (memo[entity.id]) return;
                memo[entity.id] = true;
                if (rectangles[relation.id]) {
                    rtree.remove(rectangles[relation.id]);
                    insertions[relation.id] = relation;
                }
                updateParents(relation, insertions, memo);
            });
        }

        var tree = {};

        tree.rebase = function(entities, force) {
            var insertions = {};

            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];

                if (!entity.visible)
                    continue;

                if (head.entities.hasOwnProperty(entity.id) || rectangles[entity.id]) {
                    if (!force) {
                        continue;
                    } else if (rectangles[entity.id]) {
                        rtree.remove(rectangles[entity.id]);
                    }
                }

                insertions[entity.id] = entity;
                updateParents(entity, insertions, {});
            }

            rtree.load(_.map(insertions, entityRectangle));

            return tree;
        };

        tree.intersects = function(extent, graph) {
            if (graph !== head) {
                var diff = Difference(head, graph),
                    insertions = {};

                head = graph;

                diff.deleted().forEach(function(entity) {
                    rtree.remove(rectangles[entity.id]);
                    delete rectangles[entity.id];
                });

                diff.modified().forEach(function(entity) {
                    rtree.remove(rectangles[entity.id]);
                    insertions[entity.id] = entity;
                    updateParents(entity, insertions, {});
                });

                diff.created().forEach(function(entity) {
                    insertions[entity.id] = entity;
                });

                rtree.load(_.map(insertions, entityRectangle));
            }

            return rtree.search(extent.rectangle()).map(function(rect) {
                return head.entity(rect.id);
            });
        };

        return tree;
    }

    function History(context) {
        var stack, index, tree,
            imageryUsed = ['Bing'],
            dispatch = d3.dispatch('change', 'undone', 'redone'),
            lock = iD.util.SessionMutex('lock');

        function perform(actions) {
            actions = Array.prototype.slice.call(actions);

            var annotation;

            if (!_.isFunction(_.last(actions))) {
                annotation = actions.pop();
            }

            var graph = stack[index].graph;
            for (var i = 0; i < actions.length; i++) {
                graph = actions[i](graph);
            }

            return {
                graph: graph,
                annotation: annotation,
                imageryUsed: imageryUsed
            };
        }

        function change(previous) {
            var difference = Difference(previous, history.graph());
            dispatch.change(difference);
            return difference;
        }

        // iD uses namespaced keys so multiple installations do not conflict
        function getKey(n) {
            return 'iD_' + window.location.origin + '_' + n;
        }

        var history = {
            graph: function() {
                return stack[index].graph;
            },

            base: function() {
                return stack[0].graph;
            },

            merge: function(entities, extent) {
                stack[0].graph.rebase(entities, _.map(stack, 'graph'), false);
                tree.rebase(entities, false);

                dispatch.change(undefined, extent);
            },

            perform: function() {
                var previous = stack[index].graph;

                stack = stack.slice(0, index + 1);
                stack.push(perform(arguments));
                index++;

                return change(previous);
            },

            replace: function() {
                var previous = stack[index].graph;

                // assert(index == stack.length - 1)
                stack[index] = perform(arguments);

                return change(previous);
            },

            pop: function() {
                var previous = stack[index].graph;

                if (index > 0) {
                    index--;
                    stack.pop();
                    return change(previous);
                }
            },

            // Same as calling pop and then perform
            overwrite: function() {
                var previous = stack[index].graph;

                if (index > 0) {
                    index--;
                    stack.pop();
                }
                stack = stack.slice(0, index + 1);
                stack.push(perform(arguments));
                index++;

                return change(previous);
            },

            undo: function() {
                var previous = stack[index].graph;

                // Pop to the next annotated state.
                while (index > 0) {
                    index--;
                    if (stack[index].annotation) break;
                }

                dispatch.undone();
                return change(previous);
            },

            redo: function() {
                var previous = stack[index].graph;

                while (index < stack.length - 1) {
                    index++;
                    if (stack[index].annotation) break;
                }

                dispatch.redone();
                return change(previous);
            },

            undoAnnotation: function() {
                var i = index;
                while (i >= 0) {
                    if (stack[i].annotation) return stack[i].annotation;
                    i--;
                }
            },

            redoAnnotation: function() {
                var i = index + 1;
                while (i <= stack.length - 1) {
                    if (stack[i].annotation) return stack[i].annotation;
                    i++;
                }
            },

            intersects: function(extent) {
                return tree.intersects(extent, stack[index].graph);
            },

            difference: function() {
                var base = stack[0].graph,
                    head = stack[index].graph;
                return Difference(base, head);
            },

            changes: function(action) {
                var base = stack[0].graph,
                    head = stack[index].graph;

                if (action) {
                    head = action(head);
                }

                var difference = Difference(base, head);

                return {
                    modified: difference.modified(),
                    created: difference.created(),
                    deleted: difference.deleted()
                };
            },

            validate: function(changes) {
                return _(iD.validations)
                    .map(function(fn) { return fn()(changes, stack[index].graph); })
                    .flatten()
                    .value();
            },

            hasChanges: function() {
                return this.difference().length() > 0;
            },

            imageryUsed: function(sources) {
                if (sources) {
                    imageryUsed = sources;
                    return history;
                } else {
                    return _(stack.slice(1, index + 1))
                        .map('imageryUsed')
                        .flatten()
                        .uniq()
                        .without(undefined, 'Custom')
                        .value();
                }
            },

            reset: function() {
                stack = [{graph: Graph()}];
                index = 0;
                tree = Tree(stack[0].graph);
                dispatch.change();
                return history;
            },

            toJSON: function() {
                if (!this.hasChanges()) return;

                var allEntities = {},
                    baseEntities = {},
                    base = stack[0];

                var s = stack.map(function(i) {
                    var modified = [], deleted = [];

                    _.forEach(i.graph.entities, function(entity, id) {
                        if (entity) {
                            var key = Entity.key(entity);
                            allEntities[key] = entity;
                            modified.push(key);
                        } else {
                            deleted.push(id);
                        }

                        // make sure that the originals of changed or deleted entities get merged
                        // into the base of the stack after restoring the data from JSON.
                        if (id in base.graph.entities) {
                            baseEntities[id] = base.graph.entities[id];
                        }
                        // get originals of parent entities too
                        _.forEach(base.graph._parentWays[id], function(parentId) {
                            if (parentId in base.graph.entities) {
                                baseEntities[parentId] = base.graph.entities[parentId];
                            }
                        });
                    });

                    var x = {};

                    if (modified.length) x.modified = modified;
                    if (deleted.length) x.deleted = deleted;
                    if (i.imageryUsed) x.imageryUsed = i.imageryUsed;
                    if (i.annotation) x.annotation = i.annotation;

                    return x;
                });

                return JSON.stringify({
                    version: 3,
                    entities: _.values(allEntities),
                    baseEntities: _.values(baseEntities),
                    stack: s,
                    nextIDs: Entity.id.next,
                    index: index
                });
            },

            fromJSON: function(json, loadChildNodes) {
                var h = JSON.parse(json),
                    loadComplete = true;

                Entity.id.next = h.nextIDs;
                index = h.index;

                if (h.version === 2 || h.version === 3) {
                    var allEntities = {};

                    h.entities.forEach(function(entity) {
                        allEntities[Entity.key(entity)] = Entity(entity);
                    });

                    if (h.version === 3) {
                        // This merges originals for changed entities into the base of
                        // the stack even if the current stack doesn't have them (for
                        // example when iD has been restarted in a different region)
                        var baseEntities = h.baseEntities.map(function(d) { return Entity(d); });
                        stack[0].graph.rebase(baseEntities, _.map(stack, 'graph'), true);
                        tree.rebase(baseEntities, true);

                        // When we restore a modified way, we also need to fetch any missing
                        // childnodes that would normally have been downloaded with it.. #2142
                        if (loadChildNodes) {
                            var missing =  _(baseEntities)
                                    .filter({ type: 'way' })
                                    .map('nodes')
                                    .flatten()
                                    .uniq()
                                    .reject(function(n) { return stack[0].graph.hasEntity(n); })
                                    .value();

                            if (!_.isEmpty(missing)) {
                                loadComplete = false;
                                context.redrawEnable(false);

                                var loading = iD.ui.Loading(context).blocking(true);
                                context.container().call(loading);

                                var childNodesLoaded = function(err, result) {
                                    if (!err) {
                                        var visible = _.groupBy(result.data, 'visible');
                                        if (!_.isEmpty(visible.true)) {
                                            missing = _.difference(missing, _.map(visible.true, 'id'));
                                            stack[0].graph.rebase(visible.true, _.map(stack, 'graph'), true);
                                            tree.rebase(visible.true, true);
                                        }

                                        // fetch older versions of nodes that were deleted..
                                        _.each(visible.false, function(entity) {
                                            context.connection()
                                                .loadEntityVersion(entity.id, +entity.version - 1, childNodesLoaded);
                                        });
                                    }

                                    if (err || _.isEmpty(missing)) {
                                        loading.close();
                                        context.redrawEnable(true);
                                        dispatch.change();
                                    }
                                };

                                context.connection().loadMultiple(missing, childNodesLoaded);
                            }
                        }
                    }

                    stack = h.stack.map(function(d) {
                        var entities = {}, entity;

                        if (d.modified) {
                            d.modified.forEach(function(key) {
                                entity = allEntities[key];
                                entities[entity.id] = entity;
                            });
                        }

                        if (d.deleted) {
                            d.deleted.forEach(function(id) {
                                entities[id] = undefined;
                            });
                        }

                        return {
                            graph: Graph(stack[0].graph).load(entities),
                            annotation: d.annotation,
                            imageryUsed: d.imageryUsed
                        };
                    });

                } else { // original version
                    stack = h.stack.map(function(d) {
                        var entities = {};

                        for (var i in d.entities) {
                            var entity = d.entities[i];
                            entities[i] = entity === 'undefined' ? undefined : Entity(entity);
                        }

                        d.graph = Graph(stack[0].graph).load(entities);
                        return d;
                    });
                }

                if (loadComplete) {
                    dispatch.change();
                }

                return history;
            },

            save: function() {
                if (lock.locked()) context.storage(getKey('saved_history'), history.toJSON() || null);
                return history;
            },

            clearSaved: function() {
                context.debouncedSave.cancel();
                if (lock.locked()) context.storage(getKey('saved_history'), null);
                return history;
            },

            lock: function() {
                return lock.lock();
            },

            unlock: function() {
                lock.unlock();
            },

            // is iD not open in another window and it detects that
            // there's a history stored in localStorage that's recoverable?
            restorableChanges: function() {
                return lock.locked() && !!context.storage(getKey('saved_history'));
            },

            // load history from a version stored in localStorage
            restore: function() {
                if (!lock.locked()) return;

                var json = context.storage(getKey('saved_history'));
                if (json) history.fromJSON(json, true);
            },

            _getKey: getKey

        };

        history.reset();

        return d3.rebind(history, dispatch, 'on');
    }

    exports.Connection = Connection;
    exports.Difference = Difference;
    exports.Entity = Entity;
    exports.Graph = Graph;
    exports.History = History;
    exports.Node = Node;
    exports.Relation = Relation;
    exports.oneWayTags = oneWayTags;
    exports.pavedTags = pavedTags;
    exports.interestingTag = interestingTag;
    exports.Tree = Tree;
    exports.Way = Way;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
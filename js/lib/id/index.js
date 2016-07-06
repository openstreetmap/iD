(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
   typeof define === 'function' && define.amd ? define(['exports'], factory) :
   (factory((global.iD = global.iD || {})));
}(this, function (exports) { 'use strict';

   function AddEntity(way) {
       return function(graph) {
           return graph.replace(way);
       };
   }

   function Extent(min, max) {
       if (!(this instanceof Extent)) return new Extent(min, max);
       if (min instanceof Extent) {
           return min;
       } else if (min && min.length === 2 && min[0].length === 2 && min[1].length === 2) {
           this[0] = min[0];
           this[1] = min[1];
       } else {
           this[0] = min        || [ Infinity,  Infinity];
           this[1] = max || min || [-Infinity, -Infinity];
       }
   }

   Extent.prototype = new Array(2);

   _.extend(Extent.prototype, {
       equals: function (obj) {
           return this[0][0] === obj[0][0] &&
               this[0][1] === obj[0][1] &&
               this[1][0] === obj[1][0] &&
               this[1][1] === obj[1][1];
       },

       extend: function(obj) {
           if (!(obj instanceof Extent)) obj = new Extent(obj);
           return Extent([Math.min(obj[0][0], this[0][0]),
                                 Math.min(obj[0][1], this[0][1])],
                                [Math.max(obj[1][0], this[1][0]),
                                 Math.max(obj[1][1], this[1][1])]);
       },

       _extend: function(extent) {
           this[0][0] = Math.min(extent[0][0], this[0][0]);
           this[0][1] = Math.min(extent[0][1], this[0][1]);
           this[1][0] = Math.max(extent[1][0], this[1][0]);
           this[1][1] = Math.max(extent[1][1], this[1][1]);
       },

       area: function() {
           return Math.abs((this[1][0] - this[0][0]) * (this[1][1] - this[0][1]));
       },

       center: function() {
           return [(this[0][0] + this[1][0]) / 2,
                   (this[0][1] + this[1][1]) / 2];
       },

       rectangle: function() {
           return [this[0][0], this[0][1], this[1][0], this[1][1]];
       },

       bbox: function() {
           return { minX: this[0][0], minY: this[0][1], maxX: this[1][0], maxY: this[1][1] };
       },

       polygon: function() {
           return [
               [this[0][0], this[0][1]],
               [this[0][0], this[1][1]],
               [this[1][0], this[1][1]],
               [this[1][0], this[0][1]],
               [this[0][0], this[0][1]]
           ];
       },

       contains: function(obj) {
           if (!(obj instanceof Extent)) obj = new Extent(obj);
           return obj[0][0] >= this[0][0] &&
                  obj[0][1] >= this[0][1] &&
                  obj[1][0] <= this[1][0] &&
                  obj[1][1] <= this[1][1];
       },

       intersects: function(obj) {
           if (!(obj instanceof Extent)) obj = new Extent(obj);
           return obj[0][0] <= this[1][0] &&
                  obj[0][1] <= this[1][1] &&
                  obj[1][0] >= this[0][0] &&
                  obj[1][1] >= this[0][1];
       },

       intersection: function(obj) {
           if (!this.intersects(obj)) return new Extent();
           return new Extent([Math.max(obj[0][0], this[0][0]),
                                     Math.max(obj[0][1], this[0][1])],
                                    [Math.min(obj[1][0], this[1][0]),
                                     Math.min(obj[1][1], this[1][1])]);
       },

       percentContainedIn: function(obj) {
           if (!(obj instanceof Extent)) obj = new Extent(obj);
           var a1 = this.intersection(obj).area(),
               a2 = this.area();

           if (a1 === Infinity || a2 === Infinity || a1 === 0 || a2 === 0) {
               return 0;
           } else {
               return a1 / a2;
           }
       },

       padByMeters: function(meters) {
           var dLat = metersToLat(meters),
               dLon = metersToLon(meters, this.center()[1]);
           return Extent(
                   [this[0][0] - dLon, this[0][1] - dLat],
                   [this[1][0] + dLon, this[1][1] + dLat]);
       },

       toParam: function() {
           return this.rectangle().join(',');
       }

   });

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
           // function parseTurnLane(str) {
           //     if (!str || str === '') return null;
           //
           //     return str.split('|').map(function(s) {
           //         return s.split(';');
           //     });
           // }

           if (!this.tags.highway) return null;
           var defaultLanes = {}, tagged = {};
           switch (this.tags.highway) {
               case 'trunk':
               case 'motorway':
                   defaultLanes.count = this.isOneWay() ? 2 : 4;
                   break;
               default:
                   defaultLanes.count = this.isOneWay() ? 1 : 2;
                   break;
           }

           tagged.oneway = this.isOneWay();
           tagged.lanes = {};

           if (this.tags.lanes) tagged.lanes.count = this.tags.lanes;
           if (this.tags['lanes:forward']) tagged.lanes.forward = this.tags['lanes:forward'];
           if (this.tags['lanes:backward']) tagged.lanes.backward = this.tags['lanes:backward'];

           return {
               defaults: {
                   lanes: defaultLanes
               },
               tagged: tagged
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

           outers = joinWays(outers, resolver);
           inners = joinWays(inners, resolver);

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

   var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

   function createCommonjsModule(fn, module) {
   	return module = { exports: {} }, fn(module, module.exports), module.exports;
   }

   var store = createCommonjsModule(function (module, exports) {
   "use strict"
   // Module export pattern from
   // https://github.com/umdjs/umd/blob/master/returnExports.js
   ;(function (root, factory) {
       if (typeof define === 'function' && define.amd) {
           // AMD. Register as an anonymous module.
           define([], factory);
       } else if (typeof exports === 'object') {
           // Node. Does not work with strict CommonJS, but
           // only CommonJS-like environments that support module.exports,
           // like Node.
           module.exports = factory();
       } else {
           // Browser globals (root is window)
           root.store = factory();
     }
   }(commonjsGlobal, function () {
   	
   	// Store.js
   	var store = {},
   		win = (typeof window != 'undefined' ? window : commonjsGlobal),
   		doc = win.document,
   		localStorageName = 'localStorage',
   		scriptTag = 'script',
   		storage

   	store.disabled = false
   	store.version = '1.3.20'
   	store.set = function(key, value) {}
   	store.get = function(key, defaultVal) {}
   	store.has = function(key) { return store.get(key) !== undefined }
   	store.remove = function(key) {}
   	store.clear = function() {}
   	store.transact = function(key, defaultVal, transactionFn) {
   		if (transactionFn == null) {
   			transactionFn = defaultVal
   			defaultVal = null
   		}
   		if (defaultVal == null) {
   			defaultVal = {}
   		}
   		var val = store.get(key, defaultVal)
   		transactionFn(val)
   		store.set(key, val)
   	}
   	store.getAll = function() {}
   	store.forEach = function() {}

   	store.serialize = function(value) {
   		return JSON.stringify(value)
   	}
   	store.deserialize = function(value) {
   		if (typeof value != 'string') { return undefined }
   		try { return JSON.parse(value) }
   		catch(e) { return value || undefined }
   	}

   	// Functions to encapsulate questionable FireFox 3.6.13 behavior
   	// when about.config::dom.storage.enabled === false
   	// See https://github.com/marcuswestin/store.js/issues#issue/13
   	function isLocalStorageNameSupported() {
   		try { return (localStorageName in win && win[localStorageName]) }
   		catch(err) { return false }
   	}

   	if (isLocalStorageNameSupported()) {
   		storage = win[localStorageName]
   		store.set = function(key, val) {
   			if (val === undefined) { return store.remove(key) }
   			storage.setItem(key, store.serialize(val))
   			return val
   		}
   		store.get = function(key, defaultVal) {
   			var val = store.deserialize(storage.getItem(key))
   			return (val === undefined ? defaultVal : val)
   		}
   		store.remove = function(key) { storage.removeItem(key) }
   		store.clear = function() { storage.clear() }
   		store.getAll = function() {
   			var ret = {}
   			store.forEach(function(key, val) {
   				ret[key] = val
   			})
   			return ret
   		}
   		store.forEach = function(callback) {
   			for (var i=0; i<storage.length; i++) {
   				var key = storage.key(i)
   				callback(key, store.get(key))
   			}
   		}
   	} else if (doc && doc.documentElement.addBehavior) {
   		var storageOwner,
   			storageContainer
   		// Since #userData storage applies only to specific paths, we need to
   		// somehow link our data to a specific path.  We choose /favicon.ico
   		// as a pretty safe option, since all browsers already make a request to
   		// this URL anyway and being a 404 will not hurt us here.  We wrap an
   		// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
   		// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
   		// since the iframe access rules appear to allow direct access and
   		// manipulation of the document element, even for a 404 page.  This
   		// document can be used instead of the current document (which would
   		// have been limited to the current path) to perform #userData storage.
   		try {
   			storageContainer = new ActiveXObject('htmlfile')
   			storageContainer.open()
   			storageContainer.write('<'+scriptTag+'>document.w=window</'+scriptTag+'><iframe src="/favicon.ico"></iframe>')
   			storageContainer.close()
   			storageOwner = storageContainer.w.frames[0].document
   			storage = storageOwner.createElement('div')
   		} catch(e) {
   			// somehow ActiveXObject instantiation failed (perhaps some special
   			// security settings or otherwse), fall back to per-path storage
   			storage = doc.createElement('div')
   			storageOwner = doc.body
   		}
   		var withIEStorage = function(storeFunction) {
   			return function() {
   				var args = Array.prototype.slice.call(arguments, 0)
   				args.unshift(storage)
   				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
   				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
   				storageOwner.appendChild(storage)
   				storage.addBehavior('#default#userData')
   				storage.load(localStorageName)
   				var result = storeFunction.apply(store, args)
   				storageOwner.removeChild(storage)
   				return result
   			}
   		}

   		// In IE7, keys cannot start with a digit or contain certain chars.
   		// See https://github.com/marcuswestin/store.js/issues/40
   		// See https://github.com/marcuswestin/store.js/issues/83
   		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
   		var ieKeyFix = function(key) {
   			return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
   		}
   		store.set = withIEStorage(function(storage, key, val) {
   			key = ieKeyFix(key)
   			if (val === undefined) { return store.remove(key) }
   			storage.setAttribute(key, store.serialize(val))
   			storage.save(localStorageName)
   			return val
   		})
   		store.get = withIEStorage(function(storage, key, defaultVal) {
   			key = ieKeyFix(key)
   			var val = store.deserialize(storage.getAttribute(key))
   			return (val === undefined ? defaultVal : val)
   		})
   		store.remove = withIEStorage(function(storage, key) {
   			key = ieKeyFix(key)
   			storage.removeAttribute(key)
   			storage.save(localStorageName)
   		})
   		store.clear = withIEStorage(function(storage) {
   			var attributes = storage.XMLDocument.documentElement.attributes
   			storage.load(localStorageName)
   			for (var i=attributes.length-1; i>=0; i--) {
   				storage.removeAttribute(attributes[i].name)
   			}
   			storage.save(localStorageName)
   		})
   		store.getAll = function(storage) {
   			var ret = {}
   			store.forEach(function(key, val) {
   				ret[key] = val
   			})
   			return ret
   		}
   		store.forEach = withIEStorage(function(storage, callback) {
   			var attributes = storage.XMLDocument.documentElement.attributes
   			for (var i=0, attr; attr=attributes[i]; ++i) {
   				callback(attr.name, store.deserialize(storage.getAttribute(attr.name)))
   			}
   		})
   	}

   	try {
   		var testKey = '__storejs__'
   		store.set(testKey, testKey)
   		if (store.get(testKey) != testKey) { store.disabled = true }
   		store.remove(testKey)
   	} catch(e) {
   		store.disabled = true
   	}
   	store.enabled = !store.disabled
   	
   	return store
   }));
   });

   var require$$0 = (store && typeof store === 'object' && 'default' in store ? store['default'] : store);

   var immutable = createCommonjsModule(function (module) {
   module.exports = extend

   var hasOwnProperty = Object.prototype.hasOwnProperty;

   function extend() {
       var target = {}

       for (var i = 0; i < arguments.length; i++) {
           var source = arguments[i]

           for (var key in source) {
               if (hasOwnProperty.call(source, key)) {
                   target[key] = source[key]
               }
           }
       }

       return target
   }
   });

   var require$$1 = (immutable && typeof immutable === 'object' && 'default' in immutable ? immutable['default'] : immutable);

   var hasKeys = createCommonjsModule(function (module) {
   module.exports = hasKeys

   function hasKeys(source) {
       return source !== null &&
           (typeof source === "object" ||
           typeof source === "function")
   }
   });

   var require$$0$2 = (hasKeys && typeof hasKeys === 'object' && 'default' in hasKeys ? hasKeys['default'] : hasKeys);

   var index$4 = createCommonjsModule(function (module) {
   var hasOwn = Object.prototype.hasOwnProperty;
   var toString = Object.prototype.toString;

   module.exports = function forEach (obj, fn, ctx) {
       if (toString.call(fn) !== '[object Function]') {
           throw new TypeError('iterator must be a function');
       }
       var l = obj.length;
       if (l === +l) {
           for (var i = 0; i < l; i++) {
               fn.call(ctx, obj[i], i, obj);
           }
       } else {
           for (var k in obj) {
               if (hasOwn.call(obj, k)) {
                   fn.call(ctx, obj[k], k, obj);
               }
           }
       }
   };
   });

   var require$$0$4 = (index$4 && typeof index$4 === 'object' && 'default' in index$4 ? index$4['default'] : index$4);

   var index$5 = createCommonjsModule(function (module) {
   /**!
    * is
    * the definitive JavaScript type testing library
    * 
    * @copyright 2013 Enrico Marino
    * @license MIT
    */

   var objProto = Object.prototype;
   var owns = objProto.hasOwnProperty;
   var toString = objProto.toString;
   var isActualNaN = function (value) {
     return value !== value;
   };
   var NON_HOST_TYPES = {
     "boolean": 1,
     "number": 1,
     "string": 1,
     "undefined": 1
   };

   /**
    * Expose `is`
    */

   var is = module.exports = {};

   /**
    * Test general.
    */

   /**
    * is.type
    * Test if `value` is a type of `type`.
    *
    * @param {Mixed} value value to test
    * @param {String} type type
    * @return {Boolean} true if `value` is a type of `type`, false otherwise
    * @api public
    */

   is.a =
   is.type = function (value, type) {
     return typeof value === type;
   };

   /**
    * is.defined
    * Test if `value` is defined.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if 'value' is defined, false otherwise
    * @api public
    */

   is.defined = function (value) {
     return value !== undefined;
   };

   /**
    * is.empty
    * Test if `value` is empty.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is empty, false otherwise
    * @api public
    */

   is.empty = function (value) {
     var type = toString.call(value);
     var key;

     if ('[object Array]' === type || '[object Arguments]' === type) {
       return value.length === 0;
     }

     if ('[object Object]' === type) {
       for (key in value) if (owns.call(value, key)) return false;
       return true;
     }

     if ('[object String]' === type) {
       return '' === value;
     }

     return false;
   };

   /**
    * is.equal
    * Test if `value` is equal to `other`.
    *
    * @param {Mixed} value value to test
    * @param {Mixed} other value to compare with
    * @return {Boolean} true if `value` is equal to `other`, false otherwise
    */

   is.equal = function (value, other) {
     var type = toString.call(value)
     var key;

     if (type !== toString.call(other)) {
       return false;
     }

     if ('[object Object]' === type) {
       for (key in value) {
         if (!is.equal(value[key], other[key])) {
           return false;
         }
       }
       return true;
     }

     if ('[object Array]' === type) {
       key = value.length;
       if (key !== other.length) {
         return false;
       }
       while (--key) {
         if (!is.equal(value[key], other[key])) {
           return false;
         }
       }
       return true;
     }

     if ('[object Function]' === type) {
       return value.prototype === other.prototype;
     }

     if ('[object Date]' === type) {
       return value.getTime() === other.getTime();
     }

     return value === other;
   };

   /**
    * is.hosted
    * Test if `value` is hosted by `host`.
    *
    * @param {Mixed} value to test
    * @param {Mixed} host host to test with
    * @return {Boolean} true if `value` is hosted by `host`, false otherwise
    * @api public
    */

   is.hosted = function (value, host) {
     var type = typeof host[value];
     return type === 'object' ? !!host[value] : !NON_HOST_TYPES[type];
   };

   /**
    * is.instance
    * Test if `value` is an instance of `constructor`.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is an instance of `constructor`
    * @api public
    */

   is.instance = is['instanceof'] = function (value, constructor) {
     return value instanceof constructor;
   };

   /**
    * is.null
    * Test if `value` is null.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is null, false otherwise
    * @api public
    */

   is['null'] = function (value) {
     return value === null;
   };

   /**
    * is.undefined
    * Test if `value` is undefined.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is undefined, false otherwise
    * @api public
    */

   is.undefined = function (value) {
     return value === undefined;
   };

   /**
    * Test arguments.
    */

   /**
    * is.arguments
    * Test if `value` is an arguments object.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is an arguments object, false otherwise
    * @api public
    */

   is.arguments = function (value) {
     var isStandardArguments = '[object Arguments]' === toString.call(value);
     var isOldArguments = !is.array(value) && is.arraylike(value) && is.object(value) && is.fn(value.callee);
     return isStandardArguments || isOldArguments;
   };

   /**
    * Test array.
    */

   /**
    * is.array
    * Test if 'value' is an array.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is an array, false otherwise
    * @api public
    */

   is.array = function (value) {
     return '[object Array]' === toString.call(value);
   };

   /**
    * is.arguments.empty
    * Test if `value` is an empty arguments object.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is an empty arguments object, false otherwise
    * @api public
    */
   is.arguments.empty = function (value) {
     return is.arguments(value) && value.length === 0;
   };

   /**
    * is.array.empty
    * Test if `value` is an empty array.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is an empty array, false otherwise
    * @api public
    */
   is.array.empty = function (value) {
     return is.array(value) && value.length === 0;
   };

   /**
    * is.arraylike
    * Test if `value` is an arraylike object.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is an arguments object, false otherwise
    * @api public
    */

   is.arraylike = function (value) {
     return !!value && !is.boolean(value)
       && owns.call(value, 'length')
       && isFinite(value.length)
       && is.number(value.length)
       && value.length >= 0;
   };

   /**
    * Test boolean.
    */

   /**
    * is.boolean
    * Test if `value` is a boolean.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is a boolean, false otherwise
    * @api public
    */

   is.boolean = function (value) {
     return '[object Boolean]' === toString.call(value);
   };

   /**
    * is.false
    * Test if `value` is false.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is false, false otherwise
    * @api public
    */

   is['false'] = function (value) {
     return is.boolean(value) && (value === false || value.valueOf() === false);
   };

   /**
    * is.true
    * Test if `value` is true.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is true, false otherwise
    * @api public
    */

   is['true'] = function (value) {
     return is.boolean(value) && (value === true || value.valueOf() === true);
   };

   /**
    * Test date.
    */

   /**
    * is.date
    * Test if `value` is a date.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is a date, false otherwise
    * @api public
    */

   is.date = function (value) {
     return '[object Date]' === toString.call(value);
   };

   /**
    * Test element.
    */

   /**
    * is.element
    * Test if `value` is an html element.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is an HTML Element, false otherwise
    * @api public
    */

   is.element = function (value) {
     return value !== undefined
       && typeof HTMLElement !== 'undefined'
       && value instanceof HTMLElement
       && value.nodeType === 1;
   };

   /**
    * Test error.
    */

   /**
    * is.error
    * Test if `value` is an error object.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is an error object, false otherwise
    * @api public
    */

   is.error = function (value) {
     return '[object Error]' === toString.call(value);
   };

   /**
    * Test function.
    */

   /**
    * is.fn / is.function (deprecated)
    * Test if `value` is a function.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is a function, false otherwise
    * @api public
    */

   is.fn = is['function'] = function (value) {
     var isAlert = typeof window !== 'undefined' && value === window.alert;
     return isAlert || '[object Function]' === toString.call(value);
   };

   /**
    * Test number.
    */

   /**
    * is.number
    * Test if `value` is a number.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is a number, false otherwise
    * @api public
    */

   is.number = function (value) {
     return '[object Number]' === toString.call(value);
   };

   /**
    * is.infinite
    * Test if `value` is positive or negative infinity.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is positive or negative Infinity, false otherwise
    * @api public
    */
   is.infinite = function (value) {
     return value === Infinity || value === -Infinity;
   };

   /**
    * is.decimal
    * Test if `value` is a decimal number.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is a decimal number, false otherwise
    * @api public
    */

   is.decimal = function (value) {
     return is.number(value) && !isActualNaN(value) && !is.infinite(value) && value % 1 !== 0;
   };

   /**
    * is.divisibleBy
    * Test if `value` is divisible by `n`.
    *
    * @param {Number} value value to test
    * @param {Number} n dividend
    * @return {Boolean} true if `value` is divisible by `n`, false otherwise
    * @api public
    */

   is.divisibleBy = function (value, n) {
     var isDividendInfinite = is.infinite(value);
     var isDivisorInfinite = is.infinite(n);
     var isNonZeroNumber = is.number(value) && !isActualNaN(value) && is.number(n) && !isActualNaN(n) && n !== 0;
     return isDividendInfinite || isDivisorInfinite || (isNonZeroNumber && value % n === 0);
   };

   /**
    * is.int
    * Test if `value` is an integer.
    *
    * @param value to test
    * @return {Boolean} true if `value` is an integer, false otherwise
    * @api public
    */

   is.int = function (value) {
     return is.number(value) && !isActualNaN(value) && value % 1 === 0;
   };

   /**
    * is.maximum
    * Test if `value` is greater than 'others' values.
    *
    * @param {Number} value value to test
    * @param {Array} others values to compare with
    * @return {Boolean} true if `value` is greater than `others` values
    * @api public
    */

   is.maximum = function (value, others) {
     if (isActualNaN(value)) {
       throw new TypeError('NaN is not a valid value');
     } else if (!is.arraylike(others)) {
       throw new TypeError('second argument must be array-like');
     }
     var len = others.length;

     while (--len >= 0) {
       if (value < others[len]) {
         return false;
       }
     }

     return true;
   };

   /**
    * is.minimum
    * Test if `value` is less than `others` values.
    *
    * @param {Number} value value to test
    * @param {Array} others values to compare with
    * @return {Boolean} true if `value` is less than `others` values
    * @api public
    */

   is.minimum = function (value, others) {
     if (isActualNaN(value)) {
       throw new TypeError('NaN is not a valid value');
     } else if (!is.arraylike(others)) {
       throw new TypeError('second argument must be array-like');
     }
     var len = others.length;

     while (--len >= 0) {
       if (value > others[len]) {
         return false;
       }
     }

     return true;
   };

   /**
    * is.nan
    * Test if `value` is not a number.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is not a number, false otherwise
    * @api public
    */

   is.nan = function (value) {
     return !is.number(value) || value !== value;
   };

   /**
    * is.even
    * Test if `value` is an even number.
    *
    * @param {Number} value value to test
    * @return {Boolean} true if `value` is an even number, false otherwise
    * @api public
    */

   is.even = function (value) {
     return is.infinite(value) || (is.number(value) && value === value && value % 2 === 0);
   };

   /**
    * is.odd
    * Test if `value` is an odd number.
    *
    * @param {Number} value value to test
    * @return {Boolean} true if `value` is an odd number, false otherwise
    * @api public
    */

   is.odd = function (value) {
     return is.infinite(value) || (is.number(value) && value === value && value % 2 !== 0);
   };

   /**
    * is.ge
    * Test if `value` is greater than or equal to `other`.
    *
    * @param {Number} value value to test
    * @param {Number} other value to compare with
    * @return {Boolean}
    * @api public
    */

   is.ge = function (value, other) {
     if (isActualNaN(value) || isActualNaN(other)) {
       throw new TypeError('NaN is not a valid value');
     }
     return !is.infinite(value) && !is.infinite(other) && value >= other;
   };

   /**
    * is.gt
    * Test if `value` is greater than `other`.
    *
    * @param {Number} value value to test
    * @param {Number} other value to compare with
    * @return {Boolean}
    * @api public
    */

   is.gt = function (value, other) {
     if (isActualNaN(value) || isActualNaN(other)) {
       throw new TypeError('NaN is not a valid value');
     }
     return !is.infinite(value) && !is.infinite(other) && value > other;
   };

   /**
    * is.le
    * Test if `value` is less than or equal to `other`.
    *
    * @param {Number} value value to test
    * @param {Number} other value to compare with
    * @return {Boolean} if 'value' is less than or equal to 'other'
    * @api public
    */

   is.le = function (value, other) {
     if (isActualNaN(value) || isActualNaN(other)) {
       throw new TypeError('NaN is not a valid value');
     }
     return !is.infinite(value) && !is.infinite(other) && value <= other;
   };

   /**
    * is.lt
    * Test if `value` is less than `other`.
    *
    * @param {Number} value value to test
    * @param {Number} other value to compare with
    * @return {Boolean} if `value` is less than `other`
    * @api public
    */

   is.lt = function (value, other) {
     if (isActualNaN(value) || isActualNaN(other)) {
       throw new TypeError('NaN is not a valid value');
     }
     return !is.infinite(value) && !is.infinite(other) && value < other;
   };

   /**
    * is.within
    * Test if `value` is within `start` and `finish`.
    *
    * @param {Number} value value to test
    * @param {Number} start lower bound
    * @param {Number} finish upper bound
    * @return {Boolean} true if 'value' is is within 'start' and 'finish'
    * @api public
    */
   is.within = function (value, start, finish) {
     if (isActualNaN(value) || isActualNaN(start) || isActualNaN(finish)) {
       throw new TypeError('NaN is not a valid value');
     } else if (!is.number(value) || !is.number(start) || !is.number(finish)) {
       throw new TypeError('all arguments must be numbers');
     }
     var isAnyInfinite = is.infinite(value) || is.infinite(start) || is.infinite(finish);
     return isAnyInfinite || (value >= start && value <= finish);
   };

   /**
    * Test object.
    */

   /**
    * is.object
    * Test if `value` is an object.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is an object, false otherwise
    * @api public
    */

   is.object = function (value) {
     return value && '[object Object]' === toString.call(value);
   };

   /**
    * is.hash
    * Test if `value` is a hash - a plain object literal.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is a hash, false otherwise
    * @api public
    */

   is.hash = function (value) {
     return is.object(value) && value.constructor === Object && !value.nodeType && !value.setInterval;
   };

   /**
    * Test regexp.
    */

   /**
    * is.regexp
    * Test if `value` is a regular expression.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if `value` is a regexp, false otherwise
    * @api public
    */

   is.regexp = function (value) {
     return '[object RegExp]' === toString.call(value);
   };

   /**
    * Test string.
    */

   /**
    * is.string
    * Test if `value` is a string.
    *
    * @param {Mixed} value value to test
    * @return {Boolean} true if 'value' is a string, false otherwise
    * @api public
    */

   is.string = function (value) {
     return '[object String]' === toString.call(value);
   };
   });

   var require$$1$2 = (index$5 && typeof index$5 === 'object' && 'default' in index$5 ? index$5['default'] : index$5);

   var shim = createCommonjsModule(function (module) {
   (function () {
   	"use strict";

   	// modified from https://github.com/kriskowal/es5-shim
   	var has = Object.prototype.hasOwnProperty,
   		is = require$$1$2,
   		forEach = require$$0$4,
   		hasDontEnumBug = !({'toString': null}).propertyIsEnumerable('toString'),
   		dontEnums = [
   			"toString",
   			"toLocaleString",
   			"valueOf",
   			"hasOwnProperty",
   			"isPrototypeOf",
   			"propertyIsEnumerable",
   			"constructor"
   		],
   		keysShim;

   	keysShim = function keys(object) {
   		if (!is.object(object) && !is.array(object)) {
   			throw new TypeError("Object.keys called on a non-object");
   		}

   		var name, theKeys = [];
   		for (name in object) {
   			if (has.call(object, name)) {
   				theKeys.push(name);
   			}
   		}

   		if (hasDontEnumBug) {
   			forEach(dontEnums, function (dontEnum) {
   				if (has.call(object, dontEnum)) {
   					theKeys.push(dontEnum);
   				}
   			});
   		}
   		return theKeys;
   	};

   	module.exports = keysShim;
   }());
   });

   var require$$0$3 = (shim && typeof shim === 'object' && 'default' in shim ? shim['default'] : shim);

   var index$3 = createCommonjsModule(function (module) {
   module.exports = Object.keys || require$$0$3;
   });

   var require$$1$1 = (index$3 && typeof index$3 === 'object' && 'default' in index$3 ? index$3['default'] : index$3);

   var index$2 = createCommonjsModule(function (module) {
   var Keys = require$$1$1
   var hasKeys = require$$0$2

   module.exports = extend

   function extend() {
       var target = {}

       for (var i = 0; i < arguments.length; i++) {
           var source = arguments[i]

           if (!hasKeys(source)) {
               continue
           }

           var keys = Keys(source)

           for (var j = 0; j < keys.length; j++) {
               var name = keys[j]
               target[name] = source[name]
           }
       }

       return target
   }
   });

   var require$$0$1 = (index$2 && typeof index$2 === 'object' && 'default' in index$2 ? index$2['default'] : index$2);

   var hashes = createCommonjsModule(function (module, exports) {
   /**
    * jshashes - https://github.com/h2non/jshashes
    * Released under the "New BSD" license
    *
    * Algorithms specification:
    *
    * MD5 - http://www.ietf.org/rfc/rfc1321.txt
    * RIPEMD-160 - http://homes.esat.kuleuven.be/~bosselae/ripemd160.html
    * SHA1   - http://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf
    * SHA256 - http://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf
    * SHA512 - http://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf
    * HMAC - http://www.ietf.org/rfc/rfc2104.txt
    */
   (function() {
     var Hashes;

     function utf8Encode(str) {
       var x, y, output = '',
         i = -1,
         l;

       if (str && str.length) {
         l = str.length;
         while ((i += 1) < l) {
           /* Decode utf-16 surrogate pairs */
           x = str.charCodeAt(i);
           y = i + 1 < l ? str.charCodeAt(i + 1) : 0;
           if (0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
             x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
             i += 1;
           }
           /* Encode output as utf-8 */
           if (x <= 0x7F) {
             output += String.fromCharCode(x);
           } else if (x <= 0x7FF) {
             output += String.fromCharCode(0xC0 | ((x >>> 6) & 0x1F),
               0x80 | (x & 0x3F));
           } else if (x <= 0xFFFF) {
             output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
               0x80 | ((x >>> 6) & 0x3F),
               0x80 | (x & 0x3F));
           } else if (x <= 0x1FFFFF) {
             output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
               0x80 | ((x >>> 12) & 0x3F),
               0x80 | ((x >>> 6) & 0x3F),
               0x80 | (x & 0x3F));
           }
         }
       }
       return output;
     }

     function utf8Decode(str) {
       var i, ac, c1, c2, c3, arr = [],
         l;
       i = ac = c1 = c2 = c3 = 0;

       if (str && str.length) {
         l = str.length;
         str += '';

         while (i < l) {
           c1 = str.charCodeAt(i);
           ac += 1;
           if (c1 < 128) {
             arr[ac] = String.fromCharCode(c1);
             i += 1;
           } else if (c1 > 191 && c1 < 224) {
             c2 = str.charCodeAt(i + 1);
             arr[ac] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
             i += 2;
           } else {
             c2 = str.charCodeAt(i + 1);
             c3 = str.charCodeAt(i + 2);
             arr[ac] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
             i += 3;
           }
         }
       }
       return arr.join('');
     }

     /**
      * Add integers, wrapping at 2^32. This uses 16-bit operations internally
      * to work around bugs in some JS interpreters.
      */

     function safe_add(x, y) {
       var lsw = (x & 0xFFFF) + (y & 0xFFFF),
         msw = (x >> 16) + (y >> 16) + (lsw >> 16);
       return (msw << 16) | (lsw & 0xFFFF);
     }

     /**
      * Bitwise rotate a 32-bit number to the left.
      */

     function bit_rol(num, cnt) {
       return (num << cnt) | (num >>> (32 - cnt));
     }

     /**
      * Convert a raw string to a hex string
      */

     function rstr2hex(input, hexcase) {
       var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef',
         output = '',
         x, i = 0,
         l = input.length;
       for (; i < l; i += 1) {
         x = input.charCodeAt(i);
         output += hex_tab.charAt((x >>> 4) & 0x0F) + hex_tab.charAt(x & 0x0F);
       }
       return output;
     }

     /**
      * Encode a string as utf-16
      */

     function str2rstr_utf16le(input) {
       var i, l = input.length,
         output = '';
       for (i = 0; i < l; i += 1) {
         output += String.fromCharCode(input.charCodeAt(i) & 0xFF, (input.charCodeAt(i) >>> 8) & 0xFF);
       }
       return output;
     }

     function str2rstr_utf16be(input) {
       var i, l = input.length,
         output = '';
       for (i = 0; i < l; i += 1) {
         output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF, input.charCodeAt(i) & 0xFF);
       }
       return output;
     }

     /**
      * Convert an array of big-endian words to a string
      */

     function binb2rstr(input) {
       var i, l = input.length * 32,
         output = '';
       for (i = 0; i < l; i += 8) {
         output += String.fromCharCode((input[i >> 5] >>> (24 - i % 32)) & 0xFF);
       }
       return output;
     }

     /**
      * Convert an array of little-endian words to a string
      */

     function binl2rstr(input) {
       var i, l = input.length * 32,
         output = '';
       for (i = 0; i < l; i += 8) {
         output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
       }
       return output;
     }

     /**
      * Convert a raw string to an array of little-endian words
      * Characters >255 have their high-byte silently ignored.
      */

     function rstr2binl(input) {
       var i, l = input.length * 8,
         output = Array(input.length >> 2),
         lo = output.length;
       for (i = 0; i < lo; i += 1) {
         output[i] = 0;
       }
       for (i = 0; i < l; i += 8) {
         output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
       }
       return output;
     }

     /**
      * Convert a raw string to an array of big-endian words
      * Characters >255 have their high-byte silently ignored.
      */

     function rstr2binb(input) {
       var i, l = input.length * 8,
         output = Array(input.length >> 2),
         lo = output.length;
       for (i = 0; i < lo; i += 1) {
         output[i] = 0;
       }
       for (i = 0; i < l; i += 8) {
         output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (24 - i % 32);
       }
       return output;
     }

     /**
      * Convert a raw string to an arbitrary string encoding
      */

     function rstr2any(input, encoding) {
       var divisor = encoding.length,
         remainders = Array(),
         i, q, x, ld, quotient, dividend, output, full_length;

       /* Convert to an array of 16-bit big-endian values, forming the dividend */
       dividend = Array(Math.ceil(input.length / 2));
       ld = dividend.length;
       for (i = 0; i < ld; i += 1) {
         dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
       }

       /**
        * Repeatedly perform a long division. The binary array forms the dividend,
        * the length of the encoding is the divisor. Once computed, the quotient
        * forms the dividend for the next step. We stop when the dividend is zerHashes.
        * All remainders are stored for later use.
        */
       while (dividend.length > 0) {
         quotient = Array();
         x = 0;
         for (i = 0; i < dividend.length; i += 1) {
           x = (x << 16) + dividend[i];
           q = Math.floor(x / divisor);
           x -= q * divisor;
           if (quotient.length > 0 || q > 0) {
             quotient[quotient.length] = q;
           }
         }
         remainders[remainders.length] = x;
         dividend = quotient;
       }

       /* Convert the remainders to the output string */
       output = '';
       for (i = remainders.length - 1; i >= 0; i--) {
         output += encoding.charAt(remainders[i]);
       }

       /* Append leading zero equivalents */
       full_length = Math.ceil(input.length * 8 / (Math.log(encoding.length) / Math.log(2)));
       for (i = output.length; i < full_length; i += 1) {
         output = encoding[0] + output;
       }
       return output;
     }

     /**
      * Convert a raw string to a base-64 string
      */

     function rstr2b64(input, b64pad) {
       var tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
         output = '',
         len = input.length,
         i, j, triplet;
       b64pad = b64pad || '=';
       for (i = 0; i < len; i += 3) {
         triplet = (input.charCodeAt(i) << 16) | (i + 1 < len ? input.charCodeAt(i + 1) << 8 : 0) | (i + 2 < len ? input.charCodeAt(i + 2) : 0);
         for (j = 0; j < 4; j += 1) {
           if (i * 8 + j * 6 > input.length * 8) {
             output += b64pad;
           } else {
             output += tab.charAt((triplet >>> 6 * (3 - j)) & 0x3F);
           }
         }
       }
       return output;
     }

     Hashes = {
       /**
        * @property {String} version
        * @readonly
        */
       VERSION: '1.0.5',
       /**
        * @member Hashes
        * @class Base64
        * @constructor
        */
       Base64: function() {
         // private properties
         var tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
           pad = '=', // default pad according with the RFC standard
           url = false, // URL encoding support @todo
           utf8 = true; // by default enable UTF-8 support encoding

         // public method for encoding
         this.encode = function(input) {
           var i, j, triplet,
             output = '',
             len = input.length;

           pad = pad || '=';
           input = (utf8) ? utf8Encode(input) : input;

           for (i = 0; i < len; i += 3) {
             triplet = (input.charCodeAt(i) << 16) | (i + 1 < len ? input.charCodeAt(i + 1) << 8 : 0) | (i + 2 < len ? input.charCodeAt(i + 2) : 0);
             for (j = 0; j < 4; j += 1) {
               if (i * 8 + j * 6 > len * 8) {
                 output += pad;
               } else {
                 output += tab.charAt((triplet >>> 6 * (3 - j)) & 0x3F);
               }
             }
           }
           return output;
         };

         // public method for decoding
         this.decode = function(input) {
           // var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
           var i, o1, o2, o3, h1, h2, h3, h4, bits, ac,
             dec = '',
             arr = [];
           if (!input) {
             return input;
           }

           i = ac = 0;
           input = input.replace(new RegExp('\\' + pad, 'gi'), ''); // use '='
           //input += '';

           do { // unpack four hexets into three octets using index points in b64
             h1 = tab.indexOf(input.charAt(i += 1));
             h2 = tab.indexOf(input.charAt(i += 1));
             h3 = tab.indexOf(input.charAt(i += 1));
             h4 = tab.indexOf(input.charAt(i += 1));

             bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

             o1 = bits >> 16 & 0xff;
             o2 = bits >> 8 & 0xff;
             o3 = bits & 0xff;
             ac += 1;

             if (h3 === 64) {
               arr[ac] = String.fromCharCode(o1);
             } else if (h4 === 64) {
               arr[ac] = String.fromCharCode(o1, o2);
             } else {
               arr[ac] = String.fromCharCode(o1, o2, o3);
             }
           } while (i < input.length);

           dec = arr.join('');
           dec = (utf8) ? utf8Decode(dec) : dec;

           return dec;
         };

         // set custom pad string
         this.setPad = function(str) {
           pad = str || pad;
           return this;
         };
         // set custom tab string characters
         this.setTab = function(str) {
           tab = str || tab;
           return this;
         };
         this.setUTF8 = function(bool) {
           if (typeof bool === 'boolean') {
             utf8 = bool;
           }
           return this;
         };
       },

       /**
        * CRC-32 calculation
        * @member Hashes
        * @method CRC32
        * @static
        * @param {String} str Input String
        * @return {String}
        */
       CRC32: function(str) {
         var crc = 0,
           x = 0,
           y = 0,
           table, i, iTop;
         str = utf8Encode(str);

         table = [
           '00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 ',
           '79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 ',
           '84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F ',
           '63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD ',
           'A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC ',
           '51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 ',
           'B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 ',
           '06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 ',
           'E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 ',
           '12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 ',
           'D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 ',
           '33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 ',
           'CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 ',
           '9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E ',
           '7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D ',
           '806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 ',
           '60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA ',
           'AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 ',
           '5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 ',
           'B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 ',
           '05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 ',
           'F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA ',
           '11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 ',
           'D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F ',
           '30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E ',
           'C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D'
         ].join('');

         crc = crc ^ (-1);
         for (i = 0, iTop = str.length; i < iTop; i += 1) {
           y = (crc ^ str.charCodeAt(i)) & 0xFF;
           x = '0x' + table.substr(y * 9, 8);
           crc = (crc >>> 8) ^ x;
         }
         // always return a positive number (that's what >>> 0 does)
         return (crc ^ (-1)) >>> 0;
       },
       /**
        * @member Hashes
        * @class MD5
        * @constructor
        * @param {Object} [config]
        *
        * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
        * Digest Algorithm, as defined in RFC 1321.
        * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
        * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
        * See <http://pajhome.org.uk/crypt/md5> for more infHashes.
        */
       MD5: function(options) {
         /**
          * Private config properties. You may need to tweak these to be compatible with
          * the server-side, but the defaults work in most cases.
          * See {@link Hashes.MD5#method-setUpperCase} and {@link Hashes.SHA1#method-setUpperCase}
          */
         var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false, // hexadecimal output case format. false - lowercase; true - uppercase
           b64pad = (options && typeof options.pad === 'string') ? options.pda : '=', // base-64 pad character. Defaults to '=' for strict RFC compliance
           utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true; // enable/disable utf8 encoding

         // privileged (public) methods
         this.hex = function(s) {
           return rstr2hex(rstr(s, utf8), hexcase);
         };
         this.b64 = function(s) {
           return rstr2b64(rstr(s), b64pad);
         };
         this.any = function(s, e) {
           return rstr2any(rstr(s, utf8), e);
         };
         this.raw = function(s) {
           return rstr(s, utf8);
         };
         this.hex_hmac = function(k, d) {
           return rstr2hex(rstr_hmac(k, d), hexcase);
         };
         this.b64_hmac = function(k, d) {
           return rstr2b64(rstr_hmac(k, d), b64pad);
         };
         this.any_hmac = function(k, d, e) {
           return rstr2any(rstr_hmac(k, d), e);
         };
         /**
          * Perform a simple self-test to see if the VM is working
          * @return {String} Hexadecimal hash sample
          */
         this.vm_test = function() {
           return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
         };
         /**
          * Enable/disable uppercase hexadecimal returned string
          * @param {Boolean}
          * @return {Object} this
          */
         this.setUpperCase = function(a) {
           if (typeof a === 'boolean') {
             hexcase = a;
           }
           return this;
         };
         /**
          * Defines a base64 pad string
          * @param {String} Pad
          * @return {Object} this
          */
         this.setPad = function(a) {
           b64pad = a || b64pad;
           return this;
         };
         /**
          * Defines a base64 pad string
          * @param {Boolean}
          * @return {Object} [this]
          */
         this.setUTF8 = function(a) {
           if (typeof a === 'boolean') {
             utf8 = a;
           }
           return this;
         };

         // private methods

         /**
          * Calculate the MD5 of a raw string
          */

         function rstr(s) {
           s = (utf8) ? utf8Encode(s) : s;
           return binl2rstr(binl(rstr2binl(s), s.length * 8));
         }

         /**
          * Calculate the HMAC-MD5, of a key and some data (raw strings)
          */

         function rstr_hmac(key, data) {
           var bkey, ipad, opad, hash, i;

           key = (utf8) ? utf8Encode(key) : key;
           data = (utf8) ? utf8Encode(data) : data;
           bkey = rstr2binl(key);
           if (bkey.length > 16) {
             bkey = binl(bkey, key.length * 8);
           }

           ipad = Array(16), opad = Array(16);
           for (i = 0; i < 16; i += 1) {
             ipad[i] = bkey[i] ^ 0x36363636;
             opad[i] = bkey[i] ^ 0x5C5C5C5C;
           }
           hash = binl(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
           return binl2rstr(binl(opad.concat(hash), 512 + 128));
         }

         /**
          * Calculate the MD5 of an array of little-endian words, and a bit length.
          */

         function binl(x, len) {
           var i, olda, oldb, oldc, oldd,
             a = 1732584193,
             b = -271733879,
             c = -1732584194,
             d = 271733878;

           /* append padding */
           x[len >> 5] |= 0x80 << ((len) % 32);
           x[(((len + 64) >>> 9) << 4) + 14] = len;

           for (i = 0; i < x.length; i += 16) {
             olda = a;
             oldb = b;
             oldc = c;
             oldd = d;

             a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
             d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
             c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
             b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
             a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
             d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
             c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
             b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
             a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
             d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
             c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
             b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
             a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
             d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
             c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
             b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

             a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
             d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
             c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
             b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
             a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
             d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
             c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
             b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
             a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
             d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
             c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
             b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
             a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
             d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
             c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
             b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

             a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
             d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
             c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
             b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
             a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
             d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
             c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
             b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
             a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
             d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
             c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
             b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
             a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
             d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
             c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
             b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

             a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
             d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
             c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
             b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
             a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
             d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
             c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
             b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
             a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
             d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
             c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
             b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
             a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
             d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
             c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
             b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

             a = safe_add(a, olda);
             b = safe_add(b, oldb);
             c = safe_add(c, oldc);
             d = safe_add(d, oldd);
           }
           return Array(a, b, c, d);
         }

         /**
          * These functions implement the four basic operations the algorithm uses.
          */

         function md5_cmn(q, a, b, x, s, t) {
           return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
         }

         function md5_ff(a, b, c, d, x, s, t) {
           return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
         }

         function md5_gg(a, b, c, d, x, s, t) {
           return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
         }

         function md5_hh(a, b, c, d, x, s, t) {
           return md5_cmn(b ^ c ^ d, a, b, x, s, t);
         }

         function md5_ii(a, b, c, d, x, s, t) {
           return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
         }
       },
       /**
        * @member Hashes
        * @class Hashes.SHA1
        * @param {Object} [config]
        * @constructor
        *
        * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined in FIPS 180-1
        * Version 2.2 Copyright Paul Johnston 2000 - 2009.
        * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
        * See http://pajhome.org.uk/crypt/md5 for details.
        */
       SHA1: function(options) {
         /**
          * Private config properties. You may need to tweak these to be compatible with
          * the server-side, but the defaults work in most cases.
          * See {@link Hashes.MD5#method-setUpperCase} and {@link Hashes.SHA1#method-setUpperCase}
          */
         var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false, // hexadecimal output case format. false - lowercase; true - uppercase
           b64pad = (options && typeof options.pad === 'string') ? options.pda : '=', // base-64 pad character. Defaults to '=' for strict RFC compliance
           utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true; // enable/disable utf8 encoding

         // public methods
         this.hex = function(s) {
           return rstr2hex(rstr(s, utf8), hexcase);
         };
         this.b64 = function(s) {
           return rstr2b64(rstr(s, utf8), b64pad);
         };
         this.any = function(s, e) {
           return rstr2any(rstr(s, utf8), e);
         };
         this.raw = function(s) {
           return rstr(s, utf8);
         };
         this.hex_hmac = function(k, d) {
           return rstr2hex(rstr_hmac(k, d));
         };
         this.b64_hmac = function(k, d) {
           return rstr2b64(rstr_hmac(k, d), b64pad);
         };
         this.any_hmac = function(k, d, e) {
           return rstr2any(rstr_hmac(k, d), e);
         };
         /**
          * Perform a simple self-test to see if the VM is working
          * @return {String} Hexadecimal hash sample
          * @public
          */
         this.vm_test = function() {
           return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
         };
         /**
          * @description Enable/disable uppercase hexadecimal returned string
          * @param {boolean}
          * @return {Object} this
          * @public
          */
         this.setUpperCase = function(a) {
           if (typeof a === 'boolean') {
             hexcase = a;
           }
           return this;
         };
         /**
          * @description Defines a base64 pad string
          * @param {string} Pad
          * @return {Object} this
          * @public
          */
         this.setPad = function(a) {
           b64pad = a || b64pad;
           return this;
         };
         /**
          * @description Defines a base64 pad string
          * @param {boolean}
          * @return {Object} this
          * @public
          */
         this.setUTF8 = function(a) {
           if (typeof a === 'boolean') {
             utf8 = a;
           }
           return this;
         };

         // private methods

         /**
          * Calculate the SHA-512 of a raw string
          */

         function rstr(s) {
           s = (utf8) ? utf8Encode(s) : s;
           return binb2rstr(binb(rstr2binb(s), s.length * 8));
         }

         /**
          * Calculate the HMAC-SHA1 of a key and some data (raw strings)
          */

         function rstr_hmac(key, data) {
           var bkey, ipad, opad, i, hash;
           key = (utf8) ? utf8Encode(key) : key;
           data = (utf8) ? utf8Encode(data) : data;
           bkey = rstr2binb(key);

           if (bkey.length > 16) {
             bkey = binb(bkey, key.length * 8);
           }
           ipad = Array(16), opad = Array(16);
           for (i = 0; i < 16; i += 1) {
             ipad[i] = bkey[i] ^ 0x36363636;
             opad[i] = bkey[i] ^ 0x5C5C5C5C;
           }
           hash = binb(ipad.concat(rstr2binb(data)), 512 + data.length * 8);
           return binb2rstr(binb(opad.concat(hash), 512 + 160));
         }

         /**
          * Calculate the SHA-1 of an array of big-endian words, and a bit length
          */

         function binb(x, len) {
           var i, j, t, olda, oldb, oldc, oldd, olde,
             w = Array(80),
             a = 1732584193,
             b = -271733879,
             c = -1732584194,
             d = 271733878,
             e = -1009589776;

           /* append padding */
           x[len >> 5] |= 0x80 << (24 - len % 32);
           x[((len + 64 >> 9) << 4) + 15] = len;

           for (i = 0; i < x.length; i += 16) {
             olda = a,
             oldb = b;
             oldc = c;
             oldd = d;
             olde = e;

             for (j = 0; j < 80; j += 1) {
               if (j < 16) {
                 w[j] = x[i + j];
               } else {
                 w[j] = bit_rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
               }
               t = safe_add(safe_add(bit_rol(a, 5), sha1_ft(j, b, c, d)),
                 safe_add(safe_add(e, w[j]), sha1_kt(j)));
               e = d;
               d = c;
               c = bit_rol(b, 30);
               b = a;
               a = t;
             }

             a = safe_add(a, olda);
             b = safe_add(b, oldb);
             c = safe_add(c, oldc);
             d = safe_add(d, oldd);
             e = safe_add(e, olde);
           }
           return Array(a, b, c, d, e);
         }

         /**
          * Perform the appropriate triplet combination function for the current
          * iteration
          */

         function sha1_ft(t, b, c, d) {
           if (t < 20) {
             return (b & c) | ((~b) & d);
           }
           if (t < 40) {
             return b ^ c ^ d;
           }
           if (t < 60) {
             return (b & c) | (b & d) | (c & d);
           }
           return b ^ c ^ d;
         }

         /**
          * Determine the appropriate additive constant for the current iteration
          */

         function sha1_kt(t) {
           return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 :
             (t < 60) ? -1894007588 : -899497514;
         }
       },
       /**
        * @class Hashes.SHA256
        * @param {config}
        *
        * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined in FIPS 180-2
        * Version 2.2 Copyright Angel Marin, Paul Johnston 2000 - 2009.
        * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
        * See http://pajhome.org.uk/crypt/md5 for details.
        * Also http://anmar.eu.org/projects/jssha2/
        */
       SHA256: function(options) {
         /**
          * Private properties configuration variables. You may need to tweak these to be compatible with
          * the server-side, but the defaults work in most cases.
          * @see this.setUpperCase() method
          * @see this.setPad() method
          */
         var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false, // hexadecimal output case format. false - lowercase; true - uppercase  */
           b64pad = (options && typeof options.pad === 'string') ? options.pda : '=',
           /* base-64 pad character. Default '=' for strict RFC compliance   */
           utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true,
           /* enable/disable utf8 encoding */
           sha256_K;

         /* privileged (public) methods */
         this.hex = function(s) {
           return rstr2hex(rstr(s, utf8));
         };
         this.b64 = function(s) {
           return rstr2b64(rstr(s, utf8), b64pad);
         };
         this.any = function(s, e) {
           return rstr2any(rstr(s, utf8), e);
         };
         this.raw = function(s) {
           return rstr(s, utf8);
         };
         this.hex_hmac = function(k, d) {
           return rstr2hex(rstr_hmac(k, d));
         };
         this.b64_hmac = function(k, d) {
           return rstr2b64(rstr_hmac(k, d), b64pad);
         };
         this.any_hmac = function(k, d, e) {
           return rstr2any(rstr_hmac(k, d), e);
         };
         /**
          * Perform a simple self-test to see if the VM is working
          * @return {String} Hexadecimal hash sample
          * @public
          */
         this.vm_test = function() {
           return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
         };
         /**
          * Enable/disable uppercase hexadecimal returned string
          * @param {boolean}
          * @return {Object} this
          * @public
          */
         this.setUpperCase = function(a) {
           if (typeof a === 'boolean') {
             hexcase = a;
           }
           return this;
         };
         /**
          * @description Defines a base64 pad string
          * @param {string} Pad
          * @return {Object} this
          * @public
          */
         this.setPad = function(a) {
           b64pad = a || b64pad;
           return this;
         };
         /**
          * Defines a base64 pad string
          * @param {boolean}
          * @return {Object} this
          * @public
          */
         this.setUTF8 = function(a) {
           if (typeof a === 'boolean') {
             utf8 = a;
           }
           return this;
         };

         // private methods

         /**
          * Calculate the SHA-512 of a raw string
          */

         function rstr(s, utf8) {
           s = (utf8) ? utf8Encode(s) : s;
           return binb2rstr(binb(rstr2binb(s), s.length * 8));
         }

         /**
          * Calculate the HMAC-sha256 of a key and some data (raw strings)
          */

         function rstr_hmac(key, data) {
           key = (utf8) ? utf8Encode(key) : key;
           data = (utf8) ? utf8Encode(data) : data;
           var hash, i = 0,
             bkey = rstr2binb(key),
             ipad = Array(16),
             opad = Array(16);

           if (bkey.length > 16) {
             bkey = binb(bkey, key.length * 8);
           }

           for (; i < 16; i += 1) {
             ipad[i] = bkey[i] ^ 0x36363636;
             opad[i] = bkey[i] ^ 0x5C5C5C5C;
           }

           hash = binb(ipad.concat(rstr2binb(data)), 512 + data.length * 8);
           return binb2rstr(binb(opad.concat(hash), 512 + 256));
         }

         /*
          * Main sha256 function, with its support functions
          */

         function sha256_S(X, n) {
           return (X >>> n) | (X << (32 - n));
         }

         function sha256_R(X, n) {
           return (X >>> n);
         }

         function sha256_Ch(x, y, z) {
           return ((x & y) ^ ((~x) & z));
         }

         function sha256_Maj(x, y, z) {
           return ((x & y) ^ (x & z) ^ (y & z));
         }

         function sha256_Sigma0256(x) {
           return (sha256_S(x, 2) ^ sha256_S(x, 13) ^ sha256_S(x, 22));
         }

         function sha256_Sigma1256(x) {
           return (sha256_S(x, 6) ^ sha256_S(x, 11) ^ sha256_S(x, 25));
         }

         function sha256_Gamma0256(x) {
           return (sha256_S(x, 7) ^ sha256_S(x, 18) ^ sha256_R(x, 3));
         }

         function sha256_Gamma1256(x) {
           return (sha256_S(x, 17) ^ sha256_S(x, 19) ^ sha256_R(x, 10));
         }

         function sha256_Sigma0512(x) {
           return (sha256_S(x, 28) ^ sha256_S(x, 34) ^ sha256_S(x, 39));
         }

         function sha256_Sigma1512(x) {
           return (sha256_S(x, 14) ^ sha256_S(x, 18) ^ sha256_S(x, 41));
         }

         function sha256_Gamma0512(x) {
           return (sha256_S(x, 1) ^ sha256_S(x, 8) ^ sha256_R(x, 7));
         }

         function sha256_Gamma1512(x) {
           return (sha256_S(x, 19) ^ sha256_S(x, 61) ^ sha256_R(x, 6));
         }

         sha256_K = [
           1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993, -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
           1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
           264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
           113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
           1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885, -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
           430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
           1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872, -1866530822, -1538233109, -1090935817, -965641998
         ];

         function binb(m, l) {
           var HASH = [1779033703, -1150833019, 1013904242, -1521486534,
             1359893119, -1694144372, 528734635, 1541459225
           ];
           var W = new Array(64);
           var a, b, c, d, e, f, g, h;
           var i, j, T1, T2;

           /* append padding */
           m[l >> 5] |= 0x80 << (24 - l % 32);
           m[((l + 64 >> 9) << 4) + 15] = l;

           for (i = 0; i < m.length; i += 16) {
             a = HASH[0];
             b = HASH[1];
             c = HASH[2];
             d = HASH[3];
             e = HASH[4];
             f = HASH[5];
             g = HASH[6];
             h = HASH[7];

             for (j = 0; j < 64; j += 1) {
               if (j < 16) {
                 W[j] = m[j + i];
               } else {
                 W[j] = safe_add(safe_add(safe_add(sha256_Gamma1256(W[j - 2]), W[j - 7]),
                   sha256_Gamma0256(W[j - 15])), W[j - 16]);
               }

               T1 = safe_add(safe_add(safe_add(safe_add(h, sha256_Sigma1256(e)), sha256_Ch(e, f, g)),
                 sha256_K[j]), W[j]);
               T2 = safe_add(sha256_Sigma0256(a), sha256_Maj(a, b, c));
               h = g;
               g = f;
               f = e;
               e = safe_add(d, T1);
               d = c;
               c = b;
               b = a;
               a = safe_add(T1, T2);
             }

             HASH[0] = safe_add(a, HASH[0]);
             HASH[1] = safe_add(b, HASH[1]);
             HASH[2] = safe_add(c, HASH[2]);
             HASH[3] = safe_add(d, HASH[3]);
             HASH[4] = safe_add(e, HASH[4]);
             HASH[5] = safe_add(f, HASH[5]);
             HASH[6] = safe_add(g, HASH[6]);
             HASH[7] = safe_add(h, HASH[7]);
           }
           return HASH;
         }

       },

       /**
        * @class Hashes.SHA512
        * @param {config}
        *
        * A JavaScript implementation of the Secure Hash Algorithm, SHA-512, as defined in FIPS 180-2
        * Version 2.2 Copyright Anonymous Contributor, Paul Johnston 2000 - 2009.
        * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
        * See http://pajhome.org.uk/crypt/md5 for details.
        */
       SHA512: function(options) {
         /**
          * Private properties configuration variables. You may need to tweak these to be compatible with
          * the server-side, but the defaults work in most cases.
          * @see this.setUpperCase() method
          * @see this.setPad() method
          */
         var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false,
           /* hexadecimal output case format. false - lowercase; true - uppercase  */
           b64pad = (options && typeof options.pad === 'string') ? options.pda : '=',
           /* base-64 pad character. Default '=' for strict RFC compliance   */
           utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true,
           /* enable/disable utf8 encoding */
           sha512_k;

         /* privileged (public) methods */
         this.hex = function(s) {
           return rstr2hex(rstr(s));
         };
         this.b64 = function(s) {
           return rstr2b64(rstr(s), b64pad);
         };
         this.any = function(s, e) {
           return rstr2any(rstr(s), e);
         };
         this.raw = function(s) {
           return rstr(s, utf8);
         };
         this.hex_hmac = function(k, d) {
           return rstr2hex(rstr_hmac(k, d));
         };
         this.b64_hmac = function(k, d) {
           return rstr2b64(rstr_hmac(k, d), b64pad);
         };
         this.any_hmac = function(k, d, e) {
           return rstr2any(rstr_hmac(k, d), e);
         };
         /**
          * Perform a simple self-test to see if the VM is working
          * @return {String} Hexadecimal hash sample
          * @public
          */
         this.vm_test = function() {
           return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
         };
         /**
          * @description Enable/disable uppercase hexadecimal returned string
          * @param {boolean}
          * @return {Object} this
          * @public
          */
         this.setUpperCase = function(a) {
           if (typeof a === 'boolean') {
             hexcase = a;
           }
           return this;
         };
         /**
          * @description Defines a base64 pad string
          * @param {string} Pad
          * @return {Object} this
          * @public
          */
         this.setPad = function(a) {
           b64pad = a || b64pad;
           return this;
         };
         /**
          * @description Defines a base64 pad string
          * @param {boolean}
          * @return {Object} this
          * @public
          */
         this.setUTF8 = function(a) {
           if (typeof a === 'boolean') {
             utf8 = a;
           }
           return this;
         };

         /* private methods */

         /**
          * Calculate the SHA-512 of a raw string
          */

         function rstr(s) {
           s = (utf8) ? utf8Encode(s) : s;
           return binb2rstr(binb(rstr2binb(s), s.length * 8));
         }
         /*
          * Calculate the HMAC-SHA-512 of a key and some data (raw strings)
          */

         function rstr_hmac(key, data) {
           key = (utf8) ? utf8Encode(key) : key;
           data = (utf8) ? utf8Encode(data) : data;

           var hash, i = 0,
             bkey = rstr2binb(key),
             ipad = Array(32),
             opad = Array(32);

           if (bkey.length > 32) {
             bkey = binb(bkey, key.length * 8);
           }

           for (; i < 32; i += 1) {
             ipad[i] = bkey[i] ^ 0x36363636;
             opad[i] = bkey[i] ^ 0x5C5C5C5C;
           }

           hash = binb(ipad.concat(rstr2binb(data)), 1024 + data.length * 8);
           return binb2rstr(binb(opad.concat(hash), 1024 + 512));
         }

         /**
          * Calculate the SHA-512 of an array of big-endian dwords, and a bit length
          */

         function binb(x, len) {
           var j, i, l,
             W = new Array(80),
             hash = new Array(16),
             //Initial hash values
             H = [
               new int64(0x6a09e667, -205731576),
               new int64(-1150833019, -2067093701),
               new int64(0x3c6ef372, -23791573),
               new int64(-1521486534, 0x5f1d36f1),
               new int64(0x510e527f, -1377402159),
               new int64(-1694144372, 0x2b3e6c1f),
               new int64(0x1f83d9ab, -79577749),
               new int64(0x5be0cd19, 0x137e2179)
             ],
             T1 = new int64(0, 0),
             T2 = new int64(0, 0),
             a = new int64(0, 0),
             b = new int64(0, 0),
             c = new int64(0, 0),
             d = new int64(0, 0),
             e = new int64(0, 0),
             f = new int64(0, 0),
             g = new int64(0, 0),
             h = new int64(0, 0),
             //Temporary variables not specified by the document
             s0 = new int64(0, 0),
             s1 = new int64(0, 0),
             Ch = new int64(0, 0),
             Maj = new int64(0, 0),
             r1 = new int64(0, 0),
             r2 = new int64(0, 0),
             r3 = new int64(0, 0);

           if (sha512_k === undefined) {
             //SHA512 constants
             sha512_k = [
               new int64(0x428a2f98, -685199838), new int64(0x71374491, 0x23ef65cd),
               new int64(-1245643825, -330482897), new int64(-373957723, -2121671748),
               new int64(0x3956c25b, -213338824), new int64(0x59f111f1, -1241133031),
               new int64(-1841331548, -1357295717), new int64(-1424204075, -630357736),
               new int64(-670586216, -1560083902), new int64(0x12835b01, 0x45706fbe),
               new int64(0x243185be, 0x4ee4b28c), new int64(0x550c7dc3, -704662302),
               new int64(0x72be5d74, -226784913), new int64(-2132889090, 0x3b1696b1),
               new int64(-1680079193, 0x25c71235), new int64(-1046744716, -815192428),
               new int64(-459576895, -1628353838), new int64(-272742522, 0x384f25e3),
               new int64(0xfc19dc6, -1953704523), new int64(0x240ca1cc, 0x77ac9c65),
               new int64(0x2de92c6f, 0x592b0275), new int64(0x4a7484aa, 0x6ea6e483),
               new int64(0x5cb0a9dc, -1119749164), new int64(0x76f988da, -2096016459),
               new int64(-1740746414, -295247957), new int64(-1473132947, 0x2db43210),
               new int64(-1341970488, -1728372417), new int64(-1084653625, -1091629340),
               new int64(-958395405, 0x3da88fc2), new int64(-710438585, -1828018395),
               new int64(0x6ca6351, -536640913), new int64(0x14292967, 0xa0e6e70),
               new int64(0x27b70a85, 0x46d22ffc), new int64(0x2e1b2138, 0x5c26c926),
               new int64(0x4d2c6dfc, 0x5ac42aed), new int64(0x53380d13, -1651133473),
               new int64(0x650a7354, -1951439906), new int64(0x766a0abb, 0x3c77b2a8),
               new int64(-2117940946, 0x47edaee6), new int64(-1838011259, 0x1482353b),
               new int64(-1564481375, 0x4cf10364), new int64(-1474664885, -1136513023),
               new int64(-1035236496, -789014639), new int64(-949202525, 0x654be30),
               new int64(-778901479, -688958952), new int64(-694614492, 0x5565a910),
               new int64(-200395387, 0x5771202a), new int64(0x106aa070, 0x32bbd1b8),
               new int64(0x19a4c116, -1194143544), new int64(0x1e376c08, 0x5141ab53),
               new int64(0x2748774c, -544281703), new int64(0x34b0bcb5, -509917016),
               new int64(0x391c0cb3, -976659869), new int64(0x4ed8aa4a, -482243893),
               new int64(0x5b9cca4f, 0x7763e373), new int64(0x682e6ff3, -692930397),
               new int64(0x748f82ee, 0x5defb2fc), new int64(0x78a5636f, 0x43172f60),
               new int64(-2067236844, -1578062990), new int64(-1933114872, 0x1a6439ec),
               new int64(-1866530822, 0x23631e28), new int64(-1538233109, -561857047),
               new int64(-1090935817, -1295615723), new int64(-965641998, -479046869),
               new int64(-903397682, -366583396), new int64(-779700025, 0x21c0c207),
               new int64(-354779690, -840897762), new int64(-176337025, -294727304),
               new int64(0x6f067aa, 0x72176fba), new int64(0xa637dc5, -1563912026),
               new int64(0x113f9804, -1090974290), new int64(0x1b710b35, 0x131c471b),
               new int64(0x28db77f5, 0x23047d84), new int64(0x32caab7b, 0x40c72493),
               new int64(0x3c9ebe0a, 0x15c9bebc), new int64(0x431d67c4, -1676669620),
               new int64(0x4cc5d4be, -885112138), new int64(0x597f299c, -60457430),
               new int64(0x5fcb6fab, 0x3ad6faec), new int64(0x6c44198c, 0x4a475817)
             ];
           }

           for (i = 0; i < 80; i += 1) {
             W[i] = new int64(0, 0);
           }

           // append padding to the source string. The format is described in the FIPS.
           x[len >> 5] |= 0x80 << (24 - (len & 0x1f));
           x[((len + 128 >> 10) << 5) + 31] = len;
           l = x.length;
           for (i = 0; i < l; i += 32) { //32 dwords is the block size
             int64copy(a, H[0]);
             int64copy(b, H[1]);
             int64copy(c, H[2]);
             int64copy(d, H[3]);
             int64copy(e, H[4]);
             int64copy(f, H[5]);
             int64copy(g, H[6]);
             int64copy(h, H[7]);

             for (j = 0; j < 16; j += 1) {
               W[j].h = x[i + 2 * j];
               W[j].l = x[i + 2 * j + 1];
             }

             for (j = 16; j < 80; j += 1) {
               //sigma1
               int64rrot(r1, W[j - 2], 19);
               int64revrrot(r2, W[j - 2], 29);
               int64shr(r3, W[j - 2], 6);
               s1.l = r1.l ^ r2.l ^ r3.l;
               s1.h = r1.h ^ r2.h ^ r3.h;
               //sigma0
               int64rrot(r1, W[j - 15], 1);
               int64rrot(r2, W[j - 15], 8);
               int64shr(r3, W[j - 15], 7);
               s0.l = r1.l ^ r2.l ^ r3.l;
               s0.h = r1.h ^ r2.h ^ r3.h;

               int64add4(W[j], s1, W[j - 7], s0, W[j - 16]);
             }

             for (j = 0; j < 80; j += 1) {
               //Ch
               Ch.l = (e.l & f.l) ^ (~e.l & g.l);
               Ch.h = (e.h & f.h) ^ (~e.h & g.h);

               //Sigma1
               int64rrot(r1, e, 14);
               int64rrot(r2, e, 18);
               int64revrrot(r3, e, 9);
               s1.l = r1.l ^ r2.l ^ r3.l;
               s1.h = r1.h ^ r2.h ^ r3.h;

               //Sigma0
               int64rrot(r1, a, 28);
               int64revrrot(r2, a, 2);
               int64revrrot(r3, a, 7);
               s0.l = r1.l ^ r2.l ^ r3.l;
               s0.h = r1.h ^ r2.h ^ r3.h;

               //Maj
               Maj.l = (a.l & b.l) ^ (a.l & c.l) ^ (b.l & c.l);
               Maj.h = (a.h & b.h) ^ (a.h & c.h) ^ (b.h & c.h);

               int64add5(T1, h, s1, Ch, sha512_k[j], W[j]);
               int64add(T2, s0, Maj);

               int64copy(h, g);
               int64copy(g, f);
               int64copy(f, e);
               int64add(e, d, T1);
               int64copy(d, c);
               int64copy(c, b);
               int64copy(b, a);
               int64add(a, T1, T2);
             }
             int64add(H[0], H[0], a);
             int64add(H[1], H[1], b);
             int64add(H[2], H[2], c);
             int64add(H[3], H[3], d);
             int64add(H[4], H[4], e);
             int64add(H[5], H[5], f);
             int64add(H[6], H[6], g);
             int64add(H[7], H[7], h);
           }

           //represent the hash as an array of 32-bit dwords
           for (i = 0; i < 8; i += 1) {
             hash[2 * i] = H[i].h;
             hash[2 * i + 1] = H[i].l;
           }
           return hash;
         }

         //A constructor for 64-bit numbers

         function int64(h, l) {
           this.h = h;
           this.l = l;
           //this.toString = int64toString;
         }

         //Copies src into dst, assuming both are 64-bit numbers

         function int64copy(dst, src) {
           dst.h = src.h;
           dst.l = src.l;
         }

         //Right-rotates a 64-bit number by shift
         //Won't handle cases of shift>=32
         //The function revrrot() is for that

         function int64rrot(dst, x, shift) {
           dst.l = (x.l >>> shift) | (x.h << (32 - shift));
           dst.h = (x.h >>> shift) | (x.l << (32 - shift));
         }

         //Reverses the dwords of the source and then rotates right by shift.
         //This is equivalent to rotation by 32+shift

         function int64revrrot(dst, x, shift) {
           dst.l = (x.h >>> shift) | (x.l << (32 - shift));
           dst.h = (x.l >>> shift) | (x.h << (32 - shift));
         }

         //Bitwise-shifts right a 64-bit number by shift
         //Won't handle shift>=32, but it's never needed in SHA512

         function int64shr(dst, x, shift) {
           dst.l = (x.l >>> shift) | (x.h << (32 - shift));
           dst.h = (x.h >>> shift);
         }

         //Adds two 64-bit numbers
         //Like the original implementation, does not rely on 32-bit operations

         function int64add(dst, x, y) {
           var w0 = (x.l & 0xffff) + (y.l & 0xffff);
           var w1 = (x.l >>> 16) + (y.l >>> 16) + (w0 >>> 16);
           var w2 = (x.h & 0xffff) + (y.h & 0xffff) + (w1 >>> 16);
           var w3 = (x.h >>> 16) + (y.h >>> 16) + (w2 >>> 16);
           dst.l = (w0 & 0xffff) | (w1 << 16);
           dst.h = (w2 & 0xffff) | (w3 << 16);
         }

         //Same, except with 4 addends. Works faster than adding them one by one.

         function int64add4(dst, a, b, c, d) {
           var w0 = (a.l & 0xffff) + (b.l & 0xffff) + (c.l & 0xffff) + (d.l & 0xffff);
           var w1 = (a.l >>> 16) + (b.l >>> 16) + (c.l >>> 16) + (d.l >>> 16) + (w0 >>> 16);
           var w2 = (a.h & 0xffff) + (b.h & 0xffff) + (c.h & 0xffff) + (d.h & 0xffff) + (w1 >>> 16);
           var w3 = (a.h >>> 16) + (b.h >>> 16) + (c.h >>> 16) + (d.h >>> 16) + (w2 >>> 16);
           dst.l = (w0 & 0xffff) | (w1 << 16);
           dst.h = (w2 & 0xffff) | (w3 << 16);
         }

         //Same, except with 5 addends

         function int64add5(dst, a, b, c, d, e) {
           var w0 = (a.l & 0xffff) + (b.l & 0xffff) + (c.l & 0xffff) + (d.l & 0xffff) + (e.l & 0xffff),
             w1 = (a.l >>> 16) + (b.l >>> 16) + (c.l >>> 16) + (d.l >>> 16) + (e.l >>> 16) + (w0 >>> 16),
             w2 = (a.h & 0xffff) + (b.h & 0xffff) + (c.h & 0xffff) + (d.h & 0xffff) + (e.h & 0xffff) + (w1 >>> 16),
             w3 = (a.h >>> 16) + (b.h >>> 16) + (c.h >>> 16) + (d.h >>> 16) + (e.h >>> 16) + (w2 >>> 16);
           dst.l = (w0 & 0xffff) | (w1 << 16);
           dst.h = (w2 & 0xffff) | (w3 << 16);
         }
       },
       /**
        * @class Hashes.RMD160
        * @constructor
        * @param {Object} [config]
        *
        * A JavaScript implementation of the RIPEMD-160 Algorithm
        * Version 2.2 Copyright Jeremy Lin, Paul Johnston 2000 - 2009.
        * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
        * See http://pajhome.org.uk/crypt/md5 for details.
        * Also http://www.ocf.berkeley.edu/~jjlin/jsotp/
        */
       RMD160: function(options) {
         /**
          * Private properties configuration variables. You may need to tweak these to be compatible with
          * the server-side, but the defaults work in most cases.
          * @see this.setUpperCase() method
          * @see this.setPad() method
          */
         var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false,
           /* hexadecimal output case format. false - lowercase; true - uppercase  */
           b64pad = (options && typeof options.pad === 'string') ? options.pda : '=',
           /* base-64 pad character. Default '=' for strict RFC compliance   */
           utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true,
           /* enable/disable utf8 encoding */
           rmd160_r1 = [
             0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
             7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
             3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
             1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
             4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
           ],
           rmd160_r2 = [
             5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
             6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
             15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
             8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
             12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
           ],
           rmd160_s1 = [
             11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
             7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
             11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
             11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
             9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
           ],
           rmd160_s2 = [
             8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
             9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
             9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
             15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
             8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
           ];

         /* privileged (public) methods */
         this.hex = function(s) {
           return rstr2hex(rstr(s, utf8));
         };
         this.b64 = function(s) {
           return rstr2b64(rstr(s, utf8), b64pad);
         };
         this.any = function(s, e) {
           return rstr2any(rstr(s, utf8), e);
         };
         this.raw = function(s) {
           return rstr(s, utf8);
         };
         this.hex_hmac = function(k, d) {
           return rstr2hex(rstr_hmac(k, d));
         };
         this.b64_hmac = function(k, d) {
           return rstr2b64(rstr_hmac(k, d), b64pad);
         };
         this.any_hmac = function(k, d, e) {
           return rstr2any(rstr_hmac(k, d), e);
         };
         /**
          * Perform a simple self-test to see if the VM is working
          * @return {String} Hexadecimal hash sample
          * @public
          */
         this.vm_test = function() {
           return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
         };
         /**
          * @description Enable/disable uppercase hexadecimal returned string
          * @param {boolean}
          * @return {Object} this
          * @public
          */
         this.setUpperCase = function(a) {
           if (typeof a === 'boolean') {
             hexcase = a;
           }
           return this;
         };
         /**
          * @description Defines a base64 pad string
          * @param {string} Pad
          * @return {Object} this
          * @public
          */
         this.setPad = function(a) {
           if (typeof a !== 'undefined') {
             b64pad = a;
           }
           return this;
         };
         /**
          * @description Defines a base64 pad string
          * @param {boolean}
          * @return {Object} this
          * @public
          */
         this.setUTF8 = function(a) {
           if (typeof a === 'boolean') {
             utf8 = a;
           }
           return this;
         };

         /* private methods */

         /**
          * Calculate the rmd160 of a raw string
          */

         function rstr(s) {
           s = (utf8) ? utf8Encode(s) : s;
           return binl2rstr(binl(rstr2binl(s), s.length * 8));
         }

         /**
          * Calculate the HMAC-rmd160 of a key and some data (raw strings)
          */

         function rstr_hmac(key, data) {
           key = (utf8) ? utf8Encode(key) : key;
           data = (utf8) ? utf8Encode(data) : data;
           var i, hash,
             bkey = rstr2binl(key),
             ipad = Array(16),
             opad = Array(16);

           if (bkey.length > 16) {
             bkey = binl(bkey, key.length * 8);
           }

           for (i = 0; i < 16; i += 1) {
             ipad[i] = bkey[i] ^ 0x36363636;
             opad[i] = bkey[i] ^ 0x5C5C5C5C;
           }
           hash = binl(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
           return binl2rstr(binl(opad.concat(hash), 512 + 160));
         }

         /**
          * Convert an array of little-endian words to a string
          */

         function binl2rstr(input) {
           var i, output = '',
             l = input.length * 32;
           for (i = 0; i < l; i += 8) {
             output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
           }
           return output;
         }

         /**
          * Calculate the RIPE-MD160 of an array of little-endian words, and a bit length.
          */

         function binl(x, len) {
           var T, j, i, l,
             h0 = 0x67452301,
             h1 = 0xefcdab89,
             h2 = 0x98badcfe,
             h3 = 0x10325476,
             h4 = 0xc3d2e1f0,
             A1, B1, C1, D1, E1,
             A2, B2, C2, D2, E2;

           /* append padding */
           x[len >> 5] |= 0x80 << (len % 32);
           x[(((len + 64) >>> 9) << 4) + 14] = len;
           l = x.length;

           for (i = 0; i < l; i += 16) {
             A1 = A2 = h0;
             B1 = B2 = h1;
             C1 = C2 = h2;
             D1 = D2 = h3;
             E1 = E2 = h4;
             for (j = 0; j <= 79; j += 1) {
               T = safe_add(A1, rmd160_f(j, B1, C1, D1));
               T = safe_add(T, x[i + rmd160_r1[j]]);
               T = safe_add(T, rmd160_K1(j));
               T = safe_add(bit_rol(T, rmd160_s1[j]), E1);
               A1 = E1;
               E1 = D1;
               D1 = bit_rol(C1, 10);
               C1 = B1;
               B1 = T;
               T = safe_add(A2, rmd160_f(79 - j, B2, C2, D2));
               T = safe_add(T, x[i + rmd160_r2[j]]);
               T = safe_add(T, rmd160_K2(j));
               T = safe_add(bit_rol(T, rmd160_s2[j]), E2);
               A2 = E2;
               E2 = D2;
               D2 = bit_rol(C2, 10);
               C2 = B2;
               B2 = T;
             }

             T = safe_add(h1, safe_add(C1, D2));
             h1 = safe_add(h2, safe_add(D1, E2));
             h2 = safe_add(h3, safe_add(E1, A2));
             h3 = safe_add(h4, safe_add(A1, B2));
             h4 = safe_add(h0, safe_add(B1, C2));
             h0 = T;
           }
           return [h0, h1, h2, h3, h4];
         }

         // specific algorithm methods

         function rmd160_f(j, x, y, z) {
           return (0 <= j && j <= 15) ? (x ^ y ^ z) :
             (16 <= j && j <= 31) ? (x & y) | (~x & z) :
             (32 <= j && j <= 47) ? (x | ~y) ^ z :
             (48 <= j && j <= 63) ? (x & z) | (y & ~z) :
             (64 <= j && j <= 79) ? x ^ (y | ~z) :
             'rmd160_f: j out of range';
         }

         function rmd160_K1(j) {
           return (0 <= j && j <= 15) ? 0x00000000 :
             (16 <= j && j <= 31) ? 0x5a827999 :
             (32 <= j && j <= 47) ? 0x6ed9eba1 :
             (48 <= j && j <= 63) ? 0x8f1bbcdc :
             (64 <= j && j <= 79) ? 0xa953fd4e :
             'rmd160_K1: j out of range';
         }

         function rmd160_K2(j) {
           return (0 <= j && j <= 15) ? 0x50a28be6 :
             (16 <= j && j <= 31) ? 0x5c4dd124 :
             (32 <= j && j <= 47) ? 0x6d703ef3 :
             (48 <= j && j <= 63) ? 0x7a6d76e9 :
             (64 <= j && j <= 79) ? 0x00000000 :
             'rmd160_K2: j out of range';
         }
       }
     };

     // exposes Hashes
     (function(window, undefined) {
       var freeExports = false;
       if (typeof exports === 'object') {
         freeExports = exports;
         if (exports && typeof commonjsGlobal === 'object' && commonjsGlobal && commonjsGlobal === commonjsGlobal.global) {
           window = commonjsGlobal;
         }
       }

       if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
         // define as an anonymous module, so, through path mapping, it can be aliased
         define(function() {
           return Hashes;
         });
       } else if (freeExports) {
         // in Node.js or RingoJS v0.8.0+
         if (typeof module === 'object' && module && module.exports === freeExports) {
           module.exports = Hashes;
         }
         // in Narwhal or RingoJS v0.7.0-
         else {
           freeExports.Hashes = Hashes;
         }
       } else {
         // in a browser or Rhino
         window.Hashes = Hashes;
       }
     }(this));
   }()); // IIFE
   });

   var require$$1$3 = (hashes && typeof hashes === 'object' && 'default' in hashes ? hashes['default'] : hashes);

   var index$1 = createCommonjsModule(function (module) {
   'use strict';

   var hashes = require$$1$3,
       xtend = require$$0$1,
       sha1 = new hashes.SHA1();

   var ohauth = {};

   ohauth.qsString = function(obj) {
       return Object.keys(obj).sort().map(function(key) {
           return ohauth.percentEncode(key) + '=' +
               ohauth.percentEncode(obj[key]);
       }).join('&');
   };

   ohauth.stringQs = function(str) {
       return str.split('&').reduce(function(obj, pair){
           var parts = pair.split('=');
           obj[decodeURIComponent(parts[0])] = (null === parts[1]) ?
               '' : decodeURIComponent(parts[1]);
           return obj;
       }, {});
   };

   ohauth.rawxhr = function(method, url, data, headers, callback) {
       var xhr = new XMLHttpRequest(),
           twoHundred = /^20\d$/;
       xhr.onreadystatechange = function() {
           if (4 == xhr.readyState && 0 !== xhr.status) {
               if (twoHundred.test(xhr.status)) callback(null, xhr);
               else return callback(xhr, null);
           }
       };
       xhr.onerror = function(e) { return callback(e, null); };
       xhr.open(method, url, true);
       for (var h in headers) xhr.setRequestHeader(h, headers[h]);
       xhr.send(data);
   };

   ohauth.xhr = function(method, url, auth, data, options, callback) {
       var headers = (options && options.header) || {
           'Content-Type': 'application/x-www-form-urlencoded'
       };
       headers.Authorization = 'OAuth ' + ohauth.authHeader(auth);
       ohauth.rawxhr(method, url, data, headers, callback);
   };

   ohauth.nonce = function() {
       for (var o = ''; o.length < 6;) {
           o += '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'[Math.floor(Math.random() * 61)];
       }
       return o;
   };

   ohauth.authHeader = function(obj) {
       return Object.keys(obj).sort().map(function(key) {
           return encodeURIComponent(key) + '="' + encodeURIComponent(obj[key]) + '"';
       }).join(', ');
   };

   ohauth.timestamp = function() { return ~~((+new Date()) / 1000); };

   ohauth.percentEncode = function(s) {
       return encodeURIComponent(s)
           .replace(/\!/g, '%21').replace(/\'/g, '%27')
           .replace(/\*/g, '%2A').replace(/\(/g, '%28').replace(/\)/g, '%29');
   };

   ohauth.baseString = function(method, url, params) {
       if (params.oauth_signature) delete params.oauth_signature;
       return [
           method,
           ohauth.percentEncode(url),
           ohauth.percentEncode(ohauth.qsString(params))].join('&');
   };

   ohauth.signature = function(oauth_secret, token_secret, baseString) {
       return sha1.b64_hmac(
           ohauth.percentEncode(oauth_secret) + '&' +
           ohauth.percentEncode(token_secret),
           baseString);
   };

   /**
    * Takes an options object for configuration (consumer_key,
    * consumer_secret, version, signature_method, token) and returns a
    * function that generates the Authorization header for given data.
    *
    * The returned function takes these parameters:
    * - method: GET/POST/...
    * - uri: full URI with protocol, port, path and query string
    * - extra_params: any extra parameters (that are passed in the POST data),
    *   can be an object or a from-urlencoded string.
    *
    * Returned function returns full OAuth header with "OAuth" string in it.
    */

   ohauth.headerGenerator = function(options) {
       options = options || {};
       var consumer_key = options.consumer_key || '',
           consumer_secret = options.consumer_secret || '',
           signature_method = options.signature_method || 'HMAC-SHA1',
           version = options.version || '1.0',
           token = options.token || '';

       return function(method, uri, extra_params) {
           method = method.toUpperCase();
           if (typeof extra_params === 'string' && extra_params.length > 0) {
               extra_params = ohauth.stringQs(extra_params);
           }

           var uri_parts = uri.split('?', 2),
           base_uri = uri_parts[0];

           var query_params = uri_parts.length === 2 ?
               ohauth.stringQs(uri_parts[1]) : {};

           var oauth_params = {
               oauth_consumer_key: consumer_key,
               oauth_signature_method: signature_method,
               oauth_version: version,
               oauth_timestamp: ohauth.timestamp(),
               oauth_nonce: ohauth.nonce()
           };

           if (token) oauth_params.oauth_token = token;

           var all_params = xtend({}, oauth_params, query_params, extra_params),
               base_str = ohauth.baseString(method, base_uri, all_params);

           oauth_params.oauth_signature = ohauth.signature(consumer_secret, token, base_str);

           return 'OAuth ' + ohauth.authHeader(oauth_params);
       };
   };

   module.exports = ohauth;
   });

   var require$$2 = (index$1 && typeof index$1 === 'object' && 'default' in index$1 ? index$1['default'] : index$1);

   var index = createCommonjsModule(function (module) {
   'use strict';

   var ohauth = require$$2,
       xtend = require$$1,
       store = require$$0;

   // # osm-auth
   //
   // This code is only compatible with IE10+ because the [XDomainRequest](http://bit.ly/LfO7xo)
   // object, IE<10's idea of [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing),
   // does not support custom headers, which this uses everywhere.
   module.exports = function(o) {

       var oauth = {};

       // authenticated users will also have a request token secret, but it's
       // not used in transactions with the server
       oauth.authenticated = function() {
           return !!(token('oauth_token') && token('oauth_token_secret'));
       };

       oauth.logout = function() {
           token('oauth_token', '');
           token('oauth_token_secret', '');
           token('oauth_request_token_secret', '');
           return oauth;
       };

       // TODO: detect lack of click event
       oauth.authenticate = function(callback) {
           if (oauth.authenticated()) return callback();

           oauth.logout();

           // ## Getting a request token
           var params = timenonce(getAuth(o)),
               url = o.url + '/oauth/request_token';

           params.oauth_signature = ohauth.signature(
               o.oauth_secret, '',
               ohauth.baseString('POST', url, params));

           if (!o.singlepage) {
               // Create a 600x550 popup window in the center of the screen
               var w = 600, h = 550,
                   settings = [
                       ['width', w], ['height', h],
                       ['left', screen.width / 2 - w / 2],
                       ['top', screen.height / 2 - h / 2]].map(function(x) {
                           return x.join('=');
                       }).join(','),
                   popup = window.open('about:blank', 'oauth_window', settings);
           }

           // Request a request token. When this is complete, the popup
           // window is redirected to OSM's authorization page.
           ohauth.xhr('POST', url, params, null, {}, reqTokenDone);
           o.loading();

           function reqTokenDone(err, xhr) {
               o.done();
               if (err) return callback(err);
               var resp = ohauth.stringQs(xhr.response);
               token('oauth_request_token_secret', resp.oauth_token_secret);
               var authorize_url = o.url + '/oauth/authorize?' + ohauth.qsString({
                   oauth_token: resp.oauth_token,
                   oauth_callback: location.href.replace('index.html', '')
                       .replace(/#.*/, '').replace(location.search, '') + o.landing
               });

               if (o.singlepage) {
                   location.href = authorize_url;
               } else {
                   popup.location = authorize_url;
               }
           }

           // Called by a function in a landing page, in the popup window. The
           // window closes itself.
           window.authComplete = function(token) {
               var oauth_token = ohauth.stringQs(token.split('?')[1]);
               get_access_token(oauth_token.oauth_token);
               delete window.authComplete;
           };

           // ## Getting an request token
           //
           // At this point we have an `oauth_token`, brought in from a function
           // call on a landing page popup.
           function get_access_token(oauth_token) {
               var url = o.url + '/oauth/access_token',
                   params = timenonce(getAuth(o)),
                   request_token_secret = token('oauth_request_token_secret');
               params.oauth_token = oauth_token;
               params.oauth_signature = ohauth.signature(
                   o.oauth_secret,
                   request_token_secret,
                   ohauth.baseString('POST', url, params));

               // ## Getting an access token
               //
               // The final token required for authentication. At this point
               // we have a `request token secret`
               ohauth.xhr('POST', url, params, null, {}, accessTokenDone);
               o.loading();
           }

           function accessTokenDone(err, xhr) {
               o.done();
               if (err) return callback(err);
               var access_token = ohauth.stringQs(xhr.response);
               token('oauth_token', access_token.oauth_token);
               token('oauth_token_secret', access_token.oauth_token_secret);
               callback(null, oauth);
           }
       };

       oauth.bootstrapToken = function(oauth_token, callback) {
           // ## Getting an request token
           // At this point we have an `oauth_token`, brought in from a function
           // call on a landing page popup.
           function get_access_token(oauth_token) {
               var url = o.url + '/oauth/access_token',
                   params = timenonce(getAuth(o)),
                   request_token_secret = token('oauth_request_token_secret');
               params.oauth_token = oauth_token;
               params.oauth_signature = ohauth.signature(
                   o.oauth_secret,
                   request_token_secret,
                   ohauth.baseString('POST', url, params));

               // ## Getting an access token
               // The final token required for authentication. At this point
               // we have a `request token secret`
               ohauth.xhr('POST', url, params, null, {}, accessTokenDone);
               o.loading();
           }

           function accessTokenDone(err, xhr) {
               o.done();
               if (err) return callback(err);
               var access_token = ohauth.stringQs(xhr.response);
               token('oauth_token', access_token.oauth_token);
               token('oauth_token_secret', access_token.oauth_token_secret);
               callback(null, oauth);
           }

           get_access_token(oauth_token);
       };

       // # xhr
       //
       // A single XMLHttpRequest wrapper that does authenticated calls if the
       // user has logged in.
       oauth.xhr = function(options, callback) {
           if (!oauth.authenticated()) {
               if (o.auto) return oauth.authenticate(run);
               else return callback('not authenticated', null);
           } else return run();

           function run() {
               var params = timenonce(getAuth(o)),
                   oauth_token_secret = token('oauth_token_secret');
               var url = (options.prefix !== false) ? o.url + options.path : options.path;

               // https://tools.ietf.org/html/rfc5849#section-3.4.1.3.1
               if ((!options.options || !options.options.header ||
                   options.options.header['Content-Type'] === 'application/x-www-form-urlencoded') &&
                   options.content) {
                   params = xtend(params, ohauth.stringQs(options.content));
               }

               params.oauth_token = token('oauth_token');
               params.oauth_signature = ohauth.signature(
                   o.oauth_secret,
                   oauth_token_secret,
                   ohauth.baseString(options.method, url, params));

               ohauth.xhr(options.method,
                   url, params, options.content, options.options, done);
           }

           function done(err, xhr) {
               if (err) return callback(err);
               else if (xhr.responseXML) return callback(err, xhr.responseXML);
               else return callback(err, xhr.response);
           }
       };

       // pre-authorize this object, if we can just get a token and token_secret
       // from the start
       oauth.preauth = function(c) {
           if (!c) return;
           if (c.oauth_token) token('oauth_token', c.oauth_token);
           if (c.oauth_token_secret) token('oauth_token_secret', c.oauth_token_secret);
           return oauth;
       };

       oauth.options = function(_) {
           if (!arguments.length) return o;

           o = _;

           o.url = o.url || 'http://www.openstreetmap.org';
           o.landing = o.landing || 'land.html';

           o.singlepage = o.singlepage || false;

           // Optional loading and loading-done functions for nice UI feedback.
           // by default, no-ops
           o.loading = o.loading || function() {};
           o.done = o.done || function() {};

           return oauth.preauth(o);
       };

       // 'stamp' an authentication object from `getAuth()`
       // with a [nonce](http://en.wikipedia.org/wiki/Cryptographic_nonce)
       // and timestamp
       function timenonce(o) {
           o.oauth_timestamp = ohauth.timestamp();
           o.oauth_nonce = ohauth.nonce();
           return o;
       }

       // get/set tokens. These are prefixed with the base URL so that `osm-auth`
       // can be used with multiple APIs and the keys in `localStorage`
       // will not clash
       var token;

       if (store.enabled) {
           token = function (x, y) {
               if (arguments.length === 1) return store.get(o.url + x);
               else if (arguments.length === 2) return store.set(o.url + x, y);
           };
       } else {
           var storage = {};
           token = function (x, y) {
               if (arguments.length === 1) return storage[o.url + x];
               else if (arguments.length === 2) return storage[o.url + x] = y;
           };
       }

       // Get an authentication object. If you just add and remove properties
       // from a single object, you'll need to use `delete` to make sure that
       // it doesn't contain undesired properties for authentication
       function getAuth(o) {
           return {
               oauth_consumer_key: o.oauth_consumer_key,
               oauth_signature_method: "HMAC-SHA1"
           };
       }

       // potentially pre-authorize
       oauth.options(o);

       return oauth;
   };
   });

   var osmAuth = (index && typeof index === 'object' && 'default' in index ? index['default'] : index);

   var JXON = new (function () {
     var
       sValueProp = 'keyValue', sAttributesProp = 'keyAttributes', sAttrPref = '@', /* you can customize these values */
       aCache = [], rIsNull = /^\s*$/, rIsBool = /^(?:true|false)$/i;

     function parseText (sValue) {
       if (rIsNull.test(sValue)) { return null; }
       if (rIsBool.test(sValue)) { return sValue.toLowerCase() === 'true'; }
       if (isFinite(sValue)) { return parseFloat(sValue); }
       if (isFinite(Date.parse(sValue))) { return new Date(sValue); }
       return sValue;
     }

     function EmptyTree () { }
     EmptyTree.prototype.toString = function () { return 'null'; };
     EmptyTree.prototype.valueOf = function () { return null; };

     function objectify (vValue) {
       return vValue === null ? new EmptyTree() : vValue instanceof Object ? vValue : new vValue.constructor(vValue);
     }

     function createObjTree (oParentNode, nVerb, bFreeze, bNesteAttr) {
       var
         nLevelStart = aCache.length, bChildren = oParentNode.hasChildNodes(),
         bAttributes = oParentNode.hasAttributes(), bHighVerb = Boolean(nVerb & 2);

       var
         sProp, vContent, nLength = 0, sCollectedTxt = '',
         vResult = bHighVerb ? {} : /* put here the default value for empty nodes: */ true;

       if (bChildren) {
         for (var oNode, nItem = 0; nItem < oParentNode.childNodes.length; nItem++) {
           oNode = oParentNode.childNodes.item(nItem);
           if (oNode.nodeType === 4) { sCollectedTxt += oNode.nodeValue; } /* nodeType is 'CDATASection' (4) */
           else if (oNode.nodeType === 3) { sCollectedTxt += oNode.nodeValue.trim(); } /* nodeType is 'Text' (3) */
           else if (oNode.nodeType === 1 && !oNode.prefix) { aCache.push(oNode); } /* nodeType is 'Element' (1) */
         }
       }

       var nLevelEnd = aCache.length, vBuiltVal = parseText(sCollectedTxt);

       if (!bHighVerb && (bChildren || bAttributes)) { vResult = nVerb === 0 ? objectify(vBuiltVal) : {}; }

       for (var nElId = nLevelStart; nElId < nLevelEnd; nElId++) {
         sProp = aCache[nElId].nodeName.toLowerCase();
         vContent = createObjTree(aCache[nElId], nVerb, bFreeze, bNesteAttr);
         if (vResult.hasOwnProperty(sProp)) {
           if (vResult[sProp].constructor !== Array) { vResult[sProp] = [vResult[sProp]]; }
           vResult[sProp].push(vContent);
         } else {
           vResult[sProp] = vContent;
           nLength++;
         }
       }

       if (bAttributes) {
         var
           nAttrLen = oParentNode.attributes.length,
           sAPrefix = bNesteAttr ? '' : sAttrPref, oAttrParent = bNesteAttr ? {} : vResult;

         for (var oAttrib, nAttrib = 0; nAttrib < nAttrLen; nLength++, nAttrib++) {
           oAttrib = oParentNode.attributes.item(nAttrib);
           oAttrParent[sAPrefix + oAttrib.name.toLowerCase()] = parseText(oAttrib.value.trim());
         }

         if (bNesteAttr) {
           if (bFreeze) { Object.freeze(oAttrParent); }
           vResult[sAttributesProp] = oAttrParent;
           nLength -= nAttrLen - 1;
         }
       }

       if (nVerb === 3 || (nVerb === 2 || nVerb === 1 && nLength > 0) && sCollectedTxt) {
         vResult[sValueProp] = vBuiltVal;
       } else if (!bHighVerb && nLength === 0 && sCollectedTxt) {
         vResult = vBuiltVal;
       }

       if (bFreeze && (bHighVerb || nLength > 0)) { Object.freeze(vResult); }

       aCache.length = nLevelStart;

       return vResult;
     }

     function loadObjTree (oXMLDoc, oParentEl, oParentObj) {
       var vValue, oChild;

       if (oParentObj instanceof String || oParentObj instanceof Number || oParentObj instanceof Boolean) {
         oParentEl.appendChild(oXMLDoc.createTextNode(oParentObj.toString())); /* verbosity level is 0 */
       } else if (oParentObj.constructor === Date) {
         oParentEl.appendChild(oXMLDoc.createTextNode(oParentObj.toGMTString()));    
       }

       for (var sName in oParentObj) {
         vValue = oParentObj[sName];
         if (isFinite(sName) || vValue instanceof Function) { continue; } /* verbosity level is 0 */
         if (sName === sValueProp) {
           if (vValue !== null && vValue !== true) { oParentEl.appendChild(oXMLDoc.createTextNode(vValue.constructor === Date ? vValue.toGMTString() : String(vValue))); }
         } else if (sName === sAttributesProp) { /* verbosity level is 3 */
           for (var sAttrib in vValue) { oParentEl.setAttribute(sAttrib, vValue[sAttrib]); }
         } else if (sName.charAt(0) === sAttrPref) {
           oParentEl.setAttribute(sName.slice(1), vValue);
         } else if (vValue.constructor === Array) {
           for (var nItem = 0; nItem < vValue.length; nItem++) {
             oChild = oXMLDoc.createElement(sName);
             loadObjTree(oXMLDoc, oChild, vValue[nItem]);
             oParentEl.appendChild(oChild);
           }
         } else {
           oChild = oXMLDoc.createElement(sName);
           if (vValue instanceof Object) {
             loadObjTree(oXMLDoc, oChild, vValue);
           } else if (vValue !== null && vValue !== true) {
             oChild.appendChild(oXMLDoc.createTextNode(vValue.toString()));
           }
           oParentEl.appendChild(oChild);
        }
      }
     }

     this.build = function (oXMLParent, nVerbosity /* optional */, bFreeze /* optional */, bNesteAttributes /* optional */) {
       var _nVerb = arguments.length > 1 && typeof nVerbosity === 'number' ? nVerbosity & 3 : /* put here the default verbosity level: */ 1;
       return createObjTree(oXMLParent, _nVerb, bFreeze || false, arguments.length > 3 ? bNesteAttributes : _nVerb === 3);    
     };

     this.unbuild = function (oObjTree) {    
       var oNewDoc = document.implementation.createDocument('', '', null);
       loadObjTree(oNewDoc, oNewDoc, oObjTree);
       return oNewDoc;
     };

     this.stringify = function (oObjTree) {
       return (new XMLSerializer()).serializeToString(JXON.unbuild(oObjTree));
     };
   })();

   // var myObject = JXON.build(doc);
   // we got our javascript object! try: alert(JSON.stringify(myObject));

   // var newDoc = JXON.unbuild(myObject);
   // we got our Document instance! try: alert((new XMLSerializer()).serializeToString(newDoc));

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
                       extent: Extent(
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

   function tagText(entity) {
       return d3.entries(entity.tags).map(function(e) {
           return e.key + '=' + e.value;
       }).join(', ');
   }

   function entitySelector(ids) {
       return ids.length ? '.' + ids.join(',.') : 'nothing';
   }

   function entityOrMemberSelector(ids, graph) {
       var s = entitySelector(ids);

       ids.forEach(function(id) {
           var entity = graph.hasEntity(id);
           if (entity && entity.type === 'relation') {
               entity.members.forEach(function(member) {
                   s += ',.' + member.id;
               });
           }
       });

       return s;
   }

   function displayName(entity) {
       var localeName = 'name:' + iD.detect().locale.toLowerCase().split('-')[0];
       return entity.tags[localeName] || entity.tags.name || entity.tags.ref;
   }

   function displayType(id) {
       return {
           n: t('inspector.node'),
           w: t('inspector.way'),
           r: t('inspector.relation')
       }[id.charAt(0)];
   }

   function stringQs(str) {
       return str.split('&').reduce(function(obj, pair){
           var parts = pair.split('=');
           if (parts.length === 2) {
               obj[parts[0]] = (null === parts[1]) ? '' : decodeURIComponent(parts[1]);
           }
           return obj;
       }, {});
   }

   function qsString(obj, noencode) {
       function softEncode(s) {
         // encode everything except special characters used in certain hash parameters:
         // "/" in map states, ":", ",", {" and "}" in background
         return encodeURIComponent(s).replace(/(%2F|%3A|%2C|%7B|%7D)/g, decodeURIComponent);
       }
       return Object.keys(obj).sort().map(function(key) {
           return encodeURIComponent(key) + '=' + (
               noencode ? softEncode(obj[key]) : encodeURIComponent(obj[key]));
       }).join('&');
   }

   function prefixDOMProperty(property) {
       var prefixes = ['webkit', 'ms', 'moz', 'o'],
           i = -1,
           n = prefixes.length,
           s = document.body;

       if (property in s)
           return property;

       property = property.substr(0, 1).toUpperCase() + property.substr(1);

       while (++i < n)
           if (prefixes[i] + property in s)
               return prefixes[i] + property;

       return false;
   }

   function prefixCSSProperty(property) {
       var prefixes = ['webkit', 'ms', 'Moz', 'O'],
           i = -1,
           n = prefixes.length,
           s = document.body.style;

       if (property.toLowerCase() in s)
           return property.toLowerCase();

       while (++i < n)
           if (prefixes[i] + property in s)
               return '-' + prefixes[i].toLowerCase() + property.replace(/([A-Z])/g, '-$1').toLowerCase();

       return false;
   }


   var transformProperty;
   function setTransform(el, x, y, scale) {
       var prop = transformProperty = transformProperty || prefixCSSProperty('Transform'),
           translate = iD.detect().opera ?
               'translate('   + x + 'px,' + y + 'px)' :
               'translate3d(' + x + 'px,' + y + 'px,0)';
       return el.style(prop, translate + (scale ? ' scale(' + scale + ')' : ''));
   }

   function getStyle(selector) {
       for (var i = 0; i < document.styleSheets.length; i++) {
           var rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules || [];
           for (var k = 0; k < rules.length; k++) {
               var selectorText = rules[k].selectorText && rules[k].selectorText.split(', ');
               if (_.includes(selectorText, selector)) {
                   return rules[k];
               }
           }
       }
   }

   function editDistance(a, b) {
       if (a.length === 0) return b.length;
       if (b.length === 0) return a.length;
       var matrix = [];
       for (var i = 0; i <= b.length; i++) { matrix[i] = [i]; }
       for (var j = 0; j <= a.length; j++) { matrix[0][j] = j; }
       for (i = 1; i <= b.length; i++) {
           for (j = 1; j <= a.length; j++) {
               if (b.charAt(i-1) === a.charAt(j-1)) {
                   matrix[i][j] = matrix[i-1][j-1];
               } else {
                   matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                       Math.min(matrix[i][j-1] + 1, // insertion
                       matrix[i-1][j] + 1)); // deletion
               }
           }
       }
       return matrix[b.length][a.length];
   }

   // a d3.mouse-alike which
   // 1. Only works on HTML elements, not SVG
   // 2. Does not cause style recalculation
   function fastMouse(container) {
       var rect = container.getBoundingClientRect(),
           rectLeft = rect.left,
           rectTop = rect.top,
           clientLeft = +container.clientLeft,
           clientTop = +container.clientTop;
       return function(e) {
           return [
               e.clientX - rectLeft - clientLeft,
               e.clientY - rectTop - clientTop];
       };
   }

   /* eslint-disable no-proto */
   var getPrototypeOf = Object.getPrototypeOf || function(obj) { return obj.__proto__; };
   /* eslint-enable no-proto */

   function asyncMap(inputs, func, callback) {
       var remaining = inputs.length,
           results = [],
           errors = [];

       inputs.forEach(function(d, i) {
           func(d, function done(err, data) {
               errors[i] = err;
               results[i] = data;
               remaining--;
               if (!remaining) callback(errors, results);
           });
       });
   }

   // wraps an index to an interval [0..length-1]
   function Wrap(index, length) {
       if (index < 0)
           index += Math.ceil(-index/length)*length;
       return index % length;
   }

   // A per-domain session mutex backed by a cookie and dead man's
   // switch. If the session crashes, the mutex will auto-release
   // after 5 seconds.

   function SessionMutex(name) {
       var mutex = {},
           intervalID;

       function renew() {
           var expires = new Date();
           expires.setSeconds(expires.getSeconds() + 5);
           document.cookie = name + '=1; expires=' + expires.toUTCString();
       }

       mutex.lock = function() {
           if (intervalID) return true;
           var cookie = document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + name + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1');
           if (cookie) return false;
           renew();
           intervalID = window.setInterval(renew, 4000);
           return true;
       };

       mutex.unlock = function() {
           if (!intervalID) return;
           document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
           clearInterval(intervalID);
           intervalID = null;
       };

       mutex.locked = function() {
           return !!intervalID;
       };

       return mutex;
   }

   function SuggestNames(preset, suggestions) {
       preset = preset.id.split('/', 2);
       var k = preset[0],
           v = preset[1];

       return function(value, callback) {
           var result = [];
           if (value && value.length > 2) {
               if (suggestions[k] && suggestions[k][v]) {
                   for (var sugg in suggestions[k][v]) {
                       var dist = editDistance(value, sugg.substring(0, value.length));
                       if (dist < 3) {
                           result.push({
                               title: sugg,
                               value: sugg,
                               dist: dist
                           });
                       }
                   }
               }
               result.sort(function(a, b) {
                   return a.dist - b.dist;
               });
           }
           result = result.slice(0,3);
           callback(result);
       };
   }



   var util = Object.freeze({
   	tagText: tagText,
   	entitySelector: entitySelector,
   	entityOrMemberSelector: entityOrMemberSelector,
   	displayName: displayName,
   	displayType: displayType,
   	stringQs: stringQs,
   	qsString: qsString,
   	prefixDOMProperty: prefixDOMProperty,
   	prefixCSSProperty: prefixCSSProperty,
   	setTransform: setTransform,
   	getStyle: getStyle,
   	editDistance: editDistance,
   	fastMouse: fastMouse,
   	getPrototypeOf: getPrototypeOf,
   	asyncMap: asyncMap,
   	wrap: Wrap,
   	SessionMutex: SessionMutex,
   	SuggestNames: SuggestNames
   });

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
               'entities': getPrototypeOf(this.entities),
               'parentWays': getPrototypeOf(this._parentWays),
               'parentRels': getPrototypeOf(this._parentRels)
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

   var index$7 = createCommonjsModule(function (module) {
   'use strict';

   module.exports = partialSort;

   // Floyd-Rivest selection algorithm:
   // Rearrange items so that all items in the [left, k] range are smaller than all items in (k, right];
   // The k-th element will have the (k - left + 1)th smallest value in [left, right]

   function partialSort(arr, k, left, right, compare) {
       left = left || 0;
       right = right || (arr.length - 1);
       compare = compare || defaultCompare;

       while (right > left) {
           if (right - left > 600) {
               var n = right - left + 1;
               var m = k - left + 1;
               var z = Math.log(n);
               var s = 0.5 * Math.exp(2 * z / 3);
               var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
               var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
               var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
               partialSort(arr, k, newLeft, newRight, compare);
           }

           var t = arr[k];
           var i = left;
           var j = right;

           swap(arr, left, k);
           if (compare(arr[right], t) > 0) swap(arr, left, right);

           while (i < j) {
               swap(arr, i, j);
               i++;
               j--;
               while (compare(arr[i], t) < 0) i++;
               while (compare(arr[j], t) > 0) j--;
           }

           if (compare(arr[left], t) === 0) swap(arr, left, j);
           else {
               j++;
               swap(arr, j, right);
           }

           if (j <= k) left = j + 1;
           if (k <= j) right = j - 1;
       }
   }

   function swap(arr, i, j) {
       var tmp = arr[i];
       arr[i] = arr[j];
       arr[j] = tmp;
   }

   function defaultCompare(a, b) {
       return a < b ? -1 : a > b ? 1 : 0;
   }
   });

   var require$$0$5 = (index$7 && typeof index$7 === 'object' && 'default' in index$7 ? index$7['default'] : index$7);

   var index$6 = createCommonjsModule(function (module) {
   'use strict';

   module.exports = rbush;

   var quickselect = require$$0$5;

   function rbush(maxEntries, format) {
       if (!(this instanceof rbush)) return new rbush(maxEntries, format);

       // max entries in a node is 9 by default; min node fill is 40% for best performance
       this._maxEntries = Math.max(4, maxEntries || 9);
       this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));

       if (format) {
           this._initFormat(format);
       }

       this.clear();
   }

   rbush.prototype = {

       all: function () {
           return this._all(this.data, []);
       },

       search: function (bbox) {

           var node = this.data,
               result = [],
               toBBox = this.toBBox;

           if (!intersects(bbox, node)) return result;

           var nodesToSearch = [],
               i, len, child, childBBox;

           while (node) {
               for (i = 0, len = node.children.length; i < len; i++) {

                   child = node.children[i];
                   childBBox = node.leaf ? toBBox(child) : child;

                   if (intersects(bbox, childBBox)) {
                       if (node.leaf) result.push(child);
                       else if (contains(bbox, childBBox)) this._all(child, result);
                       else nodesToSearch.push(child);
                   }
               }
               node = nodesToSearch.pop();
           }

           return result;
       },

       collides: function (bbox) {

           var node = this.data,
               toBBox = this.toBBox;

           if (!intersects(bbox, node)) return false;

           var nodesToSearch = [],
               i, len, child, childBBox;

           while (node) {
               for (i = 0, len = node.children.length; i < len; i++) {

                   child = node.children[i];
                   childBBox = node.leaf ? toBBox(child) : child;

                   if (intersects(bbox, childBBox)) {
                       if (node.leaf || contains(bbox, childBBox)) return true;
                       nodesToSearch.push(child);
                   }
               }
               node = nodesToSearch.pop();
           }

           return false;
       },

       load: function (data) {
           if (!(data && data.length)) return this;

           if (data.length < this._minEntries) {
               for (var i = 0, len = data.length; i < len; i++) {
                   this.insert(data[i]);
               }
               return this;
           }

           // recursively build the tree with the given data from stratch using OMT algorithm
           var node = this._build(data.slice(), 0, data.length - 1, 0);

           if (!this.data.children.length) {
               // save as is if tree is empty
               this.data = node;

           } else if (this.data.height === node.height) {
               // split root if trees have the same height
               this._splitRoot(this.data, node);

           } else {
               if (this.data.height < node.height) {
                   // swap trees if inserted one is bigger
                   var tmpNode = this.data;
                   this.data = node;
                   node = tmpNode;
               }

               // insert the small tree into the large tree at appropriate level
               this._insert(node, this.data.height - node.height - 1, true);
           }

           return this;
       },

       insert: function (item) {
           if (item) this._insert(item, this.data.height - 1);
           return this;
       },

       clear: function () {
           this.data = createNode([]);
           return this;
       },

       remove: function (item, equalsFn) {
           if (!item) return this;

           var node = this.data,
               bbox = this.toBBox(item),
               path = [],
               indexes = [],
               i, parent, index, goingUp;

           // depth-first iterative tree traversal
           while (node || path.length) {

               if (!node) { // go up
                   node = path.pop();
                   parent = path[path.length - 1];
                   i = indexes.pop();
                   goingUp = true;
               }

               if (node.leaf) { // check current node
                   index = findItem(item, node.children, equalsFn);

                   if (index !== -1) {
                       // item found, remove the item and condense tree upwards
                       node.children.splice(index, 1);
                       path.push(node);
                       this._condense(path);
                       return this;
                   }
               }

               if (!goingUp && !node.leaf && contains(node, bbox)) { // go down
                   path.push(node);
                   indexes.push(i);
                   i = 0;
                   parent = node;
                   node = node.children[0];

               } else if (parent) { // go right
                   i++;
                   node = parent.children[i];
                   goingUp = false;

               } else node = null; // nothing found
           }

           return this;
       },

       toBBox: function (item) { return item; },

       compareMinX: compareNodeMinX,
       compareMinY: compareNodeMinY,

       toJSON: function () { return this.data; },

       fromJSON: function (data) {
           this.data = data;
           return this;
       },

       _all: function (node, result) {
           var nodesToSearch = [];
           while (node) {
               if (node.leaf) result.push.apply(result, node.children);
               else nodesToSearch.push.apply(nodesToSearch, node.children);

               node = nodesToSearch.pop();
           }
           return result;
       },

       _build: function (items, left, right, height) {

           var N = right - left + 1,
               M = this._maxEntries,
               node;

           if (N <= M) {
               // reached leaf level; return leaf
               node = createNode(items.slice(left, right + 1));
               calcBBox(node, this.toBBox);
               return node;
           }

           if (!height) {
               // target height of the bulk-loaded tree
               height = Math.ceil(Math.log(N) / Math.log(M));

               // target number of root entries to maximize storage utilization
               M = Math.ceil(N / Math.pow(M, height - 1));
           }

           node = createNode([]);
           node.leaf = false;
           node.height = height;

           // split the items into M mostly square tiles

           var N2 = Math.ceil(N / M),
               N1 = N2 * Math.ceil(Math.sqrt(M)),
               i, j, right2, right3;

           multiSelect(items, left, right, N1, this.compareMinX);

           for (i = left; i <= right; i += N1) {

               right2 = Math.min(i + N1 - 1, right);

               multiSelect(items, i, right2, N2, this.compareMinY);

               for (j = i; j <= right2; j += N2) {

                   right3 = Math.min(j + N2 - 1, right2);

                   // pack each entry recursively
                   node.children.push(this._build(items, j, right3, height - 1));
               }
           }

           calcBBox(node, this.toBBox);

           return node;
       },

       _chooseSubtree: function (bbox, node, level, path) {

           var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;

           while (true) {
               path.push(node);

               if (node.leaf || path.length - 1 === level) break;

               minArea = minEnlargement = Infinity;

               for (i = 0, len = node.children.length; i < len; i++) {
                   child = node.children[i];
                   area = bboxArea(child);
                   enlargement = enlargedArea(bbox, child) - area;

                   // choose entry with the least area enlargement
                   if (enlargement < minEnlargement) {
                       minEnlargement = enlargement;
                       minArea = area < minArea ? area : minArea;
                       targetNode = child;

                   } else if (enlargement === minEnlargement) {
                       // otherwise choose one with the smallest area
                       if (area < minArea) {
                           minArea = area;
                           targetNode = child;
                       }
                   }
               }

               node = targetNode || node.children[0];
           }

           return node;
       },

       _insert: function (item, level, isNode) {

           var toBBox = this.toBBox,
               bbox = isNode ? item : toBBox(item),
               insertPath = [];

           // find the best node for accommodating the item, saving all nodes along the path too
           var node = this._chooseSubtree(bbox, this.data, level, insertPath);

           // put the item into the node
           node.children.push(item);
           extend(node, bbox);

           // split on node overflow; propagate upwards if necessary
           while (level >= 0) {
               if (insertPath[level].children.length > this._maxEntries) {
                   this._split(insertPath, level);
                   level--;
               } else break;
           }

           // adjust bboxes along the insertion path
           this._adjustParentBBoxes(bbox, insertPath, level);
       },

       // split overflowed node into two
       _split: function (insertPath, level) {

           var node = insertPath[level],
               M = node.children.length,
               m = this._minEntries;

           this._chooseSplitAxis(node, m, M);

           var splitIndex = this._chooseSplitIndex(node, m, M);

           var newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
           newNode.height = node.height;
           newNode.leaf = node.leaf;

           calcBBox(node, this.toBBox);
           calcBBox(newNode, this.toBBox);

           if (level) insertPath[level - 1].children.push(newNode);
           else this._splitRoot(node, newNode);
       },

       _splitRoot: function (node, newNode) {
           // split root node
           this.data = createNode([node, newNode]);
           this.data.height = node.height + 1;
           this.data.leaf = false;
           calcBBox(this.data, this.toBBox);
       },

       _chooseSplitIndex: function (node, m, M) {

           var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;

           minOverlap = minArea = Infinity;

           for (i = m; i <= M - m; i++) {
               bbox1 = distBBox(node, 0, i, this.toBBox);
               bbox2 = distBBox(node, i, M, this.toBBox);

               overlap = intersectionArea(bbox1, bbox2);
               area = bboxArea(bbox1) + bboxArea(bbox2);

               // choose distribution with minimum overlap
               if (overlap < minOverlap) {
                   minOverlap = overlap;
                   index = i;

                   minArea = area < minArea ? area : minArea;

               } else if (overlap === minOverlap) {
                   // otherwise choose distribution with minimum area
                   if (area < minArea) {
                       minArea = area;
                       index = i;
                   }
               }
           }

           return index;
       },

       // sorts node children by the best axis for split
       _chooseSplitAxis: function (node, m, M) {

           var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX,
               compareMinY = node.leaf ? this.compareMinY : compareNodeMinY,
               xMargin = this._allDistMargin(node, m, M, compareMinX),
               yMargin = this._allDistMargin(node, m, M, compareMinY);

           // if total distributions margin value is minimal for x, sort by minX,
           // otherwise it's already sorted by minY
           if (xMargin < yMargin) node.children.sort(compareMinX);
       },

       // total margin of all possible split distributions where each node is at least m full
       _allDistMargin: function (node, m, M, compare) {

           node.children.sort(compare);

           var toBBox = this.toBBox,
               leftBBox = distBBox(node, 0, m, toBBox),
               rightBBox = distBBox(node, M - m, M, toBBox),
               margin = bboxMargin(leftBBox) + bboxMargin(rightBBox),
               i, child;

           for (i = m; i < M - m; i++) {
               child = node.children[i];
               extend(leftBBox, node.leaf ? toBBox(child) : child);
               margin += bboxMargin(leftBBox);
           }

           for (i = M - m - 1; i >= m; i--) {
               child = node.children[i];
               extend(rightBBox, node.leaf ? toBBox(child) : child);
               margin += bboxMargin(rightBBox);
           }

           return margin;
       },

       _adjustParentBBoxes: function (bbox, path, level) {
           // adjust bboxes along the given tree path
           for (var i = level; i >= 0; i--) {
               extend(path[i], bbox);
           }
       },

       _condense: function (path) {
           // go through the path, removing empty nodes and updating bboxes
           for (var i = path.length - 1, siblings; i >= 0; i--) {
               if (path[i].children.length === 0) {
                   if (i > 0) {
                       siblings = path[i - 1].children;
                       siblings.splice(siblings.indexOf(path[i]), 1);

                   } else this.clear();

               } else calcBBox(path[i], this.toBBox);
           }
       },

       _initFormat: function (format) {
           // data format (minX, minY, maxX, maxY accessors)

           // uses eval-type function compilation instead of just accepting a toBBox function
           // because the algorithms are very sensitive to sorting functions performance,
           // so they should be dead simple and without inner calls

           var compareArr = ['return a', ' - b', ';'];

           this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
           this.compareMinY = new Function('a', 'b', compareArr.join(format[1]));

           this.toBBox = new Function('a',
               'return {minX: a' + format[0] +
               ', minY: a' + format[1] +
               ', maxX: a' + format[2] +
               ', maxY: a' + format[3] + '};');
       }
   };

   function findItem(item, items, equalsFn) {
       if (!equalsFn) return items.indexOf(item);

       for (var i = 0; i < items.length; i++) {
           if (equalsFn(item, items[i])) return i;
       }
       return -1;
   }

   // calculate node's bbox from bboxes of its children
   function calcBBox(node, toBBox) {
       distBBox(node, 0, node.children.length, toBBox, node);
   }

   // min bounding rectangle of node children from k to p-1
   function distBBox(node, k, p, toBBox, destNode) {
       if (!destNode) destNode = createNode(null);
       destNode.minX = Infinity;
       destNode.minY = Infinity;
       destNode.maxX = -Infinity;
       destNode.maxY = -Infinity;

       for (var i = k, child; i < p; i++) {
           child = node.children[i];
           extend(destNode, node.leaf ? toBBox(child) : child);
       }

       return destNode;
   }

   function extend(a, b) {
       a.minX = Math.min(a.minX, b.minX);
       a.minY = Math.min(a.minY, b.minY);
       a.maxX = Math.max(a.maxX, b.maxX);
       a.maxY = Math.max(a.maxY, b.maxY);
       return a;
   }

   function compareNodeMinX(a, b) { return a.minX - b.minX; }
   function compareNodeMinY(a, b) { return a.minY - b.minY; }

   function bboxArea(a)   { return (a.maxX - a.minX) * (a.maxY - a.minY); }
   function bboxMargin(a) { return (a.maxX - a.minX) + (a.maxY - a.minY); }

   function enlargedArea(a, b) {
       return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) *
              (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
   }

   function intersectionArea(a, b) {
       var minX = Math.max(a.minX, b.minX),
           minY = Math.max(a.minY, b.minY),
           maxX = Math.min(a.maxX, b.maxX),
           maxY = Math.min(a.maxY, b.maxY);

       return Math.max(0, maxX - minX) *
              Math.max(0, maxY - minY);
   }

   function contains(a, b) {
       return a.minX <= b.minX &&
              a.minY <= b.minY &&
              b.maxX <= a.maxX &&
              b.maxY <= a.maxY;
   }

   function intersects(a, b) {
       return b.minX <= a.maxX &&
              b.minY <= a.maxY &&
              b.maxX >= a.minX &&
              b.maxY >= a.minY;
   }

   function createNode(children) {
       return {
           children: children,
           height: 1,
           leaf: true,
           minX: Infinity,
           minY: Infinity,
           maxX: -Infinity,
           maxY: -Infinity
       };
   }

   // sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
   // combines selection algorithm with binary divide & conquer approach

   function multiSelect(arr, left, right, n, compare) {
       var stack = [left, right],
           mid;

       while (stack.length) {
           right = stack.pop();
           left = stack.pop();

           if (right - left <= n) continue;

           mid = left + Math.ceil((right - left) / n / 2) * n;
           quickselect(arr, mid, left, right, compare);

           stack.push(left, mid, mid, right);
       }
   }
   });

   var rbush = (index$6 && typeof index$6 === 'object' && 'default' in index$6 ? index$6['default'] : index$6);

   function Tree(head) {
       var rtree = rbush(),
           bboxes = {};

       function entityBBox(entity) {
           var bbox = entity.extent(head).bbox();
           bbox.id = entity.id;
           bboxes[entity.id] = bbox;
           return bbox;
       }

       function updateParents(entity, insertions, memo) {
           head.parentWays(entity).forEach(function(way) {
               if (bboxes[way.id]) {
                   rtree.remove(bboxes[way.id]);
                   insertions[way.id] = way;
               }
               updateParents(way, insertions, memo);
           });

           head.parentRelations(entity).forEach(function(relation) {
               if (memo[entity.id]) return;
               memo[entity.id] = true;
               if (bboxes[relation.id]) {
                   rtree.remove(bboxes[relation.id]);
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

               if (head.entities.hasOwnProperty(entity.id) || bboxes[entity.id]) {
                   if (!force) {
                       continue;
                   } else if (bboxes[entity.id]) {
                       rtree.remove(bboxes[entity.id]);
                   }
               }

               insertions[entity.id] = entity;
               updateParents(entity, insertions, {});
           }

           rtree.load(_.map(insertions, entityBBox));

           return tree;
       };

       tree.intersects = function(extent, graph) {
           if (graph !== head) {
               var diff = Difference(head, graph),
                   insertions = {};

               head = graph;

               diff.deleted().forEach(function(entity) {
                   rtree.remove(bboxes[entity.id]);
                   delete bboxes[entity.id];
               });

               diff.modified().forEach(function(entity) {
                   rtree.remove(bboxes[entity.id]);
                   insertions[entity.id] = entity;
                   updateParents(entity, insertions, {});
               });

               diff.created().forEach(function(entity) {
                   insertions[entity.id] = entity;
               });

               rtree.load(_.map(insertions, entityBBox));
           }

           return rtree.search(extent.bbox()).map(function(bbox) {
               return head.entity(bbox.id);
           });
       };

       return tree;
   }

   function access(field) {
       var dispatch = d3.dispatch('change'),
           items;

       function access(selection) {
           var wrap = selection.selectAll('.preset-input-wrap')
               .data([0]);

           wrap.enter().append('div')
               .attr('class', 'cf preset-input-wrap')
               .append('ul');

           items = wrap.select('ul').selectAll('li')
               .data(field.keys);

           // Enter

           var enter = items.enter().append('li')
               .attr('class', function(d) { return 'cf preset-access-' + d; });

           enter.append('span')
               .attr('class', 'col6 label preset-label-access')
               .attr('for', function(d) { return 'preset-input-access-' + d; })
               .text(function(d) { return field.t('types.' + d); });

           enter.append('div')
               .attr('class', 'col6 preset-input-access-wrap')
               .append('input')
               .attr('type', 'text')
               .attr('class', 'preset-input-access')
               .attr('id', function(d) { return 'preset-input-access-' + d; })
               .each(function(d) {
                   d3.select(this)
                       .call(d3.combobox()
                           .data(access.options(d)));
               });

           // Update

           wrap.selectAll('.preset-input-access')
               .on('change', change)
               .on('blur', change);
       }

       function change(d) {
           var tag = {};
           tag[d] = d3.select(this).value() || undefined;
           dispatch.change(tag);
       }

       access.options = function(type) {
           var options = ['no', 'permissive', 'private', 'destination'];

           if (type !== 'access') {
               options.unshift('yes');
               options.push('designated');

               if (type === 'bicycle') {
                   options.push('dismount');
               }
           }

           return options.map(function(option) {
               return {
                   title: field.t('options.' + option + '.description'),
                   value: option
               };
           });
       };

       var placeholders = {
           footway: {
               foot: 'designated',
               motor_vehicle: 'no'
           },
           steps: {
               foot: 'yes',
               motor_vehicle: 'no',
               bicycle: 'no',
               horse: 'no'
           },
           pedestrian: {
               foot: 'yes',
               motor_vehicle: 'no'
           },
           cycleway: {
               motor_vehicle: 'no',
               bicycle: 'designated'
           },
           bridleway: {
               motor_vehicle: 'no',
               horse: 'designated'
           },
           path: {
               foot: 'yes',
               motor_vehicle: 'no',
               bicycle: 'yes',
               horse: 'yes'
           },
           motorway: {
               foot: 'no',
               motor_vehicle: 'yes',
               bicycle: 'no',
               horse: 'no'
           },
           trunk: {
               motor_vehicle: 'yes'
           },
           primary: {
               foot: 'yes',
               motor_vehicle: 'yes',
               bicycle: 'yes',
               horse: 'yes'
           },
           secondary: {
               foot: 'yes',
               motor_vehicle: 'yes',
               bicycle: 'yes',
               horse: 'yes'
           },
           tertiary: {
               foot: 'yes',
               motor_vehicle: 'yes',
               bicycle: 'yes',
               horse: 'yes'
           },
           residential: {
               foot: 'yes',
               motor_vehicle: 'yes',
               bicycle: 'yes',
               horse: 'yes'
           },
           unclassified: {
               foot: 'yes',
               motor_vehicle: 'yes',
               bicycle: 'yes',
               horse: 'yes'
           },
           service: {
               foot: 'yes',
               motor_vehicle: 'yes',
               bicycle: 'yes',
               horse: 'yes'
           },
           motorway_link: {
               foot: 'no',
               motor_vehicle: 'yes',
               bicycle: 'no',
               horse: 'no'
           },
           trunk_link: {
               motor_vehicle: 'yes'
           },
           primary_link: {
               foot: 'yes',
               motor_vehicle: 'yes',
               bicycle: 'yes',
               horse: 'yes'
           },
           secondary_link: {
               foot: 'yes',
               motor_vehicle: 'yes',
               bicycle: 'yes',
               horse: 'yes'
           },
           tertiary_link: {
               foot: 'yes',
               motor_vehicle: 'yes',
               bicycle: 'yes',
               horse: 'yes'
           }
       };

       access.tags = function(tags) {
           items.selectAll('.preset-input-access')
               .value(function(d) { return tags[d] || ''; })
               .attr('placeholder', function() {
                   return tags.access ? tags.access : field.placeholder();
               });

           // items.selectAll('#preset-input-access-access')
           //     .attr('placeholder', 'yes');

           _.forEach(placeholders[tags.highway], function(v, k) {
               items.selectAll('#preset-input-access-' + k)
                   .attr('placeholder', function() { return (tags.access || v); });
           });
       };

       access.focus = function() {
           items.selectAll('.preset-input-access')
               .node().focus();
       };

       return d3.rebind(access, dispatch, 'on');
   }

   function address(field, context) {
       var dispatch = d3.dispatch('init', 'change'),
           wrap,
           entity,
           isInitialized;

       var widths = {
           housenumber: 1/3,
           street: 2/3,
           city: 2/3,
           state: 1/4,
           postcode: 1/3
       };

       function getStreets() {
           var extent = entity.extent(context.graph()),
               l = extent.center(),
               box = Extent(l).padByMeters(200);

           return context.intersects(box)
               .filter(isAddressable)
               .map(function(d) {
                   var loc = context.projection([
                       (extent[0][0] + extent[1][0]) / 2,
                       (extent[0][1] + extent[1][1]) / 2]),
                       choice = chooseEdge(context.childNodes(d), loc, context.projection);
                   return {
                       title: d.tags.name,
                       value: d.tags.name,
                       dist: choice.distance
                   };
               }).sort(function(a, b) {
                   return a.dist - b.dist;
               });

           function isAddressable(d) {
               return d.tags.highway && d.tags.name && d.type === 'way';
           }
       }

       function getCities() {
           var extent = entity.extent(context.graph()),
               l = extent.center(),
               box = Extent(l).padByMeters(200);

           return context.intersects(box)
               .filter(isAddressable)
               .map(function(d) {
                   return {
                       title: d.tags['addr:city'] || d.tags.name,
                       value: d.tags['addr:city'] || d.tags.name,
                       dist: sphericalDistance(d.extent(context.graph()).center(), l)
                   };
               }).sort(function(a, b) {
                   return a.dist - b.dist;
               });

           function isAddressable(d) {
               if (d.tags.name &&
                   (d.tags.admin_level === '8' || d.tags.border_type === 'city'))
                   return true;

               if (d.tags.place && d.tags.name && (
                       d.tags.place === 'city' ||
                       d.tags.place === 'town' ||
                       d.tags.place === 'village'))
                   return true;

               if (d.tags['addr:city']) return true;

               return false;
           }
       }

       function getPostCodes() {
           var extent = entity.extent(context.graph()),
               l = extent.center(),
               box = Extent(l).padByMeters(200);

           return context.intersects(box)
               .filter(isAddressable)
               .map(function(d) {
                   return {
                       title: d.tags['addr:postcode'],
                       value: d.tags['addr:postcode'],
                       dist: sphericalDistance(d.extent(context.graph()).center(), l)
                   };
               }).sort(function(a, b) {
                   return a.dist - b.dist;
               });

           function isAddressable(d) {
               return d.tags['addr:postcode'];
           }
       }

       function address(selection) {
           isInitialized = false;

           wrap = selection.selectAll('.preset-input-wrap')
               .data([0]);

           // Enter

           wrap.enter()
               .append('div')
               .attr('class', 'preset-input-wrap');

           var center = entity.extent(context.graph()).center(),
               addressFormat;

           iD.services.nominatim().countryCode(center, function (err, countryCode) {
               addressFormat = _.find(iD.data.addressFormats, function (a) {
                   return a && a.countryCodes && _.includes(a.countryCodes, countryCode);
               }) || _.first(iD.data.addressFormats);

               function row(r) {
                   // Normalize widths.
                   var total = _.reduce(r, function(sum, field) {
                       return sum + (widths[field] || 0.5);
                   }, 0);

                   return r.map(function (field) {
                       return {
                           id: field,
                           width: (widths[field] || 0.5) / total
                       };
                   });
               }

               wrap.selectAll('div')
                   .data(addressFormat.format)
                   .enter()
                   .append('div')
                   .attr('class', 'addr-row')
                   .selectAll('input')
                   .data(row)
                   .enter()
                   .append('input')
                   .property('type', 'text')
                   .attr('placeholder', function (d) { return field.t('placeholders.' + d.id); })
                   .attr('class', function (d) { return 'addr-' + d.id; })
                   .style('width', function (d) { return d.width * 100 + '%'; });

               // Update

               wrap.selectAll('.addr-street')
                   .call(d3.combobox()
                       .fetcher(function(value, callback) {
                           callback(getStreets());
                       }));

               wrap.selectAll('.addr-city')
                   .call(d3.combobox()
                       .fetcher(function(value, callback) {
                           callback(getCities());
                       }));

               wrap.selectAll('.addr-postcode')
                   .call(d3.combobox()
                       .fetcher(function(value, callback) {
                           callback(getPostCodes());
                       }));

               wrap.selectAll('input')
                   .on('blur', change())
                   .on('change', change());

               wrap.selectAll('input:not(.combobox-input)')
                   .on('input', change(true));

               dispatch.init();
               isInitialized = true;
           });
       }

       function change(onInput) {
           return function() {
               var tags = {};

               wrap.selectAll('input')
                   .each(function (field) {
                       tags['addr:' + field.id] = this.value || undefined;
                   });

               dispatch.change(tags, onInput);
           };
       }

       function updateTags(tags) {
           wrap.selectAll('input')
               .value(function (field) {
                   return tags['addr:' + field.id] || '';
               });
       }

       address.entity = function(_) {
           if (!arguments.length) return entity;
           entity = _;
           return address;
       };

       address.tags = function(tags) {
           if (isInitialized) {
               updateTags(tags);
           } else {
               dispatch.on('init', function () {
                   updateTags(tags);
               });
           }
       };

       address.focus = function() {
           var node = wrap.selectAll('input').node();
           if (node) node.focus();
       };

       return d3.rebind(address, dispatch, 'on');
   }

   function check(field) {
       var dispatch = d3.dispatch('change'),
           options = field.strings && field.strings.options,
           values = [],
           texts = [],
           entity, value, box, text, label;

       if (options) {
           for (var k in options) {
               values.push(k === 'undefined' ? undefined : k);
               texts.push(field.t('options.' + k, { 'default': options[k] }));
           }
       } else {
           values = [undefined, 'yes'];
           texts = [t('inspector.unknown'), t('inspector.check.yes')];
           if (field.type === 'check') {
               values.push('no');
               texts.push(t('inspector.check.no'));
           }
       }

       var check = function(selection) {
           // hack: pretend oneway field is a oneway_yes field
           // where implied oneway tag exists (e.g. `junction=roundabout`) #2220, #1841
           if (field.id === 'oneway') {
               for (var key in entity.tags) {
                   if (key in oneWayTags && (entity.tags[key] in oneWayTags[key])) {
                       texts[0] = t('presets.fields.oneway_yes.options.undefined');
                       break;
                   }
               }
           }

           selection.classed('checkselect', 'true');

           label = selection.selectAll('.preset-input-wrap')
               .data([0]);

           var enter = label.enter().append('label')
               .attr('class', 'preset-input-wrap');

           enter.append('input')
               .property('indeterminate', field.type === 'check')
               .attr('type', 'checkbox')
               .attr('id', 'preset-input-' + field.id);

           enter.append('span')
               .text(texts[0])
               .attr('class', 'value');

           box = label.select('input')
               .on('click', function() {
                   var t = {};
                   t[field.key] = values[(values.indexOf(value) + 1) % values.length];
                   dispatch.change(t);
                   d3.event.stopPropagation();
               });

           text = label.select('span.value');
       };

       check.entity = function(_) {
           if (!arguments.length) return entity;
           entity = _;
           return check;
       };

       check.tags = function(tags) {
           value = tags[field.key];
           box.property('indeterminate', field.type === 'check' && !value);
           box.property('checked', value === 'yes');
           text.text(texts[values.indexOf(value)]);
           label.classed('set', !!value);
       };

       check.focus = function() {
           box.node().focus();
       };

       return d3.rebind(check, dispatch, 'on');
   }

   function combo(field, context) {
       var dispatch = d3.dispatch('change'),
           isMulti = (field.type === 'multiCombo'),
           optstrings = field.strings && field.strings.options,
           optarray = field.options,
           snake_case = (field.snake_case || (field.snake_case === undefined)),
           combobox = d3.combobox().minItems(isMulti ? 1 : 2),
           comboData = [],
           multiData = [],
           container,
           input,
           entity;

       // ensure multiCombo field.key ends with a ':'
       if (isMulti && field.key.match(/:$/) === null) {
           field.key += ':';
       }


       function snake(s) {
           return s.replace(/\s+/g, '_');
       }

       function unsnake(s) {
           return s.replace(/_+/g, ' ');
       }

       function clean(s) {
           return s.split(';')
               .map(function(s) { return s.trim(); })
               .join(';');
       }


       // returns the tag value for a display value
       // (for multiCombo, dval should be the key suffix, not the entire key)
       function tagValue(dval) {
           dval = clean(dval || '');

           if (optstrings) {
               var match = _.find(comboData, function(o) {
                   return o.key && clean(o.value) === dval;
               });
               if (match) {
                   return match.key;
               }
           }

           if (field.type === 'typeCombo' && !dval) {
               return 'yes';
           }

           return (snake_case ? snake(dval) : dval) || undefined;
       }


       // returns the display value for a tag value
       // (for multiCombo, tval should be the key suffix, not the entire key)
       function displayValue(tval) {
           tval = tval || '';

           if (optstrings) {
               var match = _.find(comboData, function(o) { return o.key === tval && o.value; });
               if (match) {
                   return match.value;
               }
           }

           if (field.type === 'typeCombo' && tval.toLowerCase() === 'yes') {
               return '';
           }

           return snake_case ? unsnake(tval) : tval;
       }


       function objectDifference(a, b) {
           return _.reject(a, function(d1) {
               return _.some(b, function(d2) { return d1.value === d2.value; });
           });
       }


       function initCombo(selection, attachTo) {
           if (optstrings) {
               selection.attr('readonly', 'readonly');
               selection.call(combobox, attachTo);
               setStaticValues(setPlaceholder);

           } else if (optarray) {
               selection.call(combobox, attachTo);
               setStaticValues(setPlaceholder);

           } else if (context.taginfo()) {
               selection.call(combobox.fetcher(setTaginfoValues), attachTo);
               setTaginfoValues('', setPlaceholder);
           }
       }


       function setStaticValues(callback) {
           if (!(optstrings || optarray)) return;

           if (optstrings) {
               comboData = Object.keys(optstrings).map(function(k) {
                   var v = field.t('options.' + k, { 'default': optstrings[k] });
                   return {
                       key: k,
                       value: v,
                       title: v
                   };
               });

           } else if (optarray) {
               comboData = optarray.map(function(k) {
                   var v = snake_case ? unsnake(k) : k;
                   return {
                       key: k,
                       value: v,
                       title: v
                   };
               });
           }

           combobox.data(objectDifference(comboData, multiData));
           if (callback) callback(comboData);
       }


       function setTaginfoValues(q, callback) {
           var fn = isMulti ? 'multikeys' : 'values';
           context.taginfo()[fn]({
               debounce: true,
               key: field.key,
               geometry: context.geometry(entity.id),
               query: (isMulti ? field.key : '') + q
           }, function(err, data) {
               if (err) return;
               comboData = _.map(data, 'value').map(function(k) {
                   if (isMulti) k = k.replace(field.key, '');
                   var v = snake_case ? unsnake(k) : k;
                   return {
                       key: k,
                       value: v,
                       title: v
                   };
               });
               comboData = objectDifference(comboData, multiData);
               if (callback) callback(comboData);
           });
       }


       function setPlaceholder(d) {
           var ph;
           if (isMulti) {
               ph = field.placeholder() || t('inspector.add');
           } else {
               var vals = _.map(d, 'value').filter(function(s) { return s.length < 20; }),
                   placeholders = vals.length > 1 ? vals : _.map(d, 'key');
               ph = field.placeholder() || placeholders.slice(0, 3).join(', ');
           }

           input.attr('placeholder', ph + '…');
       }


       function change() {
           var val = tagValue(input.value()),
               t = {};

           if (isMulti) {
               if (!val) return;
               container.classed('active', false);
               input.value('');
               field.keys.push(field.key + val);
               t[field.key + val] = 'yes';
               window.setTimeout(function() { input.node().focus(); }, 10);

           } else {
               t[field.key] = val;
           }

           dispatch.change(t);
       }


       function removeMultikey(d) {
           d3.event.stopPropagation();
           var t = {};
           t[d.key] = undefined;
           dispatch.change(t);
       }


       function combo(selection) {
           if (isMulti) {
               container = selection.selectAll('ul').data([0]);

               container.enter()
                   .append('ul')
                   .attr('class', 'form-field-multicombo')
                   .on('click', function() {
                       window.setTimeout(function() { input.node().focus(); }, 10);
                   });

           } else {
               container = selection;
           }

           input = container.selectAll('input')
               .data([0]);

           input.enter()
               .append('input')
               .attr('type', 'text')
               .attr('id', 'preset-input-' + field.id)
               .call(initCombo, selection);

           input
               .on('change', change)
               .on('blur', change);

           if (isMulti) {
               combobox
                   .on('accept', function() {
                       input.node().blur();
                       input.node().focus();
                   });

               input
                   .on('focus', function() { container.classed('active', true); });
           }
       }


       combo.tags = function(tags) {
           if (isMulti) {
               multiData = [];

               // Build multiData array containing keys already set..
               Object.keys(tags).forEach(function(key) {
                   if (key.indexOf(field.key) !== 0 || tags[key].toLowerCase() !== 'yes') return;

                   var suffix = key.substring(field.key.length);
                   multiData.push({
                       key: key,
                       value: displayValue(suffix)
                   });
               });

               // Set keys for form-field modified (needed for undo and reset buttons)..
               field.keys = _.map(multiData, 'key');

               // Exclude existing multikeys from combo options..
               var available = objectDifference(comboData, multiData);
               combobox.data(available);

               // Hide "Add" button if this field uses fixed set of
               // translateable optstrings and they're all currently used..
               container.selectAll('.combobox-input, .combobox-caret')
                   .classed('hide', optstrings && !available.length);


               // Render chips
               var chips = container.selectAll('.chips').data(multiData);

               var enter = chips.enter()
                   .insert('li', 'input')
                   .attr('class', 'chips');

               enter.append('span');
               enter.append('a');

               chips.select('span')
                   .text(function(d) { return d.value; });

               chips.select('a')
                   .on('click', removeMultikey)
                   .attr('class', 'remove')
                   .text('×');

               chips.exit()
                   .remove();

           } else {
               input.value(displayValue(tags[field.key]));
           }
       };


       combo.focus = function() {
           input.node().focus();
       };


       combo.entity = function(_) {
           if (!arguments.length) return entity;
           entity = _;
           return combo;
       };


       return d3.rebind(combo, dispatch, 'on');
   }

   function cycleway(field) {
       var dispatch = d3.dispatch('change'),
           items;

       function cycleway(selection) {
           var wrap = selection.selectAll('.preset-input-wrap')
               .data([0]);

           wrap.enter().append('div')
               .attr('class', 'cf preset-input-wrap')
               .append('ul');

           items = wrap.select('ul').selectAll('li')
               .data(field.keys);

           // Enter

           var enter = items.enter().append('li')
               .attr('class', function(d) { return 'cf preset-cycleway-' + d; });

           enter.append('span')
               .attr('class', 'col6 label preset-label-cycleway')
               .attr('for', function(d) { return 'preset-input-cycleway-' + d; })
               .text(function(d) { return field.t('types.' + d); });

           enter.append('div')
               .attr('class', 'col6 preset-input-cycleway-wrap')
               .append('input')
               .attr('type', 'text')
               .attr('class', 'preset-input-cycleway')
               .attr('id', function(d) { return 'preset-input-cycleway-' + d; })
               .each(function(d) {
                   d3.select(this)
                       .call(d3.combobox()
                           .data(cycleway.options(d)));
               });

           // Update

           wrap.selectAll('.preset-input-cycleway')
               .on('change', change)
               .on('blur', change);
       }

       function change() {
           var inputs = d3.selectAll('.preset-input-cycleway')[0],
               left = d3.select(inputs[0]).value(),
               right = d3.select(inputs[1]).value(),
               tag = {};
           if (left === 'none' || left === '') { left = undefined; }
           if (right === 'none' || right === '') { right = undefined; }

           // Always set both left and right as changing one can affect the other
           tag = {
               cycleway: undefined,
               'cycleway:left': left,
               'cycleway:right': right
           };

           // If the left and right tags match, use the cycleway tag to tag both
           // sides the same way
           if (left === right) {
               tag = {
                   cycleway: left,
                   'cycleway:left': undefined,
                   'cycleway:right': undefined
               };
           }

           dispatch.change(tag);
       }

       cycleway.options = function() {
           return d3.keys(field.strings.options).map(function(option) {
               return {
                   title: field.t('options.' + option + '.description'),
                   value: option
               };
           });
       };

       cycleway.tags = function(tags) {
           items.selectAll('.preset-input-cycleway')
               .value(function(d) {
                   // If cycleway is set, always return that
                   if (tags.cycleway) {
                       return tags.cycleway;
                   }
                   return tags[d] || '';
               })
               .attr('placeholder', field.placeholder());
       };

       cycleway.focus = function() {
           items.selectAll('.preset-input-cycleway')
               .node().focus();
       };

       return d3.rebind(cycleway, dispatch, 'on');
   }

   function url(field, context) {

       var dispatch = d3.dispatch('change'),
           input,
           entity;

       function i(selection) {
           var fieldId = 'preset-input-' + field.id;

           input = selection.selectAll('input')
               .data([0]);

           input.enter().append('input')
               .attr('type', field.type)
               .attr('id', fieldId)
               .attr('placeholder', field.placeholder() || t('inspector.unknown'));

           input
               .on('input', change(true))
               .on('blur', change())
               .on('change', change());

           if (field.type === 'tel') {
               var center = entity.extent(context.graph()).center();
               iD.services.nominatim().countryCode(center, function (err, countryCode) {
                   if (err || !iD.data.phoneFormats[countryCode]) return;
                   selection.selectAll('#' + fieldId)
                       .attr('placeholder', iD.data.phoneFormats[countryCode]);
               });

           } else if (field.type === 'number') {
               input.attr('type', 'text');

               var spinControl = selection.selectAll('.spin-control')
                   .data([0]);

               var enter = spinControl.enter().append('div')
                   .attr('class', 'spin-control');

               enter.append('button')
                   .datum(1)
                   .attr('class', 'increment')
                   .attr('tabindex', -1);

               enter.append('button')
                   .datum(-1)
                   .attr('class', 'decrement')
                   .attr('tabindex', -1);

               spinControl.selectAll('button')
                   .on('click', function(d) {
                       d3.event.preventDefault();
                       var num = parseInt(input.node().value || 0, 10);
                       if (!isNaN(num)) input.node().value = num + d;
                       change()();
                   });
           }
       }

       function change(onInput) {
           return function() {
               var t = {};
               t[field.key] = input.value() || undefined;
               dispatch.change(t, onInput);
           };
       }

       i.entity = function(_) {
           if (!arguments.length) return entity;
           entity = _;
           return i;
       };

       i.tags = function(tags) {
           input.value(tags[field.key] || '');
       };

       i.focus = function() {
           var node = input.node();
           if (node) node.focus();
       };

       return d3.rebind(i, dispatch, 'on');
   }

   function Areas(projection) {
       // Patterns only work in Firefox when set directly on element.
       // (This is not a bug: https://bugzilla.mozilla.org/show_bug.cgi?id=750632)
       var patterns = {
           wetland: 'wetland',
           beach: 'beach',
           scrub: 'scrub',
           construction: 'construction',
           military: 'construction',
           cemetery: 'cemetery',
           grave_yard: 'cemetery',
           meadow: 'meadow',
           farm: 'farmland',
           farmland: 'farmland',
           orchard: 'orchard'
       };

       var patternKeys = ['landuse', 'natural', 'amenity'];

       function setPattern(d) {
           for (var i = 0; i < patternKeys.length; i++) {
               if (patterns.hasOwnProperty(d.tags[patternKeys[i]])) {
                   this.style.fill = this.style.stroke = 'url("#pattern-' + patterns[d.tags[patternKeys[i]]] + '")';
                   return;
               }
           }
           this.style.fill = this.style.stroke = '';
       }

       return function drawAreas(surface, graph, entities, filter) {
           var path = iD.svg.Path(projection, graph, true),
               areas = {},
               multipolygon;

           for (var i = 0; i < entities.length; i++) {
               var entity = entities[i];
               if (entity.geometry(graph) !== 'area') continue;

               multipolygon = iD.geo.isSimpleMultipolygonOuterMember(entity, graph);
               if (multipolygon) {
                   areas[multipolygon.id] = {
                       entity: multipolygon.mergeTags(entity.tags),
                       area: Math.abs(entity.area(graph))
                   };
               } else if (!areas[entity.id]) {
                   areas[entity.id] = {
                       entity: entity,
                       area: Math.abs(entity.area(graph))
                   };
               }
           }

           areas = d3.values(areas).filter(function hasPath(a) { return path(a.entity); });
           areas.sort(function areaSort(a, b) { return b.area - a.area; });
           areas = _.map(areas, 'entity');

           var strokes = areas.filter(function(area) {
               return area.type === 'way';
           });

           var data = {
               clip: areas,
               shadow: strokes,
               stroke: strokes,
               fill: areas
           };

           var clipPaths = surface.selectAll('defs').selectAll('.clipPath')
              .filter(filter)
              .data(data.clip, iD.Entity.key);

           clipPaths.enter()
              .append('clipPath')
              .attr('class', 'clipPath')
              .attr('id', function(entity) { return entity.id + '-clippath'; })
              .append('path');

           clipPaths.selectAll('path')
              .attr('d', path);

           clipPaths.exit()
              .remove();

           var areagroup = surface
               .selectAll('.layer-areas')
               .selectAll('g.areagroup')
               .data(['fill', 'shadow', 'stroke']);

           areagroup.enter()
               .append('g')
               .attr('class', function(d) { return 'layer areagroup area-' + d; });

           var paths = areagroup
               .selectAll('path')
               .filter(filter)
               .data(function(layer) { return data[layer]; }, iD.Entity.key);

           // Remove exiting areas first, so they aren't included in the `fills`
           // array used for sorting below (https://github.com/openstreetmap/iD/issues/1903).
           paths.exit()
               .remove();

           var fills = surface.selectAll('.area-fill path.area')[0];

           var bisect = d3.bisector(function(node) {
               return -node.__data__.area(graph);
           }).left;

           function sortedByArea(entity) {
               if (this.__data__ === 'fill') {
                   return fills[bisect(fills, -entity.area(graph))];
               }
           }

           paths.enter()
               .insert('path', sortedByArea)
               .each(function(entity) {
                   var layer = this.parentNode.__data__;

                   this.setAttribute('class', entity.type + ' area ' + layer + ' ' + entity.id);

                   if (layer === 'fill') {
                       this.setAttribute('clip-path', 'url(#' + entity.id + '-clippath)');
                       setPattern.apply(this, arguments);
                   }
               })
               .call(iD.svg.TagClasses());

           paths
               .attr('d', path);
       };
   }

   function Debug(projection, context) {

       function multipolygons(imagery) {
           return imagery.map(function(data) {
               return {
                   type: 'MultiPolygon',
                   coordinates: [ data.polygon ]
               };
           });
       }

       function drawDebug(surface) {
           var showsTile = context.getDebug('tile'),
               showsCollision = context.getDebug('collision'),
               showsImagery = context.getDebug('imagery'),
               showsImperial = context.getDebug('imperial'),
               showsDriveLeft = context.getDebug('driveLeft'),
               path = d3.geo.path().projection(projection);


           var debugData = [];
           if (showsTile) {
               debugData.push({ class: 'red', label: 'tile' });
           }
           if (showsCollision) {
               debugData.push({ class: 'yellow', label: 'collision' });
           }
           if (showsImagery) {
               debugData.push({ class: 'orange', label: 'imagery' });
           }
           if (showsImperial) {
               debugData.push({ class: 'cyan', label: 'imperial' });
           }
           if (showsDriveLeft) {
               debugData.push({ class: 'green', label: 'driveLeft' });
           }


           var legend = d3.select('#content')
               .selectAll('.debug-legend')
               .data(debugData.length ? [0] : []);

           legend.enter()
               .append('div')
               .attr('class', 'fillD debug-legend');

           legend.exit()
               .remove();


           var legendItems = legend.selectAll('.debug-legend-item')
               .data(debugData, function(d) { return d.label; });

           legendItems.enter()
               .append('span')
               .attr('class', function(d) { return 'debug-legend-item ' + d.class; })
               .text(function(d) { return d.label; });

           legendItems.exit()
               .remove();


           var layer = surface.selectAll('.layer-debug')
               .data(showsImagery || showsImperial || showsDriveLeft ? [0] : []);

           layer.enter()
               .append('g')
               .attr('class', 'layer-debug');

           layer.exit()
               .remove();


           var extent = context.map().extent(),
               availableImagery = showsImagery && multipolygons(iD.data.imagery.filter(function(source) {
                   if (!source.polygon) return false;
                   return source.polygon.some(function(polygon) {
                       return iD.geo.polygonIntersectsPolygon(polygon, extent, true);
                   });
               }));

           var imagery = layer.selectAll('path.debug-imagery')
               .data(showsImagery ? availableImagery : []);

           imagery.enter()
               .append('path')
               .attr('class', 'debug-imagery debug orange');

           imagery.exit()
               .remove();


           var imperial = layer
               .selectAll('path.debug-imperial')
               .data(showsImperial ? [iD.data.imperial] : []);

           imperial.enter()
               .append('path')
               .attr('class', 'debug-imperial debug cyan');

           imperial.exit()
               .remove();


           var driveLeft = layer
               .selectAll('path.debug-drive-left')
               .data(showsDriveLeft ? [iD.data.driveLeft] : []);

           driveLeft.enter()
               .append('path')
               .attr('class', 'debug-drive-left debug green');

           driveLeft.exit()
               .remove();


           // update
           layer.selectAll('path')
               .attr('d', path);
       }

       // This looks strange because `enabled` methods on other layers are
       // chainable getter/setters, and this one is just a getter.
       drawDebug.enabled = function() {
           if (!arguments.length) {
               return context.getDebug('tile') ||
                   context.getDebug('collision') ||
                   context.getDebug('imagery') ||
                   context.getDebug('imperial') ||
                   context.getDebug('driveLeft');
           } else {
               return this;
           }
       };

       return drawDebug;
   }

   /*
       A standalone SVG element that contains only a `defs` sub-element. To be
       used once globally, since defs IDs must be unique within a document.
   */
   function Defs(context) {

       function SVGSpriteDefinition(id, href) {
           return function(defs) {
               d3.xml(href, 'image/svg+xml', function(err, svg) {
                   if (err) return;
                   defs.node().appendChild(
                       d3.select(svg.documentElement).attr('id', id).node()
                   );
               });
           };
       }

       return function drawDefs(selection) {
           var defs = selection.append('defs');

           // marker
           defs.append('marker')
               .attr({
                   id: 'oneway-marker',
                   viewBox: '0 0 10 10',
                   refY: 2.5,
                   refX: 5,
                   markerWidth: 2,
                   markerHeight: 2,
                   markerUnits: 'strokeWidth',
                   orient: 'auto'
               })
               .append('path')
               .attr('class', 'oneway')
               .attr('d', 'M 5 3 L 0 3 L 0 2 L 5 2 L 5 0 L 10 2.5 L 5 5 z')
               .attr('stroke', 'none')
               .attr('fill', '#000')
               .attr('opacity', '0.5');

           // patterns
           var patterns = defs.selectAll('pattern')
               .data([
                   // pattern name, pattern image name
                   ['wetland', 'wetland'],
                   ['construction', 'construction'],
                   ['cemetery', 'cemetery'],
                   ['orchard', 'orchard'],
                   ['farmland', 'farmland'],
                   ['beach', 'dots'],
                   ['scrub', 'dots'],
                   ['meadow', 'dots']
               ])
               .enter()
               .append('pattern')
               .attr({
                   id: function (d) {
                       return 'pattern-' + d[0];
                   },
                   width: 32,
                   height: 32,
                   patternUnits: 'userSpaceOnUse'
               });

           patterns.append('rect')
               .attr({
                   x: 0,
                   y: 0,
                   width: 32,
                   height: 32,
                   'class': function (d) {
                       return 'pattern-color-' + d[0];
                   }
               });

           patterns.append('image')
               .attr({
                   x: 0,
                   y: 0,
                   width: 32,
                   height: 32
               })
               .attr('xlink:href', function (d) {
                   return context.imagePath('pattern/' + d[1] + '.png');
               });

           // clip paths
           defs.selectAll()
               .data([12, 18, 20, 32, 45])
               .enter().append('clipPath')
               .attr('id', function (d) {
                   return 'clip-square-' + d;
               })
               .append('rect')
               .attr('x', 0)
               .attr('y', 0)
               .attr('width', function (d) {
                   return d;
               })
               .attr('height', function (d) {
                   return d;
               });

           defs.call(SVGSpriteDefinition(
               'iD-sprite',
               context.imagePath('iD-sprite.svg')));

           defs.call(SVGSpriteDefinition(
               'maki-sprite',
               context.imagePath('maki-sprite.svg')));
       };
   }

   var require$$0$6 = {};

   var togeojson = createCommonjsModule(function (module, exports) {
   var toGeoJSON = (function() {
       'use strict';

       var removeSpace = (/\s*/g),
           trimSpace = (/^\s*|\s*$/g),
           splitSpace = (/\s+/);
       // generate a short, numeric hash of a string
       function okhash(x) {
           if (!x || !x.length) return 0;
           for (var i = 0, h = 0; i < x.length; i++) {
               h = ((h << 5) - h) + x.charCodeAt(i) | 0;
           } return h;
       }
       // all Y children of X
       function get(x, y) { return x.getElementsByTagName(y); }
       function attr(x, y) { return x.getAttribute(y); }
       function attrf(x, y) { return parseFloat(attr(x, y)); }
       // one Y child of X, if any, otherwise null
       function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
       // https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
       function norm(el) { if (el.normalize) { el.normalize(); } return el; }
       // cast array x into numbers
       function numarray(x) {
           for (var j = 0, o = []; j < x.length; j++) { o[j] = parseFloat(x[j]); }
           return o;
       }
       function clean(x) {
           var o = {};
           for (var i in x) { if (x[i]) { o[i] = x[i]; } }
           return o;
       }
       // get the content of a text node, if any
       function nodeVal(x) {
           if (x) { norm(x); }
           return (x && x.textContent) || '';
       }
       // get one coordinate from a coordinate array, if any
       function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
       // get all coordinates from a coordinate array as [[],[]]
       function coord(v) {
           var coords = v.replace(trimSpace, '').split(splitSpace),
               o = [];
           for (var i = 0; i < coords.length; i++) {
               o.push(coord1(coords[i]));
           }
           return o;
       }
       function coordPair(x) {
           var ll = [attrf(x, 'lon'), attrf(x, 'lat')],
               ele = get1(x, 'ele'),
               // handle namespaced attribute in browser
               heartRate = get1(x, 'gpxtpx:hr') || get1(x, 'hr'),
               time = get1(x, 'time'),
               e;
           if (ele) {
               e = parseFloat(nodeVal(ele));
               if (!isNaN(e)) {
                   ll.push(e);
               }
           }
           return {
               coordinates: ll,
               time: time ? nodeVal(time) : null,
               heartRate: heartRate ? parseFloat(nodeVal(heartRate)) : null
           };
       }

       // create a new feature collection parent object
       function fc() {
           return {
               type: 'FeatureCollection',
               features: []
           };
       }

       var serializer;
       if (typeof XMLSerializer !== 'undefined') {
           /* istanbul ignore next */
           serializer = new XMLSerializer();
       // only require xmldom in a node environment
       } else if (typeof exports === 'object' && typeof process === 'object' && !process.browser) {
           serializer = new (require$$0$6.XMLSerializer)();
       }
       function xml2str(str) {
           // IE9 will create a new XMLSerializer but it'll crash immediately.
           // This line is ignored because we don't run coverage tests in IE9
           /* istanbul ignore next */
           if (str.xml !== undefined) return str.xml;
           return serializer.serializeToString(str);
       }

       var t = {
           kml: function(doc) {

               var gj = fc(),
                   // styleindex keeps track of hashed styles in order to match features
                   styleIndex = {},
                   // atomic geospatial types supported by KML - MultiGeometry is
                   // handled separately
                   geotypes = ['Polygon', 'LineString', 'Point', 'Track', 'gx:Track'],
                   // all root placemarks in the file
                   placemarks = get(doc, 'Placemark'),
                   styles = get(doc, 'Style'),
                   styleMaps = get(doc, 'StyleMap');

               for (var k = 0; k < styles.length; k++) {
                   styleIndex['#' + attr(styles[k], 'id')] = okhash(xml2str(styles[k])).toString(16);
               }
               for (var l = 0; l < styleMaps.length; l++) {
                   styleIndex['#' + attr(styleMaps[l], 'id')] = okhash(xml2str(styleMaps[l])).toString(16);
               }
               for (var j = 0; j < placemarks.length; j++) {
                   gj.features = gj.features.concat(getPlacemark(placemarks[j]));
               }
               function kmlColor(v) {
                   var color, opacity;
                   v = v || '';
                   if (v.substr(0, 1) === '#') { v = v.substr(1); }
                   if (v.length === 6 || v.length === 3) { color = v; }
                   if (v.length === 8) {
                       opacity = parseInt(v.substr(0, 2), 16) / 255;
                       color = '#'+v.substr(2);
                   }
                   return [color, isNaN(opacity) ? undefined : opacity];
               }
               function gxCoord(v) { return numarray(v.split(' ')); }
               function gxCoords(root) {
                   var elems = get(root, 'coord', 'gx'), coords = [], times = [];
                   if (elems.length === 0) elems = get(root, 'gx:coord');
                   for (var i = 0; i < elems.length; i++) coords.push(gxCoord(nodeVal(elems[i])));
                   var timeElems = get(root, 'when');
                   for (var j = 0; j < timeElems.length; j++) times.push(nodeVal(timeElems[j]));
                   return {
                       coords: coords,
                       times: times
                   };
               }
               function getGeometry(root) {
                   var geomNode, geomNodes, i, j, k, geoms = [], coordTimes = [];
                   if (get1(root, 'MultiGeometry')) { return getGeometry(get1(root, 'MultiGeometry')); }
                   if (get1(root, 'MultiTrack')) { return getGeometry(get1(root, 'MultiTrack')); }
                   if (get1(root, 'gx:MultiTrack')) { return getGeometry(get1(root, 'gx:MultiTrack')); }
                   for (i = 0; i < geotypes.length; i++) {
                       geomNodes = get(root, geotypes[i]);
                       if (geomNodes) {
                           for (j = 0; j < geomNodes.length; j++) {
                               geomNode = geomNodes[j];
                               if (geotypes[i] === 'Point') {
                                   geoms.push({
                                       type: 'Point',
                                       coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                   });
                               } else if (geotypes[i] === 'LineString') {
                                   geoms.push({
                                       type: 'LineString',
                                       coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                   });
                               } else if (geotypes[i] === 'Polygon') {
                                   var rings = get(geomNode, 'LinearRing'),
                                       coords = [];
                                   for (k = 0; k < rings.length; k++) {
                                       coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                   }
                                   geoms.push({
                                       type: 'Polygon',
                                       coordinates: coords
                                   });
                               } else if (geotypes[i] === 'Track' ||
                                   geotypes[i] === 'gx:Track') {
                                   var track = gxCoords(geomNode);
                                   geoms.push({
                                       type: 'LineString',
                                       coordinates: track.coords
                                   });
                                   if (track.times.length) coordTimes.push(track.times);
                               }
                           }
                       }
                   }
                   return {
                       geoms: geoms,
                       coordTimes: coordTimes
                   };
               }
               function getPlacemark(root) {
                   var geomsAndTimes = getGeometry(root), i, properties = {},
                       name = nodeVal(get1(root, 'name')),
                       styleUrl = nodeVal(get1(root, 'styleUrl')),
                       description = nodeVal(get1(root, 'description')),
                       timeSpan = get1(root, 'TimeSpan'),
                       extendedData = get1(root, 'ExtendedData'),
                       lineStyle = get1(root, 'LineStyle'),
                       polyStyle = get1(root, 'PolyStyle');

                   if (!geomsAndTimes.geoms.length) return [];
                   if (name) properties.name = name;
                   if (styleUrl[0] !== '#') {
                       styleUrl = '#' + styleUrl;
                   }
                   if (styleUrl && styleIndex[styleUrl]) {
                       properties.styleUrl = styleUrl;
                       properties.styleHash = styleIndex[styleUrl];
                   }
                   if (description) properties.description = description;
                   if (timeSpan) {
                       var begin = nodeVal(get1(timeSpan, 'begin'));
                       var end = nodeVal(get1(timeSpan, 'end'));
                       properties.timespan = { begin: begin, end: end };
                   }
                   if (lineStyle) {
                       var linestyles = kmlColor(nodeVal(get1(lineStyle, 'color'))),
                           color = linestyles[0],
                           opacity = linestyles[1],
                           width = parseFloat(nodeVal(get1(lineStyle, 'width')));
                       if (color) properties.stroke = color;
                       if (!isNaN(opacity)) properties['stroke-opacity'] = opacity;
                       if (!isNaN(width)) properties['stroke-width'] = width;
                   }
                   if (polyStyle) {
                       var polystyles = kmlColor(nodeVal(get1(polyStyle, 'color'))),
                           pcolor = polystyles[0],
                           popacity = polystyles[1],
                           fill = nodeVal(get1(polyStyle, 'fill')),
                           outline = nodeVal(get1(polyStyle, 'outline'));
                       if (pcolor) properties.fill = pcolor;
                       if (!isNaN(popacity)) properties['fill-opacity'] = popacity;
                       if (fill) properties['fill-opacity'] = fill === '1' ? 1 : 0;
                       if (outline) properties['stroke-opacity'] = outline === '1' ? 1 : 0;
                   }
                   if (extendedData) {
                       var datas = get(extendedData, 'Data'),
                           simpleDatas = get(extendedData, 'SimpleData');

                       for (i = 0; i < datas.length; i++) {
                           properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                       }
                       for (i = 0; i < simpleDatas.length; i++) {
                           properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                       }
                   }
                   if (geomsAndTimes.coordTimes.length) {
                       properties.coordTimes = (geomsAndTimes.coordTimes.length === 1) ?
                           geomsAndTimes.coordTimes[0] : geomsAndTimes.coordTimes;
                   }
                   var feature = {
                       type: 'Feature',
                       geometry: (geomsAndTimes.geoms.length === 1) ? geomsAndTimes.geoms[0] : {
                           type: 'GeometryCollection',
                           geometries: geomsAndTimes.geoms
                       },
                       properties: properties
                   };
                   if (attr(root, 'id')) feature.id = attr(root, 'id');
                   return [feature];
               }
               return gj;
           },
           gpx: function(doc) {
               var i,
                   tracks = get(doc, 'trk'),
                   routes = get(doc, 'rte'),
                   waypoints = get(doc, 'wpt'),
                   // a feature collection
                   gj = fc(),
                   feature;
               for (i = 0; i < tracks.length; i++) {
                   feature = getTrack(tracks[i]);
                   if (feature) gj.features.push(feature);
               }
               for (i = 0; i < routes.length; i++) {
                   feature = getRoute(routes[i]);
                   if (feature) gj.features.push(feature);
               }
               for (i = 0; i < waypoints.length; i++) {
                   gj.features.push(getPoint(waypoints[i]));
               }
               function getPoints(node, pointname) {
                   var pts = get(node, pointname),
                       line = [],
                       times = [],
                       heartRates = [],
                       l = pts.length;
                   if (l < 2) return {};  // Invalid line in GeoJSON
                   for (var i = 0; i < l; i++) {
                       var c = coordPair(pts[i]);
                       line.push(c.coordinates);
                       if (c.time) times.push(c.time);
                       if (c.heartRate) heartRates.push(c.heartRate);
                   }
                   return {
                       line: line,
                       times: times,
                       heartRates: heartRates
                   };
               }
               function getTrack(node) {
                   var segments = get(node, 'trkseg'),
                       track = [],
                       times = [],
                       heartRates = [],
                       line;
                   for (var i = 0; i < segments.length; i++) {
                       line = getPoints(segments[i], 'trkpt');
                       if (line.line) track.push(line.line);
                       if (line.times && line.times.length) times.push(line.times);
                       if (line.heartRates && line.heartRates.length) heartRates.push(line.heartRates);
                   }
                   if (track.length === 0) return;
                   var properties = getProperties(node);
                   if (times.length) properties.coordTimes = track.length === 1 ? times[0] : times;
                   if (heartRates.length) properties.heartRates = track.length === 1 ? heartRates[0] : heartRates;
                   return {
                       type: 'Feature',
                       properties: properties,
                       geometry: {
                           type: track.length === 1 ? 'LineString' : 'MultiLineString',
                           coordinates: track.length === 1 ? track[0] : track
                       }
                   };
               }
               function getRoute(node) {
                   var line = getPoints(node, 'rtept');
                   if (!line.line) return;
                   var routeObj = {
                       type: 'Feature',
                       properties: getProperties(node),
                       geometry: {
                           type: 'LineString',
                           coordinates: line.line
                       }
                   };
                   return routeObj;
               }
               function getPoint(node) {
                   var prop = getProperties(node);
                   prop.sym = nodeVal(get1(node, 'sym'));
                   return {
                       type: 'Feature',
                       properties: prop,
                       geometry: {
                           type: 'Point',
                           coordinates: coordPair(node).coordinates
                       }
                   };
               }
               function getProperties(node) {
                   var meta = ['name', 'desc', 'author', 'copyright', 'link',
                               'time', 'keywords'],
                       prop = {},
                       k;
                   for (k = 0; k < meta.length; k++) {
                       prop[meta[k]] = nodeVal(get1(node, meta[k]));
                   }
                   return clean(prop);
               }
               return gj;
           }
       };
       return t;
   })();

   if (typeof module !== 'undefined') module.exports = toGeoJSON;
   });

   var toGeoJSON = (togeojson && typeof togeojson === 'object' && 'default' in togeojson ? togeojson['default'] : togeojson);

   function Gpx(projection, context, dispatch) {
       var showLabels = true,
           layer;

       function init() {
           if (iD.svg.Gpx.initialized) return;  // run once

           iD.svg.Gpx.geojson = {};
           iD.svg.Gpx.enabled = true;

           function over() {
               d3.event.stopPropagation();
               d3.event.preventDefault();
               d3.event.dataTransfer.dropEffect = 'copy';
           }

           d3.select('body')
               .attr('dropzone', 'copy')
               .on('drop.localgpx', function() {
                   d3.event.stopPropagation();
                   d3.event.preventDefault();
                   if (!iD.detect().filedrop) return;
                   drawGpx.files(d3.event.dataTransfer.files);
               })
               .on('dragenter.localgpx', over)
               .on('dragexit.localgpx', over)
               .on('dragover.localgpx', over);

           iD.svg.Gpx.initialized = true;
       }


       function drawGpx(surface) {
           var geojson = iD.svg.Gpx.geojson,
               enabled = iD.svg.Gpx.enabled;

           layer = surface.selectAll('.layer-gpx')
               .data(enabled ? [0] : []);

           layer.enter()
               .append('g')
               .attr('class', 'layer-gpx');

           layer.exit()
               .remove();


           var paths = layer
               .selectAll('path')
               .data([geojson]);

           paths.enter()
               .append('path')
               .attr('class', 'gpx');

           paths.exit()
               .remove();

           var path = d3.geo.path()
               .projection(projection);

           paths
               .attr('d', path);


           var labels = layer.selectAll('text')
               .data(showLabels && geojson.features ? geojson.features : []);

           labels.enter()
               .append('text')
               .attr('class', 'gpx');

           labels.exit()
               .remove();

           labels
               .text(function(d) {
                   return d.properties.desc || d.properties.name;
               })
               .attr('x', function(d) {
                   var centroid = path.centroid(d);
                   return centroid[0] + 7;
               })
               .attr('y', function(d) {
                   var centroid = path.centroid(d);
                   return centroid[1];
               });

       }

       function toDom(x) {
           return (new DOMParser()).parseFromString(x, 'text/xml');
       }

       drawGpx.showLabels = function(_) {
           if (!arguments.length) return showLabels;
           showLabels = _;
           return this;
       };

       drawGpx.enabled = function(_) {
           if (!arguments.length) return iD.svg.Gpx.enabled;
           iD.svg.Gpx.enabled = _;
           dispatch.change();
           return this;
       };

       drawGpx.hasGpx = function() {
           var geojson = iD.svg.Gpx.geojson;
           return (!(_.isEmpty(geojson) || _.isEmpty(geojson.features)));
       };

       drawGpx.geojson = function(gj) {
           if (!arguments.length) return iD.svg.Gpx.geojson;
           if (_.isEmpty(gj) || _.isEmpty(gj.features)) return this;
           iD.svg.Gpx.geojson = gj;
           dispatch.change();
           return this;
       };

       drawGpx.url = function(url) {
           d3.text(url, function(err, data) {
               if (!err) {
                   drawGpx.geojson(toGeoJSON.gpx(toDom(data)));
               }
           });
           return this;
       };

       drawGpx.files = function(fileList) {
           if (!fileList.length) return this;
           var f = fileList[0],
               reader = new FileReader();

           reader.onload = function(e) {
               drawGpx.geojson(toGeoJSON.gpx(toDom(e.target.result))).fitZoom();
           };

           reader.readAsText(f);
           return this;
       };

       drawGpx.fitZoom = function() {
           if (!this.hasGpx()) return this;
           var geojson = iD.svg.Gpx.geojson;

           var map = context.map(),
               viewport = map.trimmedExtent().polygon(),
               coords = _.reduce(geojson.features, function(coords, feature) {
                   var c = feature.geometry.coordinates;
                   return _.union(coords, feature.geometry.type === 'Point' ? [c] : c);
               }, []);

           if (!iD.geo.polygonIntersectsPolygon(viewport, coords, true)) {
               var extent = iD.geo.Extent(d3.geo.bounds(geojson));
               map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
           }

           return this;
       };

       init();
       return drawGpx;
   }

   function Icon(name, svgklass, useklass) {
       return function drawIcon(selection) {
           selection.selectAll('svg')
               .data([0])
               .enter()
               .append('svg')
               .attr('class', 'icon ' + (svgklass || ''))
               .append('use')
               .attr('xlink:href', name)
               .attr('class', useklass);
       };
   }

   function Labels(projection, context) {
       var path = d3.geo.path().projection(projection);

       // Replace with dict and iterate over entities tags instead?
       var label_stack = [
           ['line', 'aeroway'],
           ['line', 'highway'],
           ['line', 'railway'],
           ['line', 'waterway'],
           ['area', 'aeroway'],
           ['area', 'amenity'],
           ['area', 'building'],
           ['area', 'historic'],
           ['area', 'leisure'],
           ['area', 'man_made'],
           ['area', 'natural'],
           ['area', 'shop'],
           ['area', 'tourism'],
           ['point', 'aeroway'],
           ['point', 'amenity'],
           ['point', 'building'],
           ['point', 'historic'],
           ['point', 'leisure'],
           ['point', 'man_made'],
           ['point', 'natural'],
           ['point', 'shop'],
           ['point', 'tourism'],
           ['line', 'name'],
           ['area', 'name'],
           ['point', 'name']
       ];

       var default_size = 12;

       var font_sizes = label_stack.map(function(d) {
           var style = iD.util.getStyle('text.' + d[0] + '.tag-' + d[1]),
               m = style && style.cssText.match('font-size: ([0-9]{1,2})px;');
           if (m) return parseInt(m[1], 10);

           style = iD.util.getStyle('text.' + d[0]);
           m = style && style.cssText.match('font-size: ([0-9]{1,2})px;');
           if (m) return parseInt(m[1], 10);

           return default_size;
       });

       var iconSize = 18;

       var pointOffsets = [
           [15, -11, 'start'], // right
           [10, -11, 'start'], // unused right now
           [-15, -11, 'end']
       ];

       var lineOffsets = [50, 45, 55, 40, 60, 35, 65, 30, 70, 25,
           75, 20, 80, 15, 95, 10, 90, 5, 95];


       var noIcons = ['building', 'landuse', 'natural'];
       function blacklisted(preset) {
           return _.some(noIcons, function(s) {
               return preset.id.indexOf(s) >= 0;
           });
       }

       function get(array, prop) {
           return function(d, i) { return array[i][prop]; };
       }

       var textWidthCache = {};

       function textWidth(text, size, elem) {
           var c = textWidthCache[size];
           if (!c) c = textWidthCache[size] = {};

           if (c[text]) {
               return c[text];

           } else if (elem) {
               c[text] = elem.getComputedTextLength();
               return c[text];

           } else {
               var str = encodeURIComponent(text).match(/%[CDEFcdef]/g);
               if (str === null) {
                   return size / 3 * 2 * text.length;
               } else {
                   return size / 3 * (2 * text.length + str.length);
               }
           }
       }

       function drawLineLabels(group, entities, filter, classes, labels) {
           var texts = group.selectAll('text.' + classes)
               .filter(filter)
               .data(entities, iD.Entity.key);

           texts.enter()
               .append('text')
               .attr('class', function(d, i) { return classes + ' ' + labels[i].classes + ' ' + d.id; })
               .append('textPath')
               .attr('class', 'textpath');


           texts.selectAll('.textpath')
               .filter(filter)
               .data(entities, iD.Entity.key)
               .attr({
                   'startOffset': '50%',
                   'xlink:href': function(d) { return '#labelpath-' + d.id; }
               })
               .text(iD.util.displayName);

           texts.exit().remove();
       }

       function drawLinePaths(group, entities, filter, classes, labels) {
           var halos = group.selectAll('path')
               .filter(filter)
               .data(entities, iD.Entity.key);

           halos.enter()
               .append('path')
               .style('stroke-width', get(labels, 'font-size'))
               .attr('id', function(d) { return 'labelpath-' + d.id; })
               .attr('class', classes);

           halos.attr('d', get(labels, 'lineString'));

           halos.exit().remove();
       }

       function drawPointLabels(group, entities, filter, classes, labels) {
           var texts = group.selectAll('text.' + classes)
               .filter(filter)
               .data(entities, iD.Entity.key);

           texts.enter()
               .append('text')
               .attr('class', function(d, i) { return classes + ' ' + labels[i].classes + ' ' + d.id; });

           texts.attr('x', get(labels, 'x'))
               .attr('y', get(labels, 'y'))
               .style('text-anchor', get(labels, 'textAnchor'))
               .text(iD.util.displayName)
               .each(function(d, i) { textWidth(iD.util.displayName(d), labels[i].height, this); });

           texts.exit().remove();
           return texts;
       }

       function drawAreaLabels(group, entities, filter, classes, labels) {
           entities = entities.filter(hasText);
           labels = labels.filter(hasText);
           return drawPointLabels(group, entities, filter, classes, labels);

           function hasText(d, i) {
               return labels[i].hasOwnProperty('x') && labels[i].hasOwnProperty('y');
           }
       }

       function drawAreaIcons(group, entities, filter, classes, labels) {
           var icons = group.selectAll('use')
               .filter(filter)
               .data(entities, iD.Entity.key);

           icons.enter()
               .append('use')
               .attr('class', 'icon areaicon')
               .attr('width', '18px')
               .attr('height', '18px');

           icons.attr('transform', get(labels, 'transform'))
               .attr('xlink:href', function(d) {
                   var icon = context.presets().match(d, context.graph()).icon;
                   return '#' + icon + (icon === 'hairdresser' ? '-24': '-18');    // workaround: maki hairdresser-18 broken?
               });


           icons.exit().remove();
       }

       function reverse(p) {
           var angle = Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]);
           return !(p[0][0] < p[p.length - 1][0] && angle < Math.PI/2 && angle > -Math.PI/2);
       }

       function lineString(nodes) {
           return 'M' + nodes.join('L');
       }

       function subpath(nodes, from, to) {
           function segmentLength(i) {
               var dx = nodes[i][0] - nodes[i + 1][0];
               var dy = nodes[i][1] - nodes[i + 1][1];
               return Math.sqrt(dx * dx + dy * dy);
           }

           var sofar = 0,
               start, end, i0, i1;
           for (var i = 0; i < nodes.length - 1; i++) {
               var current = segmentLength(i);
               var portion;
               if (!start && sofar + current >= from) {
                   portion = (from - sofar) / current;
                   start = [
                       nodes[i][0] + portion * (nodes[i + 1][0] - nodes[i][0]),
                       nodes[i][1] + portion * (nodes[i + 1][1] - nodes[i][1])
                   ];
                   i0 = i + 1;
               }
               if (!end && sofar + current >= to) {
                   portion = (to - sofar) / current;
                   end = [
                       nodes[i][0] + portion * (nodes[i + 1][0] - nodes[i][0]),
                       nodes[i][1] + portion * (nodes[i + 1][1] - nodes[i][1])
                   ];
                   i1 = i + 1;
               }
               sofar += current;

           }
           var ret = nodes.slice(i0, i1);
           ret.unshift(start);
           ret.push(end);
           return ret;

       }

       function hideOnMouseover() {
           var layers = d3.select(this)
               .selectAll('.layer-label, .layer-halo');

           layers.selectAll('.proximate')
               .classed('proximate', false);

           var mouse = context.mouse(),
               pad = 50,
               bbox = { minX: mouse[0] - pad, minY: mouse[1] - pad, maxX: mouse[0] + pad, maxY: mouse[1] + pad },
               ids = _.map(rtree.search(bbox), 'id');

           if (!ids.length) return;
           layers.selectAll('.' + ids.join(', .'))
               .classed('proximate', true);
       }

       var rtree = rbush(),
           bboxes = {};

       function drawLabels(surface, graph, entities, filter, dimensions, fullRedraw) {
           var hidePoints = !surface.selectAll('.node.point').node();

           var labelable = [], i, k, entity;
           for (i = 0; i < label_stack.length; i++) labelable.push([]);

           if (fullRedraw) {
               rtree.clear();
               bboxes = {};
           } else {
               for (i = 0; i < entities.length; i++) {
                   rtree.remove(bboxes[entities[i].id]);
               }
           }

           // Split entities into groups specified by label_stack
           for (i = 0; i < entities.length; i++) {
               entity = entities[i];
               var geometry = entity.geometry(graph);

               if (geometry === 'vertex')
                   continue;
               if (hidePoints && geometry === 'point')
                   continue;

               var preset = geometry === 'area' && context.presets().match(entity, graph),
                   icon = preset && !blacklisted(preset) && preset.icon;

               if (!icon && !iD.util.displayName(entity))
                   continue;

               for (k = 0; k < label_stack.length; k++) {
                   if (geometry === label_stack[k][0] && entity.tags[label_stack[k][1]]) {
                       labelable[k].push(entity);
                       break;
                   }
               }
           }

           var positions = {
               point: [],
               line: [],
               area: []
           };

           var labelled = {
               point: [],
               line: [],
               area: []
           };

           // Try and find a valid label for labellable entities
           for (k = 0; k < labelable.length; k++) {
               var font_size = font_sizes[k];
               for (i = 0; i < labelable[k].length; i++) {
                   entity = labelable[k][i];
                   var name = iD.util.displayName(entity),
                       width = name && textWidth(name, font_size),
                       p;
                   if (entity.geometry(graph) === 'point') {
                       p = getPointLabel(entity, width, font_size);
                   } else if (entity.geometry(graph) === 'line') {
                       p = getLineLabel(entity, width, font_size);
                   } else if (entity.geometry(graph) === 'area') {
                       p = getAreaLabel(entity, width, font_size);
                   }
                   if (p) {
                       p.classes = entity.geometry(graph) + ' tag-' + label_stack[k][1];
                       positions[entity.geometry(graph)].push(p);
                       labelled[entity.geometry(graph)].push(entity);
                   }
               }
           }

           function getPointLabel(entity, width, height) {
               var coord = projection(entity.loc),
                   m = 5,  // margin
                   offset = pointOffsets[0],
                   p = {
                       height: height,
                       width: width,
                       x: coord[0] + offset[0],
                       y: coord[1] + offset[1],
                       textAnchor: offset[2]
                   };
               var bbox = { minX: p.x - m, minY: p.y - m, maxX: p.x + width + m, maxY: p.y + height + m };
               if (tryInsert(bbox, entity.id)) return p;
           }


           function getLineLabel(entity, width, height) {
               var nodes = _.map(graph.childNodes(entity), 'loc').map(projection),
                   length = iD.geo.pathLength(nodes);
               if (length < width + 20) return;

               for (var i = 0; i < lineOffsets.length; i++) {
                   var offset = lineOffsets[i],
                       middle = offset / 100 * length,
                       start = middle - width/2;
                   if (start < 0 || start + width > length) continue;
                   var sub = subpath(nodes, start, start + width),
                       rev = reverse(sub),
                       bbox = {
                           minX: Math.min(sub[0][0], sub[sub.length - 1][0]) - 10,
                           minY: Math.min(sub[0][1], sub[sub.length - 1][1]) - 10,
                           maxX: Math.max(sub[0][0], sub[sub.length - 1][0]) + 20,
                           maxY: Math.max(sub[0][1], sub[sub.length - 1][1]) + 30
                       };
                   if (rev) sub = sub.reverse();
                   if (tryInsert(bbox, entity.id)) return {
                       'font-size': height + 2,
                       lineString: lineString(sub),
                       startOffset: offset + '%'
                   };
               }
           }

           function getAreaLabel(entity, width, height) {
               var centroid = path.centroid(entity.asGeoJSON(graph, true)),
                   extent = entity.extent(graph),
                   entitywidth = projection(extent[1])[0] - projection(extent[0])[0],
                   bbox;

               if (isNaN(centroid[0]) || entitywidth < 20) return;

               var iconX = centroid[0] - (iconSize/2),
                   iconY = centroid[1] - (iconSize/2),
                   textOffset = iconSize + 5;

               var p = {
                   transform: 'translate(' + iconX + ',' + iconY + ')'
               };

               if (width && entitywidth >= width + 20) {
                   p.x = centroid[0];
                   p.y = centroid[1] + textOffset;
                   p.textAnchor = 'middle';
                   p.height = height;
                   bbox = { minX: p.x - width/2, minY: p.y, maxX: p.x + width/2, maxY: p.y + height + textOffset };
               } else {
                   bbox = { minX: iconX, minY: iconY, maxX: iconX + iconSize, maxY: iconY + iconSize };
               }

               if (tryInsert(bbox, entity.id)) return p;

           }

           function tryInsert(bbox, id) {
               // Check that label is visible
               if (bbox.minX < 0 || bbox.minY < 0 || bbox.maxX > dimensions[0] || bbox.maxY > dimensions[1]) return false;
               var v = rtree.search(bbox).length === 0;
               if (v) {
                   bbox.id = id;
                   rtree.insert(bbox);
                   bboxes[id] = bbox;
               }
               return v;
           }

           var label = surface.selectAll('.layer-label'),
               halo = surface.selectAll('.layer-halo');

           // points
           drawPointLabels(label, labelled.point, filter, 'pointlabel', positions.point);
           drawPointLabels(halo, labelled.point, filter, 'pointlabel-halo', positions.point);

           // lines
           drawLinePaths(halo, labelled.line, filter, '', positions.line);
           drawLineLabels(label, labelled.line, filter, 'linelabel', positions.line);
           drawLineLabels(halo, labelled.line, filter, 'linelabel-halo', positions.line);

           // areas
           drawAreaLabels(label, labelled.area, filter, 'arealabel', positions.area);
           drawAreaLabels(halo, labelled.area, filter, 'arealabel-halo', positions.area);
           drawAreaIcons(label, labelled.area, filter, 'arealabel-icon', positions.area);

           // debug
           var showDebug = context.getDebug('collision');
           var debug = label.selectAll('.layer-label-debug')
               .data(showDebug ? [true] : []);

           debug.enter()
               .append('g')
               .attr('class', 'layer-label-debug');

           debug.exit()
               .remove();

           if (showDebug) {
               var gj = rtree.all().map(function(d) {
                   return { type: 'Polygon', coordinates: [[
                       [d.minX, d.minY],
                       [d.maxX, d.minY],
                       [d.maxX, d.maxY],
                       [d.minX, d.maxY],
                       [d.minX, d.minY]
                   ]]};
               });

               var debugboxes = debug.selectAll('.debug').data(gj);

               debugboxes.enter()
                   .append('path')
                   .attr('class', 'debug yellow');

               debugboxes.exit()
                   .remove();

               debugboxes
                   .attr('d', d3.geo.path().projection(null));
           }
       }

       drawLabels.supersurface = function(supersurface) {
           supersurface
               .on('mousemove.hidelabels', hideOnMouseover)
               .on('mousedown.hidelabels', function () {
                   supersurface.on('mousemove.hidelabels', null);
               })
               .on('mouseup.hidelabels', function () {
                   supersurface.on('mousemove.hidelabels', hideOnMouseover);
               });
       };

       return drawLabels;
   }

   function Layers(projection, context) {
       var dispatch = d3.dispatch('change'),
           svg = d3.select(null),
           layers = [
               { id: 'osm', layer: iD.svg.Osm(projection, context, dispatch) },
               { id: 'gpx', layer: iD.svg.Gpx(projection, context, dispatch) },
               { id: 'mapillary-images', layer: iD.svg.MapillaryImages(projection, context, dispatch) },
               { id: 'mapillary-signs',  layer: iD.svg.MapillarySigns(projection, context, dispatch) },
               { id: 'debug', layer: iD.svg.Debug(projection, context, dispatch) }
           ];


       function drawLayers(selection) {
           svg = selection.selectAll('.surface')
               .data([0]);

           svg.enter()
               .append('svg')
               .attr('class', 'surface')
               .append('defs');

           var groups = svg.selectAll('.data-layer')
               .data(layers);

           groups.enter()
               .append('g')
               .attr('class', function(d) { return 'data-layer data-layer-' + d.id; });

           groups
               .each(function(d) { d3.select(this).call(d.layer); });

           groups.exit()
               .remove();
       }

       drawLayers.all = function() {
           return layers;
       };

       drawLayers.layer = function(id) {
           var obj = _.find(layers, function(o) {return o.id === id;});
           return obj && obj.layer;
       };

       drawLayers.only = function(what) {
           var arr = [].concat(what);
           drawLayers.remove(_.difference(_.map(layers, 'id'), arr));
           return this;
       };

       drawLayers.remove = function(what) {
           var arr = [].concat(what);
           arr.forEach(function(id) {
               layers = _.reject(layers, function(o) {return o.id === id;});
           });
           dispatch.change();
           return this;
       };

       drawLayers.add = function(what) {
           var arr = [].concat(what);
           arr.forEach(function(obj) {
               if ('id' in obj && 'layer' in obj) {
                   layers.push(obj);
               }
           });
           dispatch.change();
           return this;
       };

       drawLayers.dimensions = function(_) {
           if (!arguments.length) return svg.dimensions();
           svg.dimensions(_);
           layers.forEach(function(obj) {
               if (obj.layer.dimensions) {
                   obj.layer.dimensions(_);
               }
           });
           return this;
       };


       return d3.rebind(drawLayers, dispatch, 'on');
   }

   function Lines(projection) {

       var highway_stack = {
           motorway: 0,
           motorway_link: 1,
           trunk: 2,
           trunk_link: 3,
           primary: 4,
           primary_link: 5,
           secondary: 6,
           tertiary: 7,
           unclassified: 8,
           residential: 9,
           service: 10,
           footway: 11
       };

       function waystack(a, b) {
           var as = 0, bs = 0;

           if (a.tags.highway) { as -= highway_stack[a.tags.highway]; }
           if (b.tags.highway) { bs -= highway_stack[b.tags.highway]; }
           return as - bs;
       }

       return function drawLines(surface, graph, entities, filter) {
           var ways = [], pathdata = {}, onewaydata = {},
               getPath = iD.svg.Path(projection, graph);

           for (var i = 0; i < entities.length; i++) {
               var entity = entities[i],
                   outer = iD.geo.simpleMultipolygonOuterMember(entity, graph);
               if (outer) {
                   ways.push(entity.mergeTags(outer.tags));
               } else if (entity.geometry(graph) === 'line') {
                   ways.push(entity);
               }
           }

           ways = ways.filter(getPath);

           pathdata = _.groupBy(ways, function(way) { return way.layer(); });

           _.forOwn(pathdata, function(v, k) {
               onewaydata[k] = _(v)
                   .filter(function(d) { return d.isOneWay(); })
                   .map(iD.svg.OneWaySegments(projection, graph, 35))
                   .flatten()
                   .valueOf();
           });

           var layergroup = surface
               .selectAll('.layer-lines')
               .selectAll('g.layergroup')
               .data(d3.range(-10, 11));

           layergroup.enter()
               .append('g')
               .attr('class', function(d) { return 'layer layergroup layer' + String(d); });


           var linegroup = layergroup
               .selectAll('g.linegroup')
               .data(['shadow', 'casing', 'stroke']);

           linegroup.enter()
               .append('g')
               .attr('class', function(d) { return 'layer linegroup line-' + d; });


           var lines = linegroup
               .selectAll('path')
               .filter(filter)
               .data(
                   function() { return pathdata[this.parentNode.parentNode.__data__] || []; },
                   iD.Entity.key
               );

           // Optimization: call simple TagClasses only on enter selection. This
           // works because iD.Entity.key is defined to include the entity v attribute.
           lines.enter()
               .append('path')
               .attr('class', function(d) { return 'way line ' + this.parentNode.__data__ + ' ' + d.id; })
               .call(iD.svg.TagClasses());

           lines
               .sort(waystack)
               .attr('d', getPath)
               .call(iD.svg.TagClasses().tags(iD.svg.RelationMemberTags(graph)));

           lines.exit()
               .remove();


           var onewaygroup = layergroup
               .selectAll('g.onewaygroup')
               .data(['oneway']);

           onewaygroup.enter()
               .append('g')
               .attr('class', 'layer onewaygroup');


           var oneways = onewaygroup
               .selectAll('path')
               .filter(filter)
               .data(
                   function() { return onewaydata[this.parentNode.parentNode.__data__] || []; },
                   function(d) { return [d.id, d.index]; }
               );

           oneways.enter()
               .append('path')
               .attr('class', 'oneway')
               .attr('marker-mid', 'url(#oneway-marker)');

           oneways
               .attr('d', function(d) { return d.d; });

           if (iD.detect().ie) {
               oneways.each(function() { this.parentNode.insertBefore(this, this); });
           }

           oneways.exit()
               .remove();

       };
   }

   function Midpoints(projection, context) {
       return function drawMidpoints(surface, graph, entities, filter, extent) {
           var poly = extent.polygon(),
               midpoints = {};

           for (var i = 0; i < entities.length; i++) {
               var entity = entities[i];

               if (entity.type !== 'way')
                   continue;
               if (!filter(entity))
                   continue;
               if (context.selectedIDs().indexOf(entity.id) < 0)
                   continue;

               var nodes = graph.childNodes(entity);
               for (var j = 0; j < nodes.length - 1; j++) {

                   var a = nodes[j],
                       b = nodes[j + 1],
                       id = [a.id, b.id].sort().join('-');

                   if (midpoints[id]) {
                       midpoints[id].parents.push(entity);
                   } else {
                       if (iD.geo.euclideanDistance(projection(a.loc), projection(b.loc)) > 40) {
                           var point = iD.geo.interp(a.loc, b.loc, 0.5),
                               loc = null;

                           if (extent.intersects(point)) {
                               loc = point;
                           } else {
                               for (var k = 0; k < 4; k++) {
                                   point = iD.geo.lineIntersection([a.loc, b.loc], [poly[k], poly[k+1]]);
                                   if (point &&
                                       iD.geo.euclideanDistance(projection(a.loc), projection(point)) > 20 &&
                                       iD.geo.euclideanDistance(projection(b.loc), projection(point)) > 20)
                                   {
                                       loc = point;
                                       break;
                                   }
                               }
                           }

                           if (loc) {
                               midpoints[id] = {
                                   type: 'midpoint',
                                   id: id,
                                   loc: loc,
                                   edge: [a.id, b.id],
                                   parents: [entity]
                               };
                           }
                       }
                   }
               }
           }

           function midpointFilter(d) {
               if (midpoints[d.id])
                   return true;

               for (var i = 0; i < d.parents.length; i++)
                   if (filter(d.parents[i]))
                       return true;

               return false;
           }

           var groups = surface.selectAll('.layer-hit').selectAll('g.midpoint')
               .filter(midpointFilter)
               .data(_.values(midpoints), function(d) { return d.id; });

           var enter = groups.enter()
               .insert('g', ':first-child')
               .attr('class', 'midpoint');

           enter.append('polygon')
               .attr('points', '-6,8 10,0 -6,-8')
               .attr('class', 'shadow');

           enter.append('polygon')
               .attr('points', '-3,4 5,0 -3,-4')
               .attr('class', 'fill');

           groups
               .attr('transform', function(d) {
                   var translate = iD.svg.PointTransform(projection),
                       a = context.entity(d.edge[0]),
                       b = context.entity(d.edge[1]),
                       angle = Math.round(iD.geo.angle(a, b, projection) * (180 / Math.PI));
                   return translate(d) + ' rotate(' + angle + ')';
               })
               .call(iD.svg.TagClasses().tags(
                   function(d) { return d.parents[0].tags; }
               ));

           // Propagate data bindings.
           groups.select('polygon.shadow');
           groups.select('polygon.fill');

           groups.exit()
               .remove();
       };
   }

   function Points(projection, context) {
       function markerPath(selection, klass) {
           selection
               .attr('class', klass)
               .attr('transform', 'translate(-8, -23)')
               .attr('d', 'M 17,8 C 17,13 11,21 8.5,23.5 C 6,21 0,13 0,8 C 0,4 4,-0.5 8.5,-0.5 C 13,-0.5 17,4 17,8 z');
       }

       function sortY(a, b) {
           return b.loc[1] - a.loc[1];
       }

       return function drawPoints(surface, graph, entities, filter) {
           var wireframe = surface.classed('fill-wireframe'),
               points = wireframe ? [] : _.filter(entities, function(e) {
                   return e.geometry(graph) === 'point';
               });

           points.sort(sortY);

           var groups = surface.selectAll('.layer-hit').selectAll('g.point')
               .filter(filter)
               .data(points, iD.Entity.key);

           var group = groups.enter()
               .append('g')
               .attr('class', function(d) { return 'node point ' + d.id; })
               .order();

           group.append('path')
               .call(markerPath, 'shadow');

           group.append('path')
               .call(markerPath, 'stroke');

           group.append('use')
               .attr('transform', 'translate(-6, -20)')
               .attr('class', 'icon')
               .attr('width', '12px')
               .attr('height', '12px');

           groups.attr('transform', iD.svg.PointTransform(projection))
               .call(iD.svg.TagClasses());

           // Selecting the following implicitly
           // sets the data (point entity) on the element
           groups.select('.shadow');
           groups.select('.stroke');
           groups.select('.icon')
               .attr('xlink:href', function(entity) {
                   var preset = context.presets().match(entity, graph);
                   return preset.icon ? '#' + preset.icon + '-12' : '';
               });

           groups.exit()
               .remove();
       };
   }

   function Turns(projection) {
       return function drawTurns(surface, graph, turns) {
           function key(turn) {
               return [turn.from.node + turn.via.node + turn.to.node].join('-');
           }

           function icon(turn) {
               var u = turn.u ? '-u' : '';
               if (!turn.restriction)
                   return '#turn-yes' + u;
               var restriction = graph.entity(turn.restriction).tags.restriction;
               return '#turn-' +
                   (!turn.indirect_restriction && /^only_/.test(restriction) ? 'only' : 'no') + u;
           }

           var groups = surface.selectAll('.layer-hit').selectAll('g.turn')
               .data(turns, key);

           // Enter
           var enter = groups.enter().append('g')
               .attr('class', 'turn');

           var nEnter = enter.filter(function (turn) { return !turn.u; });

           nEnter.append('rect')
               .attr('transform', 'translate(-22, -12)')
               .attr('width', '44')
               .attr('height', '24');

           nEnter.append('use')
               .attr('transform', 'translate(-22, -12)')
               .attr('width', '44')
               .attr('height', '24');


           var uEnter = enter.filter(function (turn) { return turn.u; });

           uEnter.append('circle')
               .attr('r', '16');

           uEnter.append('use')
               .attr('transform', 'translate(-16, -16)')
               .attr('width', '32')
               .attr('height', '32');


           // Update
           groups
               .attr('transform', function (turn) {
                   var v = graph.entity(turn.via.node),
                       t = graph.entity(turn.to.node),
                       a = iD.geo.angle(v, t, projection),
                       p = projection(v.loc),
                       r = turn.u ? 0 : 60;

                   return 'translate(' + (r * Math.cos(a) + p[0]) + ',' + (r * Math.sin(a) + p[1]) + ') ' +
                       'rotate(' + a * 180 / Math.PI + ')';
               });

           groups.select('use')
               .attr('xlink:href', icon);

           groups.select('rect');
           groups.select('circle');


           // Exit
           groups.exit()
               .remove();

           return this;
       };
   }

   function Vertices(projection, context) {
       var radiuses = {
           //       z16-, z17, z18+, tagged
           shadow: [6,    7.5,   7.5,  11.5],
           stroke: [2.5,  3.5,   3.5,  7],
           fill:   [1,    1.5,   1.5,  1.5]
       };

       var hover;

       function siblingAndChildVertices(ids, graph, extent) {
           var vertices = {};

           function addChildVertices(entity) {
               if (!context.features().isHiddenFeature(entity, graph, entity.geometry(graph))) {
                   var i;
                   if (entity.type === 'way') {
                       for (i = 0; i < entity.nodes.length; i++) {
                           addChildVertices(graph.entity(entity.nodes[i]));
                       }
                   } else if (entity.type === 'relation') {
                       for (i = 0; i < entity.members.length; i++) {
                           var member = context.hasEntity(entity.members[i].id);
                           if (member) {
                               addChildVertices(member);
                           }
                       }
                   } else if (entity.intersects(extent, graph)) {
                       vertices[entity.id] = entity;
                   }
               }
           }

           ids.forEach(function(id) {
               var entity = context.hasEntity(id);
               if (entity && entity.type === 'node') {
                   vertices[entity.id] = entity;
                   context.graph().parentWays(entity).forEach(function(entity) {
                       addChildVertices(entity);
                   });
               } else if (entity) {
                   addChildVertices(entity);
               }
           });

           return vertices;
       }

       function draw(selection, vertices, klass, graph, zoom) {
           var icons = {},
               z = (zoom < 17 ? 0 : zoom < 18 ? 1 : 2);

           var groups = selection
               .data(vertices, iD.Entity.key);

           function icon(entity) {
               if (entity.id in icons) return icons[entity.id];
               icons[entity.id] =
                   entity.hasInterestingTags() &&
                   context.presets().match(entity, graph).icon;
               return icons[entity.id];
           }

           function setClass(klass) {
               return function(entity) {
                   this.setAttribute('class', 'node vertex ' + klass + ' ' + entity.id);
               };
           }

           function setAttributes(selection) {
               ['shadow','stroke','fill'].forEach(function(klass) {
                   var rads = radiuses[klass];
                   selection.selectAll('.' + klass)
                       .each(function(entity) {
                           var i = z && icon(entity),
                               c = i ? 0.5 : 0,
                               r = rads[i ? 3 : z];
                           this.setAttribute('cx', c);
                           this.setAttribute('cy', -c);
                           this.setAttribute('r', r);
                           if (i && klass === 'fill') {
                               this.setAttribute('visibility', 'hidden');
                           } else {
                               this.removeAttribute('visibility');
                           }
                       });
               });

               selection.selectAll('use')
                   .each(function() {
                       if (z) {
                           this.removeAttribute('visibility');
                       } else {
                           this.setAttribute('visibility', 'hidden');
                       }
                   });
           }

           var enter = groups.enter()
               .append('g')
               .attr('class', function(d) { return 'node vertex ' + klass + ' ' + d.id; });

           enter.append('circle')
               .each(setClass('shadow'));

           enter.append('circle')
               .each(setClass('stroke'));

           // Vertices with icons get a `use`.
           enter.filter(function(d) { return icon(d); })
               .append('use')
               .attr('transform', 'translate(-6, -6)')
               .attr('xlink:href', function(d) { return '#' + icon(d) + '-12'; })
               .attr('width', '12px')
               .attr('height', '12px')
               .each(setClass('icon'));

           // Vertices with tags get a fill.
           enter.filter(function(d) { return d.hasInterestingTags(); })
               .append('circle')
               .each(setClass('fill'));

           groups
               .attr('transform', iD.svg.PointTransform(projection))
               .classed('shared', function(entity) { return graph.isShared(entity); })
               .call(setAttributes);

           groups.exit()
               .remove();
       }

       function drawVertices(surface, graph, entities, filter, extent, zoom) {
           var selected = siblingAndChildVertices(context.selectedIDs(), graph, extent),
               wireframe = surface.classed('fill-wireframe'),
               vertices = [];

           for (var i = 0; i < entities.length; i++) {
               var entity = entities[i],
                   geometry = entity.geometry(graph);

               if (wireframe && geometry === 'point') {
                   vertices.push(entity);
                   continue;
               }

               if (geometry !== 'vertex')
                   continue;

               if (entity.id in selected ||
                   entity.hasInterestingTags() ||
                   entity.isIntersection(graph)) {
                   vertices.push(entity);
               }
           }

           surface.selectAll('.layer-hit').selectAll('g.vertex.vertex-persistent')
               .filter(filter)
               .call(draw, vertices, 'vertex-persistent', graph, zoom);

           drawHover(surface, graph, extent, zoom);
       }

       function drawHover(surface, graph, extent, zoom) {
           var hovered = hover ? siblingAndChildVertices([hover.id], graph, extent) : {};

           surface.selectAll('.layer-hit').selectAll('g.vertex.vertex-hover')
               .call(draw, d3.values(hovered), 'vertex-hover', graph, zoom);
       }

       drawVertices.drawHover = function(surface, graph, target, extent, zoom) {
           if (target === hover) return;
           hover = target;
           drawHover(surface, graph, extent, zoom);
       };

       return drawVertices;
   }

   function localized(field, context) {
       var dispatch = d3.dispatch('change', 'input'),
           wikipedia = iD.services.wikipedia(),
           input, localizedInputs, wikiTitles,
           entity;

       function localized(selection) {
           input = selection.selectAll('.localized-main')
               .data([0]);

           input.enter().append('input')
               .attr('type', 'text')
               .attr('id', 'preset-input-' + field.id)
               .attr('class', 'localized-main')
               .attr('placeholder', field.placeholder());

           if (field.id === 'name') {
               var preset = context.presets().match(entity, context.graph());
               input.call(d3.combobox().fetcher(
                   SuggestNames(preset, iD.data.suggestions)
               ));
           }

           input
               .on('input', change(true))
               .on('blur', change())
               .on('change', change());

           var translateButton = selection.selectAll('.localized-add')
               .data([0]);

           translateButton.enter()
               .append('button')
               .attr('class', 'button-input-action localized-add minor')
               .attr('tabindex', -1)
               .call(Icon('#icon-plus'))
               .call(bootstrap.tooltip()
                   .title(t('translate.translate'))
                   .placement('left'));

           translateButton
               .on('click', addNew);

           localizedInputs = selection.selectAll('.localized-wrap')
               .data([0]);

           localizedInputs.enter().append('div')
               .attr('class', 'localized-wrap');
       }

       function addNew() {
           d3.event.preventDefault();
           var data = localizedInputs.selectAll('div.entry').data();
           var defaultLang = iD.detect().locale.toLowerCase().split('-')[0];
           var langExists = _.find(data, function(datum) { return datum.lang === defaultLang;});
           var isLangEn = defaultLang.indexOf('en') > -1;
           if (isLangEn || langExists) {
             defaultLang = '';
           }
           data.push({ lang: defaultLang, value: '' });
           localizedInputs.call(render, data);
       }

       function change(onInput) {
           return function() {
               var t = {};
               t[field.key] = d3.select(this).value() || undefined;
               dispatch.change(t, onInput);
           };
       }

       function key(lang) { return field.key + ':' + lang; }

       function changeLang(d) {
           var lang = d3.select(this).value(),
               t = {},
               language = _.find(iD.data.wikipedia, function(d) {
                   return d[0].toLowerCase() === lang.toLowerCase() ||
                       d[1].toLowerCase() === lang.toLowerCase();
               });

           if (language) lang = language[2];

           if (d.lang && d.lang !== lang) {
               t[key(d.lang)] = undefined;
           }

           var value = d3.select(this.parentNode)
               .selectAll('.localized-value')
               .value();

           if (lang && value) {
               t[key(lang)] = value;
           } else if (lang && wikiTitles && wikiTitles[d.lang]) {
               t[key(lang)] = wikiTitles[d.lang];
           }

           d.lang = lang;
           dispatch.change(t);
       }

       function changeValue(d) {
           if (!d.lang) return;
           var t = {};
           t[key(d.lang)] = d3.select(this).value() || undefined;
           dispatch.change(t);
       }

       function fetcher(value, cb) {
           var v = value.toLowerCase();

           cb(iD.data.wikipedia.filter(function(d) {
               return d[0].toLowerCase().indexOf(v) >= 0 ||
               d[1].toLowerCase().indexOf(v) >= 0 ||
               d[2].toLowerCase().indexOf(v) >= 0;
           }).map(function(d) {
               return { value: d[1] };
           }));
       }

       function render(selection, data) {
           var wraps = selection.selectAll('div.entry').
               data(data, function(d) { return d.lang; });

           var innerWrap = wraps.enter()
               .insert('div', ':first-child');

           innerWrap.attr('class', 'entry')
               .each(function() {
                   var wrap = d3.select(this);
                   var langcombo = d3.combobox().fetcher(fetcher).minItems(0);

                   var label = wrap.append('label')
                       .attr('class','form-label')
                       .text(t('translate.localized_translation_label'))
                       .attr('for','localized-lang');

                   label.append('button')
                       .attr('class', 'minor remove')
                       .on('click', function(d){
                           d3.event.preventDefault();
                           var t = {};
                           t[key(d.lang)] = undefined;
                           dispatch.change(t);
                           d3.select(this.parentNode.parentNode)
                               .style('top','0')
                               .style('max-height','240px')
                               .transition()
                               .style('opacity', '0')
                               .style('max-height','0px')
                               .remove();
                       })
                       .call(Icon('#operation-delete'));

                   wrap.append('input')
                       .attr('class', 'localized-lang')
                       .attr('type', 'text')
                       .attr('placeholder',t('translate.localized_translation_language'))
                       .on('blur', changeLang)
                       .on('change', changeLang)
                       .call(langcombo);

                   wrap.append('input')
                       .on('blur', changeValue)
                       .on('change', changeValue)
                       .attr('type', 'text')
                       .attr('placeholder', t('translate.localized_translation_name'))
                       .attr('class', 'localized-value');
               });

           innerWrap
               .style('margin-top', '0px')
               .style('max-height', '0px')
               .style('opacity', '0')
               .transition()
               .duration(200)
               .style('margin-top', '10px')
               .style('max-height', '240px')
               .style('opacity', '1')
               .each('end', function() {
                   d3.select(this)
                       .style('max-height', '')
                       .style('overflow', 'visible');
               });

           wraps.exit()
               .transition()
               .duration(200)
               .style('max-height','0px')
               .style('opacity', '0')
               .style('top','-10px')
               .remove();

           var entry = selection.selectAll('.entry');

           entry.select('.localized-lang')
               .value(function(d) {
                   var lang = _.find(iD.data.wikipedia, function(lang) { return lang[2] === d.lang; });
                   return lang ? lang[1] : d.lang;
               });

           entry.select('.localized-value')
               .value(function(d) { return d.value; });
       }

       localized.tags = function(tags) {
           // Fetch translations from wikipedia
           if (tags.wikipedia && !wikiTitles) {
               wikiTitles = {};
               var wm = tags.wikipedia.match(/([^:]+):(.+)/);
               if (wm && wm[0] && wm[1]) {
                   wikipedia.translations(wm[1], wm[2], function(d) {
                       wikiTitles = d;
                   });
               }
           }

           input.value(tags[field.key] || '');

           var postfixed = [], k, m;
           for (k in tags) {
               m = k.match(/^(.*):([a-zA-Z_-]+)$/);
               if (m && m[1] === field.key && m[2]) {
                   postfixed.push({ lang: m[2], value: tags[k] });
               }
           }

           localizedInputs.call(render, postfixed.reverse());
       };

       localized.focus = function() {
           input.node().focus();
       };

       localized.entity = function(_) {
           if (!arguments.length) return entity;
           entity = _;
           return localized;
       };

       return d3.rebind(localized, dispatch, 'on');
   }

   function lanes(field, context) {
       var dispatch = d3.dispatch('change'),
           wayID,
           laneData;

       function lanes(selection) {
           // if form field is hidden or has detached from dom, clean up.
           if (!d3.select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
               selection.call(lanes.off);
               return;
           }

           laneData = context.entity(wayID).lanes();

           var wrap = selection.selectAll('.preset-input-wrap')
               .data([0]);

           var enter = wrap.enter()
               .append('div')
               .attr('class', 'preset-input-wrap');

           enter
               .append('div')
               .attr('class', 'lane-count')
               .append('span');

           selection.selectAll('.lane-count')
             .text(laneData.tagged.lanes.count || laneData.defaults.lanes.count);

       }


       lanes.entity = function(_) {
           if (!wayID || wayID !== _.id) {
               wayID = _.id;
           }
       };

       lanes.tags = function() {};
       lanes.focus = function() {};
       lanes.off = function() {};

       return d3.rebind(lanes, dispatch, 'on');
   }

   function maxspeed(field, context) {
       var dispatch = d3.dispatch('change'),
           entity,
           imperial,
           unitInput,
           combobox,
           input;

       var metricValues = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
           imperialValues = [20, 25, 30, 35, 40, 45, 50, 55, 65, 70];

       function maxspeed(selection) {
           combobox = d3.combobox();
           var unitCombobox = d3.combobox().data(['km/h', 'mph'].map(comboValues));

           input = selection.selectAll('#preset-input-' + field.id)
               .data([0]);

           input.enter().append('input')
               .attr('type', 'text')
               .attr('id', 'preset-input-' + field.id)
               .attr('placeholder', field.placeholder());

           input
               .call(combobox)
               .on('change', change)
               .on('blur', change);

           var childNodes = context.graph().childNodes(context.entity(entity.id)),
               loc = childNodes[~~(childNodes.length/2)].loc;

           imperial = _.some(iD.data.imperial.features, function(f) {
               return _.some(f.geometry.coordinates, function(d) {
                   return pointInPolygon(loc, d);
               });
           });

           unitInput = selection.selectAll('input.maxspeed-unit')
               .data([0]);

           unitInput.enter().append('input')
               .attr('type', 'text')
               .attr('class', 'maxspeed-unit');

           unitInput
               .on('blur', changeUnits)
               .on('change', changeUnits)
               .call(unitCombobox);

           function changeUnits() {
               imperial = unitInput.value() === 'mph';
               unitInput.value(imperial ? 'mph' : 'km/h');
               setSuggestions();
               change();
           }

       }

       function setSuggestions() {
           combobox.data((imperial ? imperialValues : metricValues).map(comboValues));
           unitInput.value(imperial ? 'mph' : 'km/h');
       }

       function comboValues(d) {
           return {
               value: d.toString(),
               title: d.toString()
           };
       }

       function change() {
           var tag = {},
               value = input.value();

           if (!value) {
               tag[field.key] = undefined;
           } else if (isNaN(value) || !imperial) {
               tag[field.key] = value;
           } else {
               tag[field.key] = value + ' mph';
           }

           dispatch.change(tag);
       }

       maxspeed.tags = function(tags) {
           var value = tags[field.key];

           if (value && value.indexOf('mph') >= 0) {
               value = parseInt(value, 10);
               imperial = true;
           } else if (value) {
               imperial = false;
           }

           setSuggestions();

           input.value(value || '');
       };

       maxspeed.focus = function() {
           input.node().focus();
       };

       maxspeed.entity = function(_) {
           entity = _;
       };

       return d3.rebind(maxspeed, dispatch, 'on');
   }

   function radio(field) {
       var dispatch = d3.dispatch('change'),
           labels, radios, placeholder;

       function radio(selection) {
           selection.classed('preset-radio', true);

           var wrap = selection.selectAll('.preset-input-wrap')
               .data([0]);

           var buttonWrap = wrap.enter().append('div')
               .attr('class', 'preset-input-wrap toggle-list');

           buttonWrap.append('span')
               .attr('class', 'placeholder');

           placeholder = selection.selectAll('.placeholder');

           labels = wrap.selectAll('label')
               .data(field.options || field.keys);

           var enter = labels.enter().append('label');

           enter.append('input')
               .attr('type', 'radio')
               .attr('name', field.id)
               .attr('value', function(d) { return field.t('options.' + d, { 'default': d }); })
               .attr('checked', false);

           enter.append('span')
               .text(function(d) { return field.t('options.' + d, { 'default': d }); });

           radios = labels.selectAll('input')
               .on('change', change);
       }

       function change() {
           var t = {};
           if (field.key) t[field.key] = undefined;
           radios.each(function(d) {
               var active = d3.select(this).property('checked');
               if (field.key) {
                   if (active) t[field.key] = d;
               } else {
                   t[d] = active ? 'yes' : undefined;
               }
           });
           dispatch.change(t);
       }

       radio.tags = function(tags) {
           function checked(d) {
               if (field.key) {
                   return tags[field.key] === d;
               } else {
                   return !!(tags[d] && tags[d] !== 'no');
               }
           }

           labels.classed('active', checked);
           radios.property('checked', checked);
           var selection = radios.filter(function() { return this.checked; });
           if (selection.empty()) {
               placeholder.text(t('inspector.none'));
           } else {
               placeholder.text(selection.attr('value'));
           }
       };

       radio.focus = function() {
           radios.node().focus();
       };

       return d3.rebind(radio, dispatch, 'on');
   }

   function AddArea(context) {
       var mode = {
           id: 'add-area',
           button: 'area',
           title: t('modes.add_area.title'),
           description: t('modes.add_area.description'),
           key: '3'
       };

       var behavior = AddWay(context)
               .tail(t('modes.add_area.tail'))
               .on('start', start)
               .on('startFromWay', startFromWay)
               .on('startFromNode', startFromNode),
           defaultTags = {area: 'yes'};

       function start(loc) {
           var graph = context.graph(),
               node = Node({loc: loc}),
               way = Way({tags: defaultTags});

           context.perform(
               AddEntity(node),
               AddEntity(way),
               AddVertex(way.id, node.id),
               AddVertex(way.id, node.id));

           context.enter(DrawArea(context, way.id, graph));
       }

       function startFromWay(loc, edge) {
           var graph = context.graph(),
               node = Node({loc: loc}),
               way = Way({tags: defaultTags});

           context.perform(
               AddEntity(node),
               AddEntity(way),
               AddVertex(way.id, node.id),
               AddVertex(way.id, node.id),
               AddMidpoint({ loc: loc, edge: edge }, node));

           context.enter(DrawArea(context, way.id, graph));
       }

       function startFromNode(node) {
           var graph = context.graph(),
               way = Way({tags: defaultTags});

           context.perform(
               AddEntity(way),
               AddVertex(way.id, node.id),
               AddVertex(way.id, node.id));

           context.enter(DrawArea(context, way.id, graph));
       }

       mode.enter = function() {
           context.install(behavior);
       };

       mode.exit = function() {
           context.uninstall(behavior);
       };

       return mode;
   }

   function AddLine(context) {
       var mode = {
           id: 'add-line',
           button: 'line',
           title: t('modes.add_line.title'),
           description: t('modes.add_line.description'),
           key: '2'
       };

       var behavior = AddWay(context)
           .tail(t('modes.add_line.tail'))
           .on('start', start)
           .on('startFromWay', startFromWay)
           .on('startFromNode', startFromNode);

       function start(loc) {
           var baseGraph = context.graph(),
               node = Node({loc: loc}),
               way = Way();

           context.perform(
               AddEntity(node),
               AddEntity(way),
               AddVertex(way.id, node.id));

           context.enter(DrawLine(context, way.id, baseGraph));
       }

       function startFromWay(loc, edge) {
           var baseGraph = context.graph(),
               node = Node({loc: loc}),
               way = Way();

           context.perform(
               AddEntity(node),
               AddEntity(way),
               AddVertex(way.id, node.id),
               AddMidpoint({ loc: loc, edge: edge }, node));

           context.enter(DrawLine(context, way.id, baseGraph));
       }

       function startFromNode(node) {
           var baseGraph = context.graph(),
               way = Way();

           context.perform(
               AddEntity(way),
               AddVertex(way.id, node.id));

           context.enter(DrawLine(context, way.id, baseGraph));
       }

       mode.enter = function() {
           context.install(behavior);
       };

       mode.exit = function() {
           context.uninstall(behavior);
       };

       return mode;
   }

   function AddPoint(context) {
       var mode = {
           id: 'add-point',
           button: 'point',
           title: t('modes.add_point.title'),
           description: t('modes.add_point.description'),
           key: '1'
       };

       var behavior = Draw(context)
           .tail(t('modes.add_point.tail'))
           .on('click', add)
           .on('clickWay', addWay)
           .on('clickNode', addNode)
           .on('cancel', cancel)
           .on('finish', cancel);

       function add(loc) {
           var node = Node({loc: loc});

           context.perform(
               AddEntity(node),
               t('operations.add.annotation.point'));

           context.enter(
               Select(context, [node.id])
                   .suppressMenu(true)
                   .newFeature(true));
       }

       function addWay(loc) {
           add(loc);
       }

       function addNode(node) {
           add(node.loc);
       }

       function cancel() {
           context.enter(Browse(context));
       }

       mode.enter = function() {
           context.install(behavior);
       };

       mode.exit = function() {
           context.uninstall(behavior);
       };

       return mode;
   }

   function Browse(context) {
       var mode = {
           button: 'browse',
           id: 'browse',
           title: t('modes.browse.title'),
           description: t('modes.browse.description')
       }, sidebar;

       var behaviors = [
           Paste(context),
           Hover(context)
               .on('hover', context.ui().sidebar.hover),
           Select$1(context),
           Lasso(context),
           DragNode(context).behavior];

       mode.enter = function() {
           behaviors.forEach(function(behavior) {
               context.install(behavior);
           });

           // Get focus on the body.
           if (document.activeElement && document.activeElement.blur) {
               document.activeElement.blur();
           }

           if (sidebar) {
               context.ui().sidebar.show(sidebar);
           } else {
               context.ui().sidebar.select(null);
           }
       };

       mode.exit = function() {
           context.ui().sidebar.hover.cancel();
           behaviors.forEach(function(behavior) {
               context.uninstall(behavior);
           });

           if (sidebar) {
               context.ui().sidebar.hide();
           }
       };

       mode.sidebar = function(_) {
           if (!arguments.length) return sidebar;
           sidebar = _;
           return mode;
       };

       return mode;
   }

   function DragNode(context) {
       var mode = {
           id: 'drag-node',
           button: 'browse'
       };

       var nudgeInterval,
           activeIDs,
           wasMidpoint,
           cancelled,
           selectedIDs = [],
           hover = Hover(context)
               .altDisables(true)
               .on('hover', context.ui().sidebar.hover),
           edit = Edit(context);

       function edge(point, size) {
           var pad = [30, 100, 30, 100];
           if (point[0] > size[0] - pad[0]) return [-10, 0];
           else if (point[0] < pad[2]) return [10, 0];
           else if (point[1] > size[1] - pad[1]) return [0, -10];
           else if (point[1] < pad[3]) return [0, 10];
           return null;
       }

       function startNudge(nudge) {
           if (nudgeInterval) window.clearInterval(nudgeInterval);
           nudgeInterval = window.setInterval(function() {
               context.pan(nudge);
           }, 50);
       }

       function stopNudge() {
           if (nudgeInterval) window.clearInterval(nudgeInterval);
           nudgeInterval = null;
       }

       function moveAnnotation(entity) {
           return t('operations.move.annotation.' + entity.geometry(context.graph()));
       }

       function connectAnnotation(entity) {
           return t('operations.connect.annotation.' + entity.geometry(context.graph()));
       }

       function origin(entity) {
           return context.projection(entity.loc);
       }

       function start(entity) {
           cancelled = d3.event.sourceEvent.shiftKey ||
               context.features().hasHiddenConnections(entity, context.graph());

           if (cancelled) return behavior.cancel();

           wasMidpoint = entity.type === 'midpoint';
           if (wasMidpoint) {
               var midpoint = entity;
               entity = Node();
               context.perform(AddMidpoint(midpoint, entity));

                var vertex = context.surface()
                   .selectAll('.' + entity.id);
                behavior.target(vertex.node(), entity);

           } else {
               context.perform(
                   Noop());
           }

           activeIDs = _.map(context.graph().parentWays(entity), 'id');
           activeIDs.push(entity.id);

           context.enter(mode);
       }

       function datum() {
           if (d3.event.sourceEvent.altKey) {
               return {};
           }

           return d3.event.sourceEvent.target.__data__ || {};
       }

       // via https://gist.github.com/shawnbot/4166283
       function childOf(p, c) {
           if (p === c) return false;
           while (c && c !== p) c = c.parentNode;
           return c === p;
       }

       function move(entity) {
           if (cancelled) return;
           d3.event.sourceEvent.stopPropagation();

           var nudge = childOf(context.container().node(),
               d3.event.sourceEvent.toElement) &&
               edge(d3.event.point, context.map().dimensions());

           if (nudge) startNudge(nudge);
           else stopNudge();

           var loc = context.projection.invert(d3.event.point);

           var d = datum();
           if (d.type === 'node' && d.id !== entity.id) {
               loc = d.loc;
           } else if (d.type === 'way' && !d3.select(d3.event.sourceEvent.target).classed('fill')) {
               loc = chooseEdge(context.childNodes(d), context.mouse(), context.projection).loc;
           }

           context.replace(
               MoveNode(entity.id, loc),
               moveAnnotation(entity));
       }

       function end(entity) {
           if (cancelled) return;

           var d = datum();

           if (d.type === 'way') {
               var choice = chooseEdge(context.childNodes(d), context.mouse(), context.projection);
               context.replace(
                   AddMidpoint({ loc: choice.loc, edge: [d.nodes[choice.index - 1], d.nodes[choice.index]] }, entity),
                   connectAnnotation(d));

           } else if (d.type === 'node' && d.id !== entity.id) {
               context.replace(
                   Connect([d.id, entity.id]),
                   connectAnnotation(d));

           } else if (wasMidpoint) {
               context.replace(
                   Noop(),
                   t('operations.add.annotation.vertex'));

           } else {
               context.replace(
                   Noop(),
                   moveAnnotation(entity));
           }

           var reselection = selectedIDs.filter(function(id) {
               return context.graph().hasEntity(id);
           });

           if (reselection.length) {
               context.enter(
                   Select(context, reselection)
                       .suppressMenu(true));
           } else {
               context.enter(Browse(context));
           }
       }

       function cancel() {
           behavior.cancel();
           context.enter(Browse(context));
       }

       function setActiveElements() {
           context.surface().selectAll(entitySelector(activeIDs))
               .classed('active', true);
       }

       var behavior = drag()
           .delegate('g.node, g.point, g.midpoint')
           .surface(context.surface().node())
           .origin(origin)
           .on('start', start)
           .on('move', move)
           .on('end', end);

       mode.enter = function() {
           context.install(hover);
           context.install(edit);

           context.history()
               .on('undone.drag-node', cancel);

           context.map()
               .on('drawn.drag-node', setActiveElements);

           setActiveElements();
       };

       mode.exit = function() {
           context.ui().sidebar.hover.cancel();
           context.uninstall(hover);
           context.uninstall(edit);

           context.history()
               .on('undone.drag-node', null);

           context.map()
               .on('drawn.drag-node', null);

           context.surface()
               .selectAll('.active')
               .classed('active', false);

           stopNudge();
       };

       mode.selectedIDs = function(_) {
           if (!arguments.length) return selectedIDs;
           selectedIDs = _;
           return mode;
       };

       mode.behavior = behavior;

       return mode;
   }

   function DrawArea(context, wayId, baseGraph) {
       var mode = {
           button: 'area',
           id: 'draw-area'
       };

       var behavior;

       mode.enter = function() {
           var way = context.entity(wayId),
               headId = way.nodes[way.nodes.length - 2],
               tailId = way.first();

           behavior = DrawWay(context, wayId, -1, mode, baseGraph)
               .tail(t('modes.draw_area.tail'));

           var addNode = behavior.addNode;

           behavior.addNode = function(node) {
               if (node.id === headId || node.id === tailId) {
                   behavior.finish();
               } else {
                   addNode(node);
               }
           };

           context.install(behavior);
       };

       mode.exit = function() {
           context.uninstall(behavior);
       };

       mode.selectedIDs = function() {
           return [wayId];
       };

       return mode;
   }

   function DrawLine(context, wayId, baseGraph, affix) {
       var mode = {
           button: 'line',
           id: 'draw-line'
       };

       var behavior;

       mode.enter = function() {
           var way = context.entity(wayId),
               index = (affix === 'prefix') ? 0 : undefined,
               headId = (affix === 'prefix') ? way.first() : way.last();

           behavior = DrawWay(context, wayId, index, mode, baseGraph)
               .tail(t('modes.draw_line.tail'));

           var addNode = behavior.addNode;

           behavior.addNode = function(node) {
               if (node.id === headId) {
                   behavior.finish();
               } else {
                   addNode(node);
               }
           };

           context.install(behavior);
       };

       mode.exit = function() {
           context.uninstall(behavior);
       };

       mode.selectedIDs = function() {
           return [wayId];
       };

       return mode;
   }

   function MoveMode(context, entityIDs, baseGraph) {
       var mode = {
           id: 'move',
           button: 'browse'
       };

       var keybinding = d3.keybinding('move'),
           edit = Edit(context),
           annotation = entityIDs.length === 1 ?
               t('operations.move.annotation.' + context.geometry(entityIDs[0])) :
               t('operations.move.annotation.multiple'),
           cache,
           origin,
           nudgeInterval;

       function vecSub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }

       function edge(point, size) {
           var pad = [30, 100, 30, 100];
           if (point[0] > size[0] - pad[0]) return [-10, 0];
           else if (point[0] < pad[2]) return [10, 0];
           else if (point[1] > size[1] - pad[1]) return [0, -10];
           else if (point[1] < pad[3]) return [0, 10];
           return null;
       }

       function startNudge(nudge) {
           if (nudgeInterval) window.clearInterval(nudgeInterval);
           nudgeInterval = window.setInterval(function() {
               context.pan(nudge);

               var currMouse = context.mouse(),
                   origMouse = context.projection(origin),
                   delta = vecSub(vecSub(currMouse, origMouse), nudge),
                   action = Move$1(entityIDs, delta, context.projection, cache);

               context.overwrite(action, annotation);

           }, 50);
       }

       function stopNudge() {
           if (nudgeInterval) window.clearInterval(nudgeInterval);
           nudgeInterval = null;
       }

       function move() {
           var currMouse = context.mouse(),
               origMouse = context.projection(origin),
               delta = vecSub(currMouse, origMouse),
               action = Move$1(entityIDs, delta, context.projection, cache);

           context.overwrite(action, annotation);

           var nudge = edge(currMouse, context.map().dimensions());
           if (nudge) startNudge(nudge);
           else stopNudge();
       }

       function finish() {
           d3.event.stopPropagation();
           context.enter(Select(context, entityIDs).suppressMenu(true));
           stopNudge();
       }

       function cancel() {
           if (baseGraph) {
               while (context.graph() !== baseGraph) context.pop();
               context.enter(Browse(context));
           } else {
               context.pop();
               context.enter(Select(context, entityIDs).suppressMenu(true));
           }
           stopNudge();
       }

       function undone() {
           context.enter(Browse(context));
       }

       mode.enter = function() {
           origin = context.map().mouseCoordinates();
           cache = {};

           context.install(edit);

           context.perform(
               Noop(),
               annotation);

           context.surface()
               .on('mousemove.move', move)
               .on('click.move', finish);

           context.history()
               .on('undone.move', undone);

           keybinding
               .on('⎋', cancel)
               .on('↩', finish);

           d3.select(document)
               .call(keybinding);
       };

       mode.exit = function() {
           stopNudge();

           context.uninstall(edit);

           context.surface()
               .on('mousemove.move', null)
               .on('click.move', null);

           context.history()
               .on('undone.move', null);

           keybinding.off();
       };

       return mode;
   }

   function RotateWay(context, wayId) {
       var mode = {
           id: 'rotate-way',
           button: 'browse'
       };

       var keybinding = d3.keybinding('rotate-way'),
           edit = Edit(context);

       mode.enter = function() {
           context.install(edit);

           var annotation = t('operations.rotate.annotation.' + context.geometry(wayId)),
               way = context.graph().entity(wayId),
               nodes = _.uniq(context.graph().childNodes(way)),
               points = nodes.map(function(n) { return context.projection(n.loc); }),
               pivot = d3.geom.polygon(points).centroid(),
               angle;

           context.perform(
               Noop(),
               annotation);

           function rotate() {

               var mousePoint = context.mouse(),
                   newAngle = Math.atan2(mousePoint[1] - pivot[1], mousePoint[0] - pivot[0]);

               if (typeof angle === 'undefined') angle = newAngle;

               context.replace(
                   RotateWay$1(wayId, pivot, newAngle - angle, context.projection),
                   annotation);

               angle = newAngle;
           }

           function finish() {
               d3.event.stopPropagation();
               context.enter(Select(context, [wayId])
                   .suppressMenu(true));
           }

           function cancel() {
               context.pop();
               context.enter(Select(context, [wayId])
                   .suppressMenu(true));
           }

           function undone() {
               context.enter(Browse(context));
           }

           context.surface()
               .on('mousemove.rotate-way', rotate)
               .on('click.rotate-way', finish);

           context.history()
               .on('undone.rotate-way', undone);

           keybinding
               .on('⎋', cancel)
               .on('↩', finish);

           d3.select(document)
               .call(keybinding);
       };

       mode.exit = function() {
           context.uninstall(edit);

           context.surface()
               .on('mousemove.rotate-way', null)
               .on('click.rotate-way', null);

           context.history()
               .on('undone.rotate-way', null);

           keybinding.off();
       };

       return mode;
   }

   function SaveMode(context) {
       var ui = Commit(context)
               .on('cancel', cancel)
               .on('save', save);

       function cancel() {
           context.enter(Browse(context));
       }

       function save(e, tryAgain) {
           function withChildNodes(ids, graph) {
               return _.uniq(_.reduce(ids, function(result, id) {
                   var e = graph.entity(id);
                   if (e.type === 'way') {
                       try {
                           var cn = graph.childNodes(e);
                           result.push.apply(result, _.map(_.filter(cn, 'version'), 'id'));
                       } catch (err) {
                           /* eslint-disable no-console */
                           if (typeof console !== 'undefined') console.error(err);
                           /* eslint-enable no-console */
                       }
                   }
                   return result;
               }, _.clone(ids)));
           }

           var loading = Loading(context).message(t('save.uploading')).blocking(true),
               history = context.history(),
               origChanges = history.changes(DiscardTags(history.difference())),
               localGraph = context.graph(),
               remoteGraph = Graph(history.base(), true),
               modified = _.filter(history.difference().summary(), {changeType: 'modified'}),
               toCheck = _.map(_.map(modified, 'entity'), 'id'),
               toLoad = withChildNodes(toCheck, localGraph),
               conflicts = [],
               errors = [];

           if (!tryAgain) history.perform(Noop());  // checkpoint
           context.container().call(loading);

           if (toCheck.length) {
               context.connection().loadMultiple(toLoad, loaded);
           } else {
               finalize();
           }


           // Reload modified entities into an alternate graph and check for conflicts..
           function loaded(err, result) {
               if (errors.length) return;

               if (err) {
                   errors.push({
                       msg: err.responseText,
                       details: [ t('save.status_code', { code: err.status }) ]
                   });
                   showErrors();

               } else {
                   var loadMore = [];
                   _.each(result.data, function(entity) {
                       remoteGraph.replace(entity);
                       toLoad = _.without(toLoad, entity.id);

                       // Because loadMultiple doesn't download /full like loadEntity,
                       // need to also load children that aren't already being checked..
                       if (!entity.visible) return;
                       if (entity.type === 'way') {
                           loadMore.push.apply(loadMore,
                               _.difference(entity.nodes, toCheck, toLoad, loadMore));
                       } else if (entity.type === 'relation' && entity.isMultipolygon()) {
                           loadMore.push.apply(loadMore,
                               _.difference(_.map(entity.members, 'id'), toCheck, toLoad, loadMore));
                       }
                   });

                   if (loadMore.length) {
                       toLoad.push.apply(toLoad, loadMore);
                       context.connection().loadMultiple(loadMore, loaded);
                   }

                   if (!toLoad.length) {
                       checkConflicts();
                   }
               }
           }


           function checkConflicts() {
               function choice(id, text, action) {
                   return { id: id, text: text, action: function() { history.replace(action); } };
               }
               function formatUser(d) {
                   return '<a href="' + context.connection().userURL(d) + '" target="_blank">' + d + '</a>';
               }
               function entityName(entity) {
                   return displayName(entity) || (displayType(entity.id) + ' ' + entity.id);
               }

               function compareVersions(local, remote) {
                   if (local.version !== remote.version) return false;

                   if (local.type === 'way') {
                       var children = _.union(local.nodes, remote.nodes);

                       for (var i = 0; i < children.length; i++) {
                           var a = localGraph.hasEntity(children[i]),
                               b = remoteGraph.hasEntity(children[i]);

                           if (a && b && a.version !== b.version) return false;
                       }
                   }

                   return true;
               }

               _.each(toCheck, function(id) {
                   var local = localGraph.entity(id),
                       remote = remoteGraph.entity(id);

                   if (compareVersions(local, remote)) return;

                   var action = MergeRemoteChanges,
                       merge = action(id, localGraph, remoteGraph, formatUser);

                   history.replace(merge);

                   var mergeConflicts = merge.conflicts();
                   if (!mergeConflicts.length) return;  // merged safely

                   var forceLocal = action(id, localGraph, remoteGraph).withOption('force_local'),
                       forceRemote = action(id, localGraph, remoteGraph).withOption('force_remote'),
                       keepMine = t('save.conflict.' + (remote.visible ? 'keep_local' : 'restore')),
                       keepTheirs = t('save.conflict.' + (remote.visible ? 'keep_remote' : 'delete'));

                   conflicts.push({
                       id: id,
                       name: entityName(local),
                       details: mergeConflicts,
                       chosen: 1,
                       choices: [
                           choice(id, keepMine, forceLocal),
                           choice(id, keepTheirs, forceRemote)
                       ]
                   });
               });

               finalize();
           }


           function finalize() {
               if (conflicts.length) {
                   conflicts.sort(function(a,b) { return b.id.localeCompare(a.id); });
                   showConflicts();
               } else if (errors.length) {
                   showErrors();
               } else {
                   var changes = history.changes(DiscardTags(history.difference()));
                   if (changes.modified.length || changes.created.length || changes.deleted.length) {
                       context.connection().putChangeset(
                           changes,
                           e.comment,
                           history.imageryUsed(),
                           function(err, changeset_id) {
                               if (err) {
                                   errors.push({
                                       msg: err.responseText,
                                       details: [ t('save.status_code', { code: err.status }) ]
                                   });
                                   showErrors();
                               } else {
                                   history.clearSaved();
                                   success(e, changeset_id);
                                   // Add delay to allow for postgres replication #1646 #2678
                                   window.setTimeout(function() {
                                       loading.close();
                                       context.flush();
                                   }, 2500);
                               }
                           });
                   } else {        // changes were insignificant or reverted by user
                       loading.close();
                       context.flush();
                       cancel();
                   }
               }
           }


           function showConflicts() {
               var selection = context.container()
                   .select('#sidebar')
                   .append('div')
                   .attr('class','sidebar-component');

               loading.close();

               selection.call(Conflicts(context)
                   .list(conflicts)
                   .on('download', function() {
                       var data = JXON.stringify(context.connection().osmChangeJXON('CHANGEME', origChanges)),
                           win = window.open('data:text/xml,' + encodeURIComponent(data), '_blank');
                       win.focus();
                   })
                   .on('cancel', function() {
                       history.pop();
                       selection.remove();
                   })
                   .on('save', function() {
                       for (var i = 0; i < conflicts.length; i++) {
                           if (conflicts[i].chosen === 1) {  // user chose "keep theirs"
                               var entity = context.hasEntity(conflicts[i].id);
                               if (entity && entity.type === 'way') {
                                   var children = _.uniq(entity.nodes);
                                   for (var j = 0; j < children.length; j++) {
                                       history.replace(Revert(children[j]));
                                   }
                               }
                               history.replace(Revert(conflicts[i].id));
                           }
                       }

                       selection.remove();
                       save(e, true);
                   })
               );
           }


           function showErrors() {
               var selection = confirm(context.container());

               history.pop();
               loading.close();

               selection
                   .select('.modal-section.header')
                   .append('h3')
                   .text(t('save.error'));

               addErrors(selection, errors);
               selection.okButton();
           }


           function addErrors(selection, data) {
               var message = selection
                   .select('.modal-section.message-text');

               var items = message
                   .selectAll('.error-container')
                   .data(data);

               var enter = items.enter()
                   .append('div')
                   .attr('class', 'error-container');

               enter
                   .append('a')
                   .attr('class', 'error-description')
                   .attr('href', '#')
                   .classed('hide-toggle', true)
                   .text(function(d) { return d.msg || t('save.unknown_error_details'); })
                   .on('click', function() {
                       var error = d3.select(this),
                           detail = d3.select(this.nextElementSibling),
                           exp = error.classed('expanded');

                       detail.style('display', exp ? 'none' : 'block');
                       error.classed('expanded', !exp);

                       d3.event.preventDefault();
                   });

               var details = enter
                   .append('div')
                   .attr('class', 'error-detail-container')
                   .style('display', 'none');

               details
                   .append('ul')
                   .attr('class', 'error-detail-list')
                   .selectAll('li')
                   .data(function(d) { return d.details || []; })
                   .enter()
                   .append('li')
                   .attr('class', 'error-detail-item')
                   .text(function(d) { return d; });

               items.exit()
                   .remove();
           }

       }


       function success(e, changeset_id) {
           context.enter(Browse(context)
               .sidebar(Success(context)
                   .changeset({
                       id: changeset_id,
                       comment: e.comment
                   })
                   .on('cancel', function() {
                       context.ui().sidebar.hide();
                   })));
       }

       var mode = {
           id: 'save'
       };

       mode.enter = function() {
           context.connection().authenticate(function(err) {
               if (err) {
                   cancel();
               } else {
                   context.ui().sidebar.show(ui);
               }
           });
       };

       mode.exit = function() {
           context.ui().sidebar.hide();
       };

       return mode;
   }

   function Circularize(selectedIDs, context) {
       var entityId = selectedIDs[0],
           entity = context.entity(entityId),
           extent = entity.extent(context.graph()),
           geometry = context.geometry(entityId),
           action = Circularize$1(entityId, context.projection);

       var operation = function() {
           var annotation = t('operations.circularize.annotation.' + geometry);
           context.perform(action, annotation);
       };

       operation.available = function() {
           return selectedIDs.length === 1 &&
               entity.type === 'way' &&
               _.uniq(entity.nodes).length > 1;
       };

       operation.disabled = function() {
           var reason;
           if (extent.percentContainedIn(context.extent()) < 0.8) {
               reason = 'too_large';
           } else if (context.hasHiddenConnections(entityId)) {
               reason = 'connected_to_hidden';
           }
           return action.disabled(context.graph()) || reason;
       };

       operation.tooltip = function() {
           var disable = operation.disabled();
           return disable ?
               t('operations.circularize.' + disable) :
               t('operations.circularize.description.' + geometry);
       };

       operation.id = 'circularize';
       operation.keys = [t('operations.circularize.key')];
       operation.title = t('operations.circularize.title');

       return operation;
   }

   function Continue(selectedIDs, context) {
       var graph = context.graph(),
           entities = selectedIDs.map(function(id) { return graph.entity(id); }),
           geometries = _.extend({line: [], vertex: []},
               _.groupBy(entities, function(entity) { return entity.geometry(graph); })),
           vertex = geometries.vertex[0];

       function candidateWays() {
           return graph.parentWays(vertex).filter(function(parent) {
               return parent.geometry(graph) === 'line' &&
                   parent.affix(vertex.id) &&
                   (geometries.line.length === 0 || geometries.line[0] === parent);
           });
       }

       var operation = function() {
           var candidate = candidateWays()[0];
           context.enter(DrawLine(
               context,
               candidate.id,
               context.graph(),
               candidate.affix(vertex.id)));
       };

       operation.available = function() {
           return geometries.vertex.length === 1 && geometries.line.length <= 1 &&
               !context.features().hasHiddenConnections(vertex, context.graph());
       };

       operation.disabled = function() {
           var candidates = candidateWays();
           if (candidates.length === 0)
               return 'not_eligible';
           if (candidates.length > 1)
               return 'multiple';
       };

       operation.tooltip = function() {
           var disable = operation.disabled();
           return disable ?
               t('operations.continue.' + disable) :
               t('operations.continue.description');
       };

       operation.id = 'continue';
       operation.keys = [t('operations.continue.key')];
       operation.title = t('operations.continue.title');

       return operation;
   }

   function Delete(selectedIDs, context) {
       var action = DeleteMultiple(selectedIDs);

       var operation = function() {
           var annotation,
               nextSelectedID;

           if (selectedIDs.length > 1) {
               annotation = t('operations.delete.annotation.multiple', {n: selectedIDs.length});

           } else {
               var id = selectedIDs[0],
                   entity = context.entity(id),
                   geometry = context.geometry(id),
                   parents = context.graph().parentWays(entity),
                   parent = parents[0];

               annotation = t('operations.delete.annotation.' + geometry);

               // Select the next closest node in the way.
               if (geometry === 'vertex' && parents.length === 1 && parent.nodes.length > 2) {
                   var nodes = parent.nodes,
                       i = nodes.indexOf(id);

                   if (i === 0) {
                       i++;
                   } else if (i === nodes.length - 1) {
                       i--;
                   } else {
                       var a = sphericalDistance(entity.loc, context.entity(nodes[i - 1]).loc),
                           b = sphericalDistance(entity.loc, context.entity(nodes[i + 1]).loc);
                       i = a < b ? i - 1 : i + 1;
                   }

                   nextSelectedID = nodes[i];
               }
           }

           if (nextSelectedID && context.hasEntity(nextSelectedID)) {
               context.enter(Select(context, [nextSelectedID]));
           } else {
               context.enter(Browse(context));
           }

           context.perform(
               action,
               annotation);
       };

       operation.available = function() {
           return true;
       };

       operation.disabled = function() {
           var reason;
           if (_.some(selectedIDs, context.hasHiddenConnections)) {
               reason = 'connected_to_hidden';
           }
           return action.disabled(context.graph()) || reason;
       };

       operation.tooltip = function() {
           var disable = operation.disabled();
           return disable ?
               t('operations.delete.' + disable) :
               t('operations.delete.description');
       };

       operation.id = 'delete';
       operation.keys = [cmd('⌘⌫'), cmd('⌘⌦')];
       operation.title = t('operations.delete.title');

       return operation;
   }

   function Disconnect(selectedIDs, context) {
       var vertices = _.filter(selectedIDs, function vertex(entityId) {
           return context.geometry(entityId) === 'vertex';
       });

       var entityId = vertices[0],
           action = Disconnect$1(entityId);

       if (selectedIDs.length > 1) {
           action.limitWays(_.without(selectedIDs, entityId));
       }

       var operation = function() {
           context.perform(action, t('operations.disconnect.annotation'));
       };

       operation.available = function() {
           return vertices.length === 1;
       };

       operation.disabled = function() {
           var reason;
           if (_.some(selectedIDs, context.hasHiddenConnections)) {
               reason = 'connected_to_hidden';
           }
           return action.disabled(context.graph()) || reason;
       };

       operation.tooltip = function() {
           var disable = operation.disabled();
           return disable ?
               t('operations.disconnect.' + disable) :
               t('operations.disconnect.description');
       };

       operation.id = 'disconnect';
       operation.keys = [t('operations.disconnect.key')];
       operation.title = t('operations.disconnect.title');

       return operation;
   }

   function Merge(selectedIDs, context) {
       var join = Join(selectedIDs),
           merge = Merge$1(selectedIDs),
           mergePolygon = MergePolygon(selectedIDs);

       var operation = function() {
           var annotation = t('operations.merge.annotation', {n: selectedIDs.length}),
               action;

           if (!join.disabled(context.graph())) {
               action = join;
           } else if (!merge.disabled(context.graph())) {
               action = merge;
           } else {
               action = mergePolygon;
           }

           context.perform(action, annotation);
           context.enter(Select(context, selectedIDs.filter(function(id) { return context.hasEntity(id); }))
               .suppressMenu(true));
       };

       operation.available = function() {
           return selectedIDs.length >= 2;
       };

       operation.disabled = function() {
           return join.disabled(context.graph()) &&
               merge.disabled(context.graph()) &&
               mergePolygon.disabled(context.graph());
       };

       operation.tooltip = function() {
           var j = join.disabled(context.graph()),
               m = merge.disabled(context.graph()),
               p = mergePolygon.disabled(context.graph());

           if (j === 'restriction' && m && p)
               return t('operations.merge.restriction', {relation: context.presets().item('type/restriction').name()});

           if (p === 'incomplete_relation' && j && m)
               return t('operations.merge.incomplete_relation');

           if (j && m && p)
               return t('operations.merge.' + j);

           return t('operations.merge.description');
       };

       operation.id = 'merge';
       operation.keys = [t('operations.merge.key')];
       operation.title = t('operations.merge.title');

       return operation;
   }

   function Move(selectedIDs, context) {
       var extent = selectedIDs.reduce(function(extent, id) {
               return extent.extend(context.entity(id).extent(context.graph()));
           }, Extent());

       var operation = function() {
           context.enter(MoveMode(context, selectedIDs));
       };

       operation.available = function() {
           return selectedIDs.length > 1 ||
               context.entity(selectedIDs[0]).type !== 'node';
       };

       operation.disabled = function() {
           var reason;
           if (extent.area() && extent.percentContainedIn(context.extent()) < 0.8) {
               reason = 'too_large';
           } else if (_.some(selectedIDs, context.hasHiddenConnections)) {
               reason = 'connected_to_hidden';
           }
           return Move$1(selectedIDs).disabled(context.graph()) || reason;
       };

       operation.tooltip = function() {
           var disable = operation.disabled();
           return disable ?
               t('operations.move.' + disable) :
               t('operations.move.description');
       };

       operation.id = 'move';
       operation.keys = [t('operations.move.key')];
       operation.title = t('operations.move.title');

       return operation;
   }

   function Orthogonalize(selectedIDs, context) {
       var entityId = selectedIDs[0],
           entity = context.entity(entityId),
           extent = entity.extent(context.graph()),
           geometry = context.geometry(entityId),
           action = Orthogonalize$1(entityId, context.projection);

       var operation = function() {
           var annotation = t('operations.orthogonalize.annotation.' + geometry);
           context.perform(action, annotation);
       };

       operation.available = function() {
           return selectedIDs.length === 1 &&
               entity.type === 'way' &&
               entity.isClosed() &&
               _.uniq(entity.nodes).length > 2;
       };

       operation.disabled = function() {
           var reason;
           if (extent.percentContainedIn(context.extent()) < 0.8) {
               reason = 'too_large';
           } else if (context.hasHiddenConnections(entityId)) {
               reason = 'connected_to_hidden';
           }
           return action.disabled(context.graph()) || reason;
       };

       operation.tooltip = function() {
           var disable = operation.disabled();
           return disable ?
               t('operations.orthogonalize.' + disable) :
               t('operations.orthogonalize.description.' + geometry);
       };

       operation.id = 'orthogonalize';
       operation.keys = [t('operations.orthogonalize.key')];
       operation.title = t('operations.orthogonalize.title');

       return operation;
   }

   function Reverse(selectedIDs, context) {
       var entityId = selectedIDs[0];

       var operation = function() {
           context.perform(
               Reverse$1(entityId),
               t('operations.reverse.annotation'));
       };

       operation.available = function() {
           return selectedIDs.length === 1 &&
               context.geometry(entityId) === 'line';
       };

       operation.disabled = function() {
           return false;
       };

       operation.tooltip = function() {
           return t('operations.reverse.description');
       };

       operation.id = 'reverse';
       operation.keys = [t('operations.reverse.key')];
       operation.title = t('operations.reverse.title');

       return operation;
   }

   function Rotate(selectedIDs, context) {
       var entityId = selectedIDs[0],
           entity = context.entity(entityId),
           extent = entity.extent(context.graph()),
           geometry = context.geometry(entityId);

       var operation = function() {
           context.enter(RotateWay(context, entityId));
       };

       operation.available = function() {
           if (selectedIDs.length !== 1 || entity.type !== 'way')
               return false;
           if (geometry === 'area')
               return true;
           if (entity.isClosed() &&
               context.graph().parentRelations(entity).some(function(r) { return r.isMultipolygon(); }))
               return true;
           return false;
       };

       operation.disabled = function() {
           if (extent.percentContainedIn(context.extent()) < 0.8) {
               return 'too_large';
           } else if (context.hasHiddenConnections(entityId)) {
               return 'connected_to_hidden';
           } else {
               return false;
           }
       };

       operation.tooltip = function() {
           var disable = operation.disabled();
           return disable ?
               t('operations.rotate.' + disable) :
               t('operations.rotate.description');
       };

       operation.id = 'rotate';
       operation.keys = [t('operations.rotate.key')];
       operation.title = t('operations.rotate.title');

       return operation;
   }

   function Split(selectedIDs, context) {
       var vertices = _.filter(selectedIDs, function vertex(entityId) {
           return context.geometry(entityId) === 'vertex';
       });

       var entityId = vertices[0],
           action = Split$1(entityId);

       if (selectedIDs.length > 1) {
           action.limitWays(_.without(selectedIDs, entityId));
       }

       var operation = function() {
           var annotation;

           var ways = action.ways(context.graph());
           if (ways.length === 1) {
               annotation = t('operations.split.annotation.' + context.geometry(ways[0].id));
           } else {
               annotation = t('operations.split.annotation.multiple', {n: ways.length});
           }

           var difference = context.perform(action, annotation);
           context.enter(Select(context, difference.extantIDs()));
       };

       operation.available = function() {
           return vertices.length === 1;
       };

       operation.disabled = function() {
           var reason;
           if (_.some(selectedIDs, context.hasHiddenConnections)) {
               reason = 'connected_to_hidden';
           }
           return action.disabled(context.graph()) || reason;
       };

       operation.tooltip = function() {
           var disable = operation.disabled();
           if (disable) {
               return t('operations.split.' + disable);
           }

           var ways = action.ways(context.graph());
           if (ways.length === 1) {
               return t('operations.split.description.' + context.geometry(ways[0].id));
           } else {
               return t('operations.split.description.multiple');
           }
       };

       operation.id = 'split';
       operation.keys = [t('operations.split.key')];
       operation.title = t('operations.split.title');

       return operation;
   }

   function Straighten(selectedIDs, context) {
       var entityId = selectedIDs[0],
           action = Straighten$1(entityId, context.projection);

       function operation() {
           var annotation = t('operations.straighten.annotation');
           context.perform(action, annotation);
       }

       operation.available = function() {
           var entity = context.entity(entityId);
           return selectedIDs.length === 1 &&
               entity.type === 'way' &&
               !entity.isClosed() &&
               _.uniq(entity.nodes).length > 2;
       };

       operation.disabled = function() {
           var reason;
           if (context.hasHiddenConnections(entityId)) {
               reason = 'connected_to_hidden';
           }
           return action.disabled(context.graph()) || reason;
       };

       operation.tooltip = function() {
           var disable = operation.disabled();
           return disable ?
               t('operations.straighten.' + disable) :
               t('operations.straighten.description');
       };

       operation.id = 'straighten';
       operation.keys = [t('operations.straighten.key')];
       operation.title = t('operations.straighten.title');

       return operation;
   }



   var Operations = Object.freeze({
   	Circularize: Circularize,
   	Continue: Continue,
   	Delete: Delete,
   	Disconnect: Disconnect,
   	Merge: Merge,
   	Move: Move,
   	Orthogonalize: Orthogonalize,
   	Reverse: Reverse,
   	Rotate: Rotate,
   	Split: Split,
   	Straighten: Straighten
   });

   function Select(context, selectedIDs) {
       var mode = {
           id: 'select',
           button: 'browse'
       };

       var keybinding = d3.keybinding('select'),
           timeout = null,
           behaviors = [
               Copy(context),
               Paste(context),
               Breathe(context),
               Hover(context),
               Select$1(context),
               Lasso(context),
               DragNode(context)
                   .selectedIDs(selectedIDs)
                   .behavior],
           inspector,
           radialMenu,
           newFeature = false,
           suppressMenu = false;

       var wrap = context.container()
           .select('.inspector-wrap');


       function singular() {
           if (selectedIDs.length === 1) {
               return context.hasEntity(selectedIDs[0]);
           }
       }

       function closeMenu() {
           if (radialMenu) {
               context.surface().call(radialMenu.close);
           }
       }

       function positionMenu() {
           if (suppressMenu || !radialMenu) { return; }

           var entity = singular();
           if (entity && context.geometry(entity.id) === 'relation') {
               suppressMenu = true;
           } else if (entity && entity.type === 'node') {
               radialMenu.center(context.projection(entity.loc));
           } else {
               var point = context.mouse(),
                   viewport = Extent(context.projection.clipExtent()).polygon();
               if (pointInPolygon(point, viewport)) {
                   radialMenu.center(point);
               } else {
                   suppressMenu = true;
               }
           }
       }

       function showMenu() {
           closeMenu();
           if (!suppressMenu && radialMenu) {
               context.surface().call(radialMenu);
           }
       }

       function toggleMenu() {
           if (d3.select('.radial-menu').empty()) {
               showMenu();
           } else {
               closeMenu();
           }
       }

       mode.selectedIDs = function() {
           return selectedIDs;
       };

       mode.reselect = function() {
           var surfaceNode = context.surface().node();
           if (surfaceNode.focus) { // FF doesn't support it
               surfaceNode.focus();
           }

           positionMenu();
           showMenu();
       };

       mode.newFeature = function(_) {
           if (!arguments.length) return newFeature;
           newFeature = _;
           return mode;
       };

       mode.suppressMenu = function(_) {
           if (!arguments.length) return suppressMenu;
           suppressMenu = _;
           return mode;
       };

       mode.enter = function() {
           function update() {
               closeMenu();
               if (_.some(selectedIDs, function(id) { return !context.hasEntity(id); })) {
                   // Exit mode if selected entity gets undone
                   context.enter(Browse(context));
               }
           }

           function dblclick() {
               var target = d3.select(d3.event.target),
                   datum = target.datum();

               if (datum instanceof Way && !target.classed('fill')) {
                   var choice = chooseEdge(context.childNodes(datum), context.mouse(), context.projection),
                       node = Node();

                   var prev = datum.nodes[choice.index - 1],
                       next = datum.nodes[choice.index];

                   context.perform(
                       AddMidpoint({loc: choice.loc, edge: [prev, next]}, node),
                       t('operations.add.annotation.vertex'));

                   d3.event.preventDefault();
                   d3.event.stopPropagation();
               }
           }

           function selectElements(drawn) {
               var entity = singular();
               if (entity && context.geometry(entity.id) === 'relation') {
                   suppressMenu = true;
                   return;
               }

               var selection = context.surface()
                       .selectAll(entityOrMemberSelector(selectedIDs, context.graph()));

               if (selection.empty()) {
                   if (drawn) {  // Exit mode if selected DOM elements have disappeared..
                       context.enter(Browse(context));
                   }
               } else {
                   selection
                       .classed('selected', true);
               }
           }

           function esc() {
               if (!context.inIntro()) {
                   context.enter(Browse(context));
               }
           }


           behaviors.forEach(function(behavior) {
               context.install(behavior);
           });

           var operations = _.without(d3.values(Operations), Delete)
                   .map(function(o) { return o(selectedIDs, context); })
                   .filter(function(o) { return o.available(); });

           operations.unshift(Delete(selectedIDs, context));

           keybinding
               .on('⎋', esc, true)
               .on('space', toggleMenu);

           operations.forEach(function(operation) {
               operation.keys.forEach(function(key) {
                   keybinding.on(key, function() {
                       if (!(context.inIntro() || operation.disabled())) {
                           operation();
                       }
                   });
               });
           });

           d3.select(document)
               .call(keybinding);

           radialMenu = RadialMenu(context, operations);

           context.ui().sidebar
               .select(singular() ? singular().id : null, newFeature);

           context.history()
               .on('undone.select', update)
               .on('redone.select', update);

           context.map()
               .on('move.select', closeMenu)
               .on('drawn.select', selectElements);

           selectElements();

           var show = d3.event && !suppressMenu;

           if (show) {
               positionMenu();
           }

           timeout = window.setTimeout(function() {
               if (show) {
                   showMenu();
               }

               context.surface()
                   .on('dblclick.select', dblclick);
           }, 200);

           if (selectedIDs.length > 1) {
               var entities = SelectionList(context, selectedIDs);
               context.ui().sidebar.show(entities);
           }
       };

       mode.exit = function() {
           if (timeout) window.clearTimeout(timeout);

           if (inspector) wrap.call(inspector.close);

           behaviors.forEach(function(behavior) {
               context.uninstall(behavior);
           });

           keybinding.off();
           closeMenu();
           radialMenu = undefined;

           context.history()
               .on('undone.select', null)
               .on('redone.select', null);

           context.surface()
               .on('dblclick.select', null)
               .selectAll('.selected')
               .classed('selected', false);

           context.map().on('drawn.select', null);
           context.ui().sidebar.hide();
       };

       return mode;
   }



   var modes = Object.freeze({
   	AddArea: AddArea,
   	AddLine: AddLine,
   	AddPoint: AddPoint,
   	Browse: Browse,
   	DragNode: DragNode,
   	DrawArea: DrawArea,
   	DrawLine: DrawLine,
   	Move: MoveMode,
   	RotateWay: RotateWay,
   	Save: SaveMode,
   	Select: Select
   });

   function Edit(context) {
       function edit() {
           context.map()
               .minzoom(context.minEditableZoom());
       }

       edit.off = function() {
           context.map()
               .minzoom(0);
       };

       return edit;
   }

   /*
      The hover behavior adds the `.hover` class on mouseover to all elements to which
      the identical datum is bound, and removes it on mouseout.

      The :hover pseudo-class is insufficient for iD's purposes because a datum's visual
      representation may consist of several elements scattered throughout the DOM hierarchy.
      Only one of these elements can have the :hover pseudo-class, but all of them will
      have the .hover class.
    */
   function Hover() {
       var dispatch = d3.dispatch('hover'),
           selection,
           altDisables,
           target;

       function keydown() {
           if (altDisables && d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
               dispatch.hover(null);
               selection.selectAll('.hover')
                   .classed('hover-suppressed', true)
                   .classed('hover', false);
           }
       }

       function keyup() {
           if (altDisables && d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
               dispatch.hover(target ? target.id : null);
               selection.selectAll('.hover-suppressed')
                   .classed('hover-suppressed', false)
                   .classed('hover', true);
           }
       }

       var hover = function(__) {
           selection = __;

           function enter(d) {
               if (d === target) return;

               target = d;

               selection.selectAll('.hover')
                   .classed('hover', false);
               selection.selectAll('.hover-suppressed')
                   .classed('hover-suppressed', false);

               if (target instanceof Entity) {
                   var selector = '.' + target.id;

                   if (target.type === 'relation') {
                       target.members.forEach(function(member) {
                           selector += ', .' + member.id;
                       });
                   }

                   var suppressed = altDisables && d3.event && d3.event.altKey;

                   selection.selectAll(selector)
                       .classed(suppressed ? 'hover-suppressed' : 'hover', true);

                   dispatch.hover(target.id);
               } else {
                   dispatch.hover(null);
               }
           }

           var down;

           function mouseover() {
               if (down) return;
               var target = d3.event.target;
               enter(target ? target.__data__ : null);
           }

           function mouseout() {
               if (down) return;
               var target = d3.event.relatedTarget;
               enter(target ? target.__data__ : null);
           }

           function mousedown() {
               down = true;
               d3.select(window)
                   .on('mouseup.hover', mouseup);
           }

           function mouseup() {
               down = false;
           }

           selection
               .on('mouseover.hover', mouseover)
               .on('mouseout.hover', mouseout)
               .on('mousedown.hover', mousedown)
               .on('mouseup.hover', mouseup);

           d3.select(window)
               .on('keydown.hover', keydown)
               .on('keyup.hover', keyup);
       };

       hover.off = function(selection) {
           selection.selectAll('.hover')
               .classed('hover', false);
           selection.selectAll('.hover-suppressed')
               .classed('hover-suppressed', false);

           selection
               .on('mouseover.hover', null)
               .on('mouseout.hover', null)
               .on('mousedown.hover', null)
               .on('mouseup.hover', null);

           d3.select(window)
               .on('keydown.hover', null)
               .on('keyup.hover', null)
               .on('mouseup.hover', null);
       };

       hover.altDisables = function(_) {
           if (!arguments.length) return altDisables;
           altDisables = _;
           return hover;
       };

       return d3.rebind(hover, dispatch, 'on');
   }

   function Tail() {
       var text,
           container,
           xmargin = 25,
           tooltipSize = [0, 0],
           selectionSize = [0, 0];

       function tail(selection) {
           if (!text) return;

           d3.select(window)
               .on('resize.tail', function() { selectionSize = selection.dimensions(); });

           function show() {
               container.style('display', 'block');
               tooltipSize = container.dimensions();
           }

           function mousemove() {
               if (container.style('display') === 'none') show();
               var xoffset = ((d3.event.clientX + tooltipSize[0] + xmargin) > selectionSize[0]) ?
                   -tooltipSize[0] - xmargin : xmargin;
               container.classed('left', xoffset > 0);
               setTransform(container, d3.event.clientX + xoffset, d3.event.clientY);
           }

           function mouseleave() {
               if (d3.event.relatedTarget !== container.node()) {
                   container.style('display', 'none');
               }
           }

           function mouseenter() {
               if (d3.event.relatedTarget !== container.node()) {
                   show();
               }
           }

           container = d3.select(document.body)
               .append('div')
               .style('display', 'none')
               .attr('class', 'tail tooltip-inner');

           container.append('div')
               .text(text);

           selection
               .on('mousemove.tail', mousemove)
               .on('mouseenter.tail', mouseenter)
               .on('mouseleave.tail', mouseleave);

           container
               .on('mousemove.tail', mousemove);

           tooltipSize = container.dimensions();
           selectionSize = selection.dimensions();
       }

       tail.off = function(selection) {
           if (!text) return;

           container
               .on('mousemove.tail', null)
               .remove();

           selection
               .on('mousemove.tail', null)
               .on('mouseenter.tail', null)
               .on('mouseleave.tail', null);

           d3.select(window)
               .on('resize.tail', null);
       };

       tail.text = function(_) {
           if (!arguments.length) return text;
           text = _;
           return tail;
       };

       return tail;
   }

   function Draw(context) {
       var event = d3.dispatch('move', 'click', 'clickWay',
               'clickNode', 'undo', 'cancel', 'finish'),
           keybinding = d3.keybinding('draw'),
           hover = Hover(context)
               .altDisables(true)
               .on('hover', context.ui().sidebar.hover),
           tail = Tail(),
           edit = Edit(context),
           closeTolerance = 4,
           tolerance = 12,
           mouseLeave = false,
           lastMouse = null,
           cached = Draw;

       function datum() {
           if (d3.event.altKey) return {};

           if (d3.event.type === 'keydown') {
               return (lastMouse && lastMouse.target.__data__) || {};
           } else {
               return d3.event.target.__data__ || {};
           }
       }

       function mousedown() {

           function point() {
               var p = context.container().node();
               return touchId !== null ? d3.touches(p).filter(function(p) {
                   return p.identifier === touchId;
               })[0] : d3.mouse(p);
           }

           var element = d3.select(this),
               touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null,
               t1 = +new Date(),
               p1 = point();

           element.on('mousemove.draw', null);

           d3.select(window).on('mouseup.draw', function() {
               var t2 = +new Date(),
                   p2 = point(),
                   dist = euclideanDistance(p1, p2);

               element.on('mousemove.draw', mousemove);
               d3.select(window).on('mouseup.draw', null);

               if (dist < closeTolerance || (dist < tolerance && (t2 - t1) < 500)) {
                   // Prevent a quick second click
                   d3.select(window).on('click.draw-block', function() {
                       d3.event.stopPropagation();
                   }, true);

                   context.map().dblclickEnable(false);

                   window.setTimeout(function() {
                       context.map().dblclickEnable(true);
                       d3.select(window).on('click.draw-block', null);
                   }, 500);

                   click();
               }
           });
       }

       function mousemove() {
           lastMouse = d3.event;
           event.move(datum());
       }

       function mouseenter() {
           mouseLeave = false;
       }

       function mouseleave() {
           mouseLeave = true;
       }

       function click() {
           var d = datum();
           if (d.type === 'way') {
               var dims = context.map().dimensions(),
                   mouse = context.mouse(),
                   pad = 5,
                   trySnap = mouse[0] > pad && mouse[0] < dims[0] - pad &&
                       mouse[1] > pad && mouse[1] < dims[1] - pad;

               if (trySnap) {
                   var choice = chooseEdge(context.childNodes(d), context.mouse(), context.projection),
                       edge = [d.nodes[choice.index - 1], d.nodes[choice.index]];
                   event.clickWay(choice.loc, edge);
               } else {
                   event.click(context.map().mouseCoordinates());
               }

           } else if (d.type === 'node') {
               event.clickNode(d);

           } else {
               event.click(context.map().mouseCoordinates());
           }
       }

       function space() {
           var currSpace = context.mouse();
           if (cached.disableSpace && cached.lastSpace) {
               var dist = euclideanDistance(cached.lastSpace, currSpace);
               if (dist > tolerance) {
                   cached.disableSpace = false;
               }
           }

           if (cached.disableSpace || mouseLeave || !lastMouse) return;

           // user must move mouse or release space bar to allow another click
           cached.lastSpace = currSpace;
           cached.disableSpace = true;

           d3.select(window).on('keyup.space-block', function() {
               cached.disableSpace = false;
               d3.select(window).on('keyup.space-block', null);
           });

           d3.event.preventDefault();
           click();
       }

       function backspace() {
           d3.event.preventDefault();
           event.undo();
       }

       function del() {
           d3.event.preventDefault();
           event.cancel();
       }

       function ret() {
           d3.event.preventDefault();
           event.finish();
       }

       function draw(selection) {
           context.install(hover);
           context.install(edit);

           if (!context.inIntro() && !cached.usedTails[tail.text()]) {
               context.install(tail);
           }

           keybinding
               .on('⌫', backspace)
               .on('⌦', del)
               .on('⎋', ret)
               .on('↩', ret)
               .on('space', space)
               .on('⌥space', space);

           selection
               .on('mouseenter.draw', mouseenter)
               .on('mouseleave.draw', mouseleave)
               .on('mousedown.draw', mousedown)
               .on('mousemove.draw', mousemove);

           d3.select(document)
               .call(keybinding);

           return draw;
       }

       draw.off = function(selection) {
           context.ui().sidebar.hover.cancel();
           context.uninstall(hover);
           context.uninstall(edit);

           if (!context.inIntro() && !cached.usedTails[tail.text()]) {
               context.uninstall(tail);
               cached.usedTails[tail.text()] = true;
           }

           selection
               .on('mouseenter.draw', null)
               .on('mouseleave.draw', null)
               .on('mousedown.draw', null)
               .on('mousemove.draw', null);

           d3.select(window)
               .on('mouseup.draw', null);
               // note: keyup.space-block, click.draw-block should remain

           d3.select(document)
               .call(keybinding.off);
       };

       draw.tail = function(_) {
           tail.text(_);
           return draw;
       };

       return d3.rebind(draw, event, 'on');
   }

   Draw.usedTails = {};
   Draw.disableSpace = false;
   Draw.lastSpace = null;

   function AddWay(context) {
       var event = d3.dispatch('start', 'startFromWay', 'startFromNode'),
           draw = Draw(context);

       var addWay = function(surface) {
           draw.on('click', event.start)
               .on('clickWay', event.startFromWay)
               .on('clickNode', event.startFromNode)
               .on('cancel', addWay.cancel)
               .on('finish', addWay.cancel);

           context.map()
               .dblclickEnable(false);

           surface.call(draw);
       };

       addWay.off = function(surface) {
           surface.call(draw.off);
       };

       addWay.cancel = function() {
           window.setTimeout(function() {
               context.map().dblclickEnable(true);
           }, 1000);

           context.enter(Browse(context));
       };

       addWay.tail = function(text) {
           draw.tail(text);
           return addWay;
       };

       return d3.rebind(addWay, event, 'on');
   }

   function Breathe(){
       var duration = 800,
           selector = '.selected.shadow, .selected .shadow',
           selected = d3.select(null),
           classed = '',
           params = {},
           done;

       function reset(selection) {
           selection
               .style('stroke-opacity', null)
               .style('stroke-width', null)
               .style('fill-opacity', null)
               .style('r', null);
       }

       function setAnimationParams(transition, fromTo) {
           transition
               .style('stroke-opacity', function(d) { return params[d.id][fromTo].opacity; })
               .style('stroke-width', function(d) { return params[d.id][fromTo].width; })
               .style('fill-opacity', function(d) { return params[d.id][fromTo].opacity; })
               .style('r', function(d) { return params[d.id][fromTo].width; });
       }

       function calcAnimationParams(selection) {
           selection
               .call(reset)
               .each(function(d) {
                   var s = d3.select(this),
                       tag = s.node().tagName,
                       p = {'from': {}, 'to': {}},
                       opacity, width;

                   // determine base opacity and width
                   if (tag === 'circle') {
                       opacity = parseFloat(s.style('fill-opacity') || 0.5);
                       width = parseFloat(s.style('r') || 15.5);
                   } else {
                       opacity = parseFloat(s.style('stroke-opacity') || 0.7);
                       width = parseFloat(s.style('stroke-width') || 10);
                   }

                   // calculate from/to interpolation params..
                   p.tag = tag;
                   p.from.opacity = opacity * 0.6;
                   p.to.opacity = opacity * 1.25;
                   p.from.width = width * 0.9;
                   p.to.width = width * (tag === 'circle' ? 1.5 : 1.25);
                   params[d.id] = p;
               });
       }

       function run(surface, fromTo) {
           var toFrom = (fromTo === 'from' ? 'to': 'from'),
               currSelected = surface.selectAll(selector),
               currClassed = surface.attr('class'),
               n = 0;

           if (done || currSelected.empty()) {
               selected.call(reset);
               return;
           }

           if (!_.isEqual(currSelected, selected) || currClassed !== classed) {
               selected.call(reset);
               classed = currClassed;
               selected = currSelected.call(calcAnimationParams);
           }

           selected
               .transition()
               .call(setAnimationParams, fromTo)
               .duration(duration)
               .each(function() { ++n; })
               .each('end', function() {
                   if (!--n) {  // call once
                       surface.call(run, toFrom);
                   }
               });
       }

       var breathe = function(surface) {
           done = false;
           d3.timer(function() {
               if (done) return true;

               var currSelected = surface.selectAll(selector);
               if (currSelected.empty()) return false;

               surface.call(run, 'from');
               return true;
           }, 200);
       };

       breathe.off = function() {
           done = true;
           d3.timer.flush();
           selected
               .transition()
               .call(reset)
               .duration(0);
       };

       return breathe;
   }

   function Copy(context) {
       var keybinding = d3.keybinding('copy');

       function groupEntities(ids, graph) {
           var entities = ids.map(function (id) { return graph.entity(id); });
           return _.extend({relation: [], way: [], node: []},
               _.groupBy(entities, function(entity) { return entity.type; }));
       }

       function getDescendants(id, graph, descendants) {
           var entity = graph.entity(id),
               i, children;

           descendants = descendants || {};

           if (entity.type === 'relation') {
               children = _.map(entity.members, 'id');
           } else if (entity.type === 'way') {
               children = entity.nodes;
           } else {
               children = [];
           }

           for (i = 0; i < children.length; i++) {
               if (!descendants[children[i]]) {
                   descendants[children[i]] = true;
                   descendants = getDescendants(children[i], graph, descendants);
               }
           }

           return descendants;
       }

       function doCopy() {
           d3.event.preventDefault();
           if (context.inIntro()) return;

           var graph = context.graph(),
               selected = groupEntities(context.selectedIDs(), graph),
               canCopy = [],
               skip = {},
               i, entity;

           for (i = 0; i < selected.relation.length; i++) {
               entity = selected.relation[i];
               if (!skip[entity.id] && entity.isComplete(graph)) {
                   canCopy.push(entity.id);
                   skip = getDescendants(entity.id, graph, skip);
               }
           }
           for (i = 0; i < selected.way.length; i++) {
               entity = selected.way[i];
               if (!skip[entity.id]) {
                   canCopy.push(entity.id);
                   skip = getDescendants(entity.id, graph, skip);
               }
           }
           for (i = 0; i < selected.node.length; i++) {
               entity = selected.node[i];
               if (!skip[entity.id]) {
                   canCopy.push(entity.id);
               }
           }

           context.copyIDs(canCopy);
       }

       function copy() {
           keybinding.on(cmd('⌘C'), doCopy);
           d3.select(document).call(keybinding);
           return copy;
       }

       copy.off = function() {
           d3.select(document).call(keybinding.off);
       };

       return copy;
   }

   /*
       `iD.behavior.drag` is like `d3.behavior.drag`, with the following differences:

       * The `origin` function is expected to return an [x, y] tuple rather than an
         {x, y} object.
       * The events are `start`, `move`, and `end`.
         (https://github.com/mbostock/d3/issues/563)
       * The `start` event is not dispatched until the first cursor movement occurs.
         (https://github.com/mbostock/d3/pull/368)
       * The `move` event has a `point` and `delta` [x, y] tuple properties rather
         than `x`, `y`, `dx`, and `dy` properties.
       * The `end` event is not dispatched if no movement occurs.
       * An `off` function is available that unbinds the drag's internal event handlers.
       * Delegation is supported via the `delegate` function.

    */
   function drag() {
       function d3_eventCancel() {
         d3.event.stopPropagation();
         d3.event.preventDefault();
       }

       var event = d3.dispatch('start', 'move', 'end'),
           origin = null,
           selector = '',
           filter = null,
           event_, target, surface;

       event.of = function(thiz, argumentz) {
         return function(e1) {
           var e0 = e1.sourceEvent = d3.event;
           e1.target = drag;
           d3.event = e1;
           try {
             event[e1.type].apply(thiz, argumentz);
           } finally {
             d3.event = e0;
           }
         };
       };

       var d3_event_userSelectProperty = prefixCSSProperty('UserSelect'),
           d3_event_userSelectSuppress = d3_event_userSelectProperty ?
               function () {
                   var selection = d3.selection(),
                       select = selection.style(d3_event_userSelectProperty);
                   selection.style(d3_event_userSelectProperty, 'none');
                   return function () {
                       selection.style(d3_event_userSelectProperty, select);
                   };
               } :
               function (type) {
                   var w = d3.select(window).on('selectstart.' + type, d3_eventCancel);
                   return function () {
                       w.on('selectstart.' + type, null);
                   };
               };

       function mousedown() {
           target = this;
           event_ = event.of(target, arguments);
           var eventTarget = d3.event.target,
               touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null,
               offset,
               origin_ = point(),
               started = false,
               selectEnable = d3_event_userSelectSuppress(touchId !== null ? 'drag-' + touchId : 'drag');

           var w = d3.select(window)
               .on(touchId !== null ? 'touchmove.drag-' + touchId : 'mousemove.drag', dragmove)
               .on(touchId !== null ? 'touchend.drag-' + touchId : 'mouseup.drag', dragend, true);

           if (origin) {
               offset = origin.apply(target, arguments);
               offset = [offset[0] - origin_[0], offset[1] - origin_[1]];
           } else {
               offset = [0, 0];
           }

           if (touchId === null) d3.event.stopPropagation();

           function point() {
               var p = target.parentNode || surface;
               return touchId !== null ? d3.touches(p).filter(function(p) {
                   return p.identifier === touchId;
               })[0] : d3.mouse(p);
           }

           function dragmove() {

               var p = point(),
                   dx = p[0] - origin_[0],
                   dy = p[1] - origin_[1];

               if (dx === 0 && dy === 0)
                   return;

               if (!started) {
                   started = true;
                   event_({
                       type: 'start'
                   });
               }

               origin_ = p;
               d3_eventCancel();

               event_({
                   type: 'move',
                   point: [p[0] + offset[0],  p[1] + offset[1]],
                   delta: [dx, dy]
               });
           }

           function dragend() {
               if (started) {
                   event_({
                       type: 'end'
                   });

                   d3_eventCancel();
                   if (d3.event.target === eventTarget) w.on('click.drag', click, true);
               }

               w.on(touchId !== null ? 'touchmove.drag-' + touchId : 'mousemove.drag', null)
                   .on(touchId !== null ? 'touchend.drag-' + touchId : 'mouseup.drag', null);
               selectEnable();
           }

           function click() {
               d3_eventCancel();
               w.on('click.drag', null);
           }
       }

       function drag(selection) {
           var matchesSelector = prefixDOMProperty('matchesSelector'),
               delegate = mousedown;

           if (selector) {
               delegate = function() {
                   var root = this,
                       target = d3.event.target;
                   for (; target && target !== root; target = target.parentNode) {
                       if (target[matchesSelector](selector) &&
                               (!filter || filter(target.__data__))) {
                           return mousedown.call(target, target.__data__);
                       }
                   }
               };
           }

           selection.on('mousedown.drag' + selector, delegate)
               .on('touchstart.drag' + selector, delegate);
       }

       drag.off = function(selection) {
           selection.on('mousedown.drag' + selector, null)
               .on('touchstart.drag' + selector, null);
       };

       drag.delegate = function(_) {
           if (!arguments.length) return selector;
           selector = _;
           return drag;
       };

       drag.filter = function(_) {
           if (!arguments.length) return origin;
           filter = _;
           return drag;
       };

       drag.origin = function (_) {
           if (!arguments.length) return origin;
           origin = _;
           return drag;
       };

       drag.cancel = function() {
           d3.select(window)
               .on('mousemove.drag', null)
               .on('mouseup.drag', null);
           return drag;
       };

       drag.target = function() {
           if (!arguments.length) return target;
           target = arguments[0];
           event_ = event.of(target, Array.prototype.slice.call(arguments, 1));
           return drag;
       };

       drag.surface = function() {
           if (!arguments.length) return surface;
           surface = arguments[0];
           return drag;
       };

       return d3.rebind(drag, event, 'on');
   }

   function DrawWay(context, wayId, index, mode, baseGraph) {
       var way = context.entity(wayId),
           isArea = context.geometry(wayId) === 'area',
           finished = false,
           annotation = t((way.isDegenerate() ?
               'operations.start.annotation.' :
               'operations.continue.annotation.') + context.geometry(wayId)),
           draw = Draw(context);

       var startIndex = typeof index === 'undefined' ? way.nodes.length - 1 : 0,
           start = Node({loc: context.graph().entity(way.nodes[startIndex]).loc}),
           end = Node({loc: context.map().mouseCoordinates()}),
           segment = Way({
               nodes: typeof index === 'undefined' ? [start.id, end.id] : [end.id, start.id],
               tags: _.clone(way.tags)
           });

       var f = context[way.isDegenerate() ? 'replace' : 'perform'];
       if (isArea) {
           f(AddEntity(end),
               AddVertex(wayId, end.id, index));
       } else {
           f(AddEntity(start),
               AddEntity(end),
               AddEntity(segment));
       }

       function move(datum) {
           var loc;

           if (datum.type === 'node' && datum.id !== end.id) {
               loc = datum.loc;

           } else if (datum.type === 'way' && datum.id !== segment.id) {
               var dims = context.map().dimensions(),
                   mouse = context.mouse(),
                   pad = 5,
                   trySnap = mouse[0] > pad && mouse[0] < dims[0] - pad &&
                       mouse[1] > pad && mouse[1] < dims[1] - pad;

               if (trySnap) {
                   loc = chooseEdge(context.childNodes(datum), context.mouse(), context.projection).loc;
               }
           }

           if (!loc) {
               loc = context.map().mouseCoordinates();
           }

           context.replace(MoveNode(end.id, loc));
       }

       function undone() {
           finished = true;
           context.enter(Browse(context));
       }

       function setActiveElements() {
           var active = isArea ? [wayId, end.id] : [segment.id, start.id, end.id];
           context.surface().selectAll(entitySelector(active))
               .classed('active', true);
       }

       var drawWay = function(surface) {
           draw.on('move', move)
               .on('click', drawWay.add)
               .on('clickWay', drawWay.addWay)
               .on('clickNode', drawWay.addNode)
               .on('undo', context.undo)
               .on('cancel', drawWay.cancel)
               .on('finish', drawWay.finish);

           context.map()
               .dblclickEnable(false)
               .on('drawn.draw', setActiveElements);

           setActiveElements();

           surface.call(draw);

           context.history()
               .on('undone.draw', undone);
       };

       drawWay.off = function(surface) {
           if (!finished)
               context.pop();

           context.map()
               .on('drawn.draw', null);

           surface.call(draw.off)
               .selectAll('.active')
               .classed('active', false);

           context.history()
               .on('undone.draw', null);
       };

       function ReplaceTemporaryNode(newNode) {
           return function(graph) {
               if (isArea) {
                   return graph
                       .replace(way.addNode(newNode.id, index))
                       .remove(end);

               } else {
                   return graph
                       .replace(graph.entity(wayId).addNode(newNode.id, index))
                       .remove(end)
                       .remove(segment)
                       .remove(start);
               }
           };
       }

       // Accept the current position of the temporary node and continue drawing.
       drawWay.add = function(loc) {

           // prevent duplicate nodes
           var last = context.hasEntity(way.nodes[way.nodes.length - (isArea ? 2 : 1)]);
           if (last && last.loc[0] === loc[0] && last.loc[1] === loc[1]) return;

           var newNode = Node({loc: loc});

           context.replace(
               AddEntity(newNode),
               ReplaceTemporaryNode(newNode),
               annotation);

           finished = true;
           context.enter(mode);
       };

       // Connect the way to an existing way.
       drawWay.addWay = function(loc, edge) {
           var previousEdge = startIndex ?
               [way.nodes[startIndex], way.nodes[startIndex - 1]] :
               [way.nodes[0], way.nodes[1]];

           // Avoid creating duplicate segments
           if (!isArea && edgeEqual(edge, previousEdge))
               return;

           var newNode = Node({ loc: loc });

           context.perform(
               AddMidpoint({ loc: loc, edge: edge}, newNode),
               ReplaceTemporaryNode(newNode),
               annotation);

           finished = true;
           context.enter(mode);
       };

       // Connect the way to an existing node and continue drawing.
       drawWay.addNode = function(node) {

           // Avoid creating duplicate segments
           if (way.areAdjacent(node.id, way.nodes[way.nodes.length - 1])) return;

           context.perform(
               ReplaceTemporaryNode(node),
               annotation);

           finished = true;
           context.enter(mode);
       };

       // Finish the draw operation, removing the temporary node. If the way has enough
       // nodes to be valid, it's selected. Otherwise, return to browse mode.
       drawWay.finish = function() {
           context.pop();
           finished = true;

           window.setTimeout(function() {
               context.map().dblclickEnable(true);
           }, 1000);

           if (context.hasEntity(wayId)) {
               context.enter(
                   Select(context, [wayId])
                       .suppressMenu(true)
                       .newFeature(true));
           } else {
               context.enter(Browse(context));
           }
       };

       // Cancel the draw operation and return to browse, deleting everything drawn.
       drawWay.cancel = function() {
           context.perform(
               d3.functor(baseGraph),
               t('operations.cancel_draw.annotation'));

           window.setTimeout(function() {
               context.map().dblclickEnable(true);
           }, 1000);

           finished = true;
           context.enter(Browse(context));
       };

       drawWay.tail = function(text) {
           draw.tail(text);
           return drawWay;
       };

       return drawWay;
   }

   function Hash(context) {
       var s0 = null, // cached location.hash
           lat = 90 - 1e-8; // allowable latitude range

       var parser = function(map, s) {
           var q = stringQs(s);
           var args = (q.map || '').split('/').map(Number);
           if (args.length < 3 || args.some(isNaN)) {
               return true; // replace bogus hash
           } else if (s !== formatter(map).slice(1)) {
               map.centerZoom([args[1],
                   Math.min(lat, Math.max(-lat, args[2]))], args[0]);
           }
       };

       var formatter = function(map) {
           var mode = context.mode(),
               center = map.center(),
               zoom = map.zoom(),
               precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2)),
               q = _.omit(stringQs(location.hash.substring(1)), 'comment'),
               newParams = {};

           if (mode && mode.id === 'browse') {
               delete q.id;
           } else {
               var selected = context.selectedIDs().filter(function(id) {
                   return !context.entity(id).isNew();
               });
               if (selected.length) {
                   newParams.id = selected.join(',');
               }
           }

           newParams.map = zoom.toFixed(2) +
                   '/' + center[0].toFixed(precision) +
                   '/' + center[1].toFixed(precision);

           return '#' + qsString(_.assign(q, newParams), true);
       };

       function update() {
           if (context.inIntro()) return;
           var s1 = formatter(context.map());
           if (s0 !== s1) location.replace(s0 = s1); // don't recenter the map!
       }

       var throttledUpdate = _.throttle(update, 500);

       function hashchange() {
           if (location.hash === s0) return; // ignore spurious hashchange events
           if (parser(context.map(), (s0 = location.hash).substring(1))) {
               update(); // replace bogus hash
           }
       }

       function hash() {
           context.map()
               .on('move.hash', throttledUpdate);

           context
               .on('enter.hash', throttledUpdate);

           d3.select(window)
               .on('hashchange.hash', hashchange);

           if (location.hash) {
               var q = stringQs(location.hash.substring(1));
               if (q.id) context.zoomToEntity(q.id.split(',')[0], !q.map);
               if (q.comment) context.storage('comment', q.comment);
               hashchange();
               if (q.map) hash.hadHash = true;
           }
       }

       hash.off = function() {
           throttledUpdate.cancel();

           context.map()
               .on('move.hash', null);

           context
               .on('enter.hash', null);

           d3.select(window)
               .on('hashchange.hash', null);

           location.hash = '';
       };

       return hash;
   }

   function Lasso(context) {

       var behavior = function(selection) {
           var lasso;

           function mousedown() {
               var button = 0;  // left
               if (d3.event.button === button && d3.event.shiftKey === true) {
                   lasso = null;

                   selection
                       .on('mousemove.lasso', mousemove)
                       .on('mouseup.lasso', mouseup);

                   d3.event.stopPropagation();
               }
           }

           function mousemove() {
               if (!lasso) {
                   lasso = Lasso$1(context);
                   context.surface().call(lasso);
               }

               lasso.p(context.mouse());
           }

           function normalize(a, b) {
               return [
                   [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
                   [Math.max(a[0], b[0]), Math.max(a[1], b[1])]];
           }

           function lassoed() {
               if (!lasso) return [];

               var graph = context.graph(),
                   bounds = lasso.extent().map(context.projection.invert),
                   extent = Extent(normalize(bounds[0], bounds[1]));

               return _.map(context.intersects(extent).filter(function(entity) {
                   return entity.type === 'node' &&
                       pointInPolygon(context.projection(entity.loc), lasso.coordinates) &&
                       !context.features().isHidden(entity, graph, entity.geometry(graph));
               }), 'id');
           }

           function mouseup() {
               selection
                   .on('mousemove.lasso', null)
                   .on('mouseup.lasso', null);

               if (!lasso) return;

               var ids = lassoed();
               lasso.close();

               if (ids.length) {
                   context.enter(Select(context, ids));
               }
           }

           selection
               .on('mousedown.lasso', mousedown);
       };

       behavior.off = function(selection) {
           selection.on('mousedown.lasso', null);
       };

       return behavior;
   }

   function Paste(context) {
       var keybinding = d3.keybinding('paste');

       function omitTag(v, k) {
           return (
               k === 'phone' ||
               k === 'fax' ||
               k === 'email' ||
               k === 'website' ||
               k === 'url' ||
               k === 'note' ||
               k === 'description' ||
               k.indexOf('name') !== -1 ||
               k.indexOf('wiki') === 0 ||
               k.indexOf('addr:') === 0 ||
               k.indexOf('contact:') === 0
           );
       }

       function doPaste() {
           d3.event.preventDefault();
           if (context.inIntro()) return;

           var baseGraph = context.graph(),
               mouse = context.mouse(),
               projection = context.projection,
               viewport = Extent(projection.clipExtent()).polygon();

           if (!pointInPolygon(mouse, viewport)) return;

           var extent = Extent(),
               oldIDs = context.copyIDs(),
               oldGraph = context.copyGraph(),
               newIDs = [];

           if (!oldIDs.length) return;

           var action = CopyEntities(oldIDs, oldGraph);
           context.perform(action);

           var copies = action.copies();
           for (var id in copies) {
               var oldEntity = oldGraph.entity(id),
                   newEntity = copies[id];

               extent._extend(oldEntity.extent(oldGraph));
               newIDs.push(newEntity.id);
               context.perform(ChangeTags(newEntity.id, _.omit(newEntity.tags, omitTag)));
           }

           // Put pasted objects where mouse pointer is..
           var center = projection(extent.center()),
               delta = [ mouse[0] - center[0], mouse[1] - center[1] ];

           context.perform(Move$1(newIDs, delta, projection));
           context.enter(MoveMode(context, newIDs, baseGraph));
       }

       function paste() {
           keybinding.on(cmd('⌘V'), doPaste);
           d3.select(document).call(keybinding);
           return paste;
       }

       paste.off = function() {
           d3.select(document).call(keybinding.off);
       };

       return paste;
   }

   function Select$1(context) {
       function keydown() {
           if (d3.event && d3.event.shiftKey) {
               context.surface()
                   .classed('behavior-multiselect', true);
           }
       }

       function keyup() {
           if (!d3.event || !d3.event.shiftKey) {
               context.surface()
                   .classed('behavior-multiselect', false);
           }
       }

       function click() {
           var datum = d3.event.target.__data__,
               lasso = d3.select('#surface .lasso').node(),
               mode = context.mode();

           if (!(datum instanceof Entity)) {
               if (!d3.event.shiftKey && !lasso && mode.id !== 'browse')
                   context.enter(Browse(context));

           } else if (!d3.event.shiftKey && !lasso) {
               // Avoid re-entering Select mode with same entity.
               if (context.selectedIDs().length !== 1 || context.selectedIDs()[0] !== datum.id) {
                   context.enter(Select(context, [datum.id]));
               } else {
                   mode.suppressMenu(false).reselect();
               }
           } else if (context.selectedIDs().indexOf(datum.id) >= 0) {
               var selectedIDs = _.without(context.selectedIDs(), datum.id);
               context.enter(selectedIDs.length ?
                   Select(context, selectedIDs) :
                   Browse(context));

           } else {
               context.enter(Select(context, context.selectedIDs().concat([datum.id])));
           }
       }

       var behavior = function(selection) {
           d3.select(window)
               .on('keydown.select', keydown)
               .on('keyup.select', keyup);

           selection.on('click.select', click);

           keydown();
       };

       behavior.off = function(selection) {
           d3.select(window)
               .on('keydown.select', null)
               .on('keyup.select', null);

           selection.on('click.select', null);

           keyup();
       };

       return behavior;
   }



   var behavior = Object.freeze({
   	AddWay: AddWay,
   	Breathe: Breathe,
   	Copy: Copy,
   	drag: drag,
   	DrawWay: DrawWay,
   	Draw: Draw,
   	Edit: Edit,
   	Hash: Hash,
   	Hover: Hover,
   	Lasso: Lasso,
   	Paste: Paste,
   	Select: Select$1,
   	Tail: Tail
   });

   function restrictions(field, context) {
       var dispatch = d3.dispatch('change'),
           hover = Hover(context),
           vertexID,
           fromNodeID;

       function restrictions(selection) {
           // if form field is hidden or has detached from dom, clean up.
           if (!d3.select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
               selection.call(restrictions.off);
               return;
           }

           var wrap = selection.selectAll('.preset-input-wrap')
               .data([0]);

           var enter = wrap.enter()
               .append('div')
               .attr('class', 'preset-input-wrap');

           enter
               .append('div')
               .attr('class', 'restriction-help');


           var intersection = Intersection(context.graph(), vertexID),
               graph = intersection.graph,
               vertex = graph.entity(vertexID),
               filter = d3.functor(true),
               extent = Extent(),
               projection = RawMercator();

           var d = wrap.dimensions(),
               c = [d[0] / 2, d[1] / 2],
               z = 24;

           projection
               .scale(256 * Math.pow(2, z) / (2 * Math.PI));

           var s = projection(vertex.loc);

           projection
               .translate([c[0] - s[0], c[1] - s[1]])
               .clipExtent([[0, 0], d]);

           var drawLayers = Layers(projection, context).only('osm').dimensions(d),
               drawVertices = Vertices(projection, context),
               drawLines = Lines(projection, context),
               drawTurns = Turns(projection, context);

           enter
               .call(drawLayers)
               .selectAll('.surface')
               .call(hover);


           var surface = wrap.selectAll('.surface');

           surface
               .dimensions(d)
               .call(drawVertices, graph, [vertex], filter, extent, z)
               .call(drawLines, graph, intersection.ways, filter)
               .call(drawTurns, graph, intersection.turns(fromNodeID));

           surface
               .on('click.restrictions', click)
               .on('mouseover.restrictions', mouseover)
               .on('mouseout.restrictions', mouseout);

           surface
               .selectAll('.selected')
               .classed('selected', false);

           if (fromNodeID) {
               surface
                   .selectAll('.' + intersection.highways[fromNodeID].id)
                   .classed('selected', true);
           }

           mouseout();

           context.history()
               .on('change.restrictions', render);

           d3.select(window)
               .on('resize.restrictions', function() {
                   wrap.dimensions(null);
                   render();
               });

           function click() {
               var datum = d3.event.target.__data__;
               if (datum instanceof Entity) {
                   fromNodeID = intersection.adjacentNodeId(datum.id);
                   render();
               } else if (datum instanceof Turn) {
                   if (datum.restriction) {
                       context.perform(
                           UnrestrictTurn(datum, projection),
                           t('operations.restriction.annotation.delete'));
                   } else {
                       context.perform(
                           RestrictTurn(datum, projection),
                           t('operations.restriction.annotation.create'));
                   }
               }
           }

           function mouseover() {
               var datum = d3.event.target.__data__;
               if (datum instanceof Turn) {
                   var graph = context.graph(),
                       presets = context.presets(),
                       preset;

                   if (datum.restriction) {
                       preset = presets.match(graph.entity(datum.restriction), graph);
                   } else {
                       preset = presets.item('type/restriction/' +
                           inferRestriction(
                               graph,
                               datum.from,
                               datum.via,
                               datum.to,
                               projection));
                   }

                   wrap.selectAll('.restriction-help')
                       .text(t('operations.restriction.help.' +
                           (datum.restriction ? 'toggle_off' : 'toggle_on'),
                           {restriction: preset.name()}));
               }
           }

           function mouseout() {
               wrap.selectAll('.restriction-help')
                   .text(t('operations.restriction.help.' +
                       (fromNodeID ? 'toggle' : 'select')));
           }

           function render() {
               if (context.hasEntity(vertexID)) {
                   restrictions(selection);
               }
           }
       }

       restrictions.entity = function(_) {
           if (!vertexID || vertexID !== _.id) {
               fromNodeID = null;
               vertexID = _.id;
           }
       };

       restrictions.tags = function() {};
       restrictions.focus = function() {};

       restrictions.off = function(selection) {
           selection.selectAll('.surface')
               .call(hover.off)
               .on('click.restrictions', null)
               .on('mouseover.restrictions', null)
               .on('mouseout.restrictions', null);

           context.history()
               .on('change.restrictions', null);

           d3.select(window)
               .on('resize.restrictions', null);
       };

       return d3.rebind(restrictions, dispatch, 'on');
   }

   function textarea(field) {
       var dispatch = d3.dispatch('change'),
           input;

       function textarea(selection) {
           input = selection.selectAll('textarea')
               .data([0]);

           input.enter().append('textarea')
               .attr('id', 'preset-input-' + field.id)
               .attr('placeholder', field.placeholder() || t('inspector.unknown'))
               .attr('maxlength', 255);

           input
               .on('input', change(true))
               .on('blur', change())
               .on('change', change());
       }

       function change(onInput) {
           return function() {
               var t = {};
               t[field.key] = input.value() || undefined;
               dispatch.change(t, onInput);
           };
       }

       textarea.tags = function(tags) {
           input.value(tags[field.key] || '');
       };

       textarea.focus = function() {
           input.node().focus();
       };

       return d3.rebind(textarea, dispatch, 'on');
   }

   function wikipedia(field, context) {
       var dispatch = d3.dispatch('change'),
           wikipedia = iD.services.wikipedia(),
           wikidata = iD.services.wikidata(),
           link, entity, lang, title;

       function wiki(selection) {
           var langcombo = d3.combobox()
               .fetcher(function(value, cb) {
                   var v = value.toLowerCase();

                   cb(iD.data.wikipedia.filter(function(d) {
                       return d[0].toLowerCase().indexOf(v) >= 0 ||
                           d[1].toLowerCase().indexOf(v) >= 0 ||
                           d[2].toLowerCase().indexOf(v) >= 0;
                   }).map(function(d) {
                       return { value: d[1] };
                   }));
               });

           var titlecombo = d3.combobox()
               .fetcher(function(value, cb) {

                   if (!value) value = context.entity(entity.id).tags.name || '';
                   var searchfn = value.length > 7 ? wikipedia.search : wikipedia.suggestions;

                   searchfn(language()[2], value, function(query, data) {
                       cb(data.map(function(d) {
                           return { value: d };
                       }));
                   });
               });

           lang = selection.selectAll('input.wiki-lang')
               .data([0]);

           lang.enter().append('input')
               .attr('type', 'text')
               .attr('class', 'wiki-lang')
               .attr('placeholder', t('translate.localized_translation_language'))
               .value('English');

           lang
               .call(langcombo)
               .on('blur', changeLang)
               .on('change', changeLang);

           title = selection.selectAll('input.wiki-title')
               .data([0]);

           title.enter().append('input')
               .attr('type', 'text')
               .attr('class', 'wiki-title')
               .attr('id', 'preset-input-' + field.id);

           title
               .call(titlecombo)
               .on('blur', blur)
               .on('change', change);

           link = selection.selectAll('a.wiki-link')
               .data([0]);

           link.enter().append('a')
               .attr('class', 'wiki-link button-input-action minor')
               .attr('tabindex', -1)
               .attr('target', '_blank')
               .call(Icon('#icon-out-link', 'inline'));
       }

       function language() {
           var value = lang.value().toLowerCase();
           var locale = iD.detect().locale.toLowerCase();
           var localeLanguage;
           return _.find(iD.data.wikipedia, function(d) {
               if (d[2] === locale) localeLanguage = d;
               return d[0].toLowerCase() === value ||
                   d[1].toLowerCase() === value ||
                   d[2] === value;
           }) || localeLanguage || ['English', 'English', 'en'];
       }

       function changeLang() {
           lang.value(language()[1]);
           change(true);
       }

       function blur() {
           change(true);
       }

       function change(skipWikidata) {
           var value = title.value(),
               m = value.match(/https?:\/\/([-a-z]+)\.wikipedia\.org\/(?:wiki|\1-[-a-z]+)\/([^#]+)(?:#(.+))?/),
               l = m && _.find(iD.data.wikipedia, function(d) { return m[1] === d[2]; }),
               anchor,
               syncTags = {};

           if (l) {
               // Normalize title http://www.mediawiki.org/wiki/API:Query#Title_normalization
               value = decodeURIComponent(m[2]).replace(/_/g, ' ');
               if (m[3]) {
                   try {
                       // Best-effort `anchordecode:` implementation
                       anchor = decodeURIComponent(m[3].replace(/\.([0-9A-F]{2})/g, '%$1'));
                   } catch (e) {
                       anchor = decodeURIComponent(m[3]);
                   }
                   value += '#' + anchor.replace(/_/g, ' ');
               }
               value = value.slice(0, 1).toUpperCase() + value.slice(1);
               lang.value(l[1]);
               title.value(value);
           }

           syncTags.wikipedia = value ? language()[2] + ':' + value : undefined;
           if (!skipWikidata) {
               syncTags.wikidata = undefined;
           }

           dispatch.change(syncTags);


           if (skipWikidata || !value || !language()[2]) return;

           // attempt asynchronous update of wikidata tag..
           var initEntityId = entity.id,
               initWikipedia = context.entity(initEntityId).tags.wikipedia;

           wikidata.itemsByTitle(language()[2], value, function (title, data) {
               // 1. most recent change was a tag change
               var annotation = t('operations.change_tags.annotation'),
                   currAnnotation = context.history().undoAnnotation();
               if (currAnnotation !== annotation) return;

               // 2. same entity exists and still selected
               var selectedIds = context.selectedIDs(),
                   currEntityId = selectedIds.length > 0 && selectedIds[0];
               if (currEntityId !== initEntityId) return;

               // 3. wikipedia value has not changed
               var currTags = _.clone(context.entity(currEntityId).tags),
                   qids = data && Object.keys(data);
               if (initWikipedia !== currTags.wikipedia) return;

               // ok to coalesce the update of wikidata tag into the previous tag change
               currTags.wikidata = qids && _.find(qids, function (id) {
                   return id.match(/^Q\d+$/);
               });

               context.overwrite(ChangeTags(currEntityId, currTags), annotation);
               dispatch.change(currTags);
           });
       }

       wiki.tags = function(tags) {
           var value = tags[field.key] || '',
               m = value.match(/([^:]+):([^#]+)(?:#(.+))?/),
               l = m && _.find(iD.data.wikipedia, function(d) { return m[1] === d[2]; }),
               anchor = m && m[3];

           // value in correct format
           if (l) {
               lang.value(l[1]);
               title.value(m[2] + (anchor ? ('#' + anchor) : ''));
               if (anchor) {
                   try {
                       // Best-effort `anchorencode:` implementation
                       anchor = encodeURIComponent(anchor.replace(/ /g, '_')).replace(/%/g, '.');
                   } catch (e) {
                       anchor = anchor.replace(/ /g, '_');
                   }
               }
               link.attr('href', 'https://' + m[1] + '.wikipedia.org/wiki/' +
                   m[2].replace(/ /g, '_') + (anchor ? ('#' + anchor) : ''));

           // unrecognized value format
           } else {
               title.value(value);
               if (value && value !== '') {
                   lang.value('');
               }
               link.attr('href', 'https://en.wikipedia.org/wiki/Special:Search?search=' + value);
           }
       };

       wiki.entity = function(_) {
           if (!arguments.length) return entity;
           entity = _;
           return wiki;
       };

       wiki.focus = function() {
           title.node().focus();
       };

       return d3.rebind(wiki, dispatch, 'on');
   }

   var fields = {
       access: access,
       address: address,
       check: check,
       defaultcheck: check,
       combo: combo,
       typeCombo: combo,
       multiCombo: combo,
       cycleway: cycleway,
       text: url,
       url: url,
       number: url,
       email: url,
       tel: url,
       localized: localized,
       lanes: lanes,
       maxspeed: maxspeed,
       radio: radio,
       restrictions: restrictions,
       textarea: textarea,
       wikipedia: wikipedia
   };

   function Account(context) {
       var connection = context.connection();

       function update(selection) {
           if (!connection.authenticated()) {
               selection.selectAll('#userLink, #logoutLink')
                   .classed('hide', true);
               return;
           }

           connection.userDetails(function(err, details) {
               var userLink = selection.select('#userLink'),
                   logoutLink = selection.select('#logoutLink');

               userLink.html('');
               logoutLink.html('');

               if (err) return;

               selection.selectAll('#userLink, #logoutLink')
                   .classed('hide', false);

               // Link
               userLink.append('a')
                   .attr('href', connection.userURL(details.display_name))
                   .attr('target', '_blank');

               // Add thumbnail or dont
               if (details.image_url) {
                   userLink.append('img')
                       .attr('class', 'icon pre-text user-icon')
                       .attr('src', details.image_url);
               } else {
                   userLink
                       .call(Icon('#icon-avatar', 'pre-text light'));
               }

               // Add user name
               userLink.append('span')
                   .attr('class', 'label')
                   .text(details.display_name);

               logoutLink.append('a')
                   .attr('class', 'logout')
                   .attr('href', '#')
                   .text(t('logout'))
                   .on('click.logout', function() {
                       d3.event.preventDefault();
                       connection.logout();
                   });
           });
       }

       return function(selection) {
           selection.append('li')
               .attr('id', 'logoutLink')
               .classed('hide', true);

           selection.append('li')
               .attr('id', 'userLink')
               .classed('hide', true);

           connection.on('auth.account', function() { update(selection); });
           update(selection);
       };
   }

   function Attribution(context) {
       var selection;

       function attribution(data, klass) {
           var div = selection.selectAll('.' + klass)
               .data([0]);

           div.enter()
               .append('div')
               .attr('class', klass);

           var background = div.selectAll('.attribution')
               .data(data, function(d) { return d.name(); });

           background.enter()
               .append('span')
               .attr('class', 'attribution')
               .each(function(d) {
                   if (d.terms_html) {
                       d3.select(this)
                           .html(d.terms_html);
                       return;
                   }

                   var source = d.terms_text || d.id || d.name();

                   if (d.logo) {
                       source = '<img class="source-image" src="' + context.imagePath(d.logo) + '">';
                   }

                   if (d.terms_url) {
                       d3.select(this)
                           .append('a')
                           .attr('href', d.terms_url)
                           .attr('target', '_blank')
                           .html(source);
                   } else {
                       d3.select(this)
                           .text(source);
                   }
               });

           background.exit()
               .remove();

           var copyright = background.selectAll('.copyright-notice')
               .data(function(d) {
                   var notice = d.copyrightNotices(context.map().zoom(), context.map().extent());
                   return notice ? [notice] : [];
               });

           copyright.enter()
               .append('span')
               .attr('class', 'copyright-notice');

           copyright.text(String);

           copyright.exit()
               .remove();
       }

       function update() {
           attribution([context.background().baseLayerSource()], 'base-layer-attribution');
           attribution(context.background().overlayLayerSources().filter(function (s) {
               return s.validZoom(context.map().zoom());
           }), 'overlay-layer-attribution');
       }

       return function(select) {
           selection = select;

           context.background()
               .on('change.attribution', update);

           context.map()
               .on('move.attribution', _.throttle(update, 400, {leading: false}));

           update();
       };
   }

   function BackgroundSource(data) {
       var source = _.clone(data),
           offset = [0, 0],
           name = source.name,
           best = !!source.best;

       source.scaleExtent = data.scaleExtent || [0, 20];
       source.overzoom = data.overzoom !== false;

       source.offset = function(_) {
           if (!arguments.length) return offset;
           offset = _;
           return source;
       };

       source.nudge = function(_, zoomlevel) {
           offset[0] += _[0] / Math.pow(2, zoomlevel);
           offset[1] += _[1] / Math.pow(2, zoomlevel);
           return source;
       };

       source.name = function() {
           return name;
       };

       source.best = function() {
           return best;
       };

       source.area = function() {
           if (!data.polygon) return Number.MAX_VALUE;  // worldwide
           var area = d3.geo.area({ type: 'MultiPolygon', coordinates: [ data.polygon ] });
           return isNaN(area) ? 0 : area;
       };

       source.imageryUsed = function() {
           return source.id || name;
       };

       source.url = function(coord) {
           return data.template
               .replace('{x}', coord[0])
               .replace('{y}', coord[1])
               // TMS-flipped y coordinate
               .replace(/\{[t-]y\}/, Math.pow(2, coord[2]) - coord[1] - 1)
               .replace(/\{z(oom)?\}/, coord[2])
               .replace(/\{switch:([^}]+)\}/, function(s, r) {
                   var subdomains = r.split(',');
                   return subdomains[(coord[0] + coord[1]) % subdomains.length];
               })
               .replace('{u}', function() {
                   var u = '';
                   for (var zoom = coord[2]; zoom > 0; zoom--) {
                       var b = 0;
                       var mask = 1 << (zoom - 1);
                       if ((coord[0] & mask) !== 0) b++;
                       if ((coord[1] & mask) !== 0) b += 2;
                       u += b.toString();
                   }
                   return u;
               });
       };

       source.intersects = function(extent) {
           extent = extent.polygon();
           return !data.polygon || data.polygon.some(function(polygon) {
               return polygonIntersectsPolygon(polygon, extent, true);
           });
       };

       source.validZoom = function(z) {
           return source.scaleExtent[0] <= z &&
               (source.overzoom || source.scaleExtent[1] > z);
       };

       source.isLocatorOverlay = function() {
           return name === 'Locator Overlay';
       };

       source.copyrightNotices = function() {};

       return source;
   }

   BackgroundSource.Bing = function(data, dispatch) {
       // http://msdn.microsoft.com/en-us/library/ff701716.aspx
       // http://msdn.microsoft.com/en-us/library/ff701701.aspx

       data.template = 'https://ecn.t{switch:0,1,2,3}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&mkt=en-gb&n=z';

       var bing = BackgroundSource(data),
           key = 'Arzdiw4nlOJzRwOz__qailc8NiR31Tt51dN2D7cm57NrnceZnCpgOkmJhNpGoppU', // Same as P2 and JOSM
           url = 'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/Aerial?include=ImageryProviders&key=' +
               key + '&jsonp={callback}',
           providers = [];

       d3.jsonp(url, function(json) {
           providers = json.resourceSets[0].resources[0].imageryProviders.map(function(provider) {
               return {
                   attribution: provider.attribution,
                   areas: provider.coverageAreas.map(function(area) {
                       return {
                           zoom: [area.zoomMin, area.zoomMax],
                           extent: Extent([area.bbox[1], area.bbox[0]], [area.bbox[3], area.bbox[2]])
                       };
                   })
               };
           });
           dispatch.change();
       });

       bing.copyrightNotices = function(zoom, extent) {
           zoom = Math.min(zoom, 21);
           return providers.filter(function(provider) {
               return _.some(provider.areas, function(area) {
                   return extent.intersects(area.extent) &&
                       area.zoom[0] <= zoom &&
                       area.zoom[1] >= zoom;
               });
           }).map(function(provider) {
               return provider.attribution;
           }).join(', ');
       };

       bing.logo = 'bing_maps.png';
       bing.terms_url = 'https://blog.openstreetmap.org/2010/11/30/microsoft-imagery-details';

       return bing;
   };

   BackgroundSource.None = function() {
       var source = BackgroundSource({id: 'none', template: ''});

       source.name = function() {
           return t('background.none');
       };

       source.imageryUsed = function() {
           return 'None';
       };

       source.area = function() {
           return -1;
       };

       return source;
   };

   BackgroundSource.Custom = function(template) {
       var source = BackgroundSource({id: 'custom', template: template});

       source.name = function() {
           return t('background.custom');
       };

       source.imageryUsed = function() {
           return 'Custom (' + template + ')';
       };

       source.area = function() {
           return -2;
       };

       return source;
   };

   function TileLayer(context) {
       var tileSize = 256,
           tile = d3.geo.tile(),
           projection,
           cache = {},
           tileOrigin,
           z,
           transformProp = prefixCSSProperty('Transform'),
           source = d3.functor('');


       // blacklist overlay tiles around Null Island..
       function nearNullIsland(x, y, z) {
           if (z >= 7) {
               var center = Math.pow(2, z - 1),
                   width = Math.pow(2, z - 6),
                   min = center - (width / 2),
                   max = center + (width / 2) - 1;
               return x >= min && x <= max && y >= min && y <= max;
           }
           return false;
       }

       function tileSizeAtZoom(d, z) {
           var epsilon = 0.002;
           return ((tileSize * Math.pow(2, z - d[2])) / tileSize) + epsilon;
       }

       function atZoom(t, distance) {
           var power = Math.pow(2, distance);
           return [
               Math.floor(t[0] * power),
               Math.floor(t[1] * power),
               t[2] + distance];
       }

       function lookUp(d) {
           for (var up = -1; up > -d[2]; up--) {
               var tile = atZoom(d, up);
               if (cache[source.url(tile)] !== false) {
                   return tile;
               }
           }
       }

       function uniqueBy(a, n) {
           var o = [], seen = {};
           for (var i = 0; i < a.length; i++) {
               if (seen[a[i][n]] === undefined) {
                   o.push(a[i]);
                   seen[a[i][n]] = true;
               }
           }
           return o;
       }

       function addSource(d) {
           d.push(source.url(d));
           return d;
       }

       // Update tiles based on current state of `projection`.
       function background(selection) {
           tile.scale(projection.scale() * 2 * Math.PI)
               .translate(projection.translate());

           tileOrigin = [
               projection.scale() * Math.PI - projection.translate()[0],
               projection.scale() * Math.PI - projection.translate()[1]];

           z = Math.max(Math.log(projection.scale() * 2 * Math.PI) / Math.log(2) - 8, 0);

           render(selection);
       }

       // Derive the tiles onscreen, remove those offscreen and position them.
       // Important that this part not depend on `projection` because it's
       // rentered when tiles load/error (see #644).
       function render(selection) {
           var requests = [];
           var showDebug = context.getDebug('tile') && !source.overlay;

           if (source.validZoom(z)) {
               tile().forEach(function(d) {
                   addSource(d);
                   if (d[3] === '') return;
                   if (typeof d[3] !== 'string') return; // Workaround for chrome crash https://github.com/openstreetmap/iD/issues/2295
                   requests.push(d);
                   if (cache[d[3]] === false && lookUp(d)) {
                       requests.push(addSource(lookUp(d)));
                   }
               });

               requests = uniqueBy(requests, 3).filter(function(r) {
                   if (!!source.overlay && nearNullIsland(r[0], r[1], r[2])) {
                       return false;
                   }
                   // don't re-request tiles which have failed in the past
                   return cache[r[3]] !== false;
               });
           }

           var pixelOffset = [
               source.offset()[0] * Math.pow(2, z),
               source.offset()[1] * Math.pow(2, z)
           ];

           function load(d) {
               cache[d[3]] = true;
               d3.select(this)
                   .on('error', null)
                   .on('load', null)
                   .classed('tile-loaded', true);
               render(selection);
           }

           function error(d) {
               cache[d[3]] = false;
               d3.select(this)
                   .on('error', null)
                   .on('load', null)
                   .remove();
               render(selection);
           }

           function imageTransform(d) {
               var _ts = tileSize * Math.pow(2, z - d[2]);
               var scale = tileSizeAtZoom(d, z);
               return 'translate(' +
                   ((d[0] * _ts) - tileOrigin[0] + pixelOffset[0]) + 'px,' +
                   ((d[1] * _ts) - tileOrigin[1] + pixelOffset[1]) + 'px)' +
                   'scale(' + scale + ',' + scale + ')';
           }

           function debugTransform(d) {
               var _ts = tileSize * Math.pow(2, z - d[2]);
               var scale = tileSizeAtZoom(d, z);
               return 'translate(' +
                   ((d[0] * _ts) - tileOrigin[0] + pixelOffset[0] + scale * (tileSize / 4)) + 'px,' +
                   ((d[1] * _ts) - tileOrigin[1] + pixelOffset[1] + scale * (tileSize / 2)) + 'px)';
           }

           var image = selection
               .selectAll('img')
               .data(requests, function(d) { return d[3]; });

           image.exit()
               .style(transformProp, imageTransform)
               .classed('tile-removing', true)
               .each(function() {
                   var tile = d3.select(this);
                   window.setTimeout(function() {
                       if (tile.classed('tile-removing')) {
                           tile.remove();
                       }
                   }, 300);
               });

           image.enter().append('img')
               .attr('class', 'tile')
               .attr('src', function(d) { return d[3]; })
               .on('error', error)
               .on('load', load);

           image
               .style(transformProp, imageTransform)
               .classed('tile-debug', showDebug)
               .classed('tile-removing', false);


           var debug = selection.selectAll('.tile-label-debug')
               .data(showDebug ? requests : [], function(d) { return d[3]; });

           debug.exit()
               .remove();

           debug.enter()
               .append('div')
               .attr('class', 'tile-label-debug');

           debug
               .text(function(d) { return d[2] + ' / ' + d[0] + ' / ' + d[1]; })
               .style(transformProp, debugTransform);
       }

       background.projection = function(_) {
           if (!arguments.length) return projection;
           projection = _;
           return background;
       };

       background.dimensions = function(_) {
           if (!arguments.length) return tile.size();
           tile.size(_);
           return background;
       };

       background.source = function(_) {
           if (!arguments.length) return source;
           source = _;
           cache = {};
           tile.scaleExtent(source.scaleExtent);
           return background;
       };

       return background;
   }

   function Background$1(context) {
       var dispatch = d3.dispatch('change'),
           baseLayer = TileLayer(context).projection(context.projection),
           overlayLayers = [],
           backgroundSources;


       function findSource(id) {
           return _.find(backgroundSources, function(d) {
               return d.id && d.id === id;
           });
       }


       function background(selection) {
           var base = selection.selectAll('.layer-background')
               .data([0]);

           base.enter()
               .insert('div', '.layer-data')
               .attr('class', 'layer layer-background');

           base.call(baseLayer);

           var overlays = selection.selectAll('.layer-overlay')
               .data(overlayLayers, function(d) { return d.source().name(); });

           overlays.enter()
               .insert('div', '.layer-data')
               .attr('class', 'layer layer-overlay');

           overlays.each(function(layer) {
               d3.select(this).call(layer);
           });

           overlays.exit()
               .remove();
       }


       background.updateImagery = function() {
           var b = background.baseLayerSource(),
               o = overlayLayers.map(function (d) { return d.source().id; }).join(','),
               meters = offsetToMeters(b.offset()),
               epsilon = 0.01,
               x = +meters[0].toFixed(2),
               y = +meters[1].toFixed(2),
               q = stringQs(location.hash.substring(1));

           var id = b.id;
           if (id === 'custom') {
               id = 'custom:' + b.template;
           }

           if (id) {
               q.background = id;
           } else {
               delete q.background;
           }

           if (o) {
               q.overlays = o;
           } else {
               delete q.overlays;
           }

           if (Math.abs(x) > epsilon || Math.abs(y) > epsilon) {
               q.offset = x + ',' + y;
           } else {
               delete q.offset;
           }

           location.replace('#' + qsString(q, true));

           var imageryUsed = [b.imageryUsed()];

           overlayLayers.forEach(function (d) {
               var source = d.source();
               if (!source.isLocatorOverlay()) {
                   imageryUsed.push(source.imageryUsed());
               }
           });

           var gpx = context.layers().layer('gpx');
           if (gpx && gpx.enabled() && gpx.hasGpx()) {
               imageryUsed.push('Local GPX');
           }

           var mapillary_images = context.layers().layer('mapillary-images');
           if (mapillary_images && mapillary_images.enabled()) {
               imageryUsed.push('Mapillary Images');
           }

           var mapillary_signs = context.layers().layer('mapillary-signs');
           if (mapillary_signs && mapillary_signs.enabled()) {
               imageryUsed.push('Mapillary Signs');
           }

           context.history().imageryUsed(imageryUsed);
       };

       background.sources = function(extent) {
           return backgroundSources.filter(function(source) {
               return source.intersects(extent);
           });
       };

       background.dimensions = function(_) {
           baseLayer.dimensions(_);

           overlayLayers.forEach(function(layer) {
               layer.dimensions(_);
           });
       };

       background.baseLayerSource = function(d) {
           if (!arguments.length) return baseLayer.source();
           baseLayer.source(d);
           dispatch.change();
           background.updateImagery();
           return background;
       };

       background.bing = function() {
           background.baseLayerSource(findSource('Bing'));
       };

       background.showsLayer = function(d) {
           return d === baseLayer.source() ||
               (d.id === 'custom' && baseLayer.source().id === 'custom') ||
               overlayLayers.some(function(l) { return l.source() === d; });
       };

       background.overlayLayerSources = function() {
           return overlayLayers.map(function (l) { return l.source(); });
       };

       background.toggleOverlayLayer = function(d) {
           var layer;

           for (var i = 0; i < overlayLayers.length; i++) {
               layer = overlayLayers[i];
               if (layer.source() === d) {
                   overlayLayers.splice(i, 1);
                   dispatch.change();
                   background.updateImagery();
                   return;
               }
           }

           layer = TileLayer(context)
               .source(d)
               .projection(context.projection)
               .dimensions(baseLayer.dimensions());

           overlayLayers.push(layer);
           dispatch.change();
           background.updateImagery();
       };

       background.nudge = function(d, zoom) {
           baseLayer.source().nudge(d, zoom);
           dispatch.change();
           background.updateImagery();
           return background;
       };

       background.offset = function(d) {
           if (!arguments.length) return baseLayer.source().offset();
           baseLayer.source().offset(d);
           dispatch.change();
           background.updateImagery();
           return background;
       };

       background.load = function(imagery) {
           function parseMap(qmap) {
               if (!qmap) return false;
               var args = qmap.split('/').map(Number);
               if (args.length < 3 || args.some(isNaN)) return false;
               return Extent([args[1], args[2]]);
           }

           var q = stringQs(location.hash.substring(1)),
               chosen = q.background || q.layer,
               extent = parseMap(q.map),
               best;

           backgroundSources = imagery.map(function(source) {
               if (source.type === 'bing') {
                   return BackgroundSource.Bing(source, dispatch);
               } else {
                   return BackgroundSource(source);
               }
           });

           backgroundSources.unshift(BackgroundSource.None());

           if (!chosen && extent) {
               best = _.find(this.sources(extent), function(s) { return s.best(); });
           }

           if (chosen && chosen.indexOf('custom:') === 0) {
               background.baseLayerSource(BackgroundSource.Custom(chosen.replace(/^custom:/, '')));
           } else {
               background.baseLayerSource(findSource(chosen) || best || findSource('Bing') || backgroundSources[1] || backgroundSources[0]);
           }

           var locator = _.find(backgroundSources, function(d) {
               return d.overlay && d.default;
           });

           if (locator) {
               background.toggleOverlayLayer(locator);
           }

           var overlays = (q.overlays || '').split(',');
           overlays.forEach(function(overlay) {
               overlay = findSource(overlay);
               if (overlay) {
                   background.toggleOverlayLayer(overlay);
               }
           });

           if (q.gpx) {
               var gpx = context.layers().layer('gpx');
               if (gpx) {
                   gpx.url(q.gpx);
               }
           }

           if (q.offset) {
               var offset = q.offset.replace(/;/g, ',').split(',').map(function(n) {
                   return !isNaN(n) && n;
               });

               if (offset.length === 2) {
                   background.offset(metersToOffset(offset));
               }
           }
       };

       return d3.rebind(background, dispatch, 'on');
   }

   function Features(context) {
       var traffic_roads = {
           'motorway': true,
           'motorway_link': true,
           'trunk': true,
           'trunk_link': true,
           'primary': true,
           'primary_link': true,
           'secondary': true,
           'secondary_link': true,
           'tertiary': true,
           'tertiary_link': true,
           'residential': true,
           'unclassified': true,
           'living_street': true
       };

       var service_roads = {
           'service': true,
           'road': true,
           'track': true
       };

       var paths = {
           'path': true,
           'footway': true,
           'cycleway': true,
           'bridleway': true,
           'steps': true,
           'pedestrian': true,
           'corridor': true
       };

       var past_futures = {
           'proposed': true,
           'construction': true,
           'abandoned': true,
           'dismantled': true,
           'disused': true,
           'razed': true,
           'demolished': true,
           'obliterated': true
       };

       var dispatch = d3.dispatch('change', 'redraw'),
           _cullFactor = 1,
           _cache = {},
           _features = {},
           _stats = {},
           _keys = [],
           _hidden = [];

       function update() {
           _hidden = features.hidden();
           dispatch.change();
           dispatch.redraw();
       }

       function defineFeature(k, filter, max) {
           _keys.push(k);
           _features[k] = {
               filter: filter,
               enabled: true,   // whether the user wants it enabled..
               count: 0,
               currentMax: (max || Infinity),
               defaultMax: (max || Infinity),
               enable: function() { this.enabled = true; this.currentMax = this.defaultMax; },
               disable: function() { this.enabled = false; this.currentMax = 0; },
               hidden: function() { return !context.editable() || this.count > this.currentMax * _cullFactor; },
               autoHidden: function() { return this.hidden() && this.currentMax > 0; }
           };
       }


       defineFeature('points', function isPoint(entity, resolver, geometry) {
           return geometry === 'point';
       }, 200);

       defineFeature('traffic_roads', function isTrafficRoad(entity) {
           return traffic_roads[entity.tags.highway];
       });

       defineFeature('service_roads', function isServiceRoad(entity) {
           return service_roads[entity.tags.highway];
       });

       defineFeature('paths', function isPath(entity) {
           return paths[entity.tags.highway];
       });

       defineFeature('buildings', function isBuilding(entity) {
           return (
               !!entity.tags['building:part'] ||
               (!!entity.tags.building && entity.tags.building !== 'no') ||
               entity.tags.amenity === 'shelter' ||
               entity.tags.parking === 'multi-storey' ||
               entity.tags.parking === 'sheds' ||
               entity.tags.parking === 'carports' ||
               entity.tags.parking === 'garage_boxes'
           );
       }, 250);

       defineFeature('landuse', function isLanduse(entity, resolver, geometry) {
           return geometry === 'area' &&
               !_features.buildings.filter(entity) &&
               !_features.water.filter(entity);
       });

       defineFeature('boundaries', function isBoundary(entity) {
           return !!entity.tags.boundary;
       });

       defineFeature('water', function isWater(entity) {
           return (
               !!entity.tags.waterway ||
               entity.tags.natural === 'water' ||
               entity.tags.natural === 'coastline' ||
               entity.tags.natural === 'bay' ||
               entity.tags.landuse === 'pond' ||
               entity.tags.landuse === 'basin' ||
               entity.tags.landuse === 'reservoir' ||
               entity.tags.landuse === 'salt_pond'
           );
       });

       defineFeature('rail', function isRail(entity) {
           return (
               !!entity.tags.railway ||
               entity.tags.landuse === 'railway'
           ) && !(
               traffic_roads[entity.tags.highway] ||
               service_roads[entity.tags.highway] ||
               paths[entity.tags.highway]
           );
       });

       defineFeature('power', function isPower(entity) {
           return !!entity.tags.power;
       });

       // contains a past/future tag, but not in active use as a road/path/cycleway/etc..
       defineFeature('past_future', function isPastFuture(entity) {
           if (
               traffic_roads[entity.tags.highway] ||
               service_roads[entity.tags.highway] ||
               paths[entity.tags.highway]
           ) { return false; }

           var strings = Object.keys(entity.tags);

           for (var i = 0; i < strings.length; i++) {
               var s = strings[i];
               if (past_futures[s] || past_futures[entity.tags[s]]) { return true; }
           }
           return false;
       });

       // Lines or areas that don't match another feature filter.
       // IMPORTANT: The 'others' feature must be the last one defined,
       //   so that code in getMatches can skip this test if `hasMatch = true`
       defineFeature('others', function isOther(entity, resolver, geometry) {
           return (geometry === 'line' || geometry === 'area');
       });


       function features() {}

       features.features = function() {
           return _features;
       };

       features.keys = function() {
           return _keys;
       };

       features.enabled = function(k) {
           if (!arguments.length) {
               return _.filter(_keys, function(k) { return _features[k].enabled; });
           }
           return _features[k] && _features[k].enabled;
       };

       features.disabled = function(k) {
           if (!arguments.length) {
               return _.reject(_keys, function(k) { return _features[k].enabled; });
           }
           return _features[k] && !_features[k].enabled;
       };

       features.hidden = function(k) {
           if (!arguments.length) {
               return _.filter(_keys, function(k) { return _features[k].hidden(); });
           }
           return _features[k] && _features[k].hidden();
       };

       features.autoHidden = function(k) {
           if (!arguments.length) {
               return _.filter(_keys, function(k) { return _features[k].autoHidden(); });
           }
           return _features[k] && _features[k].autoHidden();
       };

       features.enable = function(k) {
           if (_features[k] && !_features[k].enabled) {
               _features[k].enable();
               update();
           }
       };

       features.disable = function(k) {
           if (_features[k] && _features[k].enabled) {
               _features[k].disable();
               update();
           }
       };

       features.toggle = function(k) {
           if (_features[k]) {
               (function(f) { return f.enabled ? f.disable() : f.enable(); }(_features[k]));
               update();
           }
       };

       features.resetStats = function() {
           _.each(_features, function(f) { f.count = 0; });
           dispatch.change();
       };

       features.gatherStats = function(d, resolver, dimensions) {
           var needsRedraw = false,
               type = _.groupBy(d, function(ent) { return ent.type; }),
               entities = [].concat(type.relation || [], type.way || [], type.node || []),
               currHidden, geometry, matches;

           _.each(_features, function(f) { f.count = 0; });

           // adjust the threshold for point/building culling based on viewport size..
           // a _cullFactor of 1 corresponds to a 1000x1000px viewport..
           _cullFactor = dimensions[0] * dimensions[1] / 1000000;

           for (var i = 0; i < entities.length; i++) {
               geometry = entities[i].geometry(resolver);
               if (!(geometry === 'vertex' || geometry === 'relation')) {
                   matches = Object.keys(features.getMatches(entities[i], resolver, geometry));
                   for (var j = 0; j < matches.length; j++) {
                       _features[matches[j]].count++;
                   }
               }
           }

           currHidden = features.hidden();
           if (currHidden !== _hidden) {
               _hidden = currHidden;
               needsRedraw = true;
               dispatch.change();
           }

           return needsRedraw;
       };

       features.stats = function() {
           _.each(_keys, function(k) { _stats[k] = _features[k].count; });
           return _stats;
       };

       features.clear = function(d) {
           for (var i = 0; i < d.length; i++) {
               features.clearEntity(d[i]);
           }
       };

       features.clearEntity = function(entity) {
           delete _cache[Entity.key(entity)];
       };

       features.reset = function() {
           _cache = {};
       };

       features.getMatches = function(entity, resolver, geometry) {
           if (geometry === 'vertex' || geometry === 'relation') return {};

           var ent = Entity.key(entity);
           if (!_cache[ent]) {
               _cache[ent] = {};
           }

           if (!_cache[ent].matches) {
               var matches = {},
                   hasMatch = false;

               for (var i = 0; i < _keys.length; i++) {
                   if (_keys[i] === 'others') {
                       if (hasMatch) continue;

                       // Multipolygon members:
                       // If an entity...
                       //   1. is a way that hasn't matched other "interesting" feature rules,
                       //   2. and it belongs to a single parent multipolygon relation
                       // ...then match whatever feature rules the parent multipolygon has matched.
                       // see #2548, #2887
                       //
                       // IMPORTANT:
                       // For this to work, getMatches must be called on relations before ways.
                       //
                       if (entity.type === 'way') {
                           var parents = features.getParents(entity, resolver, geometry);
                           if (parents.length === 1 && parents[0].isMultipolygon()) {
                               var pkey = Entity.key(parents[0]);
                               if (_cache[pkey] && _cache[pkey].matches) {
                                   matches = _.clone(_cache[pkey].matches);
                                   continue;
                               }
                           }
                       }
                   }

                   if (_features[_keys[i]].filter(entity, resolver, geometry)) {
                       matches[_keys[i]] = hasMatch = true;
                   }
               }
               _cache[ent].matches = matches;
           }

           return _cache[ent].matches;
       };

       features.getParents = function(entity, resolver, geometry) {
           if (geometry === 'point') return [];

           var ent = Entity.key(entity);
           if (!_cache[ent]) {
               _cache[ent] = {};
           }

           if (!_cache[ent].parents) {
               var parents = [];
               if (geometry === 'vertex') {
                   parents = resolver.parentWays(entity);
               } else {   // 'line', 'area', 'relation'
                   parents = resolver.parentRelations(entity);
               }
               _cache[ent].parents = parents;
           }
           return _cache[ent].parents;
       };

       features.isHiddenFeature = function(entity, resolver, geometry) {
           if (!_hidden.length) return false;
           if (!entity.version) return false;

           var matches = features.getMatches(entity, resolver, geometry);

           for (var i = 0; i < _hidden.length; i++) {
               if (matches[_hidden[i]]) return true;
           }
           return false;
       };

       features.isHiddenChild = function(entity, resolver, geometry) {
           if (!_hidden.length) return false;
           if (!entity.version || geometry === 'point') return false;

           var parents = features.getParents(entity, resolver, geometry);
           if (!parents.length) return false;

           for (var i = 0; i < parents.length; i++) {
               if (!features.isHidden(parents[i], resolver, parents[i].geometry(resolver))) {
                   return false;
               }
           }
           return true;
       };

       features.hasHiddenConnections = function(entity, resolver) {
           if (!_hidden.length) return false;
           var childNodes, connections;

           if (entity.type === 'midpoint') {
               childNodes = [resolver.entity(entity.edge[0]), resolver.entity(entity.edge[1])];
               connections = [];
           } else {
               childNodes = entity.nodes ? resolver.childNodes(entity) : [];
               connections = features.getParents(entity, resolver, entity.geometry(resolver));
           }

           // gather ways connected to child nodes..
           connections = _.reduce(childNodes, function(result, e) {
               return resolver.isShared(e) ? _.union(result, resolver.parentWays(e)) : result;
           }, connections);

           return connections.length ? _.some(connections, function(e) {
               return features.isHidden(e, resolver, e.geometry(resolver));
           }) : false;
       };

       features.isHidden = function(entity, resolver, geometry) {
           if (!_hidden.length) return false;
           if (!entity.version) return false;

           var fn = (geometry === 'vertex' ? features.isHiddenChild : features.isHiddenFeature);
           return fn(entity, resolver, geometry);
       };

       features.filter = function(d, resolver) {
           if (!_hidden.length) return d;

           var result = [];
           for (var i = 0; i < d.length; i++) {
               var entity = d[i];
               if (!features.isHidden(entity, resolver, entity.geometry(resolver))) {
                   result.push(entity);
               }
           }
           return result;
       };

       return d3.rebind(features, dispatch, 'on');
   }

   function Map(context) {
       var dimensions = [1, 1],
           dispatch = d3.dispatch('move', 'drawn'),
           projection = context.projection,
           zoom = d3.behavior.zoom()
               .translate(projection.translate())
               .scale(projection.scale() * 2 * Math.PI)
               .scaleExtent([1024, 256 * Math.pow(2, 24)])
               .on('zoom', zoomPan),
           dblclickEnabled = true,
           redrawEnabled = true,
           transformStart,
           transformed = false,
           easing = false,
           minzoom = 0,
           drawLayers = Layers(projection, context),
           drawPoints = Points(projection, context),
           drawVertices = Vertices(projection, context),
           drawLines = Lines(projection),
           drawAreas = Areas(projection),
           drawMidpoints = Midpoints(projection, context),
           drawLabels = Labels(projection, context),
           supersurface,
           wrapper,
           surface,
           mouse,
           mousemove;

       function map(selection) {
           context
               .on('change.map', redraw);
           context.history()
               .on('change.map', redraw);
           context.background()
               .on('change.map', redraw);
           context.features()
               .on('redraw.map', redraw);
           drawLayers
               .on('change.map', function() {
                   context.background().updateImagery();
                   redraw();
               });

           selection
               .on('dblclick.map', dblClick)
               .call(zoom);

           supersurface = selection.append('div')
               .attr('id', 'supersurface')
               .call(setTransform, 0, 0);

           // Need a wrapper div because Opera can't cope with an absolutely positioned
           // SVG element: http://bl.ocks.org/jfirebaugh/6fbfbd922552bf776c16
           wrapper = supersurface
               .append('div')
               .attr('class', 'layer layer-data');

           map.surface = surface = wrapper
               .call(drawLayers)
               .selectAll('.surface')
               .attr('id', 'surface');

           surface
               .on('mousedown.zoom', function() {
                   if (d3.event.button === 2) {
                       d3.event.stopPropagation();
                   }
               }, true)
               .on('mouseup.zoom', function() {
                   if (resetTransform()) redraw();
               })
               .on('mousemove.map', function() {
                   mousemove = d3.event;
               })
               .on('mouseover.vertices', function() {
                   if (map.editable() && !transformed) {
                       var hover = d3.event.target.__data__;
                       surface.call(drawVertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                       dispatch.drawn({full: false});
                   }
               })
               .on('mouseout.vertices', function() {
                   if (map.editable() && !transformed) {
                       var hover = d3.event.relatedTarget && d3.event.relatedTarget.__data__;
                       surface.call(drawVertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                       dispatch.drawn({full: false});
                   }
               });


           supersurface
               .call(context.background());


           context.on('enter.map', function() {
               if (map.editable() && !transformed) {
                   var all = context.intersects(map.extent()),
                       filter = d3.functor(true),
                       graph = context.graph();

                   all = context.features().filter(all, graph);
                   surface
                       .call(drawVertices, graph, all, filter, map.extent(), map.zoom())
                       .call(drawMidpoints, graph, all, filter, map.trimmedExtent());
                   dispatch.drawn({full: false});
               }
           });

           map.dimensions(selection.dimensions());

           drawLabels.supersurface(supersurface);
       }

       function pxCenter() {
           return [dimensions[0] / 2, dimensions[1] / 2];
       }

       function drawVector(difference, extent) {
           var graph = context.graph(),
               features = context.features(),
               all = context.intersects(map.extent()),
               data, filter;

           if (difference) {
               var complete = difference.complete(map.extent());
               data = _.compact(_.values(complete));
               filter = function(d) { return d.id in complete; };
               features.clear(data);

           } else {
               // force a full redraw if gatherStats detects that a feature
               // should be auto-hidden (e.g. points or buildings)..
               if (features.gatherStats(all, graph, dimensions)) {
                   extent = undefined;
               }

               if (extent) {
                   data = context.intersects(map.extent().intersection(extent));
                   var set = d3.set(_.map(data, 'id'));
                   filter = function(d) { return set.has(d.id); };

               } else {
                   data = all;
                   filter = d3.functor(true);
               }
           }

           data = features.filter(data, graph);

           surface
               .call(drawVertices, graph, data, filter, map.extent(), map.zoom())
               .call(drawLines, graph, data, filter)
               .call(drawAreas, graph, data, filter)
               .call(drawMidpoints, graph, data, filter, map.trimmedExtent())
               .call(drawLabels, graph, data, filter, dimensions, !difference && !extent)
               .call(drawPoints, graph, data, filter);

           dispatch.drawn({full: true});
       }

       function editOff() {
           context.features().resetStats();
           surface.selectAll('.layer-osm *').remove();
           dispatch.drawn({full: true});
       }

       function dblClick() {
           if (!dblclickEnabled) {
               d3.event.preventDefault();
               d3.event.stopImmediatePropagation();
           }
       }

       function zoomPan() {
           if (Math.log(d3.event.scale) / Math.LN2 - 8 < minzoom) {
               surface.interrupt();
               flash(context.container())
                   .select('.content')
                   .text(t('cannot_zoom'));
               setZoom(context.minEditableZoom(), true);
               queueRedraw();
               dispatch.move(map);
               return;
           }

           projection
               .translate(d3.event.translate)
               .scale(d3.event.scale / (2 * Math.PI));

           var scale = d3.event.scale / transformStart[0],
               tX = (d3.event.translate[0] / scale - transformStart[1][0]) * scale,
               tY = (d3.event.translate[1] / scale - transformStart[1][1]) * scale;

           transformed = true;
           setTransform(supersurface, tX, tY, scale);
           queueRedraw();

           dispatch.move(map);
       }

       function resetTransform() {
           if (!transformed) return false;

           surface.selectAll('.radial-menu').interrupt().remove();
           setTransform(supersurface, 0, 0);
           transformed = false;
           return true;
       }

       function redraw(difference, extent) {
           if (!surface || !redrawEnabled) return;

           clearTimeout(timeoutId);

           // If we are in the middle of a zoom/pan, we can't do differenced redraws.
           // It would result in artifacts where differenced entities are redrawn with
           // one transform and unchanged entities with another.
           if (resetTransform()) {
               difference = extent = undefined;
           }

           var zoom = String(~~map.zoom());
           if (surface.attr('data-zoom') !== zoom) {
               surface.attr('data-zoom', zoom)
                   .classed('low-zoom', zoom <= 16);
           }

           if (!difference) {
               supersurface.call(context.background());
           }

           // OSM
           if (map.editable()) {
               context.loadTiles(projection, dimensions);
               drawVector(difference, extent);
           } else {
               editOff();
           }

           wrapper
               .call(drawLayers);

           transformStart = [
               projection.scale() * 2 * Math.PI,
               projection.translate().slice()];

           return map;
       }

       var timeoutId;
       function queueRedraw() {
           timeoutId = setTimeout(function() { redraw(); }, 750);
       }

       function pointLocation(p) {
           var translate = projection.translate(),
               scale = projection.scale() * 2 * Math.PI;
           return [(p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale];
       }

       function locationPoint(l) {
           var translate = projection.translate(),
               scale = projection.scale() * 2 * Math.PI;
           return [l[0] * scale + translate[0], l[1] * scale + translate[1]];
       }

       map.mouse = function() {
           var e = mousemove || d3.event, s;
           while ((s = e.sourceEvent)) e = s;
           return mouse(e);
       };

       map.mouseCoordinates = function() {
           return projection.invert(map.mouse());
       };

       map.dblclickEnable = function(_) {
           if (!arguments.length) return dblclickEnabled;
           dblclickEnabled = _;
           return map;
       };

       map.redrawEnable = function(_) {
           if (!arguments.length) return redrawEnabled;
           redrawEnabled = _;
           return map;
       };

       function interpolateZoom(_) {
           var k = projection.scale(),
               t = projection.translate();

           surface.node().__chart__ = {
               x: t[0],
               y: t[1],
               k: k * 2 * Math.PI
           };

           setZoom(_);
           projection.scale(k).translate(t);  // undo setZoom projection changes

           zoom.event(surface.transition());
       }

       function setZoom(_, force) {
           if (_ === map.zoom() && !force)
               return false;
           var scale = 256 * Math.pow(2, _),
               center = pxCenter(),
               l = pointLocation(center);
           scale = Math.max(1024, Math.min(256 * Math.pow(2, 24), scale));
           projection.scale(scale / (2 * Math.PI));
           zoom.scale(scale);
           var t = projection.translate();
           l = locationPoint(l);
           t[0] += center[0] - l[0];
           t[1] += center[1] - l[1];
           projection.translate(t);
           zoom.translate(projection.translate());
           return true;
       }

       function setCenter(_) {
           var c = map.center();
           if (_[0] === c[0] && _[1] === c[1])
               return false;
           var t = projection.translate(),
               pxC = pxCenter(),
               ll = projection(_);
           projection.translate([
               t[0] - ll[0] + pxC[0],
               t[1] - ll[1] + pxC[1]]);
           zoom.translate(projection.translate());
           return true;
       }

       map.pan = function(d) {
           var t = projection.translate();
           t[0] += d[0];
           t[1] += d[1];
           projection.translate(t);
           zoom.translate(projection.translate());
           dispatch.move(map);
           return redraw();
       };

       map.dimensions = function(_) {
           if (!arguments.length) return dimensions;
           var center = map.center();
           dimensions = _;
           drawLayers.dimensions(dimensions);
           context.background().dimensions(dimensions);
           projection.clipExtent([[0, 0], dimensions]);
           mouse = fastMouse(supersurface.node());
           setCenter(center);
           return redraw();
       };

       function zoomIn(integer) {
         interpolateZoom(~~map.zoom() + integer);
       }

       function zoomOut(integer) {
         interpolateZoom(~~map.zoom() - integer);
       }

       map.zoomIn = function() { zoomIn(1); };
       map.zoomInFurther = function() { zoomIn(4); };

       map.zoomOut = function() { zoomOut(1); };
       map.zoomOutFurther = function() { zoomOut(4); };

       map.center = function(loc) {
           if (!arguments.length) {
               return projection.invert(pxCenter());
           }

           if (setCenter(loc)) {
               dispatch.move(map);
           }

           return redraw();
       };

       map.zoom = function(z) {
           if (!arguments.length) {
               return Math.max(Math.log(projection.scale() * 2 * Math.PI) / Math.LN2 - 8, 0);
           }

           if (z < minzoom) {
               surface.interrupt();
               flash(context.container())
                   .select('.content')
                   .text(t('cannot_zoom'));
               z = context.minEditableZoom();
           }

           if (setZoom(z)) {
               dispatch.move(map);
           }

           return redraw();
       };

       map.zoomTo = function(entity, zoomLimits) {
           var extent = entity.extent(context.graph());
           if (!isFinite(extent.area())) return;

           var zoom = map.trimmedExtentZoom(extent);
           zoomLimits = zoomLimits || [context.minEditableZoom(), 20];
           map.centerZoom(extent.center(), Math.min(Math.max(zoom, zoomLimits[0]), zoomLimits[1]));
       };

       map.centerZoom = function(loc, z) {
           var centered = setCenter(loc),
               zoomed   = setZoom(z);

           if (centered || zoomed) {
               dispatch.move(map);
           }

           return redraw();
       };

       map.centerEase = function(loc2, duration) {
           duration = duration || 250;

           surface.one('mousedown.ease', function() {
               map.cancelEase();
           });

           if (easing) {
               map.cancelEase();
           }

           var t1 = Date.now(),
               t2 = t1 + duration,
               loc1 = map.center(),
               ease = d3.ease('cubic-in-out');

           easing = true;

           d3.timer(function() {
               if (!easing) return true;  // cancelled ease

               var tNow = Date.now();
               if (tNow > t2) {
                   tNow = t2;
                   easing = false;
               }

               var locNow = interp(loc1, loc2, ease((tNow - t1) / duration));
               setCenter(locNow);

               d3.event = {
                   scale: zoom.scale(),
                   translate: zoom.translate()
               };

               zoomPan();
               return !easing;
           });

           return map;
       };

       map.cancelEase = function() {
           easing = false;
           d3.timer.flush();
           return map;
       };

       map.extent = function(_) {
           if (!arguments.length) {
               return new Extent(projection.invert([0, dimensions[1]]),
                                    projection.invert([dimensions[0], 0]));
           } else {
               var extent = Extent(_);
               map.centerZoom(extent.center(), map.extentZoom(extent));
           }
       };

       map.trimmedExtent = function(_) {
           if (!arguments.length) {
               var headerY = 60, footerY = 30, pad = 10;
               return new Extent(projection.invert([pad, dimensions[1] - footerY - pad]),
                       projection.invert([dimensions[0] - pad, headerY + pad]));
           } else {
               var extent = Extent(_);
               map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
           }
       };

       function calcZoom(extent, dim) {
           var tl = projection([extent[0][0], extent[1][1]]),
               br = projection([extent[1][0], extent[0][1]]);

           // Calculate maximum zoom that fits extent
           var hFactor = (br[0] - tl[0]) / dim[0],
               vFactor = (br[1] - tl[1]) / dim[1],
               hZoomDiff = Math.log(Math.abs(hFactor)) / Math.LN2,
               vZoomDiff = Math.log(Math.abs(vFactor)) / Math.LN2,
               newZoom = map.zoom() - Math.max(hZoomDiff, vZoomDiff);

           return newZoom;
       }

       map.extentZoom = function(_) {
           return calcZoom(Extent(_), dimensions);
       };

       map.trimmedExtentZoom = function(_) {
           var trimY = 120, trimX = 40,
               trimmed = [dimensions[0] - trimX, dimensions[1] - trimY];
           return calcZoom(Extent(_), trimmed);
       };

       map.editable = function() {
           return map.zoom() >= context.minEditableZoom();
       };

       map.minzoom = function(_) {
           if (!arguments.length) return minzoom;
           minzoom = _;
           return map;
       };

       map.layers = drawLayers;

       return d3.rebind(map, dispatch, 'on');
   }

   // Translate a MacOS key command into the appropriate Windows/Linux equivalent.
   // For example, ⌘Z -> Ctrl+Z
   function cmd(code) {
       if (iD.detect().os === 'mac') {
           return code;
       }

       if (iD.detect().os === 'win') {
           if (code === '⌘⇧Z') return 'Ctrl+Y';
       }

       var result = '',
           replacements = {
               '⌘': 'Ctrl',
               '⇧': 'Shift',
               '⌥': 'Alt',
               '⌫': 'Backspace',
               '⌦': 'Delete'
           };

       for (var i = 0; i < code.length; i++) {
           if (code[i] in replacements) {
               result += replacements[code[i]] + '+';
           } else {
               result += code[i];
           }
       }

       return result;
   }

   function MapInMap(context) {
       var key = '/';

       function map_in_map(selection) {
           var backgroundLayer = TileLayer(context),
               overlayLayers = {},
               projection = RawMercator(),
               gpxLayer = Gpx(projection, context).showLabels(false),
               debugLayer = Debug(projection, context),
               zoom = d3.behavior.zoom()
                   .scaleExtent([ztok(0.5), ztok(24)])
                   .on('zoom', zoomPan),
               transformed = false,
               panning = false,
               hidden = true,
               zDiff = 6,    // by default, minimap renders at (main zoom - 6)
               tStart, tLast, tCurr, kLast, kCurr, tiles, viewport, timeoutId;

           function ztok(z) { return 256 * Math.pow(2, z); }
           function ktoz(k) { return Math.log(k) / Math.LN2 - 8; }


           function startMouse() {
               context.surface().on('mouseup.map-in-map-outside', endMouse);
               context.container().on('mouseup.map-in-map-outside', endMouse);

               tStart = tLast = tCurr = projection.translate();
               panning = true;
           }


           function zoomPan() {
               var e = d3.event.sourceEvent,
                   t = d3.event.translate,
                   k = d3.event.scale,
                   zMain = ktoz(context.projection.scale() * 2 * Math.PI),
                   zMini = ktoz(k);

               // restrict minimap zoom to < (main zoom - 3)
               if (zMini > zMain - 3) {
                   zMini = zMain - 3;
                   zoom.scale(kCurr).translate(tCurr);  // restore last good values
                   return;
               }

               tCurr = t;
               kCurr = k;
               zDiff = zMain - zMini;

               var scale = kCurr / kLast,
                   tX = (tCurr[0] / scale - tLast[0]) * scale,
                   tY = (tCurr[1] / scale - tLast[1]) * scale;

               setTransform(tiles, tX, tY, scale);
               setTransform(viewport, 0, 0, scale);
               transformed = true;

               queueRedraw();

               e.preventDefault();
               e.stopPropagation();
           }


           function endMouse() {
               context.surface().on('mouseup.map-in-map-outside', null);
               context.container().on('mouseup.map-in-map-outside', null);

               updateProjection();
               panning = false;

               if (tCurr[0] !== tStart[0] && tCurr[1] !== tStart[1]) {
                   var dMini = wrap.dimensions(),
                       cMini = [ dMini[0] / 2, dMini[1] / 2 ];

                   context.map().center(projection.invert(cMini));
               }
           }


           function updateProjection() {
               var loc = context.map().center(),
                   dMini = wrap.dimensions(),
                   cMini = [ dMini[0] / 2, dMini[1] / 2 ],
                   tMain = context.projection.translate(),
                   kMain = context.projection.scale(),
                   zMain = ktoz(kMain * 2 * Math.PI),
                   zMini = Math.max(zMain - zDiff, 0.5),
                   kMini = ztok(zMini);

               projection
                   .translate(tMain)
                   .scale(kMini / (2 * Math.PI));

               var s = projection(loc),
                   mouse = panning ? [ tCurr[0] - tStart[0], tCurr[1] - tStart[1] ] : [0, 0],
                   tMini = [
                       cMini[0] - s[0] + tMain[0] + mouse[0],
                       cMini[1] - s[1] + tMain[1] + mouse[1]
                   ];

               projection
                   .translate(tMini)
                   .clipExtent([[0, 0], dMini]);

               zoom
                   .center(cMini)
                   .translate(tMini)
                   .scale(kMini);

               tLast = tCurr = tMini;
               kLast = kCurr = kMini;

               if (transformed) {
                   setTransform(tiles, 0, 0);
                   setTransform(viewport, 0, 0);
                   transformed = false;
               }
           }


           function redraw() {
               if (hidden) return;

               updateProjection();

               var dMini = wrap.dimensions(),
                   zMini = ktoz(projection.scale() * 2 * Math.PI);

               // setup tile container
               tiles = wrap
                   .selectAll('.map-in-map-tiles')
                   .data([0]);

               tiles
                   .enter()
                   .append('div')
                   .attr('class', 'map-in-map-tiles');

               // redraw background
               backgroundLayer
                   .source(context.background().baseLayerSource())
                   .projection(projection)
                   .dimensions(dMini);

               var background = tiles
                   .selectAll('.map-in-map-background')
                   .data([0]);

               background.enter()
                   .append('div')
                   .attr('class', 'map-in-map-background');

               background
                   .call(backgroundLayer);


               // redraw overlay
               var overlaySources = context.background().overlayLayerSources();
               var activeOverlayLayers = [];
               for (var i = 0; i < overlaySources.length; i++) {
                   if (overlaySources[i].validZoom(zMini)) {
                       if (!overlayLayers[i]) overlayLayers[i] = TileLayer(context);
                       activeOverlayLayers.push(overlayLayers[i]
                           .source(overlaySources[i])
                           .projection(projection)
                           .dimensions(dMini));
                   }
               }

               var overlay = tiles
                   .selectAll('.map-in-map-overlay')
                   .data([0]);

               overlay.enter()
                   .append('div')
                   .attr('class', 'map-in-map-overlay');

               var overlays = overlay
                   .selectAll('div')
                   .data(activeOverlayLayers, function(d) { return d.source().name(); });

               overlays.enter().append('div');
               overlays.each(function(layer) {
                   d3.select(this).call(layer);
               });

               overlays.exit()
                   .remove();


               var dataLayers = tiles
                   .selectAll('.map-in-map-data')
                   .data([0]);

               dataLayers.enter()
                   .append('svg')
                   .attr('class', 'map-in-map-data');

               dataLayers.exit()
                   .remove();

               dataLayers
                   .call(gpxLayer)
                   .call(debugLayer);


               // redraw viewport bounding box
               if (!panning) {
                   var getPath = d3.geo.path().projection(projection),
                       bbox = { type: 'Polygon', coordinates: [context.map().extent().polygon()] };

                   viewport = wrap.selectAll('.map-in-map-viewport')
                       .data([0]);

                   viewport.enter()
                       .append('svg')
                       .attr('class', 'map-in-map-viewport');

                   var path = viewport.selectAll('.map-in-map-bbox')
                       .data([bbox]);

                   path.enter()
                       .append('path')
                       .attr('class', 'map-in-map-bbox');

                   path
                       .attr('d', getPath)
                       .classed('thick', function(d) { return getPath.area(d) < 30; });
               }
           }


           function queueRedraw() {
               clearTimeout(timeoutId);
               timeoutId = setTimeout(function() { redraw(); }, 300);
           }


           function toggle() {
               if (d3.event) d3.event.preventDefault();

               hidden = !hidden;

               var label = d3.select('.minimap-toggle');
               label.classed('active', !hidden)
                   .select('input').property('checked', !hidden);

               if (hidden) {
                   wrap
                       .style('display', 'block')
                       .style('opacity', 1)
                       .transition()
                       .duration(200)
                       .style('opacity', 0)
                       .each('end', function() {
                           d3.select(this).style('display', 'none');
                       });
               } else {
                   wrap
                       .style('display', 'block')
                       .style('opacity', 0)
                       .transition()
                       .duration(200)
                       .style('opacity', 1);

                   redraw();
               }
           }

           MapInMap.toggle = toggle;

           var wrap = selection.selectAll('.map-in-map')
               .data([0]);

           wrap.enter()
               .append('div')
               .attr('class', 'map-in-map')
               .style('display', (hidden ? 'none' : 'block'))
               .on('mousedown.map-in-map', startMouse)
               .on('mouseup.map-in-map', endMouse)
               .call(zoom)
               .on('dblclick.zoom', null);

           context.map()
               .on('drawn.map-in-map', function(drawn) {
                   if (drawn.full === true) redraw();
               });

           redraw();

           var keybinding = d3.keybinding('map-in-map')
               .on(key, toggle);

           d3.select(document)
               .call(keybinding);
       }

       return map_in_map;
   }

   function tooltipHtml(text, key) {
       var s = '<span>' + text + '</span>';
       if (key) {
           s += '<div class="keyhint-wrap">' +
               '<span> ' + (t('tooltip_keyhint')) + ' </span>' +
               '<span class="keyhint"> ' + key + '</span></div>';
       }
       return s;
   }

   function Background(context) {
       var key = 'B',
           opacities = [1, 0.75, 0.5, 0.25],
           directions = [
               ['right', [0.5, 0]],
               ['top', [0, -0.5]],
               ['left', [-0.5, 0]],
               ['bottom', [0, 0.5]]],
           opacityDefault = (context.storage('background-opacity') !== null) ?
               (+context.storage('background-opacity')) : 1.0,
           customTemplate = context.storage('background-custom-template') || '',
           previous;

       // Can be 0 from <1.3.0 use or due to issue #1923.
       if (opacityDefault === 0) opacityDefault = 1.0;


       function background(selection) {

           function sortSources(a, b) {
               return a.best() && !b.best() ? -1
                   : b.best() && !a.best() ? 1
                   : d3.descending(a.area(), b.area()) || d3.ascending(a.name(), b.name()) || 0;
           }

           function setOpacity(d) {
               var bg = context.container().selectAll('.layer-background')
                   .transition()
                   .style('opacity', d)
                   .attr('data-opacity', d);

               if (!iD.detect().opera) {
                   setTransform(bg, 0, 0);
               }

               opacityList.selectAll('li')
                   .classed('active', function(_) { return _ === d; });

               context.storage('background-opacity', d);
           }

           function setTooltips(selection) {
               selection.each(function(d) {
                   var item = d3.select(this);
                   if (d === previous) {
                       item.call(bootstrap.tooltip()
                           .html(true)
                           .title(function() {
                               var tip = '<div>' + t('background.switch') + '</div>';
                               return tooltipHtml(tip, cmd('⌘B'));
                           })
                           .placement('top')
                       );
                   } else if (d.description) {
                       item.call(bootstrap.tooltip()
                           .title(d.description)
                           .placement('top')
                       );
                   } else {
                       item.call(bootstrap.tooltip().destroy);
                   }
               });
           }

           function selectLayer() {
               function active(d) {
                   return context.background().showsLayer(d);
               }

               content.selectAll('.layer, .custom_layer')
                   .classed('active', active)
                   .classed('switch', function(d) { return d === previous; })
                   .call(setTooltips)
                   .selectAll('input')
                   .property('checked', active);
           }

           function clickSetSource(d) {
               previous = context.background().baseLayerSource();
               d3.event.preventDefault();
               context.background().baseLayerSource(d);
               selectLayer();
               document.activeElement.blur();
           }

           function editCustom() {
               d3.event.preventDefault();
               var template = window.prompt(t('background.custom_prompt'), customTemplate);
               if (!template ||
                   template.indexOf('google.com') !== -1 ||
                   template.indexOf('googleapis.com') !== -1 ||
                   template.indexOf('google.ru') !== -1) {
                   selectLayer();
                   return;
               }
               setCustom(template);
           }

           function setCustom(template) {
               context.background().baseLayerSource(BackgroundSource.Custom(template));
               selectLayer();
               context.storage('background-custom-template', template);
           }

           function clickSetOverlay(d) {
               d3.event.preventDefault();
               context.background().toggleOverlayLayer(d);
               selectLayer();
               document.activeElement.blur();
           }

           function drawList(layerList, type, change, filter) {
               var sources = context.background()
                   .sources(context.map().extent())
                   .filter(filter);

               var layerLinks = layerList.selectAll('li.layer')
                   .data(sources, function(d) { return d.name(); });

               var enter = layerLinks.enter()
                   .insert('li', '.custom_layer')
                   .attr('class', 'layer')
                   .classed('best', function(d) { return d.best(); });

               enter.filter(function(d) { return d.best(); })
                   .append('div')
                   .attr('class', 'best')
                   .call(bootstrap.tooltip()
                       .title(t('background.best_imagery'))
                       .placement('left'))
                   .append('span')
                   .html('&#9733;');

               var label = enter.append('label');

               label.append('input')
                   .attr('type', type)
                   .attr('name', 'layers')
                   .on('change', change);

               label.append('span')
                   .text(function(d) { return d.name(); });


               layerLinks.exit()
                   .remove();

               layerList.selectAll('li.layer')
                   .sort(sortSources)
                   .style('display', layerList.selectAll('li.layer').data().length > 0 ? 'block' : 'none');
           }

           function update() {
               backgroundList.call(drawList, 'radio', clickSetSource, function(d) { return !d.overlay; });
               overlayList.call(drawList, 'checkbox', clickSetOverlay, function(d) { return d.overlay; });

               selectLayer();

               var source = context.background().baseLayerSource();
               if (source.id === 'custom') {
                   customTemplate = source.template;
               }

               updateOffsetVal();
           }

           function updateOffsetVal() {
               var meters = offsetToMeters(context.background().offset()),
                   x = +meters[0].toFixed(2),
                   y = +meters[1].toFixed(2);

               d3.selectAll('.nudge-inner-rect')
                   .select('input')
                   .classed('error', false)
                   .property('value', x + ', ' + y);

               d3.selectAll('.nudge-reset')
                   .classed('disabled', function() {
                       return (x === 0 && y === 0);
                   });
           }

           function resetOffset() {
               context.background().offset([0, 0]);
               updateOffsetVal();
           }

           function nudge(d) {
               context.background().nudge(d, context.map().zoom());
               updateOffsetVal();
           }

           function buttonOffset(d) {
               var timeout = window.setTimeout(function() {
                       interval = window.setInterval(nudge.bind(null, d), 100);
                   }, 500),
                   interval;

               d3.select(window).on('mouseup', function() {
                   window.clearInterval(interval);
                   window.clearTimeout(timeout);
                   d3.select(window).on('mouseup', null);
               });

               nudge(d);
           }

           function inputOffset() {
               var input = d3.select(this);
               var d = input.node().value;

               if (d === '') return resetOffset();

               d = d.replace(/;/g, ',').split(',').map(function(n) {
                   // if n is NaN, it will always get mapped to false.
                   return !isNaN(n) && n;
               });

               if (d.length !== 2 || !d[0] || !d[1]) {
                   input.classed('error', true);
                   return;
               }

               context.background().offset(metersToOffset(d));
               updateOffsetVal();
           }

           function dragOffset() {
               var origin = [d3.event.clientX, d3.event.clientY];

               context.container()
                   .append('div')
                   .attr('class', 'nudge-surface');

               d3.select(window)
                   .on('mousemove.offset', function() {
                       var latest = [d3.event.clientX, d3.event.clientY];
                       var d = [
                           -(origin[0] - latest[0]) / 4,
                           -(origin[1] - latest[1]) / 4
                       ];

                       origin = latest;
                       nudge(d);
                   })
                   .on('mouseup.offset', function() {
                       d3.selectAll('.nudge-surface')
                           .remove();

                       d3.select(window)
                           .on('mousemove.offset', null)
                           .on('mouseup.offset', null);
                   });

               d3.event.preventDefault();
           }

           function hide() {
               setVisible(false);
           }

           function toggle() {
               if (d3.event) d3.event.preventDefault();
               tooltip.hide(button);
               setVisible(!button.classed('active'));
           }

           function quickSwitch() {
               if (previous) {
                   clickSetSource(previous);
               }
           }

           function setVisible(show) {
               if (show !== shown) {
                   button.classed('active', show);
                   shown = show;

                   if (show) {
                       selection.on('mousedown.background-inside', function() {
                           return d3.event.stopPropagation();
                       });
                       content.style('display', 'block')
                           .style('right', '-300px')
                           .transition()
                           .duration(200)
                           .style('right', '0px');
                   } else {
                       content.style('display', 'block')
                           .style('right', '0px')
                           .transition()
                           .duration(200)
                           .style('right', '-300px')
                           .each('end', function() {
                               d3.select(this).style('display', 'none');
                           });
                       selection.on('mousedown.background-inside', null);
                   }
               }
           }


           var content = selection.append('div')
                   .attr('class', 'fillL map-overlay col3 content hide'),
               tooltip = bootstrap.tooltip()
                   .placement('left')
                   .html(true)
                   .title(tooltipHtml(t('background.description'), key)),
               button = selection.append('button')
                   .attr('tabindex', -1)
                   .on('click', toggle)
                   .call(Icon('#icon-layers', 'light'))
                   .call(tooltip),
               shown = false;


           /* opacity switcher */

           var opa = content.append('div')
                   .attr('class', 'opacity-options-wrapper');

           opa.append('h4')
               .text(t('background.title'));

           var opacityList = opa.append('ul')
               .attr('class', 'opacity-options');

           opacityList.selectAll('div.opacity')
               .data(opacities)
               .enter()
               .append('li')
               .attr('data-original-title', function(d) {
                   return t('background.percent_brightness', { opacity: (d * 100) });
               })
               .on('click.set-opacity', setOpacity)
               .html('<div class="select-box"></div>')
               .call(bootstrap.tooltip()
                   .placement('left'))
               .append('div')
               .attr('class', 'opacity')
               .style('opacity', function(d) { return 1.25 - d; });


           /* background switcher */

           var backgroundList = content.append('ul')
               .attr('class', 'layer-list');

           var custom = backgroundList.append('li')
               .attr('class', 'custom_layer')
               .datum(BackgroundSource.Custom());

           custom.append('button')
               .attr('class', 'layer-browse')
               .call(bootstrap.tooltip()
                   .title(t('background.custom_button'))
                   .placement('left'))
               .on('click', editCustom)
               .call(Icon('#icon-search'));

           var label = custom.append('label');

           label.append('input')
               .attr('type', 'radio')
               .attr('name', 'layers')
               .on('change', function () {
                   if (customTemplate) {
                       setCustom(customTemplate);
                   } else {
                       editCustom();
                   }
               });

           label.append('span')
               .text(t('background.custom'));

           content.append('div')
               .attr('class', 'imagery-faq')
               .append('a')
               .attr('target', '_blank')
               .attr('tabindex', -1)
               .call(Icon('#icon-out-link', 'inline'))
               .attr('href', 'https://github.com/openstreetmap/iD/blob/master/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
               .append('span')
               .text(t('background.imagery_source_faq'));

           var overlayList = content.append('ul')
               .attr('class', 'layer-list');

           var controls = content.append('div')
               .attr('class', 'controls-list');


           /* minimap toggle */

           var minimapLabel = controls
               .append('label')
               .call(bootstrap.tooltip()
                   .html(true)
                   .title(tooltipHtml(t('background.minimap.tooltip'), '/'))
                   .placement('top')
               );

           minimapLabel.classed('minimap-toggle', true)
               .append('input')
               .attr('type', 'checkbox')
               .on('change', function() {
                   MapInMap.toggle();
                   d3.event.preventDefault();
               });

           minimapLabel.append('span')
               .text(t('background.minimap.description'));


           /* imagery offset controls */

           var adjustments = content.append('div')
               .attr('class', 'adjustments');

           adjustments.append('a')
               .text(t('background.fix_misalignment'))
               .attr('href', '#')
               .classed('hide-toggle', true)
               .classed('expanded', false)
               .on('click', function() {
                   var exp = d3.select(this).classed('expanded');
                   nudgeContainer.style('display', exp ? 'none' : 'block');
                   d3.select(this).classed('expanded', !exp);
                   d3.event.preventDefault();
               });

           var nudgeContainer = adjustments.append('div')
               .attr('class', 'nudge-container cf')
               .style('display', 'none');

           nudgeContainer.append('div')
               .attr('class', 'nudge-instructions')
               .text(t('background.offset'));

           var nudgeRect = nudgeContainer.append('div')
               .attr('class', 'nudge-outer-rect')
               .on('mousedown', dragOffset);

           nudgeRect.append('div')
               .attr('class', 'nudge-inner-rect')
               .append('input')
               .on('change', inputOffset)
               .on('mousedown', function() {
                   d3.event.stopPropagation();
               });

           nudgeContainer.append('div')
               .selectAll('button')
               .data(directions).enter()
               .append('button')
               .attr('class', function(d) { return d[0] + ' nudge'; })
               .on('mousedown', function(d) {
                   buttonOffset(d[1]);
               });

           nudgeContainer.append('button')
               .attr('title', t('background.reset'))
               .attr('class', 'nudge-reset disabled')
               .on('click', resetOffset)
               .call(Icon('#icon-undo'));

           context.map()
               .on('move.background-update', _.debounce(update, 1000));

           context.background()
               .on('change.background-update', update);


           update();
           setOpacity(opacityDefault);

           var keybinding = d3.keybinding('background')
               .on(key, toggle)
               .on(cmd('⌘B'), quickSwitch)
               .on('F', hide)
               .on('H', hide);

           d3.select(document)
               .call(keybinding);

           context.surface().on('mousedown.background-outside', hide);
           context.container().on('mousedown.background-outside', hide);
       }

       return background;
   }

   function Commit(context) {
       var dispatch = d3.dispatch('cancel', 'save');

       function commit(selection) {
           var changes = context.history().changes(),
               summary = context.history().difference().summary();

           function zoomToEntity(change) {
               var entity = change.entity;
               if (change.changeType !== 'deleted' &&
                   context.graph().entity(entity.id).geometry(context.graph()) !== 'vertex') {
                   context.map().zoomTo(entity);
                   context.surface().selectAll(
                       entityOrMemberSelector([entity.id], context.graph()))
                       .classed('hover', true);
               }
           }

           var header = selection.append('div')
               .attr('class', 'header fillL');

           header.append('h3')
               .text(t('commit.title'));

           var body = selection.append('div')
               .attr('class', 'body');


           // Comment Section
           var commentSection = body.append('div')
               .attr('class', 'modal-section form-field commit-form');

           commentSection.append('label')
               .attr('class', 'form-label')
               .text(t('commit.message_label'));

           var commentField = commentSection.append('textarea')
               .attr('placeholder', t('commit.description_placeholder'))
               .attr('maxlength', 255)
               .property('value', context.storage('comment') || '')
               .on('input.save', checkComment)
               .on('change.save', checkComment)
               .on('blur.save', function() {
                   context.storage('comment', this.value);
               });

           function checkComment() {
               d3.selectAll('.save-section .save-button')
                   .attr('disabled', (this.value.length ? null : true));

               var googleWarning = clippyArea
                  .html('')
                  .selectAll('a')
                  .data(this.value.match(/google/i) ? [true] : []);

               googleWarning.exit().remove();

               googleWarning.enter()
                  .append('a')
                  .attr('target', '_blank')
                  .attr('tabindex', -1)
                  .call(Icon('#icon-alert', 'inline'))
                  .attr('href', t('commit.google_warning_link'))
                  .append('span')
                  .text(t('commit.google_warning'));
           }

           commentField.node().select();

           context.connection().userChangesets(function (err, changesets) {
               if (err) return;

               var comments = [];

               for (var i = 0; i < changesets.length; i++) {
                   if (changesets[i].tags.comment) {
                       comments.push({
                           title: changesets[i].tags.comment,
                           value: changesets[i].tags.comment
                       });
                   }
               }

               commentField.call(d3.combobox().caseSensitive(true).data(comments));
           });

           var clippyArea = commentSection.append('div')
               .attr('class', 'clippy-area');


           var changeSetInfo = commentSection.append('div')
               .attr('class', 'changeset-info');

           changeSetInfo.append('a')
               .attr('target', '_blank')
               .attr('tabindex', -1)
               .call(Icon('#icon-out-link', 'inline'))
               .attr('href', t('commit.about_changeset_comments_link'))
               .append('span')
               .text(t('commit.about_changeset_comments'));

           // Warnings
           var warnings = body.selectAll('div.warning-section')
               .data([context.history().validate(changes)])
               .enter()
               .append('div')
               .attr('class', 'modal-section warning-section fillL2')
               .style('display', function(d) { return _.isEmpty(d) ? 'none' : null; })
               .style('background', '#ffb');

           warnings.append('h3')
               .text(t('commit.warnings'));

           var warningLi = warnings.append('ul')
               .attr('class', 'changeset-list')
               .selectAll('li')
               .data(function(d) { return d; })
               .enter()
               .append('li')
               .style()
               .on('mouseover', mouseover)
               .on('mouseout', mouseout)
               .on('click', warningClick);

           warningLi
               .call(Icon('#icon-alert', 'pre-text'));

           warningLi
               .append('strong').text(function(d) {
                   return d.message;
               });

           warningLi.filter(function(d) { return d.tooltip; })
               .call(bootstrap.tooltip()
                   .title(function(d) { return d.tooltip; })
                   .placement('top')
               );


           // Upload Explanation
           var saveSection = body.append('div')
               .attr('class','modal-section save-section fillL cf');

           var prose = saveSection.append('p')
               .attr('class', 'commit-info')
               .html(t('commit.upload_explanation'));

           context.connection().userDetails(function(err, user) {
               if (err) return;

               var userLink = d3.select(document.createElement('div'));

               if (user.image_url) {
                   userLink.append('img')
                       .attr('src', user.image_url)
                       .attr('class', 'icon pre-text user-icon');
               }

               userLink.append('a')
                   .attr('class','user-info')
                   .text(user.display_name)
                   .attr('href', context.connection().userURL(user.display_name))
                   .attr('tabindex', -1)
                   .attr('target', '_blank');

               prose.html(t('commit.upload_explanation_with_user', {user: userLink.html()}));
           });


           // Buttons
           var buttonSection = saveSection.append('div')
               .attr('class','buttons fillL cf');

           var cancelButton = buttonSection.append('button')
               .attr('class', 'secondary-action col5 button cancel-button')
               .on('click.cancel', function() { dispatch.cancel(); });

           cancelButton.append('span')
               .attr('class', 'label')
               .text(t('commit.cancel'));

           var saveButton = buttonSection.append('button')
               .attr('class', 'action col5 button save-button')
               .attr('disabled', function() {
                   var n = d3.select('.commit-form textarea').node();
                   return (n && n.value.length) ? null : true;
               })
               .on('click.save', function() {
                   dispatch.save({
                       comment: commentField.node().value
                   });
               });

           saveButton.append('span')
               .attr('class', 'label')
               .text(t('commit.save'));


           // Changes
           var changeSection = body.selectAll('div.commit-section')
               .data([0])
               .enter()
               .append('div')
               .attr('class', 'commit-section modal-section fillL2');

           changeSection.append('h3')
               .text(t('commit.changes', {count: summary.length}));

           var li = changeSection.append('ul')
               .attr('class', 'changeset-list')
               .selectAll('li')
               .data(summary)
               .enter()
               .append('li')
               .on('mouseover', mouseover)
               .on('mouseout', mouseout)
               .on('click', zoomToEntity);

           li.each(function(d) {
               d3.select(this)
                   .call(Icon('#icon-' + d.entity.geometry(d.graph), 'pre-text ' + d.changeType));
           });

           li.append('span')
               .attr('class', 'change-type')
               .text(function(d) {
                   return t('commit.' + d.changeType) + ' ';
               });

           li.append('strong')
               .attr('class', 'entity-type')
               .text(function(d) {
                   return context.presets().match(d.entity, d.graph).name();
               });

           li.append('span')
               .attr('class', 'entity-name')
               .text(function(d) {
                   var name = displayName(d.entity) || '',
                       string = '';
                   if (name !== '') string += ':';
                   return string += ' ' + name;
               });

           li.style('opacity', 0)
               .transition()
               .style('opacity', 1);


           function mouseover(d) {
               if (d.entity) {
                   context.surface().selectAll(
                       entityOrMemberSelector([d.entity.id], context.graph())
                   ).classed('hover', true);
               }
           }

           function mouseout() {
               context.surface().selectAll('.hover')
                   .classed('hover', false);
           }

           function warningClick(d) {
               if (d.entity) {
                   context.map().zoomTo(d.entity);
                   context.enter(
                       Select(context, [d.entity.id])
                           .suppressMenu(true));
               }
           }

           // Call checkComment off the bat, in case a changeset
           // comment is recovered from localStorage
           commentField.trigger('input');
       }

       return d3.rebind(commit, dispatch, 'on');
   }

   function modal(selection, blocking) {
       var keybinding = d3.keybinding('modal');
       var previous = selection.select('div.modal');
       var animate = previous.empty();

       previous.transition()
           .duration(200)
           .style('opacity', 0)
           .remove();

       var shaded = selection
           .append('div')
           .attr('class', 'shaded')
           .style('opacity', 0);

       shaded.close = function() {
           shaded
               .transition()
               .duration(200)
               .style('opacity',0)
               .remove();
           modal
               .transition()
               .duration(200)
               .style('top','0px');

           keybinding.off();
       };


       var modal = shaded.append('div')
           .attr('class', 'modal fillL col6');

       if (!blocking) {
           shaded.on('click.remove-modal', function() {
               if (d3.event.target === this) {
                   shaded.close();
               }
           });

           modal.append('button')
               .attr('class', 'close')
               .on('click', shaded.close)
               .call(Icon('#icon-close'));

           keybinding
               .on('⌫', shaded.close)
               .on('⎋', shaded.close);

           d3.select(document).call(keybinding);
       }

       modal.append('div')
           .attr('class', 'content');

       if (animate) {
           shaded.transition().style('opacity', 1);
       } else {
           shaded.style('opacity', 1);
       }

       return shaded;
   }

   function confirm$1(selection) {
       var modalSelection = modal(selection);

       modalSelection.select('.modal')
           .classed('modal-alert', true);

       var section = modalSelection.select('.content');

       section.append('div')
           .attr('class', 'modal-section header');

       section.append('div')
           .attr('class', 'modal-section message-text');

       var buttons = section.append('div')
           .attr('class', 'modal-section buttons cf');

       modalSelection.okButton = function() {
           buttons
               .append('button')
               .attr('class', 'action col4')
               .on('click.confirm', function() {
                   modalSelection.remove();
               })
               .text(t('confirm.okay'));

           return modalSelection;
       };

       return modalSelection;
   }

   function Conflicts(context) {
       var dispatch = d3.dispatch('download', 'cancel', 'save'),
           list;

       function conflicts(selection) {
           var header = selection
               .append('div')
               .attr('class', 'header fillL');

           header
               .append('button')
               .attr('class', 'fr')
               .on('click', function() { dispatch.cancel(); })
               .call(Icon('#icon-close'));

           header
               .append('h3')
               .text(t('save.conflict.header'));

           var body = selection
               .append('div')
               .attr('class', 'body fillL');

           body
               .append('div')
               .attr('class', 'conflicts-help')
               .text(t('save.conflict.help'))
               .append('a')
               .attr('class', 'conflicts-download')
               .text(t('save.conflict.download_changes'))
               .on('click.download', function() { dispatch.download(); });

           body
               .append('div')
               .attr('class', 'conflict-container fillL3')
               .call(showConflict, 0);

           body
               .append('div')
               .attr('class', 'conflicts-done')
               .attr('opacity', 0)
               .style('display', 'none')
               .text(t('save.conflict.done'));

           var buttons = body
               .append('div')
               .attr('class','buttons col12 joined conflicts-buttons');

           buttons
               .append('button')
               .attr('disabled', list.length > 1)
               .attr('class', 'action conflicts-button col6')
               .text(t('save.title'))
               .on('click.try_again', function() { dispatch.save(); });

           buttons
               .append('button')
               .attr('class', 'secondary-action conflicts-button col6')
               .text(t('confirm.cancel'))
               .on('click.cancel', function() { dispatch.cancel(); });
       }


       function showConflict(selection, index) {
           if (index < 0 || index >= list.length) return;

           var parent = d3.select(selection.node().parentNode);

           // enable save button if this is the last conflict being reviewed..
           if (index === list.length - 1) {
               window.setTimeout(function() {
                   parent.select('.conflicts-button')
                       .attr('disabled', null);

                   parent.select('.conflicts-done')
                       .transition()
                       .attr('opacity', 1)
                       .style('display', 'block');
               }, 250);
           }

           var item = selection
               .selectAll('.conflict')
               .data([list[index]]);

           var enter = item.enter()
               .append('div')
               .attr('class', 'conflict');

           enter
               .append('h4')
               .attr('class', 'conflict-count')
               .text(t('save.conflict.count', { num: index + 1, total: list.length }));

           enter
               .append('a')
               .attr('class', 'conflict-description')
               .attr('href', '#')
               .text(function(d) { return d.name; })
               .on('click', function(d) {
                   zoomToEntity(d.id);
                   d3.event.preventDefault();
               });

           var details = enter
               .append('div')
               .attr('class', 'conflict-detail-container');

           details
               .append('ul')
               .attr('class', 'conflict-detail-list')
               .selectAll('li')
               .data(function(d) { return d.details || []; })
               .enter()
               .append('li')
               .attr('class', 'conflict-detail-item')
               .html(function(d) { return d; });

           details
               .append('div')
               .attr('class', 'conflict-choices')
               .call(addChoices);

           details
               .append('div')
               .attr('class', 'conflict-nav-buttons joined cf')
               .selectAll('button')
               .data(['previous', 'next'])
               .enter()
               .append('button')
               .text(function(d) { return t('save.conflict.' + d); })
               .attr('class', 'conflict-nav-button action col6')
               .attr('disabled', function(d, i) {
                   return (i === 0 && index === 0) ||
                       (i === 1 && index === list.length - 1) || null;
               })
               .on('click', function(d, i) {
                   var container = parent.select('.conflict-container'),
                   sign = (i === 0 ? -1 : 1);

                   container
                       .selectAll('.conflict')
                       .remove();

                   container
                       .call(showConflict, index + sign);

                   d3.event.preventDefault();
               });

           item.exit()
               .remove();

       }

       function addChoices(selection) {
           var choices = selection
               .append('ul')
               .attr('class', 'layer-list')
               .selectAll('li')
               .data(function(d) { return d.choices || []; });

           var enter = choices.enter()
               .append('li')
               .attr('class', 'layer');

           var label = enter
               .append('label');

           label
               .append('input')
               .attr('type', 'radio')
               .attr('name', function(d) { return d.id; })
               .on('change', function(d, i) {
                   var ul = this.parentNode.parentNode.parentNode;
                   ul.__data__.chosen = i;
                   choose(ul, d);
               });

           label
               .append('span')
               .text(function(d) { return d.text; });

           choices
               .each(function(d, i) {
                   var ul = this.parentNode;
                   if (ul.__data__.chosen === i) choose(ul, d);
               });
       }

       function choose(ul, datum) {
           if (d3.event) d3.event.preventDefault();

           d3.select(ul)
               .selectAll('li')
               .classed('active', function(d) { return d === datum; })
               .selectAll('input')
               .property('checked', function(d) { return d === datum; });

           var extent = Extent(),
               entity;

           entity = context.graph().hasEntity(datum.id);
           if (entity) extent._extend(entity.extent(context.graph()));

           datum.action();

           entity = context.graph().hasEntity(datum.id);
           if (entity) extent._extend(entity.extent(context.graph()));

           zoomToEntity(datum.id, extent);
       }

       function zoomToEntity(id, extent) {
           context.surface().selectAll('.hover')
               .classed('hover', false);

           var entity = context.graph().hasEntity(id);
           if (entity) {
               if (extent) {
                   context.map().trimmedExtent(extent);
               } else {
                   context.map().zoomTo(entity);
               }
               context.surface().selectAll(
                   entityOrMemberSelector([entity.id], context.graph()))
                   .classed('hover', true);
           }
       }


       // The conflict list should be an array of objects like:
       // {
       //     id: id,
       //     name: entityName(local),
       //     details: merge.conflicts(),
       //     chosen: 1,
       //     choices: [
       //         choice(id, keepMine, forceLocal),
       //         choice(id, keepTheirs, forceRemote)
       //     ]
       // }
       conflicts.list = function(_) {
           if (!arguments.length) return list;
           list = _;
           return conflicts;
       };

       return d3.rebind(conflicts, dispatch, 'on');
   }

   function Contributors(context) {
       var debouncedUpdate = _.debounce(function() { update(); }, 1000),
           limit = 4,
           hidden = false,
           wrap = d3.select(null);

       function update() {
           var users = {},
               entities = context.intersects(context.map().extent());

           entities.forEach(function(entity) {
               if (entity && entity.user) users[entity.user] = true;
           });

           var u = Object.keys(users),
               subset = u.slice(0, u.length > limit ? limit - 1 : limit);

           wrap.html('')
               .call(Icon('#icon-nearby', 'pre-text light'));

           var userList = d3.select(document.createElement('span'));

           userList.selectAll()
               .data(subset)
               .enter()
               .append('a')
               .attr('class', 'user-link')
               .attr('href', function(d) { return context.connection().userURL(d); })
               .attr('target', '_blank')
               .attr('tabindex', -1)
               .text(String);

           if (u.length > limit) {
               var count = d3.select(document.createElement('span'));

               count.append('a')
                   .attr('target', '_blank')
                   .attr('tabindex', -1)
                   .attr('href', function() {
                       return context.connection().changesetsURL(context.map().center(), context.map().zoom());
                   })
                   .text(u.length - limit + 1);

               wrap.append('span')
                   .html(t('contributors.truncated_list', { users: userList.html(), count: count.html() }));

           } else {
               wrap.append('span')
                   .html(t('contributors.list', { users: userList.html() }));
           }

           if (!u.length) {
               hidden = true;
               wrap
                   .transition()
                   .style('opacity', 0);

           } else if (hidden) {
               wrap
                   .transition()
                   .style('opacity', 1);
           }
       }

       return function(selection) {
           wrap = selection;
           update();

           context.connection().on('loaded.contributors', debouncedUpdate);
           context.map().on('move.contributors', debouncedUpdate);
       };
   }

   // toggles the visibility of ui elements, using a combination of the
   // hide class, which sets display=none, and a d3 transition for opacity.
   // this will cause blinking when called repeatedly, so check that the
   // value actually changes between calls.
   function Toggle(show, callback) {
       return function(selection) {
           selection
               .style('opacity', show ? 0 : 1)
               .classed('hide', false)
               .transition()
               .style('opacity', show ? 1 : 0)
               .each('end', function() {
                   d3.select(this)
                       .classed('hide', !show)
                       .style('opacity', null);
                   if (callback) callback.apply(this);
               });
       };
   }

   function Disclosure() {
       var dispatch = d3.dispatch('toggled'),
           title,
           expanded = false,
           content = function () {};

       var disclosure = function(selection) {
           var $link = selection.selectAll('.hide-toggle')
               .data([0]);

           $link.enter().append('a')
               .attr('href', '#')
               .attr('class', 'hide-toggle');

           $link.text(title)
               .on('click', toggle)
               .classed('expanded', expanded);

           var $body = selection.selectAll('div')
               .data([0]);

           $body.enter().append('div');

           $body.classed('hide', !expanded)
               .call(content);

           function toggle() {
               expanded = !expanded;
               $link.classed('expanded', expanded);
               $body.call(Toggle(expanded));
               dispatch.toggled(expanded);
           }
       };

       disclosure.title = function(_) {
           if (!arguments.length) return title;
           title = _;
           return disclosure;
       };

       disclosure.expanded = function(_) {
           if (!arguments.length) return expanded;
           expanded = _;
           return disclosure;
       };

       disclosure.content = function(_) {
           if (!arguments.length) return content;
           content = _;
           return disclosure;
       };

       return d3.rebind(disclosure, dispatch, 'on');
   }

   function TagReference(tag, context) {
       var tagReference = {},
           button,
           body,
           loaded,
           showing;

       function findLocal(data) {
           var locale = iD.detect().locale.toLowerCase(),
               localized;

           localized = _.find(data, function(d) {
               return d.lang.toLowerCase() === locale;
           });
           if (localized) return localized;

           // try the non-regional version of a language, like
           // 'en' if the language is 'en-US'
           if (locale.indexOf('-') !== -1) {
               var first = locale.split('-')[0];
               localized = _.find(data, function(d) {
                   return d.lang.toLowerCase() === first;
               });
               if (localized) return localized;
           }

           // finally fall back to english
           return _.find(data, function(d) {
               return d.lang.toLowerCase() === 'en';
           });
       }

       function load(param) {
           button.classed('tag-reference-loading', true);

           context.taginfo().docs(param, function show(err, data) {
               var docs;
               if (!err && data) {
                   docs = findLocal(data);
               }

               body.html('');

               if (!docs || !docs.description) {
                   if (param.hasOwnProperty('value')) {
                       load(_.omit(param, 'value'));   // retry with key only
                   } else {
                       body.append('p').text(t('inspector.no_documentation_key'));
                       done();
                   }
                   return;
               }

               if (docs.image && docs.image.thumb_url_prefix) {
                   body
                       .append('img')
                       .attr('class', 'wiki-image')
                       .attr('src', docs.image.thumb_url_prefix + '100' + docs.image.thumb_url_suffix)
                       .on('load', function() { done(); })
                       .on('error', function() { d3.select(this).remove(); done(); });
               } else {
                   done();
               }

               body
                   .append('p')
                   .text(docs.description);

               body
                   .append('a')
                   .attr('target', '_blank')
                   .attr('tabindex', -1)
                   .attr('href', 'https://wiki.openstreetmap.org/wiki/' + docs.title)
                   .call(Icon('#icon-out-link', 'inline'))
                   .append('span')
                   .text(t('inspector.reference'));
           });
       }

       function done() {
           loaded = true;

           button.classed('tag-reference-loading', false);

           body.transition()
               .duration(200)
               .style('max-height', '200px')
               .style('opacity', '1');

           showing = true;
       }

       function hide(selection) {
           selection = selection || body.transition().duration(200);

           selection
               .style('max-height', '0px')
               .style('opacity', '0');

           showing = false;
       }

       tagReference.button = function(selection) {
           button = selection.selectAll('.tag-reference-button')
               .data([0]);

           button.enter()
               .append('button')
               .attr('class', 'tag-reference-button')
               .attr('tabindex', -1)
               .call(Icon('#icon-inspect'));

           button.on('click', function () {
               d3.event.stopPropagation();
               d3.event.preventDefault();
               if (showing) {
                   hide();
               } else if (loaded) {
                   done();
               } else {
                   if (context.taginfo()) {
                       load(tag);
                   }
               }
           });
       };

       tagReference.body = function(selection) {
           body = selection.selectAll('.tag-reference-body')
               .data([0]);

           body.enter().append('div')
               .attr('class', 'tag-reference-body cf')
               .style('max-height', '0')
               .style('opacity', '0');

           if (showing === false) {
               hide(body);
           }
       };

       tagReference.showing = function(_) {
           if (!arguments.length) return showing;
           showing = _;
           return tagReference;
       };

       return tagReference;
   }

   function preset(context) {
       var event = d3.dispatch('change'),
           state,
           fieldsArr,
           preset,
           tags,
           id;

       function UIField(field, entity, show) {
           field = _.clone(field);

           field.input = fields[field.type](field, context)
               .on('change', event.change);

           if (field.input.entity) field.input.entity(entity);

           field.keys = field.keys || [field.key];

           field.show = show;

           field.shown = function() {
               return field.id === 'name' || field.show || _.some(field.keys, function(key) { return !!tags[key]; });
           };

           field.modified = function() {
               var original = context.graph().base().entities[entity.id];
               return _.some(field.keys, function(key) {
                   return original ? tags[key] !== original.tags[key] : tags[key];
               });
           };

           field.revert = function() {
               var original = context.graph().base().entities[entity.id],
                   t = {};
               field.keys.forEach(function(key) {
                   t[key] = original ? original.tags[key] : undefined;
               });
               return t;
           };

           field.present = function() {
               return _.some(field.keys, function(key) {
                   return tags[key];
               });
           };

           field.remove = function() {
               var t = {};
               field.keys.forEach(function(key) {
                   t[key] = undefined;
               });
               return t;
           };

           return field;
       }

       function fieldKey(field) {
           return field.id;
       }

       function presets(selection) {
           selection.call(Disclosure()
               .title(t('inspector.all_fields'))
               .expanded(context.storage('preset_fields.expanded') !== 'false')
               .on('toggled', toggled)
               .content(content));

           function toggled(expanded) {
               context.storage('preset_fields.expanded', expanded);
           }
       }

       function content(selection) {
           if (!fieldsArr) {
               var entity = context.entity(id),
                   geometry = context.geometry(id);

               fieldsArr = [UIField(context.presets().field('name'), entity)];

               preset.fields.forEach(function(field) {
                   if (field.matchGeometry(geometry)) {
                       fieldsArr.push(UIField(field, entity, true));
                   }
               });

               if (entity.isHighwayIntersection(context.graph())) {
                   fieldsArr.push(UIField(context.presets().field('restrictions'), entity, true));
               }

               context.presets().universal().forEach(function(field) {
                   if (preset.fields.indexOf(field) < 0) {
                       fieldsArr.push(UIField(field, entity));
                   }
               });
           }

           var shown = fieldsArr.filter(function(field) { return field.shown(); }),
               notShown = fieldsArr.filter(function(field) { return !field.shown(); });

           var $form = selection.selectAll('.preset-form')
               .data([0]);

           $form.enter().append('div')
               .attr('class', 'preset-form inspector-inner fillL3');

           var $fields = $form.selectAll('.form-field')
               .data(shown, fieldKey);

           // Enter

           var $enter = $fields.enter()
               .append('div')
               .attr('class', function(field) {
                   return 'form-field form-field-' + field.id;
               });

           var $label = $enter.append('label')
               .attr('class', 'form-label')
               .attr('for', function(field) { return 'preset-input-' + field.id; })
               .text(function(field) { return field.label(); });

           var wrap = $label.append('div')
               .attr('class', 'form-label-button-wrap');

           wrap.append('button')
               .attr('class', 'remove-icon')
               .attr('tabindex', -1)
               .call(Icon('#operation-delete'));

           wrap.append('button')
               .attr('class', 'modified-icon')
               .attr('tabindex', -1)
               .call(Icon('#icon-undo'));

           // Update

           $fields.select('.form-label-button-wrap .remove-icon')
               .on('click', remove);

           $fields.select('.modified-icon')
               .on('click', revert);

           $fields
               .order()
               .classed('modified', function(field) {
                   return field.modified();
               })
               .classed('present', function(field) {
                   return field.present();
               })
               .each(function(field) {
                   var reference = TagReference(field.reference || {key: field.key}, context);

                   if (state === 'hover') {
                       reference.showing(false);
                   }

                   d3.select(this)
                       .call(field.input)
                       .selectAll('input')
                       .on('keydown', function() {
                           // if user presses enter, and combobox is not active, accept edits..
                           if (d3.event.keyCode === 13 && d3.select('.combobox').empty()) {
                               context.enter(Browse(context));
                           }
                       })
                       .call(reference.body)
                       .select('.form-label-button-wrap')
                       .call(reference.button);

                   field.input.tags(tags);
               });

           $fields.exit()
               .remove();

           notShown = notShown.map(function(field) {
               return {
                   title: field.label(),
                   value: field.label(),
                   field: field
               };
           });

           var $more = selection.selectAll('.more-fields')
               .data((notShown.length > 0) ? [0] : []);

           $more.enter().append('div')
               .attr('class', 'more-fields')
               .append('label')
                   .text(t('inspector.add_fields'));

           var $input = $more.selectAll('.value')
               .data([0]);

           $input.enter().append('input')
               .attr('class', 'value')
               .attr('type', 'text');

           $input.value('')
               .attr('placeholder', function() {
                   var placeholder = [];
                   for (var field in notShown) {
                       placeholder.push(notShown[field].title);
                   }
                   return placeholder.slice(0,3).join(', ') + ((placeholder.length > 3) ? '…' : '');
               })
               .call(d3.combobox().data(notShown)
                   .minItems(1)
                   .on('accept', show));

           $more.exit()
               .remove();

           $input.exit()
               .remove();

           function show(field) {
               field = field.field;
               field.show = true;
               content(selection);
               field.input.focus();
           }

           function revert(field) {
               d3.event.stopPropagation();
               d3.event.preventDefault();
               event.change(field.revert());
           }

           function remove(field) {
               d3.event.stopPropagation();
               d3.event.preventDefault();
               event.change(field.remove());
           }
       }

       presets.preset = function(_) {
           if (!arguments.length) return preset;
           if (preset && preset.id === _.id) return presets;
           preset = _;
           fieldsArr = null;
           return presets;
       };

       presets.state = function(_) {
           if (!arguments.length) return state;
           state = _;
           return presets;
       };

       presets.tags = function(_) {
           if (!arguments.length) return tags;
           tags = _;
           // Don't reset fieldsArr here.
           return presets;
       };

       presets.entityID = function(_) {
           if (!arguments.length) return id;
           if (id === _) return presets;
           id = _;
           fieldsArr = null;
           return presets;
       };

       return d3.rebind(presets, event, 'on');
   }

   function PresetIcon() {
       var preset, geometry;

       function presetIcon(selection) {
           selection.each(render);
       }

       function render() {
           var selection = d3.select(this),
               p = preset.apply(this, arguments),
               geom = geometry.apply(this, arguments),
               icon = p.icon || (geom === 'line' ? 'other-line' : 'marker-stroked'),
               maki = iD.data.featureIcons.hasOwnProperty(icon + '-24');

           if (icon === 'dentist') maki = true;  // workaround for dentist icon missing in `maki-sprite.json`

           function tag_classes(p) {
               var s = '';
               for (var i in p.tags) {
                   s += ' tag-' + i;
                   if (p.tags[i] !== '*') {
                       s += ' tag-' + i + '-' + p.tags[i];
                   }
               }
               return s;
           }

           var $fill = selection.selectAll('.preset-icon-fill')
               .data([0]);

           $fill.enter().append('div');

           $fill.attr('class', function() {
               return 'preset-icon-fill preset-icon-fill-' + geom + tag_classes(p);
           });

           var $frame = selection.selectAll('.preset-icon-frame')
               .data([0]);

           $frame.enter()
               .append('div')
               .call(Icon('#preset-icon-frame'));

           $frame.attr('class', function() {
               return 'preset-icon-frame ' + (geom === 'area' ? '' : 'hide');
           });


           var $icon = selection.selectAll('.preset-icon')
               .data([0]);

           $icon.enter()
               .append('div')
               .attr('class', 'preset-icon')
               .call(Icon(''));

           $icon
               .attr('class', 'preset-icon preset-icon-' + (maki ? '32' : (geom === 'area' ? '44' : '60')));

           $icon.selectAll('svg')
               .attr('class', function() {
                   return 'icon ' + icon + tag_classes(p);
               });

           $icon.selectAll('use')       // workaround: maki parking-24 broken?
               .attr('href', '#' + icon + (maki ? ( icon === 'parking' ? '-18' : '-24') : ''));
       }

       presetIcon.preset = function(_) {
           if (!arguments.length) return preset;
           preset = d3.functor(_);
           return presetIcon;
       };

       presetIcon.geometry = function(_) {
           if (!arguments.length) return geometry;
           geometry = d3.functor(_);
           return presetIcon;
       };

       return presetIcon;
   }

   function RawTagEditor(context) {
       var event = d3.dispatch('change'),
           showBlank = false,
           state,
           preset,
           tags,
           id;

       function rawTagEditor(selection) {
           var count = Object.keys(tags).filter(function(d) { return d; }).length;

           selection.call(Disclosure()
               .title(t('inspector.all_tags') + ' (' + count + ')')
               .expanded(context.storage('raw_tag_editor.expanded') === 'true' || preset.isFallback())
               .on('toggled', toggled)
               .content(content));

           function toggled(expanded) {
               context.storage('raw_tag_editor.expanded', expanded);
               if (expanded) {
                   selection.node().parentNode.scrollTop += 200;
               }
           }
       }

       function content($wrap) {
           var entries = d3.entries(tags);

           if (!entries.length || showBlank) {
               showBlank = false;
               entries.push({key: '', value: ''});
           }

           var $list = $wrap.selectAll('.tag-list')
               .data([0]);

           $list.enter().append('ul')
               .attr('class', 'tag-list');

           var $newTag = $wrap.selectAll('.add-tag')
               .data([0]);

           $newTag.enter()
               .append('button')
               .attr('class', 'add-tag')
               .call(Icon('#icon-plus', 'light'));

           $newTag.on('click', addTag);

           var $items = $list.selectAll('li')
               .data(entries, function(d) { return d.key; });

           // Enter

           var $enter = $items.enter().append('li')
               .attr('class', 'tag-row cf');

           $enter.append('div')
               .attr('class', 'key-wrap')
               .append('input')
               .property('type', 'text')
               .attr('class', 'key')
               .attr('maxlength', 255);

           $enter.append('div')
               .attr('class', 'input-wrap-position')
               .append('input')
               .property('type', 'text')
               .attr('class', 'value')
               .attr('maxlength', 255);

           $enter.append('button')
               .attr('tabindex', -1)
               .attr('class', 'remove minor')
               .call(Icon('#operation-delete'));

           if (context.taginfo()) {
               $enter.each(bindTypeahead);
           }

           // Update

           $items.order();

           $items.each(function(tag) {
               var isRelation = (context.entity(id).type === 'relation'),
                   reference;
               if (isRelation && tag.key === 'type')
                   reference = TagReference({rtype: tag.value}, context);
               else
                   reference = TagReference({key: tag.key, value: tag.value}, context);

               if (state === 'hover') {
                   reference.showing(false);
               }

               d3.select(this)
                   .call(reference.button)
                   .call(reference.body);
           });

           $items.select('input.key')
               .attr('title', function(d) { return d.key; })
               .value(function(d) { return d.key; })
               .on('blur', keyChange)
               .on('change', keyChange);

           $items.select('input.value')
               .attr('title', function(d) { return d.value; })
               .value(function(d) { return d.value; })
               .on('blur', valueChange)
               .on('change', valueChange)
               .on('keydown.push-more', pushMore);

           $items.select('button.remove')
               .on('click', removeTag);

           $items.exit()
               .each(unbind)
               .remove();

           function pushMore() {
               if (d3.event.keyCode === 9 && !d3.event.shiftKey &&
                   $list.selectAll('li:last-child input.value').node() === this) {
                   addTag();
               }
           }

           function bindTypeahead() {
               var row = d3.select(this),
                   key = row.selectAll('input.key'),
                   value = row.selectAll('input.value');

               function sort(value, data) {
                   var sameletter = [],
                       other = [];
                   for (var i = 0; i < data.length; i++) {
                       if (data[i].value.substring(0, value.length) === value) {
                           sameletter.push(data[i]);
                       } else {
                           other.push(data[i]);
                       }
                   }
                   return sameletter.concat(other);
               }

               key.call(d3.combobox()
                   .fetcher(function(value, callback) {
                       context.taginfo().keys({
                           debounce: true,
                           geometry: context.geometry(id),
                           query: value
                       }, function(err, data) {
                           if (!err) callback(sort(value, data));
                       });
                   }));

               value.call(d3.combobox()
                   .fetcher(function(value, callback) {
                       context.taginfo().values({
                           debounce: true,
                           key: key.value(),
                           geometry: context.geometry(id),
                           query: value
                       }, function(err, data) {
                           if (!err) callback(sort(value, data));
                       });
                   }));
           }

           function unbind() {
               var row = d3.select(this);

               row.selectAll('input.key')
                   .call(d3.combobox.off);

               row.selectAll('input.value')
                   .call(d3.combobox.off);
           }

           function keyChange(d) {
               var kOld = d.key,
                   kNew = this.value.trim(),
                   tag = {};

               if (kNew && kNew !== kOld) {
                   var match = kNew.match(/^(.*?)(?:_(\d+))?$/),
                       base = match[1],
                       suffix = +(match[2] || 1);
                   while (tags[kNew]) {  // rename key if already in use
                       kNew = base + '_' + suffix++;
                   }
               }
               tag[kOld] = undefined;
               tag[kNew] = d.value;
               d.key = kNew; // Maintain DOM identity through the subsequent update.
               this.value = kNew;
               event.change(tag);
           }

           function valueChange(d) {
               var tag = {};
               tag[d.key] = this.value;
               event.change(tag);
           }

           function removeTag(d) {
               var tag = {};
               tag[d.key] = undefined;
               event.change(tag);
               d3.select(this.parentNode).remove();
           }

           function addTag() {
               // Wrapped in a setTimeout in case it's being called from a blur
               // handler. Without the setTimeout, the call to `content` would
               // wipe out the pending value change.
               setTimeout(function() {
                   showBlank = true;
                   content($wrap);
                   $list.selectAll('li:last-child input.key').node().focus();
               }, 0);
           }
       }

       rawTagEditor.state = function(_) {
           if (!arguments.length) return state;
           state = _;
           return rawTagEditor;
       };

       rawTagEditor.preset = function(_) {
           if (!arguments.length) return preset;
           preset = _;
           return rawTagEditor;
       };

       rawTagEditor.tags = function(_) {
           if (!arguments.length) return tags;
           tags = _;
           return rawTagEditor;
       };

       rawTagEditor.entityID = function(_) {
           if (!arguments.length) return id;
           id = _;
           return rawTagEditor;
       };

       return d3.rebind(rawTagEditor, event, 'on');
   }

   function RawMemberEditor(context) {
       var id;

       function selectMember(d) {
           d3.event.preventDefault();
           context.enter(Select(context, [d.id]));
       }

       function changeRole(d) {
           var role = d3.select(this).property('value');
           var member = {id: d.id, type: d.type, role: role};
           context.perform(
               ChangeMember(d.relation.id, member, d.index),
               t('operations.change_role.annotation'));
       }

       function deleteMember(d) {
           context.perform(
               DeleteMember(d.relation.id, d.index),
               t('operations.delete_member.annotation'));

           if (!context.hasEntity(d.relation.id)) {
               context.enter(Browse(context));
           }
       }

       function rawMemberEditor(selection) {
           var entity = context.entity(id),
               memberships = [];

           entity.members.forEach(function(member, index) {
               memberships.push({
                   index: index,
                   id: member.id,
                   type: member.type,
                   role: member.role,
                   relation: entity,
                   member: context.hasEntity(member.id)
               });
           });

           selection.call(Disclosure()
               .title(t('inspector.all_members') + ' (' + memberships.length + ')')
               .expanded(true)
               .on('toggled', toggled)
               .content(content));

           function toggled(expanded) {
               if (expanded) {
                   selection.node().parentNode.scrollTop += 200;
               }
           }

           function content($wrap) {
               var $list = $wrap.selectAll('.member-list')
                   .data([0]);

               $list.enter().append('ul')
                   .attr('class', 'member-list');

               var $items = $list.selectAll('li')
                   .data(memberships, function(d) {
                       return Entity.key(d.relation) + ',' + d.index + ',' +
                           (d.member ? Entity.key(d.member) : 'incomplete');
                   });

               var $enter = $items.enter().append('li')
                   .attr('class', 'member-row form-field')
                   .classed('member-incomplete', function(d) { return !d.member; });

               $enter.each(function(d) {
                   if (d.member) {
                       var $label = d3.select(this).append('label')
                           .attr('class', 'form-label')
                           .append('a')
                           .attr('href', '#')
                           .on('click', selectMember);

                       $label.append('span')
                           .attr('class', 'member-entity-type')
                           .text(function(d) { return context.presets().match(d.member, context.graph()).name(); });

                       $label.append('span')
                           .attr('class', 'member-entity-name')
                           .text(function(d) { return displayName(d.member); });

                   } else {
                       d3.select(this).append('label')
                           .attr('class', 'form-label')
                           .text(t('inspector.incomplete'));
                   }
               });

               $enter.append('input')
                   .attr('class', 'member-role')
                   .property('type', 'text')
                   .attr('maxlength', 255)
                   .attr('placeholder', t('inspector.role'))
                   .property('value', function(d) { return d.role; })
                   .on('change', changeRole);

               $enter.append('button')
                   .attr('tabindex', -1)
                   .attr('class', 'remove button-input-action member-delete minor')
                   .on('click', deleteMember)
                   .call(Icon('#operation-delete'));

               $items.exit()
                   .remove();
           }
       }

       rawMemberEditor.entityID = function(_) {
           if (!arguments.length) return id;
           id = _;
           return rawMemberEditor;
       };

       return rawMemberEditor;
   }

   function RawMembershipEditor(context) {
       var id, showBlank;

       function selectRelation(d) {
           d3.event.preventDefault();
           context.enter(Select(context, [d.relation.id]));
       }

       function changeRole(d) {
           var role = d3.select(this).property('value');
           context.perform(
               ChangeMember(d.relation.id, _.extend({}, d.member, {role: role}), d.index),
               t('operations.change_role.annotation'));
       }

       function addMembership(d, role) {
           showBlank = false;

           if (d.relation) {
               context.perform(
                   AddMember(d.relation.id, {id: id, type: context.entity(id).type, role: role}),
                   t('operations.add_member.annotation'));

           } else {
               var relation = Relation();

               context.perform(
                   AddEntity(relation),
                   AddMember(relation.id, {id: id, type: context.entity(id).type, role: role}),
                   t('operations.add.annotation.relation'));

               context.enter(Select(context, [relation.id]));
           }
       }

       function deleteMembership(d) {
           context.perform(
               DeleteMember(d.relation.id, d.index),
               t('operations.delete_member.annotation'));
       }

       function relations(q) {
           var newRelation = {
                   relation: null,
                   value: t('inspector.new_relation')
               },
               result = [],
               graph = context.graph();

           context.intersects(context.extent()).forEach(function(entity) {
               if (entity.type !== 'relation' || entity.id === id)
                   return;

               var presetName = context.presets().match(entity, graph).name(),
                   entityName = displayName(entity) || '';

               var value = presetName + ' ' + entityName;
               if (q && value.toLowerCase().indexOf(q.toLowerCase()) === -1)
                   return;

               result.push({
                   relation: entity,
                   value: value
               });
           });

           result.sort(function(a, b) {
               return Relation.creationOrder(a.relation, b.relation);
           });

           // Dedupe identical names by appending relation id - see #2891
           var dupeGroups = _(result)
               .groupBy('value')
               .filter(function(v) { return v.length > 1; })
               .value();

           dupeGroups.forEach(function(group) {
               group.forEach(function(obj) {
                   obj.value += ' ' + obj.relation.id;
               });
           });

           result.unshift(newRelation);

           return result;
       }

       function rawMembershipEditor(selection) {
           var entity = context.entity(id),
               memberships = [];

           context.graph().parentRelations(entity).forEach(function(relation) {
               relation.members.forEach(function(member, index) {
                   if (member.id === entity.id) {
                       memberships.push({relation: relation, member: member, index: index});
                   }
               });
           });

           selection.call(Disclosure()
               .title(t('inspector.all_relations') + ' (' + memberships.length + ')')
               .expanded(true)
               .on('toggled', toggled)
               .content(content));

           function toggled(expanded) {
               if (expanded) {
                   selection.node().parentNode.scrollTop += 200;
               }
           }

           function content($wrap) {
               var $list = $wrap.selectAll('.member-list')
                   .data([0]);

               $list.enter().append('ul')
                   .attr('class', 'member-list');

               var $items = $list.selectAll('li.member-row-normal')
                   .data(memberships, function(d) { return Entity.key(d.relation) + ',' + d.index; });

               var $enter = $items.enter().append('li')
                   .attr('class', 'member-row member-row-normal form-field');

               var $label = $enter.append('label')
                   .attr('class', 'form-label')
                   .append('a')
                   .attr('href', '#')
                   .on('click', selectRelation);

               $label.append('span')
                   .attr('class', 'member-entity-type')
                   .text(function(d) { return context.presets().match(d.relation, context.graph()).name(); });

               $label.append('span')
                   .attr('class', 'member-entity-name')
                   .text(function(d) { return displayName(d.relation); });

               $enter.append('input')
                   .attr('class', 'member-role')
                   .property('type', 'text')
                   .attr('maxlength', 255)
                   .attr('placeholder', t('inspector.role'))
                   .property('value', function(d) { return d.member.role; })
                   .on('change', changeRole);

               $enter.append('button')
                   .attr('tabindex', -1)
                   .attr('class', 'remove button-input-action member-delete minor')
                   .on('click', deleteMembership)
                   .call(Icon('#operation-delete'));

               $items.exit()
                   .remove();

               if (showBlank) {
                   var $new = $list.selectAll('.member-row-new')
                       .data([0]);

                   $enter = $new.enter().append('li')
                       .attr('class', 'member-row member-row-new form-field');

                   $enter.append('input')
                       .attr('type', 'text')
                       .attr('class', 'member-entity-input')
                       .call(d3.combobox()
                           .minItems(1)
                           .fetcher(function(value, callback) {
                               callback(relations(value));
                           })
                           .on('accept', function(d) {
                               addMembership(d, $new.select('.member-role').property('value'));
                           }));

                   $enter.append('input')
                       .attr('class', 'member-role')
                       .property('type', 'text')
                       .attr('maxlength', 255)
                       .attr('placeholder', t('inspector.role'))
                       .on('change', changeRole);

                   $enter.append('button')
                       .attr('tabindex', -1)
                       .attr('class', 'remove button-input-action member-delete minor')
                       .on('click', deleteMembership)
                       .call(Icon('#operation-delete'));

               } else {
                   $list.selectAll('.member-row-new')
                       .remove();
               }

               var $add = $wrap.selectAll('.add-relation')
                   .data([0]);

               $add.enter()
                   .append('button')
                   .attr('class', 'add-relation')
                   .call(Icon('#icon-plus', 'light'));

               $wrap.selectAll('.add-relation')
                   .on('click', function() {
                       showBlank = true;
                       content($wrap);
                       $list.selectAll('.member-entity-input').node().focus();
                   });
           }
       }

       rawMembershipEditor.entityID = function(_) {
           if (!arguments.length) return id;
           id = _;
           return rawMembershipEditor;
       };

       return rawMembershipEditor;
   }

   function EntityEditor(context) {
       var dispatch = d3.dispatch('choose'),
           state = 'select',
           coalesceChanges = false,
           modified = false,
           base,
           id,
           activePreset,
           reference;

       var presetEditor = preset(context)
           .on('change', changeTags);
       var rawTagEditor = RawTagEditor(context)
           .on('change', changeTags);

       function entityEditor(selection) {
           var entity = context.entity(id),
               tags = _.clone(entity.tags);

           var $header = selection.selectAll('.header')
               .data([0]);

           // Enter
           var $enter = $header.enter().append('div')
               .attr('class', 'header fillL cf');

           $enter.append('button')
               .attr('class', 'fl preset-reset preset-choose')
               .append('span')
               .html('&#9668;');

           $enter.append('button')
               .attr('class', 'fr preset-close')
               .call(Icon(modified ? '#icon-apply' : '#icon-close'));

           $enter.append('h3');

           // Update
           $header.select('h3')
               .text(t('inspector.edit'));

           $header.select('.preset-close')
               .on('click', function() {
                   context.enter(Browse(context));
               });

           var $body = selection.selectAll('.inspector-body')
               .data([0]);

           // Enter
           $enter = $body.enter().append('div')
               .attr('class', 'inspector-body');

           $enter.append('div')
               .attr('class', 'preset-list-item inspector-inner')
               .append('div')
               .attr('class', 'preset-list-button-wrap')
               .append('button')
               .attr('class', 'preset-list-button preset-reset')
               .call(bootstrap.tooltip()
                   .title(t('inspector.back_tooltip'))
                   .placement('bottom'))
               .append('div')
               .attr('class', 'label');

           $body.select('.preset-list-button-wrap')
               .call(reference.button);

           $body.select('.preset-list-item')
               .call(reference.body);

           $enter.append('div')
               .attr('class', 'inspector-border inspector-preset');

           $enter.append('div')
               .attr('class', 'inspector-border raw-tag-editor inspector-inner');

           $enter.append('div')
               .attr('class', 'inspector-border raw-member-editor inspector-inner');

           $enter.append('div')
               .attr('class', 'raw-membership-editor inspector-inner');

           selection.selectAll('.preset-reset')
               .on('click', function() {
                   dispatch.choose(activePreset);
               });

           // Update
           $body.select('.preset-list-item button')
               .call(PresetIcon()
                   .geometry(context.geometry(id))
                   .preset(activePreset));

           $body.select('.preset-list-item .label')
               .text(activePreset.name());

           $body.select('.inspector-preset')
               .call(presetEditor
                   .preset(activePreset)
                   .entityID(id)
                   .tags(tags)
                   .state(state));

           $body.select('.raw-tag-editor')
               .call(rawTagEditor
                   .preset(activePreset)
                   .entityID(id)
                   .tags(tags)
                   .state(state));

           if (entity.type === 'relation') {
               $body.select('.raw-member-editor')
                   .style('display', 'block')
                   .call(RawMemberEditor(context)
                       .entityID(id));
           } else {
               $body.select('.raw-member-editor')
                   .style('display', 'none');
           }

           $body.select('.raw-membership-editor')
               .call(RawMembershipEditor(context)
                   .entityID(id));

           function historyChanged() {
               if (state === 'hide') return;

               var entity = context.hasEntity(id),
                   graph = context.graph();
               if (!entity) return;

               entityEditor.preset(context.presets().match(entity, graph));
               entityEditor.modified(base !== graph);
               entityEditor(selection);
           }

           context.history()
               .on('change.entity-editor', historyChanged);
       }

       function clean(o) {

           function cleanVal(k, v) {
               function keepSpaces(k) {
                   var whitelist = ['opening_hours', 'service_times', 'collection_times',
                       'operating_times', 'smoking_hours', 'happy_hours'];
                   return _.some(whitelist, function(s) { return k.indexOf(s) !== -1; });
               }

               var blacklist = ['description', 'note', 'fixme'];
               if (_.some(blacklist, function(s) { return k.indexOf(s) !== -1; })) return v;

               var cleaned = v.split(';')
                   .map(function(s) { return s.trim(); })
                   .join(keepSpaces(k) ? '; ' : ';');

               // The code below is not intended to validate websites and emails.
               // It is only intended to prevent obvious copy-paste errors. (#2323)

               // clean website- and email-like tags
               if (k.indexOf('website') !== -1 ||
                   k.indexOf('email') !== -1 ||
                   cleaned.indexOf('http') === 0) {
                   cleaned = cleaned
                       .replace(/[\u200B-\u200F\uFEFF]/g, '');  // strip LRM and other zero width chars

               }

               return cleaned;
           }

           var out = {}, k, v;
           for (k in o) {
               if (k && (v = o[k]) !== undefined) {
                   out[k] = cleanVal(k, v);
               }
           }
           return out;
       }

       // Tag changes that fire on input can all get coalesced into a single
       // history operation when the user leaves the field.  #2342
       function changeTags(changed, onInput) {
           var entity = context.entity(id),
               annotation = t('operations.change_tags.annotation'),
               tags = _.extend({}, entity.tags, changed);

           if (!onInput) {
               tags = clean(tags);
           }
           if (!_.isEqual(entity.tags, tags)) {
               if (coalesceChanges) {
                   context.overwrite(ChangeTags(id, tags), annotation);
               } else {
                   context.perform(ChangeTags(id, tags), annotation);
                   coalesceChanges = !!onInput;
               }
           }
       }

       entityEditor.modified = function(_) {
           if (!arguments.length) return modified;
           modified = _;
           d3.selectAll('button.preset-close use')
               .attr('xlink:href', (modified ? '#icon-apply' : '#icon-close'));
       };

       entityEditor.state = function(_) {
           if (!arguments.length) return state;
           state = _;
           return entityEditor;
       };

       entityEditor.entityID = function(_) {
           if (!arguments.length) return id;
           id = _;
           base = context.graph();
           entityEditor.preset(context.presets().match(context.entity(id), base));
           entityEditor.modified(false);
           coalesceChanges = false;
           return entityEditor;
       };

       entityEditor.preset = function(_) {
           if (!arguments.length) return activePreset;
           if (_ !== activePreset) {
               activePreset = _;
               reference = TagReference(activePreset.reference(context.geometry(id)), context)
                   .showing(false);
           }
           return entityEditor;
       };

       return d3.rebind(entityEditor, dispatch, 'on');
   }

   function FeatureInfo(context) {
       function update(selection) {
           var features = context.features(),
               stats = features.stats(),
               count = 0,
               hiddenList = _.compact(_.map(features.hidden(), function(k) {
                   if (stats[k]) {
                       count += stats[k];
                       return String(stats[k]) + ' ' + t('feature.' + k + '.description');
                   }
               }));

           selection.html('');

           if (hiddenList.length) {
               var tooltip = bootstrap.tooltip()
                       .placement('top')
                       .html(true)
                       .title(function() {
                           return tooltipHtml(hiddenList.join('<br/>'));
                       });

               var warning = selection.append('a')
                   .attr('href', '#')
                   .attr('tabindex', -1)
                   .html(t('feature_info.hidden_warning', { count: count }))
                   .call(tooltip)
                   .on('click', function() {
                       tooltip.hide(warning);
                       // open map data panel?
                       d3.event.preventDefault();
                   });
           }

           selection
               .classed('hide', !hiddenList.length);
       }

       return function(selection) {
           update(selection);

           context.features().on('change.feature_info', function() {
               update(selection);
           });
       };
   }

   var index$8 = createCommonjsModule(function (module) {
   module.exports = element;
   module.exports.pair = pair;
   module.exports.format = format;
   module.exports.formatPair = formatPair;
   module.exports.coordToDMS = coordToDMS;

   function element(x, dims) {
     return search(x, dims).val;
   }

   function formatPair(x) {
     return format(x.lat, 'lat') + ' ' + format(x.lon, 'lon');
   }

   // Is 0 North or South?
   function format(x, dim) {
     var dms = coordToDMS(x,dim);
     return dms.whole + '° ' +
       (dms.minutes ? dms.minutes + '\' ' : '') +
       (dms.seconds ? dms.seconds + '" ' : '') + dms.dir;
   }

   function coordToDMS(x,dim) {
     var dirs = {
       lat: ['N', 'S'],
       lon: ['E', 'W']
     }[dim] || '',
     dir = dirs[x >= 0 ? 0 : 1],
       abs = Math.abs(x),
       whole = Math.floor(abs),
       fraction = abs - whole,
       fractionMinutes = fraction * 60,
       minutes = Math.floor(fractionMinutes),
       seconds = Math.floor((fractionMinutes - minutes) * 60);

     return {
       whole: whole,
       minutes: minutes,
       seconds: seconds,
       dir: dir
     };
   }

   function search(x, dims, r) {
     if (!dims) dims = 'NSEW';
     if (typeof x !== 'string') return { val: null, regex: r };
     r = r || /[\s\,]*([\-|\—|\―]?[0-9.]+)°? *(?:([0-9.]+)['’′‘] *)?(?:([0-9.]+)(?:''|"|”|″) *)?([NSEW])?/gi;
     var m = r.exec(x);
     if (!m) return { val: null, regex: r };
     else if (m[4] && dims.indexOf(m[4]) === -1) return { val: null, regex: r };
     else return {
       val: (((m[1]) ? parseFloat(m[1]) : 0) +
             ((m[2] ? parseFloat(m[2]) / 60 : 0)) +
             ((m[3] ? parseFloat(m[3]) / 3600 : 0))) *
             ((m[4] && m[4] === 'S' || m[4] === 'W') ? -1 : 1),
       regex: r,
       raw: m[0],
       dim: m[4]
     };
   }

   function pair(x, dims) {
     x = x.trim();
     var one = search(x, dims);
     if (one.val === null) return null;
     var two = search(x, dims, one.regex);
     if (two.val === null) return null;
     // null if one/two are not contiguous.
     if (one.raw + two.raw !== x) return null;
     if (one.dim) {
       return swapdim(one.val, two.val, one.dim);
     } else {
       return [one.val, two.val];
     }
   }

   function swapdim(a, b, dim) {
     if (dim === 'N' || dim === 'S') return [a, b];
     if (dim === 'W' || dim === 'E') return [b, a];
   }
   });

   var pair = index$8.pair;

   function FeatureList(context) {
       var geocodeResults;

       function featureList(selection) {
           var header = selection.append('div')
               .attr('class', 'header fillL cf');

           header.append('h3')
               .text(t('inspector.feature_list'));

           function keypress() {
               var q = search.property('value'),
                   items = list.selectAll('.feature-list-item');
               if (d3.event.keyCode === 13 && q.length && items.size()) {
                   click(items.datum());
               }
           }

           function inputevent() {
               geocodeResults = undefined;
               drawList();
           }

           var searchWrap = selection.append('div')
               .attr('class', 'search-header');

           var search = searchWrap.append('input')
               .attr('placeholder', t('inspector.search'))
               .attr('type', 'search')
               .on('keypress', keypress)
               .on('input', inputevent);

           searchWrap
               .call(Icon('#icon-search', 'pre-text'));

           var listWrap = selection.append('div')
               .attr('class', 'inspector-body');

           var list = listWrap.append('div')
               .attr('class', 'feature-list cf');

           context
               .on('exit.feature-list', clearSearch);
           context.map()
               .on('drawn.feature-list', mapDrawn);

           function clearSearch() {
               search.property('value', '');
               drawList();
           }

           function mapDrawn(e) {
               if (e.full) {
                   drawList();
               }
           }

           function features() {
               var entities = {},
                   result = [],
                   graph = context.graph(),
                   q = search.property('value').toLowerCase();

               if (!q) return result;

               var idMatch = q.match(/^([nwr])([0-9]+)$/);

               if (idMatch) {
                   result.push({
                       id: idMatch[0],
                       geometry: idMatch[1] === 'n' ? 'point' : idMatch[1] === 'w' ? 'line' : 'relation',
                       type: idMatch[1] === 'n' ? t('inspector.node') : idMatch[1] === 'w' ? t('inspector.way') : t('inspector.relation'),
                       name: idMatch[2]
                   });
               }

               var locationMatch = pair(q.toUpperCase()) || q.match(/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/);

               if (locationMatch) {
                   var loc = [parseFloat(locationMatch[0]), parseFloat(locationMatch[1])];
                   result.push({
                       id: -1,
                       geometry: 'point',
                       type: t('inspector.location'),
                       name: loc[0].toFixed(6) + ', ' + loc[1].toFixed(6),
                       location: loc
                   });
               }

               function addEntity(entity) {
                   if (entity.id in entities || result.length > 200)
                       return;

                   entities[entity.id] = true;

                   var name = displayName(entity) || '';
                   if (name.toLowerCase().indexOf(q) >= 0) {
                       result.push({
                           id: entity.id,
                           entity: entity,
                           geometry: context.geometry(entity.id),
                           type: context.presets().match(entity, graph).name(),
                           name: name
                       });
                   }

                   graph.parentRelations(entity).forEach(function(parent) {
                       addEntity(parent);
                   });
               }

               var visible = context.surface().selectAll('.point, .line, .area')[0];
               for (var i = 0; i < visible.length && result.length <= 200; i++) {
                   addEntity(visible[i].__data__);
               }

               (geocodeResults || []).forEach(function(d) {
                   // https://github.com/openstreetmap/iD/issues/1890
                   if (d.osm_type && d.osm_id) {
                       result.push({
                           id: Entity.id.fromOSM(d.osm_type, d.osm_id),
                           geometry: d.osm_type === 'relation' ? 'relation' : d.osm_type === 'way' ? 'line' : 'point',
                           type: d.type !== 'yes' ? (d.type.charAt(0).toUpperCase() + d.type.slice(1)).replace('_', ' ')
                                                  : (d.class.charAt(0).toUpperCase() + d.class.slice(1)).replace('_', ' '),
                           name: d.display_name,
                           extent: new Extent(
                               [parseFloat(d.boundingbox[3]), parseFloat(d.boundingbox[0])],
                               [parseFloat(d.boundingbox[2]), parseFloat(d.boundingbox[1])])
                       });
                   }
               });

               return result;
           }

           function drawList() {
               var value = search.property('value'),
                   results = features();

               list.classed('filtered', value.length);

               var noResultsWorldwide = geocodeResults && geocodeResults.length === 0;

               var resultsIndicator = list.selectAll('.no-results-item')
                   .data([0])
                   .enter().append('button')
                   .property('disabled', true)
                   .attr('class', 'no-results-item')
                   .call(Icon('#icon-alert', 'pre-text'));

               resultsIndicator.append('span')
                   .attr('class', 'entity-name');

               list.selectAll('.no-results-item .entity-name')
                   .text(noResultsWorldwide ? t('geocoder.no_results_worldwide') : t('geocoder.no_results_visible'));

               list.selectAll('.geocode-item')
                   .data([0])
                   .enter().append('button')
                   .attr('class', 'geocode-item')
                   .on('click', geocode)
                   .append('div')
                   .attr('class', 'label')
                   .append('span')
                   .attr('class', 'entity-name')
                   .text(t('geocoder.search'));

               list.selectAll('.no-results-item')
                   .style('display', (value.length && !results.length) ? 'block' : 'none');

               list.selectAll('.geocode-item')
                   .style('display', (value && geocodeResults === undefined) ? 'block' : 'none');

               list.selectAll('.feature-list-item')
                   .data([-1])
                   .remove();

               var items = list.selectAll('.feature-list-item')
                   .data(results, function(d) { return d.id; });

               var enter = items.enter()
                   .insert('button', '.geocode-item')
                   .attr('class', 'feature-list-item')
                   .on('mouseover', mouseover)
                   .on('mouseout', mouseout)
                   .on('click', click);

               var label = enter
                   .append('div')
                   .attr('class', 'label');

               label.each(function(d) {
                   d3.select(this)
                       .call(Icon('#icon-' + d.geometry, 'pre-text'));
               });

               label.append('span')
                   .attr('class', 'entity-type')
                   .text(function(d) { return d.type; });

               label.append('span')
                   .attr('class', 'entity-name')
                   .text(function(d) { return d.name; });

               enter.style('opacity', 0)
                   .transition()
                   .style('opacity', 1);

               items.order();

               items.exit()
                   .remove();
           }

           function mouseover(d) {
               if (d.id === -1) return;

               context.surface().selectAll(entityOrMemberSelector([d.id], context.graph()))
                   .classed('hover', true);
           }

           function mouseout() {
               context.surface().selectAll('.hover')
                   .classed('hover', false);
           }

           function click(d) {
               d3.event.preventDefault();
               if (d.location) {
                   context.map().centerZoom([d.location[1], d.location[0]], 20);
               }
               else if (d.entity) {
                   if (d.entity.type === 'node') {
                       context.map().center(d.entity.loc);
                   } else if (d.entity.type === 'way') {
                       var center = context.projection(context.map().center()),
                           edge = chooseEdge(context.childNodes(d.entity), center, context.projection);
                       context.map().center(edge.loc);
                   }
                   context.enter(Select(context, [d.entity.id]).suppressMenu(true));
               } else {
                   context.zoomToEntity(d.id);
               }
           }

           function geocode() {
               var searchVal = encodeURIComponent(search.property('value'));
               d3.json('https://nominatim.openstreetmap.org/search/' + searchVal + '?limit=10&format=json', function(err, resp) {
                   geocodeResults = resp || [];
                   drawList();
               });
           }
       }

       return featureList;
   }

   function flash(selection) {
       var modalSelection = modal(selection);

       modalSelection.select('.modal').classed('modal-flash', true);

       modalSelection.select('.content')
           .classed('modal-section', true)
           .append('div')
           .attr('class', 'description');

       modalSelection.on('click.flash', function() { modalSelection.remove(); });

       setTimeout(function() {
           modalSelection.remove();
           return true;
       }, 1500);

       return modalSelection;
   }

   function FullScreen(context) {
       var element = context.container().node(),
           keybinding = d3.keybinding('full-screen');
           // button;

       function getFullScreenFn() {
           if (element.requestFullscreen) {
               return element.requestFullscreen;
           } else if (element.msRequestFullscreen) {
               return  element.msRequestFullscreen;
           } else if (element.mozRequestFullScreen) {
               return  element.mozRequestFullScreen;
           } else if (element.webkitRequestFullscreen) {
               return element.webkitRequestFullscreen;
           }
       }

       function getExitFullScreenFn() {
           if (document.exitFullscreen) {
               return document.exitFullscreen;
           } else if (document.msExitFullscreen) {
               return  document.msExitFullscreen;
           } else if (document.mozCancelFullScreen) {
               return  document.mozCancelFullScreen;
           } else if (document.webkitExitFullscreen) {
               return document.webkitExitFullscreen;
           }
       }

       function isFullScreen() {
           return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement ||
               document.msFullscreenElement;
       }

       function isSupported() {
           return !!getFullScreenFn();
       }

       function fullScreen() {
           d3.event.preventDefault();
           if (!isFullScreen()) {
               // button.classed('active', true);
               getFullScreenFn().apply(element);
           } else {
               // button.classed('active', false);
               getExitFullScreenFn().apply(document);
           }
       }

       return function() { // selection) {
           if (!isSupported())
               return;

           // var tooltip = bootstrap.tooltip()
           //     .placement('left');

           // button = selection.append('button')
           //     .attr('title', t('full_screen'))
           //     .attr('tabindex', -1)
           //     .on('click', fullScreen)
           //     .call(tooltip);

           // button.append('span')
           //     .attr('class', 'icon full-screen');

           keybinding
               .on('f11', fullScreen)
               .on(cmd('⌘⇧F'), fullScreen);

           d3.select(document)
               .call(keybinding);
       };
   }

   function Loading(context) {
       var message = '',
           blocking = false,
           modalSelection;

       var loading = function(selection) {
           modalSelection = modal(selection, blocking);

           var loadertext = modalSelection.select('.content')
               .classed('loading-modal', true)
               .append('div')
               .attr('class', 'modal-section fillL');

           loadertext.append('img')
               .attr('class', 'loader')
               .attr('src', context.imagePath('loader-white.gif'));

           loadertext.append('h3')
               .text(message);

           modalSelection.select('button.close')
               .attr('class', 'hide');

           return loading;
       };

       loading.message = function(_) {
           if (!arguments.length) return message;
           message = _;
           return loading;
       };

       loading.blocking = function(_) {
           if (!arguments.length) return blocking;
           blocking = _;
           return loading;
       };

       loading.close = function() {
           modalSelection.remove();
       };

       return loading;
   }

   function Geolocate(context) {
       var geoOptions = { enableHighAccuracy: false, timeout: 6000 /* 6sec */ },
           locating = Loading(context).message(t('geolocate.locating')).blocking(true),
           timeoutId;

       function click() {
           context.enter(Browse(context));
           context.container().call(locating);
           navigator.geolocation.getCurrentPosition(success, error, geoOptions);

           // This timeout ensures that we still call finish() even if
           // the user declines to share their location in Firefox
           timeoutId = setTimeout(finish, 10000 /* 10sec */ );
       }

       function success(position) {
           var map = context.map(),
               extent = Extent([position.coords.longitude, position.coords.latitude])
                   .padByMeters(position.coords.accuracy);

           map.centerZoom(extent.center(), Math.min(20, map.extentZoom(extent)));
           finish();
       }

       function error() {
           finish();
       }

       function finish() {
           locating.close();  // unblock ui
           if (timeoutId) { clearTimeout(timeoutId); }
           timeoutId = undefined;
       }

       return function(selection) {
           if (!navigator.geolocation) return;

           selection.append('button')
               .attr('tabindex', -1)
               .attr('title', t('geolocate.title'))
               .on('click', click)
               .call(Icon('#icon-geolocate', 'light'))
               .call(bootstrap.tooltip()
                   .placement('left'));
       };
   }

   function pointBox (point, context) {
       var rect = context.surfaceRect();
       point = context.projection(point);
       return {
           left: point[0] + rect.left - 30,
           top: point[1] + rect.top - 50,
           width: 60,
           height: 70
        };
   }

   function pad (box, padding, context) {
       if (box instanceof Array) {
           var rect = context.surfaceRect();
           box = context.projection(box);
           box = {
               left: box[0] + rect.left,
               top: box[1] + rect.top
           };
       }
       return {
           left: box.left - padding,
           top: box.top - padding,
           width: (box.width || 0) + 2 * padding,
           height: (box.width || 0) + 2 * padding
       };
   }

   function icon(name, svgklass) {
       return '<svg class="icon ' + (svgklass || '') + '">' +
            '<use xlink:href="' + name + '"></use></svg>';
    }

   function area(context, reveal) {
       var event = d3.dispatch('done'),
           timeout;

       var step = {
           title: 'intro.areas.title'
       };

       step.enter = function() {
           var playground = [-85.63552, 41.94159],
               corner = [-85.63565411045074, 41.9417715536927];
           context.map().centerZoom(playground, 19);
           reveal('button.add-area',
               t('intro.areas.add', { button: icon('#icon-area', 'pre-text') }),
               { tooltipClass: 'intro-areas-add' });

           context.on('enter.intro', addArea);

           function addArea(mode) {
               if (mode.id !== 'add-area') return;
               context.on('enter.intro', drawArea);

               var padding = 120 * Math.pow(2, context.map().zoom() - 19);
               var pointBox = pad(corner, padding, context);
               reveal(pointBox, t('intro.areas.corner'));

               context.map().on('move.intro', function() {
                   padding = 120 * Math.pow(2, context.map().zoom() - 19);
                   pointBox = pad(corner, padding, context);
                   reveal(pointBox, t('intro.areas.corner'), {duration: 0});
               });
           }

           function drawArea(mode) {
               if (mode.id !== 'draw-area') return;
               context.on('enter.intro', enterSelect);

               var padding = 150 * Math.pow(2, context.map().zoom() - 19);
               var pointBox = pad(playground, padding, context);
               reveal(pointBox, t('intro.areas.place'));

               context.map().on('move.intro', function() {
                   padding = 150 * Math.pow(2, context.map().zoom() - 19);
                   pointBox = pad(playground, padding, context);
                   reveal(pointBox, t('intro.areas.place'), {duration: 0});
               });
           }

           function enterSelect(mode) {
               if (mode.id !== 'select') return;
               context.map().on('move.intro', null);
               context.on('enter.intro', null);

               timeout = setTimeout(function() {
                   reveal('.preset-search-input',
                       t('intro.areas.search',
                       { name: context.presets().item('leisure/playground').name() }));
                   d3.select('.preset-search-input').on('keyup.intro', keySearch);
               }, 500);
           }

           function keySearch() {
               var first = d3.select('.preset-list-item:first-child');
               if (first.classed('preset-leisure-playground')) {
                   reveal(first.select('.preset-list-button').node(), t('intro.areas.choose'));
                   d3.selection.prototype.one.call(context.history(), 'change.intro', selectedPreset);
                   d3.select('.preset-search-input').on('keyup.intro', null);
               }
           }

           function selectedPreset() {
               reveal('.pane',
                   t('intro.areas.describe', { button: icon('#icon-apply', 'pre-text') }));
               context.on('exit.intro', event.done);
           }
       };

       step.exit = function() {
           window.clearTimeout(timeout);
           context.on('enter.intro', null);
           context.on('exit.intro', null);
           context.history().on('change.intro', null);
           context.map().on('move.intro', null);
           d3.select('.preset-search-input').on('keyup.intro', null);
       };

       return d3.rebind(step, event, 'on');
   }

   function line(context, reveal) {
       var event = d3.dispatch('done'),
           timeouts = [];

       var step = {
           title: 'intro.lines.title'
       };

       function timeout(f, t) {
           timeouts.push(window.setTimeout(f, t));
       }

       function eventCancel() {
           d3.event.stopPropagation();
           d3.event.preventDefault();
       }

       step.enter = function() {
           var centroid = [-85.62830, 41.95699];
           var midpoint = [-85.62975395449628, 41.95787501510204];
           var start = [-85.6297754121684, 41.95805253325314];
           var intersection = [-85.62974496187628, 41.95742515554585];

           context.map().centerZoom(start, 18);
           reveal('button.add-line',
               t('intro.lines.add', { button: icon('#icon-line', 'pre-text') }),
               { tooltipClass: 'intro-lines-add' });

           context.on('enter.intro', addLine);

           function addLine(mode) {
               if (mode.id !== 'add-line') return;
               context.on('enter.intro', drawLine);

               var padding = 150 * Math.pow(2, context.map().zoom() - 18);
               var pointBox = pad(start, padding, context);
               reveal(pointBox, t('intro.lines.start'));

               context.map().on('move.intro', function() {
                   padding = 150 * Math.pow(2, context.map().zoom() - 18);
                   pointBox = pad(start, padding, context);
                   reveal(pointBox, t('intro.lines.start'), {duration: 0});
               });
           }

           function drawLine(mode) {
               if (mode.id !== 'draw-line') return;
               context.history().on('change.intro', addIntersection);
               context.on('enter.intro', retry);

               var padding = 300 * Math.pow(2, context.map().zoom() - 19);
               var pointBox = pad(midpoint, padding, context);
               reveal(pointBox, t('intro.lines.intersect', {name: t('intro.graph.flower_st')}));

               context.map().on('move.intro', function() {
                   padding = 300 * Math.pow(2, context.map().zoom() - 19);
                   pointBox = pad(midpoint, padding, context);
                   reveal(pointBox, t('intro.lines.intersect', {name: t('intro.graph.flower_st')}), {duration: 0});
               });
           }

           // ended line before creating intersection
           function retry(mode) {
               if (mode.id !== 'select') return;
               var pointBox = pad(intersection, 30, context),
                   ids = mode.selectedIDs();
               reveal(pointBox, t('intro.lines.restart', {name: t('intro.graph.flower_st')}));
               d3.select(window).on('mousedown.intro', eventCancel, true);

               timeout(function() {
                   context.replace(DeleteMultiple(ids));
                   step.exit();
                   step.enter();
               }, 3000);
           }

           function addIntersection(changes) {
               if ( _.some(changes.created(), function(d) {
                   return d.type === 'node' && context.graph().parentWays(d).length > 1;
               })) {
                   context.history().on('change.intro', null);
                   context.on('enter.intro', enterSelect);

                   var padding = 900 * Math.pow(2, context.map().zoom() - 19);
                   var pointBox = pad(centroid, padding, context);
                   reveal(pointBox, t('intro.lines.finish'));

                   context.map().on('move.intro', function() {
                       padding = 900 * Math.pow(2, context.map().zoom() - 19);
                       pointBox = pad(centroid, padding, context);
                       reveal(pointBox, t('intro.lines.finish'), {duration: 0});
                   });
               }
           }

           function enterSelect(mode) {
               if (mode.id !== 'select') return;
               context.map().on('move.intro', null);
               context.on('enter.intro', null);
               d3.select('#curtain').style('pointer-events', 'all');

               presetCategory();
           }

           function presetCategory() {
               timeout(function() {
                   d3.select('#curtain').style('pointer-events', 'none');
                   var road = d3.select('.preset-category-road .preset-list-button');
                   reveal(road.node(), t('intro.lines.road'));
                   road.one('click.intro', roadCategory);
               }, 500);
           }

           function roadCategory() {
               timeout(function() {
                   var grid = d3.select('.subgrid');
                   reveal(grid.node(), t('intro.lines.residential'));
                   grid.selectAll(':not(.preset-highway-residential) .preset-list-button')
                       .one('click.intro', retryPreset);
                   grid.selectAll('.preset-highway-residential .preset-list-button')
                       .one('click.intro', roadDetails);
               }, 500);
           }

           // selected wrong road type
           function retryPreset() {
               timeout(function() {
                   var preset = d3.select('.entity-editor-pane .preset-list-button');
                   reveal(preset.node(), t('intro.lines.wrong_preset'));
                   preset.one('click.intro', presetCategory);
               }, 500);
           }

           function roadDetails() {
               reveal('.pane',
                   t('intro.lines.describe', { button: icon('#icon-apply', 'pre-text') }));
               context.on('exit.intro', event.done);
           }

       };

       step.exit = function() {
           d3.select(window).on('mousedown.intro', null, true);
           d3.select('#curtain').style('pointer-events', 'none');
           timeouts.forEach(window.clearTimeout);
           context.on('enter.intro', null);
           context.on('exit.intro', null);
           context.map().on('move.intro', null);
           context.history().on('change.intro', null);
       };

       return d3.rebind(step, event, 'on');
   }

   function navigation(context, reveal) {
       var event = d3.dispatch('done'),
           timeouts = [];

       var step = {
           title: 'intro.navigation.title'
       };

       function set(f, t) {
           timeouts.push(window.setTimeout(f, t));
       }

       function eventCancel() {
           d3.event.stopPropagation();
           d3.event.preventDefault();
       }

       step.enter = function() {
           var rect = context.surfaceRect(),
               map = {
                   left: rect.left + 10,
                   top: rect.top + 70,
                   width: rect.width - 70,
                   height: rect.height - 170
               };

           context.map().centerZoom([-85.63591, 41.94285], 19);

           reveal(map, t('intro.navigation.drag'));

           context.map().on('move.intro', _.debounce(function() {
               context.map().on('move.intro', null);
               townhall();
               context.on('enter.intro', inspectTownHall);
           }, 400));

           function townhall() {
               var hall = [-85.63645945147184, 41.942986488012565];

               var point = context.projection(hall);
               if (point[0] < 0 || point[0] > rect.width ||
                   point[1] < 0 || point[1] > rect.height) {
                   context.map().center(hall);
               }

               var box = pointBox(hall, context);
               reveal(box, t('intro.navigation.select'));

               context.map().on('move.intro', function() {
                   var box = pointBox(hall, context);
                   reveal(box, t('intro.navigation.select'), {duration: 0});
               });
           }

           function inspectTownHall(mode) {
               if (mode.id !== 'select') return;
               context.on('enter.intro', null);
               context.map().on('move.intro', null);
               set(function() {
                   reveal('.entity-editor-pane',
                       t('intro.navigation.pane', { button: icon('#icon-close', 'pre-text') }));
                   context.on('exit.intro', streetSearch);
               }, 700);
           }

           function streetSearch() {
               context.on('exit.intro', null);
               reveal('.search-header input',
                   t('intro.navigation.search', { name: t('intro.graph.spring_st') }));
               d3.select('.search-header input').on('keyup.intro', searchResult);
           }

           function searchResult() {
               var first = d3.select('.feature-list-item:nth-child(0n+2)'),  // skip No Results item
                   firstName = first.select('.entity-name'),
                   name = t('intro.graph.spring_st');

               if (!firstName.empty() && firstName.text() === name) {
                   reveal(first.node(), t('intro.navigation.choose', { name: name }));
                   context.on('exit.intro', selectedStreet);
                   d3.select('.search-header input')
                       .on('keydown.intro', eventCancel, true)
                       .on('keyup.intro', null);
               }
           }

           function selectedStreet() {
               var springSt = [-85.63585099140167, 41.942506848938926];
               context.map().center(springSt);
               context.on('exit.intro', event.done);
               set(function() {
                   reveal('.entity-editor-pane',
                       t('intro.navigation.chosen', {
                           name: t('intro.graph.spring_st'),
                           button: icon('#icon-close', 'pre-text')
                       }));
               }, 400);
           }
       };

       step.exit = function() {
           timeouts.forEach(window.clearTimeout);
           context.map().on('move.intro', null);
           context.on('enter.intro', null);
           context.on('exit.intro', null);
           d3.select('.search-header input')
               .on('keydown.intro', null)
               .on('keyup.intro', null);
       };

       return d3.rebind(step, event, 'on');
   }

   function point(context, reveal) {
       var event = d3.dispatch('done'),
           timeouts = [];

       var step = {
           title: 'intro.points.title'
       };

       function setTimeout(f, t) {
           timeouts.push(window.setTimeout(f, t));
       }

       function eventCancel() {
           d3.event.stopPropagation();
           d3.event.preventDefault();
       }

       step.enter = function() {
           context.map().centerZoom([-85.63279, 41.94394], 19);
           reveal('button.add-point',
               t('intro.points.add', { button: icon('#icon-point', 'pre-text') }),
               { tooltipClass: 'intro-points-add' });

           var corner = [-85.632481,41.944094];

           context.on('enter.intro', addPoint);

           function addPoint(mode) {
               if (mode.id !== 'add-point') return;
               context.on('enter.intro', enterSelect);

               var pointBox = pad(corner, 150, context);
               reveal(pointBox, t('intro.points.place'));

               context.map().on('move.intro', function() {
                   pointBox = pad(corner, 150, context);
                   reveal(pointBox, t('intro.points.place'), {duration: 0});
               });
           }

           function enterSelect(mode) {
               if (mode.id !== 'select') return;
               context.map().on('move.intro', null);
               context.on('enter.intro', null);

               setTimeout(function() {
                   reveal('.preset-search-input',
                       t('intro.points.search', {name: context.presets().item('amenity/cafe').name()}));
                   d3.select('.preset-search-input').on('keyup.intro', keySearch);
               }, 500);
           }

           function keySearch() {
               var first = d3.select('.preset-list-item:first-child');
               if (first.classed('preset-amenity-cafe')) {
                   reveal(first.select('.preset-list-button').node(), t('intro.points.choose'));
                   d3.selection.prototype.one.call(context.history(), 'change.intro', selectedPreset);
                   d3.select('.preset-search-input')
                       .on('keydown.intro', eventCancel, true)
                       .on('keyup.intro', null);
               }
           }

           function selectedPreset() {
               setTimeout(function() {
                   reveal('.entity-editor-pane', t('intro.points.describe'), {tooltipClass: 'intro-points-describe'});
                   context.history().on('change.intro', closeEditor);
                   context.on('exit.intro', selectPoint);
               }, 400);
           }

           function closeEditor() {
               d3.select('.preset-search-input').on('keydown.intro', null);
               context.history().on('change.intro', null);
               reveal('.entity-editor-pane',
                   t('intro.points.close', { button: icon('#icon-apply', 'pre-text') }));
           }

           function selectPoint() {
               context.on('exit.intro', null);
               context.history().on('change.intro', null);
               context.on('enter.intro', enterReselect);

               var pointBox = pad(corner, 150, context);
               reveal(pointBox, t('intro.points.reselect'));

               context.map().on('move.intro', function() {
                   pointBox = pad(corner, 150, context);
                   reveal(pointBox, t('intro.points.reselect'), {duration: 0});
               });
           }

           function enterReselect(mode) {
               if (mode.id !== 'select') return;
               context.map().on('move.intro', null);
               context.on('enter.intro', null);

               setTimeout(function() {
                   reveal('.entity-editor-pane',
                       t('intro.points.fixname', { button: icon('#icon-apply', 'pre-text') }));
                   context.on('exit.intro', deletePoint);
               }, 500);
           }

           function deletePoint() {
               context.on('exit.intro', null);
               context.on('enter.intro', enterDelete);

               var pointBox = pad(corner, 150, context);
               reveal(pointBox, t('intro.points.reselect_delete'));

               context.map().on('move.intro', function() {
                   pointBox = pad(corner, 150, context);
                   reveal(pointBox, t('intro.points.reselect_delete'), {duration: 0});
               });
           }

           function enterDelete(mode) {
               if (mode.id !== 'select') return;
               context.map().on('move.intro', null);
               context.on('enter.intro', null);
               context.on('exit.intro', deletePoint);
               context.map().on('move.intro', deletePoint);
               context.history().on('change.intro', deleted);

               setTimeout(function() {
                   var node = d3.select('.radial-menu-item-delete').node();
                   var pointBox = pad(node.getBoundingClientRect(), 50, context);
                   reveal(pointBox,
                       t('intro.points.delete', { button: icon('#operation-delete', 'pre-text') }));
               }, 300);
           }

           function deleted(changed) {
               if (changed.deleted().length) event.done();
           }

       };

       step.exit = function() {
           timeouts.forEach(window.clearTimeout);
           context.on('exit.intro', null);
           context.on('enter.intro', null);
           context.map().on('move.intro', null);
           context.history().on('change.intro', null);
           d3.select('.preset-search-input')
               .on('keyup.intro', null)
               .on('keydown.intro', null);
       };

       return d3.rebind(step, event, 'on');
   }

   function startEditing(context, reveal) {
       var event = d3.dispatch('done', 'startEditing'),
           modalSelection,
           timeouts = [];

       var step = {
           title: 'intro.startediting.title'
       };

       function timeout(f, t) {
           timeouts.push(window.setTimeout(f, t));
       }

       step.enter = function() {
           reveal('.map-control.help-control',
               t('intro.startediting.help', { button: icon('#icon-help', 'pre-text') }));

           timeout(function() {
               reveal('#bar button.save', t('intro.startediting.save'));
           }, 5000);

           timeout(function() {
               reveal('#surface');
           }, 10000);

           timeout(function() {
               modalSelection = modal(context.container());

               modalSelection.select('.modal')
                   .attr('class', 'modal-splash modal col6');

               modalSelection.selectAll('.close').remove();

               var startbutton = modalSelection.select('.content')
                   .attr('class', 'fillL')
                       .append('button')
                           .attr('class', 'modal-section huge-modal-button')
                           .on('click', function() {
                               modalSelection.remove();
                           });

                   startbutton.append('div')
                       .attr('class','illustration');
                   startbutton.append('h2')
                       .text(t('intro.startediting.start'));

               event.startEditing();
           }, 10500);
       };

       step.exit = function() {
           if (modalSelection) modalSelection.remove();
           timeouts.forEach(window.clearTimeout);
       };

       return d3.rebind(step, event, 'on');
   }

   var sampleIntros = {
       area: area,
       line: line,
       navigation: navigation,
       point: point,
       startEditing: startEditing
   };

   function intro(context) {
       var step;

       function intro(selection) {

           function localizedName(id) {
               var features = {
                   n2140018997: 'city_hall',
                   n367813436: 'fire_department',
                   w203988286: 'memory_isle_park',
                   w203972937: 'riverwalk_trail',
                   w203972938: 'riverwalk_trail',
                   w203972940: 'riverwalk_trail',
                   w41785752: 'w_michigan_ave',
                   w134150789: 'w_michigan_ave',
                   w134150795: 'w_michigan_ave',
                   w134150800: 'w_michigan_ave',
                   w134150811: 'w_michigan_ave',
                   w134150802: 'e_michigan_ave',
                   w134150836: 'e_michigan_ave',
                   w41074896: 'e_michigan_ave',
                   w17965834: 'spring_st',
                   w203986457: 'scidmore_park',
                   w203049587: 'petting_zoo',
                   w17967397: 'n_andrews_st',
                   w17967315: 's_andrews_st',
                   w17967326: 'n_constantine_st',
                   w17966400: 's_constantine_st',
                   w170848823: 'rocky_river',
                   w170848824: 'rocky_river',
                   w170848331: 'rocky_river',
                   w17967752: 'railroad_dr',
                   w17965998: 'conrail_rr',
                   w134150845: 'conrail_rr',
                   w170989131: 'st_joseph_river',
                   w143497377: 'n_main_st',
                   w134150801: 's_main_st',
                   w134150830: 's_main_st',
                   w17966462: 's_main_st',
                   w17967734: 'water_st',
                   w17964996: 'foster_st',
                   w170848330: 'portage_river',
                   w17965351: 'flower_st',
                   w17965502: 'elm_st',
                   w17965402: 'walnut_st',
                   w17964793: 'morris_ave',
                   w17967444: 'east_st',
                   w17966984: 'portage_ave'
               };
               return features[id] && t('intro.graph.' + features[id]);
           }

           context.enter(Browse(context));

           // Save current map state
           var history = context.history().toJSON(),
               hash = window.location.hash,
               center = context.map().center(),
               zoom = context.map().zoom(),
               background = context.background().baseLayerSource(),
               opacity = d3.selectAll('#map .layer-background').style('opacity'),
               loadedTiles = context.connection().loadedTiles(),
               baseEntities = context.history().graph().base().entities,
               introGraph, name;

           // Block saving
           context.inIntro(true);

           // Load semi-real data used in intro
           context.connection().toggle(false).flush();
           context.history().reset();

           introGraph = JSON.parse(iD.introGraph);
           for (var key in introGraph) {
               introGraph[key] = Entity(introGraph[key]);
               name = localizedName(key);
               if (name) {
                   introGraph[key].tags.name = name;
               }
           }
           context.history().merge(d3.values(Graph().load(introGraph).entities));
           context.background().bing();

           d3.selectAll('#map .layer-background').style('opacity', 1);

           var curtain = d3.curtain();
           selection.call(curtain);

           function reveal(box, text, options) {
               options = options || {};
               if (text) curtain.reveal(box, text, options.tooltipClass, options.duration);
               else curtain.reveal(box, '', '', options.duration);
           }

           var steps = ['navigation', 'point', 'area', 'line', 'startEditing'].map(function(step, i) {
               var s = sampleIntros[step](context, reveal)
                   .on('done', function() {
                       entered.filter(function(d) {
                           return d.title === s.title;
                       }).classed('finished', true);
                       enter(steps[i + 1]);
                   });
               return s;
           });

           steps[steps.length - 1].on('startEditing', function() {
               curtain.remove();
               navwrap.remove();
               d3.selectAll('#map .layer-background').style('opacity', opacity);
               context.connection().toggle(true).flush().loadedTiles(loadedTiles);
               context.history().reset().merge(d3.values(baseEntities));
               context.background().baseLayerSource(background);
               if (history) context.history().fromJSON(history, false);
               context.map().centerZoom(center, zoom);
               window.location.replace(hash);
               context.inIntro(false);
           });

           var navwrap = selection.append('div').attr('class', 'intro-nav-wrap fillD');

           var buttonwrap = navwrap.append('div')
               .attr('class', 'joined')
               .selectAll('button.step');

           var entered = buttonwrap
               .data(steps)
               .enter()
               .append('button')
               .attr('class', 'step')
               .on('click', enter);

           entered
               .call(Icon('#icon-apply', 'pre-text'));

           entered
               .append('label')
               .text(function(d) { return t(d.title); });

           enter(steps[0]);

           function enter (newStep) {
               if (step) { step.exit(); }

               context.enter(Browse(context));

               step = newStep;
               step.enter();

               entered.classed('active', function(d) {
                   return d.title === step.title;
               });
           }

       }
       return intro;
   }

   var marked = createCommonjsModule(function (module, exports) {
   /**
    * marked - a markdown parser
    * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
    * https://github.com/chjj/marked
    */

   ;(function() {

   /**
    * Block-Level Grammar
    */

   var block = {
     newline: /^\n+/,
     code: /^( {4}[^\n]+\n*)+/,
     fences: noop,
     hr: /^( *[-*_]){3,} *(?:\n+|$)/,
     heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
     nptable: noop,
     lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
     blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
     list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
     html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
     def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
     table: noop,
     paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
     text: /^[^\n]+/
   };

   block.bullet = /(?:[*+-]|\d+\.)/;
   block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
   block.item = replace(block.item, 'gm')
     (/bull/g, block.bullet)
     ();

   block.list = replace(block.list)
     (/bull/g, block.bullet)
     ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
     ('def', '\\n+(?=' + block.def.source + ')')
     ();

   block.blockquote = replace(block.blockquote)
     ('def', block.def)
     ();

   block._tag = '(?!(?:'
     + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
     + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
     + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

   block.html = replace(block.html)
     ('comment', /<!--[\s\S]*?-->/)
     ('closed', /<(tag)[\s\S]+?<\/\1>/)
     ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
     (/tag/g, block._tag)
     ();

   block.paragraph = replace(block.paragraph)
     ('hr', block.hr)
     ('heading', block.heading)
     ('lheading', block.lheading)
     ('blockquote', block.blockquote)
     ('tag', '<' + block._tag)
     ('def', block.def)
     ();

   /**
    * Normal Block Grammar
    */

   block.normal = merge({}, block);

   /**
    * GFM Block Grammar
    */

   block.gfm = merge({}, block.normal, {
     fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
     paragraph: /^/,
     heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
   });

   block.gfm.paragraph = replace(block.paragraph)
     ('(?!', '(?!'
       + block.gfm.fences.source.replace('\\1', '\\2') + '|'
       + block.list.source.replace('\\1', '\\3') + '|')
     ();

   /**
    * GFM + Tables Block Grammar
    */

   block.tables = merge({}, block.gfm, {
     nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
     table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
   });

   /**
    * Block Lexer
    */

   function Lexer(options) {
     this.tokens = [];
     this.tokens.links = {};
     this.options = options || marked.defaults;
     this.rules = block.normal;

     if (this.options.gfm) {
       if (this.options.tables) {
         this.rules = block.tables;
       } else {
         this.rules = block.gfm;
       }
     }
   }

   /**
    * Expose Block Rules
    */

   Lexer.rules = block;

   /**
    * Static Lex Method
    */

   Lexer.lex = function(src, options) {
     var lexer = new Lexer(options);
     return lexer.lex(src);
   };

   /**
    * Preprocessing
    */

   Lexer.prototype.lex = function(src) {
     src = src
       .replace(/\r\n|\r/g, '\n')
       .replace(/\t/g, '    ')
       .replace(/\u00a0/g, ' ')
       .replace(/\u2424/g, '\n');

     return this.token(src, true);
   };

   /**
    * Lexing
    */

   Lexer.prototype.token = function(src, top, bq) {
     var src = src.replace(/^ +$/gm, '')
       , next
       , loose
       , cap
       , bull
       , b
       , item
       , space
       , i
       , l;

     while (src) {
       // newline
       if (cap = this.rules.newline.exec(src)) {
         src = src.substring(cap[0].length);
         if (cap[0].length > 1) {
           this.tokens.push({
             type: 'space'
           });
         }
       }

       // code
       if (cap = this.rules.code.exec(src)) {
         src = src.substring(cap[0].length);
         cap = cap[0].replace(/^ {4}/gm, '');
         this.tokens.push({
           type: 'code',
           text: !this.options.pedantic
             ? cap.replace(/\n+$/, '')
             : cap
         });
         continue;
       }

       // fences (gfm)
       if (cap = this.rules.fences.exec(src)) {
         src = src.substring(cap[0].length);
         this.tokens.push({
           type: 'code',
           lang: cap[2],
           text: cap[3] || ''
         });
         continue;
       }

       // heading
       if (cap = this.rules.heading.exec(src)) {
         src = src.substring(cap[0].length);
         this.tokens.push({
           type: 'heading',
           depth: cap[1].length,
           text: cap[2]
         });
         continue;
       }

       // table no leading pipe (gfm)
       if (top && (cap = this.rules.nptable.exec(src))) {
         src = src.substring(cap[0].length);

         item = {
           type: 'table',
           header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
           align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
           cells: cap[3].replace(/\n$/, '').split('\n')
         };

         for (i = 0; i < item.align.length; i++) {
           if (/^ *-+: *$/.test(item.align[i])) {
             item.align[i] = 'right';
           } else if (/^ *:-+: *$/.test(item.align[i])) {
             item.align[i] = 'center';
           } else if (/^ *:-+ *$/.test(item.align[i])) {
             item.align[i] = 'left';
           } else {
             item.align[i] = null;
           }
         }

         for (i = 0; i < item.cells.length; i++) {
           item.cells[i] = item.cells[i].split(/ *\| */);
         }

         this.tokens.push(item);

         continue;
       }

       // lheading
       if (cap = this.rules.lheading.exec(src)) {
         src = src.substring(cap[0].length);
         this.tokens.push({
           type: 'heading',
           depth: cap[2] === '=' ? 1 : 2,
           text: cap[1]
         });
         continue;
       }

       // hr
       if (cap = this.rules.hr.exec(src)) {
         src = src.substring(cap[0].length);
         this.tokens.push({
           type: 'hr'
         });
         continue;
       }

       // blockquote
       if (cap = this.rules.blockquote.exec(src)) {
         src = src.substring(cap[0].length);

         this.tokens.push({
           type: 'blockquote_start'
         });

         cap = cap[0].replace(/^ *> ?/gm, '');

         // Pass `top` to keep the current
         // "toplevel" state. This is exactly
         // how markdown.pl works.
         this.token(cap, top, true);

         this.tokens.push({
           type: 'blockquote_end'
         });

         continue;
       }

       // list
       if (cap = this.rules.list.exec(src)) {
         src = src.substring(cap[0].length);
         bull = cap[2];

         this.tokens.push({
           type: 'list_start',
           ordered: bull.length > 1
         });

         // Get each top-level item.
         cap = cap[0].match(this.rules.item);

         next = false;
         l = cap.length;
         i = 0;

         for (; i < l; i++) {
           item = cap[i];

           // Remove the list item's bullet
           // so it is seen as the next token.
           space = item.length;
           item = item.replace(/^ *([*+-]|\d+\.) +/, '');

           // Outdent whatever the
           // list item contains. Hacky.
           if (~item.indexOf('\n ')) {
             space -= item.length;
             item = !this.options.pedantic
               ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
               : item.replace(/^ {1,4}/gm, '');
           }

           // Determine whether the next list item belongs here.
           // Backpedal if it does not belong in this list.
           if (this.options.smartLists && i !== l - 1) {
             b = block.bullet.exec(cap[i + 1])[0];
             if (bull !== b && !(bull.length > 1 && b.length > 1)) {
               src = cap.slice(i + 1).join('\n') + src;
               i = l - 1;
             }
           }

           // Determine whether item is loose or not.
           // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
           // for discount behavior.
           loose = next || /\n\n(?!\s*$)/.test(item);
           if (i !== l - 1) {
             next = item.charAt(item.length - 1) === '\n';
             if (!loose) loose = next;
           }

           this.tokens.push({
             type: loose
               ? 'loose_item_start'
               : 'list_item_start'
           });

           // Recurse.
           this.token(item, false, bq);

           this.tokens.push({
             type: 'list_item_end'
           });
         }

         this.tokens.push({
           type: 'list_end'
         });

         continue;
       }

       // html
       if (cap = this.rules.html.exec(src)) {
         src = src.substring(cap[0].length);
         this.tokens.push({
           type: this.options.sanitize
             ? 'paragraph'
             : 'html',
           pre: !this.options.sanitizer
             && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
           text: cap[0]
         });
         continue;
       }

       // def
       if ((!bq && top) && (cap = this.rules.def.exec(src))) {
         src = src.substring(cap[0].length);
         this.tokens.links[cap[1].toLowerCase()] = {
           href: cap[2],
           title: cap[3]
         };
         continue;
       }

       // table (gfm)
       if (top && (cap = this.rules.table.exec(src))) {
         src = src.substring(cap[0].length);

         item = {
           type: 'table',
           header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
           align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
           cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
         };

         for (i = 0; i < item.align.length; i++) {
           if (/^ *-+: *$/.test(item.align[i])) {
             item.align[i] = 'right';
           } else if (/^ *:-+: *$/.test(item.align[i])) {
             item.align[i] = 'center';
           } else if (/^ *:-+ *$/.test(item.align[i])) {
             item.align[i] = 'left';
           } else {
             item.align[i] = null;
           }
         }

         for (i = 0; i < item.cells.length; i++) {
           item.cells[i] = item.cells[i]
             .replace(/^ *\| *| *\| *$/g, '')
             .split(/ *\| */);
         }

         this.tokens.push(item);

         continue;
       }

       // top-level paragraph
       if (top && (cap = this.rules.paragraph.exec(src))) {
         src = src.substring(cap[0].length);
         this.tokens.push({
           type: 'paragraph',
           text: cap[1].charAt(cap[1].length - 1) === '\n'
             ? cap[1].slice(0, -1)
             : cap[1]
         });
         continue;
       }

       // text
       if (cap = this.rules.text.exec(src)) {
         // Top-level should never reach here.
         src = src.substring(cap[0].length);
         this.tokens.push({
           type: 'text',
           text: cap[0]
         });
         continue;
       }

       if (src) {
         throw new
           Error('Infinite loop on byte: ' + src.charCodeAt(0));
       }
     }

     return this.tokens;
   };

   /**
    * Inline-Level Grammar
    */

   var inline = {
     escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
     autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
     url: noop,
     tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
     link: /^!?\[(inside)\]\(href\)/,
     reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
     nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
     strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
     em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
     code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
     br: /^ {2,}\n(?!\s*$)/,
     del: noop,
     text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
   };

   inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
   inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

   inline.link = replace(inline.link)
     ('inside', inline._inside)
     ('href', inline._href)
     ();

   inline.reflink = replace(inline.reflink)
     ('inside', inline._inside)
     ();

   /**
    * Normal Inline Grammar
    */

   inline.normal = merge({}, inline);

   /**
    * Pedantic Inline Grammar
    */

   inline.pedantic = merge({}, inline.normal, {
     strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
     em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
   });

   /**
    * GFM Inline Grammar
    */

   inline.gfm = merge({}, inline.normal, {
     escape: replace(inline.escape)('])', '~|])')(),
     url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
     del: /^~~(?=\S)([\s\S]*?\S)~~/,
     text: replace(inline.text)
       (']|', '~]|')
       ('|', '|https?://|')
       ()
   });

   /**
    * GFM + Line Breaks Inline Grammar
    */

   inline.breaks = merge({}, inline.gfm, {
     br: replace(inline.br)('{2,}', '*')(),
     text: replace(inline.gfm.text)('{2,}', '*')()
   });

   /**
    * Inline Lexer & Compiler
    */

   function InlineLexer(links, options) {
     this.options = options || marked.defaults;
     this.links = links;
     this.rules = inline.normal;
     this.renderer = this.options.renderer || new Renderer;
     this.renderer.options = this.options;

     if (!this.links) {
       throw new
         Error('Tokens array requires a `links` property.');
     }

     if (this.options.gfm) {
       if (this.options.breaks) {
         this.rules = inline.breaks;
       } else {
         this.rules = inline.gfm;
       }
     } else if (this.options.pedantic) {
       this.rules = inline.pedantic;
     }
   }

   /**
    * Expose Inline Rules
    */

   InlineLexer.rules = inline;

   /**
    * Static Lexing/Compiling Method
    */

   InlineLexer.output = function(src, links, options) {
     var inline = new InlineLexer(links, options);
     return inline.output(src);
   };

   /**
    * Lexing/Compiling
    */

   InlineLexer.prototype.output = function(src) {
     var out = ''
       , link
       , text
       , href
       , cap;

     while (src) {
       // escape
       if (cap = this.rules.escape.exec(src)) {
         src = src.substring(cap[0].length);
         out += cap[1];
         continue;
       }

       // autolink
       if (cap = this.rules.autolink.exec(src)) {
         src = src.substring(cap[0].length);
         if (cap[2] === '@') {
           text = cap[1].charAt(6) === ':'
             ? this.mangle(cap[1].substring(7))
             : this.mangle(cap[1]);
           href = this.mangle('mailto:') + text;
         } else {
           text = escape(cap[1]);
           href = text;
         }
         out += this.renderer.link(href, null, text);
         continue;
       }

       // url (gfm)
       if (!this.inLink && (cap = this.rules.url.exec(src))) {
         src = src.substring(cap[0].length);
         text = escape(cap[1]);
         href = text;
         out += this.renderer.link(href, null, text);
         continue;
       }

       // tag
       if (cap = this.rules.tag.exec(src)) {
         if (!this.inLink && /^<a /i.test(cap[0])) {
           this.inLink = true;
         } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
           this.inLink = false;
         }
         src = src.substring(cap[0].length);
         out += this.options.sanitize
           ? this.options.sanitizer
             ? this.options.sanitizer(cap[0])
             : escape(cap[0])
           : cap[0]
         continue;
       }

       // link
       if (cap = this.rules.link.exec(src)) {
         src = src.substring(cap[0].length);
         this.inLink = true;
         out += this.outputLink(cap, {
           href: cap[2],
           title: cap[3]
         });
         this.inLink = false;
         continue;
       }

       // reflink, nolink
       if ((cap = this.rules.reflink.exec(src))
           || (cap = this.rules.nolink.exec(src))) {
         src = src.substring(cap[0].length);
         link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
         link = this.links[link.toLowerCase()];
         if (!link || !link.href) {
           out += cap[0].charAt(0);
           src = cap[0].substring(1) + src;
           continue;
         }
         this.inLink = true;
         out += this.outputLink(cap, link);
         this.inLink = false;
         continue;
       }

       // strong
       if (cap = this.rules.strong.exec(src)) {
         src = src.substring(cap[0].length);
         out += this.renderer.strong(this.output(cap[2] || cap[1]));
         continue;
       }

       // em
       if (cap = this.rules.em.exec(src)) {
         src = src.substring(cap[0].length);
         out += this.renderer.em(this.output(cap[2] || cap[1]));
         continue;
       }

       // code
       if (cap = this.rules.code.exec(src)) {
         src = src.substring(cap[0].length);
         out += this.renderer.codespan(escape(cap[2], true));
         continue;
       }

       // br
       if (cap = this.rules.br.exec(src)) {
         src = src.substring(cap[0].length);
         out += this.renderer.br();
         continue;
       }

       // del (gfm)
       if (cap = this.rules.del.exec(src)) {
         src = src.substring(cap[0].length);
         out += this.renderer.del(this.output(cap[1]));
         continue;
       }

       // text
       if (cap = this.rules.text.exec(src)) {
         src = src.substring(cap[0].length);
         out += this.renderer.text(escape(this.smartypants(cap[0])));
         continue;
       }

       if (src) {
         throw new
           Error('Infinite loop on byte: ' + src.charCodeAt(0));
       }
     }

     return out;
   };

   /**
    * Compile Link
    */

   InlineLexer.prototype.outputLink = function(cap, link) {
     var href = escape(link.href)
       , title = link.title ? escape(link.title) : null;

     return cap[0].charAt(0) !== '!'
       ? this.renderer.link(href, title, this.output(cap[1]))
       : this.renderer.image(href, title, escape(cap[1]));
   };

   /**
    * Smartypants Transformations
    */

   InlineLexer.prototype.smartypants = function(text) {
     if (!this.options.smartypants) return text;
     return text
       // em-dashes
       .replace(/---/g, '\u2014')
       // en-dashes
       .replace(/--/g, '\u2013')
       // opening singles
       .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
       // closing singles & apostrophes
       .replace(/'/g, '\u2019')
       // opening doubles
       .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
       // closing doubles
       .replace(/"/g, '\u201d')
       // ellipses
       .replace(/\.{3}/g, '\u2026');
   };

   /**
    * Mangle Links
    */

   InlineLexer.prototype.mangle = function(text) {
     if (!this.options.mangle) return text;
     var out = ''
       , l = text.length
       , i = 0
       , ch;

     for (; i < l; i++) {
       ch = text.charCodeAt(i);
       if (Math.random() > 0.5) {
         ch = 'x' + ch.toString(16);
       }
       out += '&#' + ch + ';';
     }

     return out;
   };

   /**
    * Renderer
    */

   function Renderer(options) {
     this.options = options || {};
   }

   Renderer.prototype.code = function(code, lang, escaped) {
     if (this.options.highlight) {
       var out = this.options.highlight(code, lang);
       if (out != null && out !== code) {
         escaped = true;
         code = out;
       }
     }

     if (!lang) {
       return '<pre><code>'
         + (escaped ? code : escape(code, true))
         + '\n</code></pre>';
     }

     return '<pre><code class="'
       + this.options.langPrefix
       + escape(lang, true)
       + '">'
       + (escaped ? code : escape(code, true))
       + '\n</code></pre>\n';
   };

   Renderer.prototype.blockquote = function(quote) {
     return '<blockquote>\n' + quote + '</blockquote>\n';
   };

   Renderer.prototype.html = function(html) {
     return html;
   };

   Renderer.prototype.heading = function(text, level, raw) {
     return '<h'
       + level
       + ' id="'
       + this.options.headerPrefix
       + raw.toLowerCase().replace(/[^\w]+/g, '-')
       + '">'
       + text
       + '</h'
       + level
       + '>\n';
   };

   Renderer.prototype.hr = function() {
     return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
   };

   Renderer.prototype.list = function(body, ordered) {
     var type = ordered ? 'ol' : 'ul';
     return '<' + type + '>\n' + body + '</' + type + '>\n';
   };

   Renderer.prototype.listitem = function(text) {
     return '<li>' + text + '</li>\n';
   };

   Renderer.prototype.paragraph = function(text) {
     return '<p>' + text + '</p>\n';
   };

   Renderer.prototype.table = function(header, body) {
     return '<table>\n'
       + '<thead>\n'
       + header
       + '</thead>\n'
       + '<tbody>\n'
       + body
       + '</tbody>\n'
       + '</table>\n';
   };

   Renderer.prototype.tablerow = function(content) {
     return '<tr>\n' + content + '</tr>\n';
   };

   Renderer.prototype.tablecell = function(content, flags) {
     var type = flags.header ? 'th' : 'td';
     var tag = flags.align
       ? '<' + type + ' style="text-align:' + flags.align + '">'
       : '<' + type + '>';
     return tag + content + '</' + type + '>\n';
   };

   // span level renderer
   Renderer.prototype.strong = function(text) {
     return '<strong>' + text + '</strong>';
   };

   Renderer.prototype.em = function(text) {
     return '<em>' + text + '</em>';
   };

   Renderer.prototype.codespan = function(text) {
     return '<code>' + text + '</code>';
   };

   Renderer.prototype.br = function() {
     return this.options.xhtml ? '<br/>' : '<br>';
   };

   Renderer.prototype.del = function(text) {
     return '<del>' + text + '</del>';
   };

   Renderer.prototype.link = function(href, title, text) {
     if (this.options.sanitize) {
       try {
         var prot = decodeURIComponent(unescape(href))
           .replace(/[^\w:]/g, '')
           .toLowerCase();
       } catch (e) {
         return '';
       }
       if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
         return '';
       }
     }
     var out = '<a href="' + href + '"';
     if (title) {
       out += ' title="' + title + '"';
     }
     out += '>' + text + '</a>';
     return out;
   };

   Renderer.prototype.image = function(href, title, text) {
     var out = '<img src="' + href + '" alt="' + text + '"';
     if (title) {
       out += ' title="' + title + '"';
     }
     out += this.options.xhtml ? '/>' : '>';
     return out;
   };

   Renderer.prototype.text = function(text) {
     return text;
   };

   /**
    * Parsing & Compiling
    */

   function Parser(options) {
     this.tokens = [];
     this.token = null;
     this.options = options || marked.defaults;
     this.options.renderer = this.options.renderer || new Renderer;
     this.renderer = this.options.renderer;
     this.renderer.options = this.options;
   }

   /**
    * Static Parse Method
    */

   Parser.parse = function(src, options, renderer) {
     var parser = new Parser(options, renderer);
     return parser.parse(src);
   };

   /**
    * Parse Loop
    */

   Parser.prototype.parse = function(src) {
     this.inline = new InlineLexer(src.links, this.options, this.renderer);
     this.tokens = src.reverse();

     var out = '';
     while (this.next()) {
       out += this.tok();
     }

     return out;
   };

   /**
    * Next Token
    */

   Parser.prototype.next = function() {
     return this.token = this.tokens.pop();
   };

   /**
    * Preview Next Token
    */

   Parser.prototype.peek = function() {
     return this.tokens[this.tokens.length - 1] || 0;
   };

   /**
    * Parse Text Tokens
    */

   Parser.prototype.parseText = function() {
     var body = this.token.text;

     while (this.peek().type === 'text') {
       body += '\n' + this.next().text;
     }

     return this.inline.output(body);
   };

   /**
    * Parse Current Token
    */

   Parser.prototype.tok = function() {
     switch (this.token.type) {
       case 'space': {
         return '';
       }
       case 'hr': {
         return this.renderer.hr();
       }
       case 'heading': {
         return this.renderer.heading(
           this.inline.output(this.token.text),
           this.token.depth,
           this.token.text);
       }
       case 'code': {
         return this.renderer.code(this.token.text,
           this.token.lang,
           this.token.escaped);
       }
       case 'table': {
         var header = ''
           , body = ''
           , i
           , row
           , cell
           , flags
           , j;

         // header
         cell = '';
         for (i = 0; i < this.token.header.length; i++) {
           flags = { header: true, align: this.token.align[i] };
           cell += this.renderer.tablecell(
             this.inline.output(this.token.header[i]),
             { header: true, align: this.token.align[i] }
           );
         }
         header += this.renderer.tablerow(cell);

         for (i = 0; i < this.token.cells.length; i++) {
           row = this.token.cells[i];

           cell = '';
           for (j = 0; j < row.length; j++) {
             cell += this.renderer.tablecell(
               this.inline.output(row[j]),
               { header: false, align: this.token.align[j] }
             );
           }

           body += this.renderer.tablerow(cell);
         }
         return this.renderer.table(header, body);
       }
       case 'blockquote_start': {
         var body = '';

         while (this.next().type !== 'blockquote_end') {
           body += this.tok();
         }

         return this.renderer.blockquote(body);
       }
       case 'list_start': {
         var body = ''
           , ordered = this.token.ordered;

         while (this.next().type !== 'list_end') {
           body += this.tok();
         }

         return this.renderer.list(body, ordered);
       }
       case 'list_item_start': {
         var body = '';

         while (this.next().type !== 'list_item_end') {
           body += this.token.type === 'text'
             ? this.parseText()
             : this.tok();
         }

         return this.renderer.listitem(body);
       }
       case 'loose_item_start': {
         var body = '';

         while (this.next().type !== 'list_item_end') {
           body += this.tok();
         }

         return this.renderer.listitem(body);
       }
       case 'html': {
         var html = !this.token.pre && !this.options.pedantic
           ? this.inline.output(this.token.text)
           : this.token.text;
         return this.renderer.html(html);
       }
       case 'paragraph': {
         return this.renderer.paragraph(this.inline.output(this.token.text));
       }
       case 'text': {
         return this.renderer.paragraph(this.parseText());
       }
     }
   };

   /**
    * Helpers
    */

   function escape(html, encode) {
     return html
       .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#39;');
   }

   function unescape(html) {
     return html.replace(/&([#\w]+);/g, function(_, n) {
       n = n.toLowerCase();
       if (n === 'colon') return ':';
       if (n.charAt(0) === '#') {
         return n.charAt(1) === 'x'
           ? String.fromCharCode(parseInt(n.substring(2), 16))
           : String.fromCharCode(+n.substring(1));
       }
       return '';
     });
   }

   function replace(regex, opt) {
     regex = regex.source;
     opt = opt || '';
     return function self(name, val) {
       if (!name) return new RegExp(regex, opt);
       val = val.source || val;
       val = val.replace(/(^|[^\[])\^/g, '$1');
       regex = regex.replace(name, val);
       return self;
     };
   }

   function noop() {}
   noop.exec = noop;

   function merge(obj) {
     var i = 1
       , target
       , key;

     for (; i < arguments.length; i++) {
       target = arguments[i];
       for (key in target) {
         if (Object.prototype.hasOwnProperty.call(target, key)) {
           obj[key] = target[key];
         }
       }
     }

     return obj;
   }


   /**
    * Marked
    */

   function marked(src, opt, callback) {
     if (callback || typeof opt === 'function') {
       if (!callback) {
         callback = opt;
         opt = null;
       }

       opt = merge({}, marked.defaults, opt || {});

       var highlight = opt.highlight
         , tokens
         , pending
         , i = 0;

       try {
         tokens = Lexer.lex(src, opt)
       } catch (e) {
         return callback(e);
       }

       pending = tokens.length;

       var done = function(err) {
         if (err) {
           opt.highlight = highlight;
           return callback(err);
         }

         var out;

         try {
           out = Parser.parse(tokens, opt);
         } catch (e) {
           err = e;
         }

         opt.highlight = highlight;

         return err
           ? callback(err)
           : callback(null, out);
       };

       if (!highlight || highlight.length < 3) {
         return done();
       }

       delete opt.highlight;

       if (!pending) return done();

       for (; i < tokens.length; i++) {
         (function(token) {
           if (token.type !== 'code') {
             return --pending || done();
           }
           return highlight(token.text, token.lang, function(err, code) {
             if (err) return done(err);
             if (code == null || code === token.text) {
               return --pending || done();
             }
             token.text = code;
             token.escaped = true;
             --pending || done();
           });
         })(tokens[i]);
       }

       return;
     }
     try {
       if (opt) opt = merge({}, marked.defaults, opt);
       return Parser.parse(Lexer.lex(src, opt), opt);
     } catch (e) {
       e.message += '\nPlease report this to https://github.com/chjj/marked.';
       if ((opt || marked.defaults).silent) {
         return '<p>An error occured:</p><pre>'
           + escape(e.message + '', true)
           + '</pre>';
       }
       throw e;
     }
   }

   /**
    * Options
    */

   marked.options =
   marked.setOptions = function(opt) {
     merge(marked.defaults, opt);
     return marked;
   };

   marked.defaults = {
     gfm: true,
     tables: true,
     breaks: false,
     pedantic: false,
     sanitize: false,
     sanitizer: null,
     mangle: true,
     smartLists: false,
     silent: false,
     highlight: null,
     langPrefix: 'lang-',
     smartypants: false,
     headerPrefix: '',
     renderer: new Renderer,
     xhtml: false
   };

   /**
    * Expose
    */

   marked.Parser = Parser;
   marked.parser = Parser.parse;

   marked.Renderer = Renderer;

   marked.Lexer = Lexer;
   marked.lexer = Lexer.lex;

   marked.InlineLexer = InlineLexer;
   marked.inlineLexer = InlineLexer.output;

   marked.parse = marked;

   if (typeof module !== 'undefined' && typeof exports === 'object') {
     module.exports = marked;
   } else if (typeof define === 'function' && define.amd) {
     define(function() { return marked; });
   } else {
     this.marked = marked;
   }

   }).call(function() {
     return this || (typeof window !== 'undefined' ? window : commonjsGlobal);
   }());
   });

   var marked$1 = (marked && typeof marked === 'object' && 'default' in marked ? marked['default'] : marked);

   function Help(context) {
       var key = 'H';

       var docKeys = [
           'help.help',
           'help.editing_saving',
           'help.roads',
           'help.gps',
           'help.imagery',
           'help.addresses',
           'help.inspector',
           'help.buildings',
           'help.relations'];

       var docs = docKeys.map(function(key) {
           var text = t(key);
           return {
               title: text.split('\n')[0].replace('#', '').trim(),
               html: marked$1(text.split('\n').slice(1).join('\n'))
           };
       });

       function help(selection) {

           function hide() {
               setVisible(false);
           }

           function toggle() {
               if (d3.event) d3.event.preventDefault();
               tooltip.hide(button);
               setVisible(!button.classed('active'));
           }

           function setVisible(show) {
               if (show !== shown) {
                   button.classed('active', show);
                   shown = show;

                   if (show) {
                       selection.on('mousedown.help-inside', function() {
                           return d3.event.stopPropagation();
                       });
                       pane.style('display', 'block')
                           .style('right', '-500px')
                           .transition()
                           .duration(200)
                           .style('right', '0px');
                   } else {
                       pane.style('right', '0px')
                           .transition()
                           .duration(200)
                           .style('right', '-500px')
                           .each('end', function() {
                               d3.select(this).style('display', 'none');
                           });
                       selection.on('mousedown.help-inside', null);
                   }
               }
           }

           function clickHelp(d, i) {
               pane.property('scrollTop', 0);
               doctitle.html(d.title);
               body.html(d.html);
               body.selectAll('a')
                   .attr('target', '_blank');
               menuItems.classed('selected', function(m) {
                   return m.title === d.title;
               });

               nav.html('');

               if (i > 0) {
                   var prevLink = nav.append('a')
                       .attr('class', 'previous')
                       .on('click', function() {
                           clickHelp(docs[i - 1], i - 1);
                       });
                   prevLink.append('span').html('&#9668; ' + docs[i - 1].title);
               }
               if (i < docs.length - 1) {
                   var nextLink = nav.append('a')
                       .attr('class', 'next')
                       .on('click', function() {
                           clickHelp(docs[i + 1], i + 1);
                       });
                   nextLink.append('span').html(docs[i + 1].title + ' &#9658;');
               }
           }

           function clickWalkthrough() {
               d3.select(document.body).call(intro(context));
               setVisible(false);
           }


           var pane = selection.append('div')
                   .attr('class', 'help-wrap map-overlay fillL col5 content hide'),
               tooltip = bootstrap.tooltip()
                   .placement('left')
                   .html(true)
                   .title(tooltipHtml(t('help.title'), key)),
               button = selection.append('button')
                   .attr('tabindex', -1)
                   .on('click', toggle)
                   .call(Icon('#icon-help', 'light'))
                   .call(tooltip),
               shown = false;


           var toc = pane.append('ul')
               .attr('class', 'toc');

           var menuItems = toc.selectAll('li')
               .data(docs)
               .enter()
               .append('li')
               .append('a')
               .html(function(d) { return d.title; })
               .on('click', clickHelp);

           toc.append('li')
               .attr('class','walkthrough')
               .append('a')
               .text(t('splash.walkthrough'))
               .on('click', clickWalkthrough);

           var content = pane.append('div')
               .attr('class', 'left-content');

           var doctitle = content.append('h2')
               .text(t('help.title'));

           var body = content.append('div')
               .attr('class', 'body');

           var nav = content.append('div')
               .attr('class', 'nav');

           clickHelp(docs[0], 0);

           var keybinding = d3.keybinding('help')
               .on(key, toggle)
               .on('B', hide)
               .on('F', hide);

           d3.select(document)
               .call(keybinding);

           context.surface().on('mousedown.help-outside', hide);
           context.container().on('mousedown.help-outside', hide);
       }

       return help;
   }

   function Info(context) {
       var key = cmd('⌘I'),
           imperial = (iD.detect().locale.toLowerCase() === 'en-us'),
           hidden = true;

       function info(selection) {
           function radiansToMeters(r) {
               // using WGS84 authalic radius (6371007.1809 m)
               return r * 6371007.1809;
           }

           function steradiansToSqmeters(r) {
               // http://gis.stackexchange.com/a/124857/40446
               return r / 12.56637 * 510065621724000;
           }

           function toLineString(feature) {
               if (feature.type === 'LineString') return feature;

               var result = { type: 'LineString', coordinates: [] };
               if (feature.type === 'Polygon') {
                   result.coordinates = feature.coordinates[0];
               } else if (feature.type === 'MultiPolygon') {
                   result.coordinates = feature.coordinates[0][0];
               }

               return result;
           }

           function displayLength(m) {
               var d = m * (imperial ? 3.28084 : 1),
                   p, unit;

               if (imperial) {
                   if (d >= 5280) {
                       d /= 5280;
                       unit = 'mi';
                   } else {
                       unit = 'ft';
                   }
               } else {
                   if (d >= 1000) {
                       d /= 1000;
                       unit = 'km';
                   } else {
                       unit = 'm';
                   }
               }

               // drop unnecessary precision
               p = d > 1000 ? 0 : d > 100 ? 1 : 2;

               return String(d.toFixed(p)) + ' ' + unit;
           }

           function displayArea(m2) {
               var d = m2 * (imperial ? 10.7639111056 : 1),
                   d1, d2, p1, p2, unit1, unit2;

               if (imperial) {
                   if (d >= 6969600) {     // > 0.25mi² show mi²
                       d1 = d / 27878400;
                       unit1 = 'mi²';
                   } else {
                       d1 = d;
                       unit1 = 'ft²';
                   }

                   if (d > 4356 && d < 43560000) {   // 0.1 - 1000 acres
                       d2 = d / 43560;
                       unit2 = 'ac';
                   }

               } else {
                   if (d >= 250000) {    // > 0.25km² show km²
                       d1 = d / 1000000;
                       unit1 = 'km²';
                   } else {
                       d1 = d;
                       unit1 = 'm²';
                   }

                   if (d > 1000 && d < 10000000) {   // 0.1 - 1000 hectares
                       d2 = d / 10000;
                       unit2 = 'ha';
                   }
               }

               // drop unnecessary precision
               p1 = d1 > 1000 ? 0 : d1 > 100 ? 1 : 2;
               p2 = d2 > 1000 ? 0 : d2 > 100 ? 1 : 2;

               return String(d1.toFixed(p1)) + ' ' + unit1 +
                   (d2 ? ' (' + String(d2.toFixed(p2)) + ' ' + unit2 + ')' : '');
           }


           function redraw() {
               if (hidden) return;

               var resolver = context.graph(),
                   selected = _.filter(context.selectedIDs(), function(e) { return context.hasEntity(e); }),
                   singular = selected.length === 1 ? selected[0] : null,
                   extent = Extent(),
                   entity;

               wrap.html('');
               wrap.append('h4')
                   .attr('class', 'infobox-heading fillD')
                   .text(singular || t('infobox.selected', { n: selected.length }));

               if (!selected.length) return;

               var center;
               for (var i = 0; i < selected.length; i++) {
                   entity = context.entity(selected[i]);
                   extent._extend(entity.extent(resolver));
               }
               center = extent.center();


               var list = wrap.append('ul');

               // multiple wrap, just display extent center..
               if (!singular) {
                   list.append('li')
                       .text(t('infobox.center') + ': ' + center[0].toFixed(5) + ', ' + center[1].toFixed(5));
                   return;
               }

               // single wrap, display details..
               if (!entity) return;
               var geometry = entity.geometry(resolver);

               if (geometry === 'line' || geometry === 'area') {
                   var closed = (entity.type === 'relation') || (entity.isClosed() && !entity.isDegenerate()),
                       feature = entity.asGeoJSON(resolver),
                       length = radiansToMeters(d3.geo.length(toLineString(feature))),
                       lengthLabel = t('infobox.' + (closed ? 'perimeter' : 'length')),
                       centroid = d3.geo.centroid(feature);

                   list.append('li')
                       .text(t('infobox.geometry') + ': ' +
                           (closed ? t('infobox.closed') + ' ' : '') + t('geometry.' + geometry) );

                   if (closed) {
                       var area = steradiansToSqmeters(entity.area(resolver));
                       list.append('li')
                           .text(t('infobox.area') + ': ' + displayArea(area));
                   }

                   list.append('li')
                       .text(lengthLabel + ': ' + displayLength(length));

                   list.append('li')
                       .text(t('infobox.centroid') + ': ' + centroid[0].toFixed(5) + ', ' + centroid[1].toFixed(5));


                   var toggle  = imperial ? 'imperial' : 'metric';
                   wrap.append('a')
                       .text(t('infobox.' + toggle))
                       .attr('href', '#')
                       .attr('class', 'button')
                       .on('click', function() {
                           d3.event.preventDefault();
                           imperial = !imperial;
                           redraw();
                       });

               } else {
                   var centerLabel = t('infobox.' + (entity.type === 'node' ? 'location' : 'center'));

                   list.append('li')
                       .text(t('infobox.geometry') + ': ' + t('geometry.' + geometry));

                   list.append('li')
                       .text(centerLabel + ': ' + center[0].toFixed(5) + ', ' + center[1].toFixed(5));
               }
           }


           function toggle() {
               if (d3.event) d3.event.preventDefault();

               hidden = !hidden;

               if (hidden) {
                   wrap
                       .style('display', 'block')
                       .style('opacity', 1)
                       .transition()
                       .duration(200)
                       .style('opacity', 0)
                       .each('end', function() {
                           d3.select(this).style('display', 'none');
                       });
               } else {
                   wrap
                       .style('display', 'block')
                       .style('opacity', 0)
                       .transition()
                       .duration(200)
                       .style('opacity', 1);

                   redraw();
               }
           }


           var wrap = selection.selectAll('.infobox')
               .data([0]);

           wrap.enter()
               .append('div')
               .attr('class', 'infobox fillD2')
               .style('display', (hidden ? 'none' : 'block'));

           context.map()
               .on('drawn.info', redraw);

           redraw();

           var keybinding = d3.keybinding('info')
               .on(key, toggle);

           d3.select(document)
               .call(keybinding);
       }

       return info;
   }

   function PresetList(context) {
       var event = d3.dispatch('choose'),
           id,
           currentPreset,
           autofocus = false;

       function presetList(selection) {
           var geometry = context.geometry(id),
               presets = context.presets().matchGeometry(geometry);

           selection.html('');

           var messagewrap = selection.append('div')
               .attr('class', 'header fillL cf');

           var message = messagewrap.append('h3')
               .text(t('inspector.choose'));

           if (context.entity(id).isUsed(context.graph())) {
               messagewrap.append('button')
                   .attr('class', 'preset-choose')
                   .on('click', function() { event.choose(currentPreset); })
                   .append('span')
                   .html('&#9658;');
           } else {
               messagewrap.append('button')
                   .attr('class', 'close')
                   .on('click', function() {
                       context.enter(Browse(context));
                   })
                   .call(Icon('#icon-close'));
           }

           function keydown() {
               // hack to let delete shortcut work when search is autofocused
               if (search.property('value').length === 0 &&
                   (d3.event.keyCode === d3.keybinding.keyCodes['⌫'] ||
                    d3.event.keyCode === d3.keybinding.keyCodes['⌦'])) {
                   d3.event.preventDefault();
                   d3.event.stopPropagation();
                   Delete([id], context)();
               } else if (search.property('value').length === 0 &&
                   (d3.event.ctrlKey || d3.event.metaKey) &&
                   d3.event.keyCode === d3.keybinding.keyCodes.z) {
                   d3.event.preventDefault();
                   d3.event.stopPropagation();
                   context.undo();
               } else if (!d3.event.ctrlKey && !d3.event.metaKey) {
                   d3.select(this).on('keydown', null);
               }
           }

           function keypress() {
               // enter
               var value = search.property('value');
               if (d3.event.keyCode === 13 && value.length) {
                   list.selectAll('.preset-list-item:first-child').datum().choose();
               }
           }

           function inputevent() {
               var value = search.property('value');
               list.classed('filtered', value.length);
               if (value.length) {
                   var results = presets.search(value, geometry);
                   message.text(t('inspector.results', {
                       n: results.collection.length,
                       search: value
                   }));
                   list.call(drawList, results);
               } else {
                   list.call(drawList, context.presets().defaults(geometry, 36));
                   message.text(t('inspector.choose'));
               }
           }

           var searchWrap = selection.append('div')
               .attr('class', 'search-header');

           var search = searchWrap.append('input')
               .attr('class', 'preset-search-input')
               .attr('placeholder', t('inspector.search'))
               .attr('type', 'search')
               .on('keydown', keydown)
               .on('keypress', keypress)
               .on('input', inputevent);

           searchWrap
               .call(Icon('#icon-search', 'pre-text'));

           if (autofocus) {
               search.node().focus();
           }

           var listWrap = selection.append('div')
               .attr('class', 'inspector-body');

           var list = listWrap.append('div')
               .attr('class', 'preset-list fillL cf')
               .call(drawList, context.presets().defaults(geometry, 36));
       }

       function drawList(list, presets) {
           var collection = presets.collection.map(function(preset) {
               return preset.members ? CategoryItem(preset) : PresetItem(preset);
           });

           var items = list.selectAll('.preset-list-item')
               .data(collection, function(d) { return d.preset.id; });

           items.enter().append('div')
               .attr('class', function(item) { return 'preset-list-item preset-' + item.preset.id.replace('/', '-'); })
               .classed('current', function(item) { return item.preset === currentPreset; })
               .each(function(item) {
                   d3.select(this).call(item);
               })
               .style('opacity', 0)
               .transition()
               .style('opacity', 1);

           items.order();

           items.exit()
               .remove();
       }

       function CategoryItem(preset) {
           var box, sublist, shown = false;

           function item(selection) {
               var wrap = selection.append('div')
                   .attr('class', 'preset-list-button-wrap category col12');

               wrap.append('button')
                   .attr('class', 'preset-list-button')
                   .classed('expanded', false)
                   .call(PresetIcon()
                       .geometry(context.geometry(id))
                       .preset(preset))
                   .on('click', function() {
                       var isExpanded = d3.select(this).classed('expanded');
                       var triangle = isExpanded ? '▶ ' :  '▼ ';
                       d3.select(this).classed('expanded', !isExpanded);
                       d3.select(this).selectAll('.label').text(triangle + preset.name());
                       item.choose();
                   })
                   .append('div')
                   .attr('class', 'label')
                   .text(function() {
                     return '▶ ' + preset.name();
                   });

               box = selection.append('div')
                   .attr('class', 'subgrid col12')
                   .style('max-height', '0px')
                   .style('opacity', 0);

               box.append('div')
                   .attr('class', 'arrow');

               sublist = box.append('div')
                   .attr('class', 'preset-list fillL3 cf fl');
           }

           item.choose = function() {
               if (!box || !sublist) return;

               if (shown) {
                   shown = false;
                   box.transition()
                       .duration(200)
                       .style('opacity', '0')
                       .style('max-height', '0px')
                       .style('padding-bottom', '0px');
               } else {
                   shown = true;
                   sublist.call(drawList, preset.members);
                   box.transition()
                       .duration(200)
                       .style('opacity', '1')
                       .style('max-height', 200 + preset.members.collection.length * 80 + 'px')
                       .style('padding-bottom', '20px');
               }
           };

           item.preset = preset;

           return item;
       }

       function PresetItem(preset) {
           function item(selection) {
               var wrap = selection.append('div')
                   .attr('class', 'preset-list-button-wrap col12');

               wrap.append('button')
                   .attr('class', 'preset-list-button')
                   .call(PresetIcon()
                       .geometry(context.geometry(id))
                       .preset(preset))
                   .on('click', item.choose)
                   .append('div')
                   .attr('class', 'label')
                   .text(preset.name());

               wrap.call(item.reference.button);
               selection.call(item.reference.body);
           }

           item.choose = function() {
               context.presets().choose(preset);

               context.perform(
                   ChangePreset(id, currentPreset, preset),
                   t('operations.change_tags.annotation'));

               event.choose(preset);
           };

           item.help = function() {
               d3.event.stopPropagation();
               item.reference.toggle();
           };

           item.preset = preset;
           item.reference = TagReference(preset.reference(context.geometry(id)), context);

           return item;
       }

       presetList.autofocus = function(_) {
           if (!arguments.length) return autofocus;
           autofocus = _;
           return presetList;
       };

       presetList.entityID = function(_) {
           if (!arguments.length) return id;
           id = _;
           presetList.preset(context.presets().match(context.entity(id), context.graph()));
           return presetList;
       };

       presetList.preset = function(_) {
           if (!arguments.length) return currentPreset;
           currentPreset = _;
           return presetList;
       };

       return d3.rebind(presetList, event, 'on');
   }

   function ViewOnOSM(context) {
       var id;

       function viewOnOSM(selection) {
           var entity = context.entity(id);

           selection.style('display', entity.isNew() ? 'none' : null);

           var $link = selection.selectAll('.view-on-osm')
               .data([0]);

           $link.enter()
               .append('a')
               .attr('class', 'view-on-osm')
               .attr('target', '_blank')
               .call(Icon('#icon-out-link', 'inline'))
               .append('span')
               .text(t('inspector.view_on_osm'));

           $link
               .attr('href', context.connection().entityURL(entity));
       }

       viewOnOSM.entityID = function(_) {
           if (!arguments.length) return id;
           id = _;
           return viewOnOSM;
       };

       return viewOnOSM;
   }

   function Inspector(context) {
       var presetList = PresetList(context),
           entityEditor = EntityEditor(context),
           state = 'select',
           entityID,
           newFeature = false;

       function inspector(selection) {
           presetList
               .entityID(entityID)
               .autofocus(newFeature)
               .on('choose', setPreset);

           entityEditor
               .state(state)
               .entityID(entityID)
               .on('choose', showList);

           var $wrap = selection.selectAll('.panewrap')
               .data([0]);

           var $enter = $wrap.enter().append('div')
               .attr('class', 'panewrap');

           $enter.append('div')
               .attr('class', 'preset-list-pane pane');

           $enter.append('div')
               .attr('class', 'entity-editor-pane pane');

           var $presetPane = $wrap.select('.preset-list-pane');
           var $editorPane = $wrap.select('.entity-editor-pane');

           var graph = context.graph(),
               entity = context.entity(entityID),
               showEditor = state === 'hover' ||
                   entity.isUsed(graph) ||
                   entity.isHighwayIntersection(graph);

           if (showEditor) {
               $wrap.style('right', '0%');
               $editorPane.call(entityEditor);
           } else {
               $wrap.style('right', '-100%');
               $presetPane.call(presetList);
           }

           var $footer = selection.selectAll('.footer')
               .data([0]);

           $footer.enter().append('div')
               .attr('class', 'footer');

           selection.select('.footer')
               .call(ViewOnOSM(context)
                   .entityID(entityID));

           function showList(preset) {
               $wrap.transition()
                   .styleTween('right', function() { return d3.interpolate('0%', '-100%'); });

               $presetPane.call(presetList
                   .preset(preset)
                   .autofocus(true));
           }

           function setPreset(preset) {
               $wrap.transition()
                   .styleTween('right', function() { return d3.interpolate('-100%', '0%'); });

               $editorPane.call(entityEditor
                   .preset(preset));
           }
       }

       inspector.state = function(_) {
           if (!arguments.length) return state;
           state = _;
           entityEditor.state(state);
           return inspector;
       };

       inspector.entityID = function(_) {
           if (!arguments.length) return entityID;
           entityID = _;
           return inspector;
       };

       inspector.newFeature = function(_) {
           if (!arguments.length) return newFeature;
           newFeature = _;
           return inspector;
       };

       return inspector;
   }

   function Lasso$1(context) {
       var group, polygon;

       lasso.coordinates = [];

       function lasso(selection) {

           context.container().classed('lasso', true);

           group = selection.append('g')
               .attr('class', 'lasso hide');

           polygon = group.append('path')
               .attr('class', 'lasso-path');

           group.call(Toggle(true));

       }

       function draw() {
           if (polygon) {
               polygon.data([lasso.coordinates])
                   .attr('d', function(d) { return 'M' + d.join(' L') + ' Z'; });
           }
       }

       lasso.extent = function () {
           return lasso.coordinates.reduce(function(extent, point) {
               return extent.extend(Extent(point));
           }, Extent());
       };

       lasso.p = function(_) {
           if (!arguments.length) return lasso;
           lasso.coordinates.push(_);
           draw();
           return lasso;
       };

       lasso.close = function() {
           if (group) {
               group.call(Toggle(false, function() {
                   d3.select(this).remove();
               }));
           }
           context.container().classed('lasso', false);
       };

       return lasso;
   }

   function MapData(context) {
       var key = 'F',
           features = context.features().keys(),
           layers = context.layers(),
           fills = ['wireframe', 'partial', 'full'],
           fillDefault = context.storage('area-fill') || 'partial',
           fillSelected = fillDefault;


       function map_data(selection) {

           function showsFeature(d) {
               return context.features().enabled(d);
           }

           function autoHiddenFeature(d) {
               return context.features().autoHidden(d);
           }

           function clickFeature(d) {
               context.features().toggle(d);
               update();
           }

           function showsFill(d) {
               return fillSelected === d;
           }

           function setFill(d) {
               _.each(fills, function(opt) {
                   context.surface().classed('fill-' + opt, Boolean(opt === d));
               });

               fillSelected = d;
               if (d !== 'wireframe') {
                   fillDefault = d;
                   context.storage('area-fill', d);
               }
               update();
           }

           function showsLayer(which) {
               var layer = layers.layer(which);
               if (layer) {
                   return layer.enabled();
               }
               return false;
           }

           function setLayer(which, enabled) {
               var layer = layers.layer(which);
               if (layer) {
                   layer.enabled(enabled);
                   update();
               }
           }

           function toggleLayer(which) {
               setLayer(which, !showsLayer(which));
           }

           function clickGpx() {
               toggleLayer('gpx');
           }

           function clickMapillaryImages() {
               toggleLayer('mapillary-images');
               if (!showsLayer('mapillary-images')) {
                   setLayer('mapillary-signs', false);
               }
           }

           function clickMapillarySigns() {
               toggleLayer('mapillary-signs');
           }


           function drawMapillaryItems(selection) {
               var mapillaryImages = layers.layer('mapillary-images'),
                   mapillarySigns = layers.layer('mapillary-signs'),
                   supportsMapillaryImages = mapillaryImages && mapillaryImages.supported(),
                   supportsMapillarySigns = mapillarySigns && mapillarySigns.supported(),
                   showsMapillaryImages = supportsMapillaryImages && mapillaryImages.enabled(),
                   showsMapillarySigns = supportsMapillarySigns && mapillarySigns.enabled();

               var mapillaryList = selection
                   .selectAll('.layer-list-mapillary')
                   .data([0]);

               // Enter
               mapillaryList
                   .enter()
                   .append('ul')
                   .attr('class', 'layer-list layer-list-mapillary');

               var mapillaryImageLayerItem = mapillaryList
                   .selectAll('.list-item-mapillary-images')
                   .data(supportsMapillaryImages ? [0] : []);

               var enterImages = mapillaryImageLayerItem.enter()
                   .append('li')
                   .attr('class', 'list-item-mapillary-images');

               var labelImages = enterImages.append('label')
                   .call(bootstrap.tooltip()
                       .title(t('mapillary_images.tooltip'))
                       .placement('top'));

               labelImages.append('input')
                   .attr('type', 'checkbox')
                   .on('change', clickMapillaryImages);

               labelImages.append('span')
                   .text(t('mapillary_images.title'));


               var mapillarySignLayerItem = mapillaryList
                   .selectAll('.list-item-mapillary-signs')
                   .data(supportsMapillarySigns ? [0] : []);

               var enterSigns = mapillarySignLayerItem.enter()
                   .append('li')
                   .attr('class', 'list-item-mapillary-signs');

               var labelSigns = enterSigns.append('label')
                   .call(bootstrap.tooltip()
                       .title(t('mapillary_signs.tooltip'))
                       .placement('top'));

               labelSigns.append('input')
                   .attr('type', 'checkbox')
                   .on('change', clickMapillarySigns);

               labelSigns.append('span')
                   .text(t('mapillary_signs.title'));

               // Update
               mapillaryImageLayerItem
                   .classed('active', showsMapillaryImages)
                   .selectAll('input')
                   .property('checked', showsMapillaryImages);

               mapillarySignLayerItem
                   .classed('active', showsMapillarySigns)
                   .selectAll('input')
                   .property('disabled', !showsMapillaryImages)
                   .property('checked', showsMapillarySigns);

               mapillarySignLayerItem
                   .selectAll('label')
                   .classed('deemphasize', !showsMapillaryImages);

               // Exit
               mapillaryImageLayerItem.exit()
                   .remove();
               mapillarySignLayerItem.exit()
                   .remove();
           }


           function drawGpxItem(selection) {
               var gpx = layers.layer('gpx'),
                   hasGpx = gpx && gpx.hasGpx(),
                   showsGpx = hasGpx && gpx.enabled();

               var gpxLayerItem = selection
                   .selectAll('.layer-list-gpx')
                   .data(gpx ? [0] : []);

               // Enter
               var enter = gpxLayerItem.enter()
                   .append('ul')
                   .attr('class', 'layer-list layer-list-gpx')
                   .append('li')
                   .classed('list-item-gpx', true);

               enter.append('button')
                   .attr('class', 'list-item-gpx-extent')
                   .call(bootstrap.tooltip()
                       .title(t('gpx.zoom'))
                       .placement('left'))
                   .on('click', function() {
                       d3.event.preventDefault();
                       d3.event.stopPropagation();
                       gpx.fitZoom();
                   })
                   .call(Icon('#icon-search'));

               enter.append('button')
                   .attr('class', 'list-item-gpx-browse')
                   .call(bootstrap.tooltip()
                       .title(t('gpx.browse'))
                       .placement('left'))
                   .on('click', function() {
                       d3.select(document.createElement('input'))
                           .attr('type', 'file')
                           .on('change', function() {
                               gpx.files(d3.event.target.files);
                           })
                           .node().click();
                   })
                   .call(Icon('#icon-geolocate'));

               var labelGpx = enter.append('label')
                   .call(bootstrap.tooltip()
                       .title(t('gpx.drag_drop'))
                       .placement('top'));

               labelGpx.append('input')
                   .attr('type', 'checkbox')
                   .on('change', clickGpx);

               labelGpx.append('span')
                   .text(t('gpx.local_layer'));

               // Update
               gpxLayerItem
                   .classed('active', showsGpx)
                   .selectAll('input')
                   .property('disabled', !hasGpx)
                   .property('checked', showsGpx);

               gpxLayerItem
                   .selectAll('label')
                   .classed('deemphasize', !hasGpx);

               // Exit
               gpxLayerItem.exit()
                   .remove();
           }


           function drawList(selection, data, type, name, change, active) {
               var items = selection.selectAll('li')
                   .data(data);

               // Enter
               var enter = items.enter()
                   .append('li')
                   .attr('class', 'layer')
                   .call(bootstrap.tooltip()
                       .html(true)
                       .title(function(d) {
                           var tip = t(name + '.' + d + '.tooltip'),
                               key = (d === 'wireframe' ? 'W' : null);

                           if (name === 'feature' && autoHiddenFeature(d)) {
                               tip += '<div>' + t('map_data.autohidden') + '</div>';
                           }
                           return tooltipHtml(tip, key);
                       })
                       .placement('top')
                   );

               var label = enter.append('label');

               label.append('input')
                   .attr('type', type)
                   .attr('name', name)
                   .on('change', change);

               label.append('span')
                   .text(function(d) { return t(name + '.' + d + '.description'); });

               // Update
               items
                   .classed('active', active)
                   .selectAll('input')
                   .property('checked', active)
                   .property('indeterminate', function(d) {
                       return (name === 'feature' && autoHiddenFeature(d));
                   });

               // Exit
               items.exit()
                   .remove();
           }


           function update() {
               dataLayerContainer.call(drawMapillaryItems);
               dataLayerContainer.call(drawGpxItem);

               fillList.call(drawList, fills, 'radio', 'area_fill', setFill, showsFill);

               featureList.call(drawList, features, 'checkbox', 'feature', clickFeature, showsFeature);
           }

           function hidePanel() {
               setVisible(false);
           }

           function togglePanel() {
               if (d3.event) d3.event.preventDefault();
               tooltip.hide(button);
               setVisible(!button.classed('active'));
           }

           function toggleWireframe() {
               if (d3.event) {
                   d3.event.preventDefault();
                   d3.event.stopPropagation();
               }
               setFill((fillSelected === 'wireframe' ? fillDefault : 'wireframe'));
               context.map().pan([0,0]);  // trigger a redraw
           }

           function setVisible(show) {
               if (show !== shown) {
                   button.classed('active', show);
                   shown = show;

                   if (show) {
                       update();
                       selection.on('mousedown.map_data-inside', function() {
                           return d3.event.stopPropagation();
                       });
                       content.style('display', 'block')
                           .style('right', '-300px')
                           .transition()
                           .duration(200)
                           .style('right', '0px');
                   } else {
                       content.style('display', 'block')
                           .style('right', '0px')
                           .transition()
                           .duration(200)
                           .style('right', '-300px')
                           .each('end', function() {
                               d3.select(this).style('display', 'none');
                           });
                       selection.on('mousedown.map_data-inside', null);
                   }
               }
           }


           var content = selection.append('div')
                   .attr('class', 'fillL map-overlay col3 content hide'),
               tooltip = bootstrap.tooltip()
                   .placement('left')
                   .html(true)
                   .title(tooltipHtml(t('map_data.description'), key)),
               button = selection.append('button')
                   .attr('tabindex', -1)
                   .on('click', togglePanel)
                   .call(Icon('#icon-data', 'light'))
                   .call(tooltip),
               shown = false;

           content.append('h4')
               .text(t('map_data.title'));


           // data layers
           content.append('a')
               .text(t('map_data.data_layers'))
               .attr('href', '#')
               .classed('hide-toggle', true)
               .classed('expanded', true)
               .on('click', function() {
                   var exp = d3.select(this).classed('expanded');
                   dataLayerContainer.style('display', exp ? 'none' : 'block');
                   d3.select(this).classed('expanded', !exp);
                   d3.event.preventDefault();
               });

           var dataLayerContainer = content.append('div')
               .attr('class', 'data-data-layers')
               .style('display', 'block');


           // area fills
           content.append('a')
               .text(t('map_data.fill_area'))
               .attr('href', '#')
               .classed('hide-toggle', true)
               .classed('expanded', false)
               .on('click', function() {
                   var exp = d3.select(this).classed('expanded');
                   fillContainer.style('display', exp ? 'none' : 'block');
                   d3.select(this).classed('expanded', !exp);
                   d3.event.preventDefault();
               });

           var fillContainer = content.append('div')
               .attr('class', 'data-area-fills')
               .style('display', 'none');

           var fillList = fillContainer.append('ul')
               .attr('class', 'layer-list layer-fill-list');


           // feature filters
           content.append('a')
               .text(t('map_data.map_features'))
               .attr('href', '#')
               .classed('hide-toggle', true)
               .classed('expanded', false)
               .on('click', function() {
                   var exp = d3.select(this).classed('expanded');
                   featureContainer.style('display', exp ? 'none' : 'block');
                   d3.select(this).classed('expanded', !exp);
                   d3.event.preventDefault();
               });

           var featureContainer = content.append('div')
               .attr('class', 'data-feature-filters')
               .style('display', 'none');

           var featureList = featureContainer.append('ul')
               .attr('class', 'layer-list layer-feature-list');


           context.features()
               .on('change.map_data-update', update);

           setFill(fillDefault);

           var keybinding = d3.keybinding('features')
               .on(key, togglePanel)
               .on('W', toggleWireframe)
               .on('B', hidePanel)
               .on('H', hidePanel);

           d3.select(document)
               .call(keybinding);

           context.surface().on('mousedown.map_data-outside', hidePanel);
           context.container().on('mousedown.map_data-outside', hidePanel);
       }

       return map_data;
   }

   function Modes(context) {
       var modes = [
           AddPoint(context),
           AddLine(context),
           AddArea(context)];

       function editable() {
           return context.editable() && context.mode().id !== 'save';
       }

       return function(selection) {
           var buttons = selection.selectAll('button.add-button')
               .data(modes);

          buttons.enter().append('button')
              .attr('tabindex', -1)
              .attr('class', function(mode) { return mode.id + ' add-button col4'; })
              .on('click.mode-buttons', function(mode) {
                  if (mode.id === context.mode().id) {
                      context.enter(Browse(context));
                  } else {
                      context.enter(mode);
                  }
              })
              .call(bootstrap.tooltip()
                  .placement('bottom')
                  .html(true)
                  .title(function(mode) {
                      return tooltipHtml(mode.description, mode.key);
                  }));

           context.map()
               .on('move.modes', _.debounce(update, 500));

           context
               .on('enter.modes', update);

           buttons.each(function(d) {
               d3.select(this)
                   .call(Icon('#icon-' + d.button, 'pre-text'));
           });

           buttons.append('span')
               .attr('class', 'label')
               .text(function(mode) { return mode.title; });

           context.on('enter.editor', function(entered) {
               buttons.classed('active', function(mode) { return entered.button === mode.button; });
               context.container()
                   .classed('mode-' + entered.id, true);
           });

           context.on('exit.editor', function(exited) {
               context.container()
                   .classed('mode-' + exited.id, false);
           });

           var keybinding = d3.keybinding('mode-buttons');

           modes.forEach(function(m) {
               keybinding.on(m.key, function() { if (editable()) context.enter(m); });
           });

           d3.select(document)
               .call(keybinding);

           function update() {
               buttons.property('disabled', !editable());
           }
       };
   }

   function Notice(context) {
       return function(selection) {
           var div = selection.append('div')
               .attr('class', 'notice');

           var button = div.append('button')
               .attr('class', 'zoom-to notice')
               .on('click', function() { context.map().zoom(context.minEditableZoom()); });

           button
               .call(Icon('#icon-plus', 'pre-text'))
               .append('span')
               .attr('class', 'label')
               .text(t('zoom_in_edit'));

           function disableTooHigh() {
               div.style('display', context.editable() ? 'none' : 'block');
           }

           context.map()
               .on('move.notice', _.debounce(disableTooHigh, 500));

           disableTooHigh();
       };
   }

   function RadialMenu(context, operations) {
       var menu,
           center = [0, 0],
           tooltip;

       var radialMenu = function(selection) {
           if (!operations.length)
               return;

           selection.node().parentNode.focus();

           function click(operation) {
               d3.event.stopPropagation();
               if (operation.disabled())
                   return;
               operation();
               radialMenu.close();
           }

           menu = selection.append('g')
               .attr('class', 'radial-menu')
               .attr('transform', 'translate(' + center + ')')
               .attr('opacity', 0);

           menu.transition()
               .attr('opacity', 1);

           var r = 50,
               a = Math.PI / 4,
               a0 = -Math.PI / 4,
               a1 = a0 + (operations.length - 1) * a;

           menu.append('path')
               .attr('class', 'radial-menu-background')
               .attr('d', 'M' + r * Math.sin(a0) + ',' +
                                r * Math.cos(a0) +
                         ' A' + r + ',' + r + ' 0 ' + (operations.length > 5 ? '1' : '0') + ',0 ' +
                                (r * Math.sin(a1) + 1e-3) + ',' +
                                (r * Math.cos(a1) + 1e-3)) // Force positive-length path (#1305)
               .attr('stroke-width', 50)
               .attr('stroke-linecap', 'round');

           var button = menu.selectAll()
               .data(operations)
               .enter()
               .append('g')
               .attr('class', function(d) { return 'radial-menu-item radial-menu-item-' + d.id; })
               .classed('disabled', function(d) { return d.disabled(); })
               .attr('transform', function(d, i) {
                   return 'translate(' + roundCoords([
                           r * Math.sin(a0 + i * a),
                           r * Math.cos(a0 + i * a)]).join(',') + ')';
               });

           button.append('circle')
               .attr('r', 15)
               .on('click', click)
               .on('mousedown', mousedown)
               .on('mouseover', mouseover)
               .on('mouseout', mouseout);

           button.append('use')
               .attr('transform', 'translate(-10,-10)')
               .attr('width', '20')
               .attr('height', '20')
               .attr('xlink:href', function(d) { return '#operation-' + d.id; });

           tooltip = d3.select(document.body)
               .append('div')
               .attr('class', 'tooltip-inner radial-menu-tooltip');

           function mousedown() {
               d3.event.stopPropagation(); // https://github.com/openstreetmap/iD/issues/1869
           }

           function mouseover(d, i) {
               var rect = context.surfaceRect(),
                   angle = a0 + i * a,
                   top = rect.top + (r + 25) * Math.cos(angle) + center[1] + 'px',
                   left = rect.left + (r + 25) * Math.sin(angle) + center[0] + 'px',
                   bottom = rect.height - (r + 25) * Math.cos(angle) - center[1] + 'px',
                   right = rect.width - (r + 25) * Math.sin(angle) - center[0] + 'px';

               tooltip
                   .style('top', null)
                   .style('left', null)
                   .style('bottom', null)
                   .style('right', null)
                   .style('display', 'block')
                   .html(tooltipHtml(d.tooltip(), d.keys[0]));

               if (i === 0) {
                   tooltip
                       .style('right', right)
                       .style('top', top);
               } else if (i >= 4) {
                   tooltip
                       .style('left', left)
                       .style('bottom', bottom);
               } else {
                   tooltip
                       .style('left', left)
                       .style('top', top);
               }
           }

           function mouseout() {
               tooltip.style('display', 'none');
           }
       };

       radialMenu.close = function() {
           if (menu) {
               menu
                   .style('pointer-events', 'none')
                   .transition()
                   .attr('opacity', 0)
                   .remove();
           }

           if (tooltip) {
               tooltip.remove();
           }
       };

       radialMenu.center = function(_) {
           if (!arguments.length) return center;
           center = _;
           return radialMenu;
       };

       return radialMenu;
   }

   function Restore(context) {
       return function(selection) {
           if (!context.history().lock() || !context.history().restorableChanges())
               return;

           var modalSelection = modal(selection, true);

           modalSelection.select('.modal')
               .attr('class', 'modal fillL col6');

           var introModal = modalSelection.select('.content');

           introModal.attr('class','cf');

           introModal.append('div')
               .attr('class', 'modal-section')
               .append('h3')
               .text(t('restore.heading'));

           introModal.append('div')
               .attr('class','modal-section')
               .append('p')
               .text(t('restore.description'));

           var buttonWrap = introModal.append('div')
               .attr('class', 'modal-actions cf');

           var restore = buttonWrap.append('button')
               .attr('class', 'restore col6')
               .text(t('restore.restore'))
               .on('click', function() {
                   context.history().restore();
                   modalSelection.remove();
               });

           buttonWrap.append('button')
               .attr('class', 'reset col6')
               .text(t('restore.reset'))
               .on('click', function() {
                   context.history().clearSaved();
                   modalSelection.remove();
               });

           restore.node().focus();
       };
   }

   function Save(context) {
       var history = context.history(),
           key = cmd('⌘S');


       function saving() {
           return context.mode().id === 'save';
       }

       function save() {
           d3.event.preventDefault();
           if (!context.inIntro() && !saving() && history.hasChanges()) {
               context.enter(SaveMode(context));
           }
       }

       function getBackground(numChanges) {
           var step;
           if (numChanges === 0) {
               return null;
           } else if (numChanges <= 50) {
               step = numChanges / 50;
               return d3.interpolateRgb('#fff', '#ff8')(step);  // white -> yellow
           } else {
               step = Math.min((numChanges - 50) / 50, 1.0);
               return d3.interpolateRgb('#ff8', '#f88')(step);  // yellow -> red
           }
       }

       return function(selection) {
           var tooltip = bootstrap.tooltip()
               .placement('bottom')
               .html(true)
               .title(tooltipHtml(t('save.no_changes'), key));

           var button = selection.append('button')
               .attr('class', 'save col12 disabled')
               .attr('tabindex', -1)
               .on('click', save)
               .call(tooltip);

           button.append('span')
               .attr('class', 'label')
               .text(t('save.title'));

           button.append('span')
               .attr('class', 'count')
               .text('0');

           var keybinding = d3.keybinding('undo-redo')
               .on(key, save, true);

           d3.select(document)
               .call(keybinding);

           var numChanges = 0;

           context.history().on('change.save', function() {
               var _ = history.difference().summary().length;
               if (_ === numChanges)
                   return;
               numChanges = _;

               tooltip.title(tooltipHtml(t(numChanges > 0 ?
                       'save.help' : 'save.no_changes'), key));

               var background = getBackground(numChanges);

               button
                   .classed('disabled', numChanges === 0)
                   .classed('has-count', numChanges > 0)
                   .style('background', background);

               button.select('span.count')
                   .text(numChanges)
                   .style('background', background)
                   .style('border-color', background);
           });

           context.on('enter.save', function() {
               button.property('disabled', saving());
               if (saving()) button.call(tooltip.hide);
           });
       };
   }

   function Scale(context) {
       var projection = context.projection,
           imperial = (iD.detect().locale.toLowerCase() === 'en-us'),
           maxLength = 180,
           tickHeight = 8;

       function scaleDefs(loc1, loc2) {
           var lat = (loc2[1] + loc1[1]) / 2,
               conversion = (imperial ? 3.28084 : 1),
               dist = lonToMeters(loc2[0] - loc1[0], lat) * conversion,
               scale = { dist: 0, px: 0, text: '' },
               buckets, i, val, dLon;

           if (imperial) {
               buckets = [5280000, 528000, 52800, 5280, 500, 50, 5, 1];
           } else {
               buckets = [5000000, 500000, 50000, 5000, 500, 50, 5, 1];
           }

           // determine a user-friendly endpoint for the scale
           for (i = 0; i < buckets.length; i++) {
               val = buckets[i];
               if (dist >= val) {
                   scale.dist = Math.floor(dist / val) * val;
                   break;
               }
           }

           dLon = metersToLon(scale.dist / conversion, lat);
           scale.px = Math.round(projection([loc1[0] + dLon, loc1[1]])[0]);

           if (imperial) {
               if (scale.dist >= 5280) {
                   scale.dist /= 5280;
                   scale.text = String(scale.dist) + ' mi';
               } else {
                   scale.text = String(scale.dist) + ' ft';
               }
           } else {
               if (scale.dist >= 1000) {
                   scale.dist /= 1000;
                   scale.text = String(scale.dist) + ' km';
               } else {
                   scale.text = String(scale.dist) + ' m';
               }
           }

           return scale;
       }

       function update(selection) {
           // choose loc1, loc2 along bottom of viewport (near where the scale will be drawn)
           var dims = context.map().dimensions(),
               loc1 = projection.invert([0, dims[1]]),
               loc2 = projection.invert([maxLength, dims[1]]),
               scale = scaleDefs(loc1, loc2);

           selection.select('#scalepath')
               .attr('d', 'M0.5,0.5v' + tickHeight + 'h' + scale.px + 'v-' + tickHeight);

           selection.select('#scaletext')
               .attr('x', scale.px + 8)
               .attr('y', tickHeight)
               .text(scale.text);
       }


       return function(selection) {
           function switchUnits() {
               imperial = !imperial;
               selection.call(update);
           }

           var g = selection.append('svg')
               .attr('id', 'scale')
               .on('click', switchUnits)
               .append('g')
               .attr('transform', 'translate(10,11)');

           g.append('path').attr('id', 'scalepath');
           g.append('text').attr('id', 'scaletext');

           selection.call(update);

           context.map().on('move.scale', function() {
               update(selection);
           });
       };
   }

   function SelectionList(context, selectedIDs) {

       function selectEntity(entity) {
           context.enter(Select(context, [entity.id]).suppressMenu(true));
       }


       function selectionList(selection) {
           selection.classed('selection-list-pane', true);

           var header = selection.append('div')
               .attr('class', 'header fillL cf');

           header.append('h3')
               .text(t('inspector.multiselect'));

           var listWrap = selection.append('div')
               .attr('class', 'inspector-body');

           var list = listWrap.append('div')
               .attr('class', 'feature-list cf');

           context.history().on('change.selection-list', drawList);
           drawList();

           function drawList() {
               var entities = selectedIDs
                   .map(function(id) { return context.hasEntity(id); })
                   .filter(function(entity) { return entity; });

               var items = list.selectAll('.feature-list-item')
                   .data(entities, Entity.key);

               var enter = items.enter().append('button')
                   .attr('class', 'feature-list-item')
                   .on('click', selectEntity);

               // Enter
               var label = enter.append('div')
                   .attr('class', 'label')
                   .call(Icon('', 'pre-text'));

               label.append('span')
                   .attr('class', 'entity-type');

               label.append('span')
                   .attr('class', 'entity-name');

               // Update
               items.selectAll('use')
                   .attr('href', function() {
                       var entity = this.parentNode.parentNode.__data__;
                       return '#icon-' + context.geometry(entity.id);
                   });

               items.selectAll('.entity-type')
                   .text(function(entity) { return context.presets().match(entity, context.graph()).name(); });

               items.selectAll('.entity-name')
                   .text(function(entity) { return displayName(entity); });

               // Exit
               items.exit()
                   .remove();
           }
       }

       return selectionList;

   }

   function Sidebar(context) {
       var inspector = Inspector(context),
           current;

       function sidebar(selection) {
           var featureListWrap = selection.append('div')
               .attr('class', 'feature-list-pane')
               .call(FeatureList(context));

           selection.call(Notice(context));

           var inspectorWrap = selection.append('div')
               .attr('class', 'inspector-hidden inspector-wrap fr');

           function hover(id) {
               if (!current && context.hasEntity(id)) {
                   featureListWrap.classed('inspector-hidden', true);
                   inspectorWrap.classed('inspector-hidden', false)
                       .classed('inspector-hover', true);

                   if (inspector.entityID() !== id || inspector.state() !== 'hover') {
                       inspector
                           .state('hover')
                           .entityID(id);

                       inspectorWrap.call(inspector);
                   }
               } else if (!current) {
                   featureListWrap.classed('inspector-hidden', false);
                   inspectorWrap.classed('inspector-hidden', true);
                   inspector.state('hide');
               }
           }

           sidebar.hover = _.throttle(hover, 200);

           sidebar.select = function(id, newFeature) {
               if (!current && id) {
                   featureListWrap.classed('inspector-hidden', true);
                   inspectorWrap.classed('inspector-hidden', false)
                       .classed('inspector-hover', false);

                   if (inspector.entityID() !== id || inspector.state() !== 'select') {
                       inspector
                           .state('select')
                           .entityID(id)
                           .newFeature(newFeature);

                       inspectorWrap.call(inspector);
                   }
               } else if (!current) {
                   featureListWrap.classed('inspector-hidden', false);
                   inspectorWrap.classed('inspector-hidden', true);
                   inspector.state('hide');
               }
           };

           sidebar.show = function(component) {
               featureListWrap.classed('inspector-hidden', true);
               inspectorWrap.classed('inspector-hidden', true);
               if (current) current.remove();
               current = selection.append('div')
                   .attr('class', 'sidebar-component')
                   .call(component);
           };

           sidebar.hide = function() {
               featureListWrap.classed('inspector-hidden', false);
               inspectorWrap.classed('inspector-hidden', true);
               if (current) current.remove();
               current = null;
           };
       }

       sidebar.hover = function() {};
       sidebar.hover.cancel = function() {};
       sidebar.select = function() {};
       sidebar.show = function() {};
       sidebar.hide = function() {};

       return sidebar;
   }

   function SourceSwitch(context) {
       var keys;

       function click() {
           d3.event.preventDefault();

           if (context.history().hasChanges() &&
               !window.confirm(t('source_switch.lose_changes'))) return;

           var live = d3.select(this)
               .classed('live');

           context.connection()
               .switch(live ? keys[1] : keys[0]);

           context.enter(Browse(context));
           context.flush();

           d3.select(this)
               .text(live ? t('source_switch.dev') : t('source_switch.live'))
               .classed('live', !live);
       }

       var sourceSwitch = function(selection) {
           selection.append('a')
               .attr('href', '#')
               .text(t('source_switch.live'))
               .classed('live', true)
               .attr('tabindex', -1)
               .on('click', click);
       };

       sourceSwitch.keys = function(_) {
           if (!arguments.length) return keys;
           keys = _;
           return sourceSwitch;
       };

       return sourceSwitch;
   }

   function Spinner(context) {
       var connection = context.connection();

       return function(selection) {
           var img = selection.append('img')
               .attr('src', context.imagePath('loader-black.gif'))
               .style('opacity', 0);

           connection.on('loading.spinner', function() {
               img.transition()
                   .style('opacity', 1);
           });

           connection.on('loaded.spinner', function() {
               img.transition()
                   .style('opacity', 0);
           });
       };
   }

   function Splash(context) {
       return function(selection) {
           if (context.storage('sawSplash'))
                return;

           context.storage('sawSplash', true);

           var modalSelection = modal(selection);

           modalSelection.select('.modal')
               .attr('class', 'modal-splash modal col6');

           var introModal = modalSelection.select('.content')
               .append('div')
               .attr('class', 'fillL');

           introModal.append('div')
               .attr('class','modal-section cf')
               .append('h3').text(t('splash.welcome'));

           introModal.append('div')
               .attr('class','modal-section')
               .append('p')
               .html(t('splash.text', {
                   version: iD.version,
                   website: '<a href="http://ideditor.com/">ideditor.com</a>',
                   github: '<a href="https://github.com/openstreetmap/iD">github.com</a>'
               }));

           var buttons = introModal.append('div').attr('class', 'modal-actions cf');

           buttons.append('button')
               .attr('class', 'col6 walkthrough')
               .text(t('splash.walkthrough'))
               .on('click', function() {
                   d3.select(document.body).call(intro(context));
                   modalSelection.close();
               });

           buttons.append('button')
               .attr('class', 'col6 start')
               .text(t('splash.start'))
               .on('click', modalSelection.close);

           modalSelection.select('button.close').attr('class','hide');

       };
   }

   function Status(context) {
       var connection = context.connection(),
           errCount = 0;

       return function(selection) {

           function update() {

               connection.status(function(err, apiStatus) {

                   selection.html('');

                   if (err && errCount++ < 2) return;

                   if (err) {
                       selection.text(t('status.error'));

                   } else if (apiStatus === 'readonly') {
                       selection.text(t('status.readonly'));

                   } else if (apiStatus === 'offline') {
                       selection.text(t('status.offline'));
                   }

                   selection.attr('class', 'api-status ' + (err ? 'error' : apiStatus));
                   if (!err) errCount = 0;

               });
           }

           connection.on('auth', function() { update(selection); });
           window.setInterval(update, 90000);
           update(selection);
       };
   }

   function Success(context) {
       var dispatch = d3.dispatch('cancel'),
           changeset;

       function success(selection) {
           var message = (changeset.comment || t('success.edited_osm')).substring(0, 130) +
               ' ' + context.connection().changesetURL(changeset.id);

           var header = selection.append('div')
               .attr('class', 'header fillL');

           header.append('button')
               .attr('class', 'fr')
               .on('click', function() { dispatch.cancel(); })
               .call(Icon('#icon-close'));

           header.append('h3')
               .text(t('success.just_edited'));

           var body = selection.append('div')
               .attr('class', 'body save-success fillL');

           body.append('p')
               .html(t('success.help_html'));

           body.append('a')
               .attr('class', 'details')
               .attr('target', '_blank')
               .attr('tabindex', -1)
               .call(Icon('#icon-out-link', 'inline'))
               .attr('href', t('success.help_link_url'))
               .append('span')
               .text(t('success.help_link_text'));

           var changesetURL = context.connection().changesetURL(changeset.id);

           body.append('a')
               .attr('class', 'button col12 osm')
               .attr('target', '_blank')
               .attr('href', changesetURL)
               .text(t('success.view_on_osm'));

           var sharing = {
               facebook: 'https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(changesetURL),
               twitter: 'https://twitter.com/intent/tweet?source=webclient&text=' + encodeURIComponent(message),
               google: 'https://plus.google.com/share?url=' + encodeURIComponent(changesetURL)
           };

           body.selectAll('.button.social')
               .data(d3.entries(sharing))
               .enter()
               .append('a')
               .attr('class', 'button social col4')
               .attr('target', '_blank')
               .attr('href', function(d) { return d.value; })
               .call(bootstrap.tooltip()
                   .title(function(d) { return t('success.' + d.key); })
                   .placement('bottom'))
               .each(function(d) { d3.select(this).call(Icon('#logo-' + d.key, 'social')); });
       }

       success.changeset = function(_) {
           if (!arguments.length) return changeset;
           changeset = _;
           return success;
       };

       return d3.rebind(success, dispatch, 'on');
   }

   function UndoRedo(context) {
       var commands = [{
           id: 'undo',
           cmd: cmd('⌘Z'),
           action: function() { if (!(context.inIntro() || saving())) context.undo(); },
           annotation: function() { return context.history().undoAnnotation(); }
       }, {
           id: 'redo',
           cmd: cmd('⌘⇧Z'),
           action: function() {if (!(context.inIntro() || saving())) context.redo(); },
           annotation: function() { return context.history().redoAnnotation(); }
       }];

       function saving() {
           return context.mode().id === 'save';
       }

       return function(selection) {
           var tooltip = bootstrap.tooltip()
               .placement('bottom')
               .html(true)
               .title(function (d) {
                   return tooltipHtml(d.annotation() ?
                       t(d.id + '.tooltip', {action: d.annotation()}) :
                       t(d.id + '.nothing'), d.cmd);
               });

           var buttons = selection.selectAll('button')
               .data(commands)
               .enter().append('button')
               .attr('class', 'col6 disabled')
               .on('click', function(d) { return d.action(); })
               .call(tooltip);

           buttons.each(function(d) {
               d3.select(this)
                   .call(Icon('#icon-' + d.id));
           });

           var keybinding = d3.keybinding('undo')
               .on(commands[0].cmd, function() { d3.event.preventDefault(); commands[0].action(); })
               .on(commands[1].cmd, function() { d3.event.preventDefault(); commands[1].action(); });

           d3.select(document)
               .call(keybinding);

           context.history()
               .on('change.undo_redo', update);

           context
               .on('enter.undo_redo', update);

           function update() {
               buttons
                   .property('disabled', saving())
                   .classed('disabled', function(d) { return !d.annotation(); })
                   .each(function() {
                       var selection = d3.select(this);
                       if (selection.property('tooltipVisible')) {
                           selection.call(tooltip.show);
                       }
                   });
           }
       };
   }

   function Zoom(context) {
       var zooms = [{
           id: 'zoom-in',
           icon: 'plus',
           title: t('zoom.in'),
           action: context.zoomIn,
           key: '+'
       }, {
           id: 'zoom-out',
           icon: 'minus',
           title: t('zoom.out'),
           action: context.zoomOut,
           key: '-'
       }];

       function zoomIn() {
           d3.event.preventDefault();
           if (!context.inIntro()) context.zoomIn();
       }

       function zoomOut() {
           d3.event.preventDefault();
           if (!context.inIntro()) context.zoomOut();
       }

       function zoomInFurther() {
           d3.event.preventDefault();
           if (!context.inIntro()) context.zoomInFurther();
       }

       function zoomOutFurther() {
           d3.event.preventDefault();
           if (!context.inIntro()) context.zoomOutFurther();
       }


       return function(selection) {
           var button = selection.selectAll('button')
               .data(zooms)
               .enter().append('button')
               .attr('tabindex', -1)
               .attr('class', function(d) { return d.id; })
               .on('click.editor', function(d) { d.action(); })
               .call(bootstrap.tooltip()
                   .placement('left')
                   .html(true)
                   .title(function(d) {
                       return tooltipHtml(d.title, d.key);
                   }));

           button.each(function(d) {
               d3.select(this)
                   .call(Icon('#icon-' + d.icon, 'light'));
           });

           var keybinding = d3.keybinding('zoom');

           _.each(['=','ffequals','plus','ffplus'], function(key) {
               keybinding.on(key, zoomIn);
               keybinding.on('⇧' + key, zoomIn);
               keybinding.on(cmd('⌘' + key), zoomInFurther);
               keybinding.on(cmd('⌘⇧' + key), zoomInFurther);
           });
           _.each(['-','ffminus','_','dash'], function(key) {
               keybinding.on(key, zoomOut);
               keybinding.on('⇧' + key, zoomOut);
               keybinding.on(cmd('⌘' + key), zoomOutFurther);
               keybinding.on(cmd('⌘⇧' + key), zoomOutFurther);
           });

           d3.select(document)
               .call(keybinding);
       };
   }

   function init(context) {
       function render(container) {
           var map = context.map();

           if (iD.detect().opera) container.classed('opera', true);

           var hash = Hash(context);

           hash();

           if (!hash.hadHash) {
               map.centerZoom([0, 0], 2);
           }

           container.append('svg')
               .attr('id', 'defs')
               .call(Defs(context));

           container.append('div')
               .attr('id', 'sidebar')
               .attr('class', 'col4')
               .call(ui.sidebar);

           var content = container.append('div')
               .attr('id', 'content');

           var bar = content.append('div')
               .attr('id', 'bar')
               .attr('class', 'fillD');

           content.append('div')
               .attr('id', 'map')
               .call(map);

           content
               .call(MapInMap(context));

           content.append('div')
               .call(Info(context));

           bar.append('div')
               .attr('class', 'spacer col4');

           var limiter = bar.append('div')
               .attr('class', 'limiter');

           limiter.append('div')
               .attr('class', 'button-wrap joined col3')
               .call(Modes(context), limiter);

           limiter.append('div')
               .attr('class', 'button-wrap joined col1')
               .call(UndoRedo(context));

           limiter.append('div')
               .attr('class', 'button-wrap col1')
               .call(Save(context));

           bar.append('div')
               .attr('class', 'full-screen')
               .call(FullScreen(context));

           bar.append('div')
               .attr('class', 'spinner')
               .call(Spinner(context));

           var controls = bar.append('div')
               .attr('class', 'map-controls');

           controls.append('div')
               .attr('class', 'map-control zoombuttons')
               .call(Zoom(context));

           controls.append('div')
               .attr('class', 'map-control geolocate-control')
               .call(Geolocate(context));

           controls.append('div')
               .attr('class', 'map-control background-control')
               .call(Background(context));

           controls.append('div')
               .attr('class', 'map-control map-data-control')
               .call(MapData(context));

           controls.append('div')
               .attr('class', 'map-control help-control')
               .call(Help(context));

           var about = content.append('div')
               .attr('id', 'about');

           about.append('div')
               .attr('id', 'attrib')
               .call(Attribution(context));

           var footer = about.append('div')
               .attr('id', 'footer')
               .attr('class', 'fillD');

           footer.append('div')
               .attr('class', 'api-status')
               .call(Status(context));

           footer.append('div')
               .attr('id', 'scale-block')
               .call(Scale(context));

           var aboutList = footer.append('div')
               .attr('id', 'info-block')
               .append('ul')
               .attr('id', 'about-list');

           if (!context.embed()) {
               aboutList.call(Account(context));
           }

           aboutList.append('li')
               .append('a')
               .attr('target', '_blank')
               .attr('tabindex', -1)
               .attr('href', 'https://github.com/openstreetmap/iD')
               .text(iD.version);

           var issueLinks = aboutList.append('li');

           issueLinks.append('a')
               .attr('target', '_blank')
               .attr('tabindex', -1)
               .attr('href', 'https://github.com/openstreetmap/iD/issues')
               .call(Icon('#icon-bug', 'light'))
               .call(bootstrap.tooltip()
                   .title(t('report_a_bug'))
                   .placement('top')
               );

           issueLinks.append('a')
               .attr('target', '_blank')
               .attr('tabindex', -1)
               .attr('href', 'https://github.com/openstreetmap/iD/blob/master/CONTRIBUTING.md#translating')
               .call(Icon('#icon-translate', 'light'))
               .call(bootstrap.tooltip()
                   .title(t('help_translate'))
                   .placement('top')
               );

           aboutList.append('li')
               .attr('class', 'feature-warning')
               .attr('tabindex', -1)
               .call(FeatureInfo(context));

           aboutList.append('li')
               .attr('class', 'user-list')
               .attr('tabindex', -1)
               .call(Contributors(context));

           window.onbeforeunload = function() {
               return context.save();
           };

           window.onunload = function() {
               context.history().unlock();
           };

           var mapDimensions = map.dimensions();

           d3.select(window).on('resize.editor', function() {
               mapDimensions = content.dimensions(null);
               map.dimensions(mapDimensions);
           });

           function pan(d) {
               return function() {
                   d3.event.preventDefault();
                   if (!context.inIntro()) context.pan(d);
               };
           }

           // pan amount
           var pa = 10;

           var keybinding = d3.keybinding('main')
               .on('⌫', function() { d3.event.preventDefault(); })
               .on('←', pan([pa, 0]))
               .on('↑', pan([0, pa]))
               .on('→', pan([-pa, 0]))
               .on('↓', pan([0, -pa]))
               .on('⇧←', pan([mapDimensions[0], 0]))
               .on('⇧↑', pan([0, mapDimensions[1]]))
               .on('⇧→', pan([-mapDimensions[0], 0]))
               .on('⇧↓', pan([0, -mapDimensions[1]]))
               .on(cmd('⌘←'), pan([mapDimensions[0], 0]))
               .on(cmd('⌘↑'), pan([0, mapDimensions[1]]))
               .on(cmd('⌘→'), pan([-mapDimensions[0], 0]))
               .on(cmd('⌘↓'), pan([0, -mapDimensions[1]]));

           d3.select(document)
               .call(keybinding);

           context.enter(Browse(context));

           context.container()
               .call(Splash(context))
               .call(Restore(context));

           var authenticating = Loading(context)
               .message(t('loading_auth'));

           context.connection()
               .on('authenticating.ui', function() {
                   context.container()
                       .call(authenticating);
               })
               .on('authenticated.ui', function() {
                   authenticating.close();
               });
       }

       function ui(container) {
           context.container(container);
           context.loadLocale(function() {
               render(container);
           });
       }

       //TODO: figure this sidebar
       ui.sidebar = Sidebar(context);

       return ui;
   }


   //
   // ui.preset = preset;
   // Object.keys(fields).map(function(p) {
   //     ui.preset[p] = fields[p];
   // });
   //
   // ui.intro = intro;
   // ui.Account = Account;
   // ui.Attribution = Attribution;
   // ui.Background = Background;
   // ui.cmd = cmd;
   // ui.Commit = Commit;
   // ui.confirm = confirm;
   // ui.Conflicts = Conflicts;
   // ui.Contributors = Contributors;
   // ui.Disclosure = Disclosure;
   // ui.EntityEditor = EntityEditor;
   // ui.FeatureInfo = FeatureInfo;
   // ui.FeatureList = FeatureList;
   // ui.flash = flash;
   // ui.FullScreen = FullScreen;
   // ui.Geolocate = Geolocate;
   // ui.Help = Help;
   // ui.Info = Info;
   // ui.Inspector = Inspector;
   // ui.intro = intro;
   // ui.Lasso = Lasso;
   // ui.Loading = Loading;
   // ui.MapData = MapData;
   // ui.MapInMap = MapInMap;
   // ui.modal = modal;
   // ui.Modes = Modes;
   // ui.Notice = Notice;
   // ui.preset = preset;
   // ui.PresetIcon = PresetIcon;
   // ui.PresetList = PresetList;
   // ui.RadialMenu = RadialMenu;
   // ui.RawMemberEditor = RawMemberEditor;
   // ui.RawMembershipEditor = RawMembershipEditor;
   // ui.RawTagEditor = RawTagEditor;
   // ui.Restore = Restore;
   // ui.Save = Save;
   // ui.Scale = Scale;
   // ui.SelectionList = SelectionList;
   // ui.Sidebar = Sidebar;
   // ui.SourceSwitch = SourceSwitch;
   // ui.Spinner = Spinner;
   // ui.Splash = Splash;
   // ui.Status = Status;
   // ui.Success = Success;
   // ui.TagReference = TagReference;
   // ui.Toggle = Toggle;
   // ui.tooltipHtml = tooltipHtml;
   // ui.UndoRedo = UndoRedo;
   // ui.ViewOnOSM = ViewOnOSM;
   // ui.Zoom = Zoom;



   var ui = Object.freeze({
   	init: init,
   	fields: fields,
   	Account: Account,
   	Attribution: Attribution,
   	Background: Background,
   	cmd: cmd,
   	Commit: Commit,
   	confirm: confirm$1,
   	Conflicts: Conflicts,
   	Contributors: Contributors,
   	Disclosure: Disclosure,
   	EntityEditor: EntityEditor,
   	FeatureInfo: FeatureInfo,
   	FeatureList: FeatureList,
   	flash: flash,
   	FullScreen: FullScreen,
   	Geolocate: Geolocate,
   	Help: Help,
   	Info: Info,
   	Inspector: Inspector,
   	intro: intro,
   	Lasso: Lasso$1,
   	Loading: Loading,
   	MapData: MapData,
   	MapInMap: MapInMap,
   	modal: modal,
   	Modes: Modes,
   	Notice: Notice,
   	preset: preset,
   	PresetIcon: PresetIcon,
   	PresetList: PresetList,
   	RadialMenu: RadialMenu,
   	RawMemberEditor: RawMemberEditor,
   	RawMembershipEditor: RawMembershipEditor,
   	RawTagEditor: RawTagEditor,
   	Restore: Restore,
   	Save: Save,
   	Scale: Scale,
   	SelectionList: SelectionList,
   	Sidebar: Sidebar,
   	SourceSwitch: SourceSwitch,
   	Spinner: Spinner,
   	Splash: Splash,
   	Status: Status,
   	Success: Success,
   	TagReference: TagReference,
   	Toggle: Toggle,
   	tooltipHtml: tooltipHtml,
   	UndoRedo: UndoRedo,
   	ViewOnOSM: ViewOnOSM,
   	Zoom: Zoom
   });

   function History(context) {
       var stack, index, tree,
           imageryUsed = ['Bing'],
           dispatch = d3.dispatch('change', 'undone', 'redone'),
           lock = SessionMutex('lock');

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

                               var loading = Loading(context).blocking(true);
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

   function Turn(turn) {
       if (!(this instanceof Turn))
           return new Turn(turn);
       _.extend(this, turn);
   }

   function Intersection(graph, vertexId) {
       var vertex = graph.entity(vertexId),
           parentWays = graph.parentWays(vertex),
           coincident = [],
           highways = {};

       function addHighway(way, adjacentNodeId) {
           if (highways[adjacentNodeId]) {
               coincident.push(adjacentNodeId);
           } else {
               highways[adjacentNodeId] = way;
           }
       }

       // Pre-split ways that would need to be split in
       // order to add a restriction. The real split will
       // happen when the restriction is added.
       parentWays.forEach(function(way) {
           if (!way.tags.highway || way.isArea() || way.isDegenerate())
               return;

           var isFirst = (vertexId === way.first()),
               isLast = (vertexId === way.last()),
               isAffix = (isFirst || isLast),
               isClosingNode = (isFirst && isLast);

           if (isAffix && !isClosingNode) {
               var index = (isFirst ? 1 : way.nodes.length - 2);
               addHighway(way, way.nodes[index]);

           } else {
               var splitIndex, wayA, wayB, indexA, indexB;
               if (isClosingNode) {
                   splitIndex = Math.ceil(way.nodes.length / 2);  // split at midpoint
                   wayA = Way({id: way.id + '-a', tags: way.tags, nodes: way.nodes.slice(0, splitIndex)});
                   wayB = Way({id: way.id + '-b', tags: way.tags, nodes: way.nodes.slice(splitIndex)});
                   indexA = 1;
                   indexB = way.nodes.length - 2;
               } else {
                   splitIndex = _.indexOf(way.nodes, vertex.id, 1);  // split at vertexid
                   wayA = Way({id: way.id + '-a', tags: way.tags, nodes: way.nodes.slice(0, splitIndex + 1)});
                   wayB = Way({id: way.id + '-b', tags: way.tags, nodes: way.nodes.slice(splitIndex)});
                   indexA = splitIndex - 1;
                   indexB = splitIndex + 1;
               }
               graph = graph.replace(wayA).replace(wayB);
               addHighway(wayA, way.nodes[indexA]);
               addHighway(wayB, way.nodes[indexB]);
           }
       });

       // remove any ways from this intersection that are coincident
       // (i.e. any adjacent node used by more than one intersecting way)
       coincident.forEach(function (n) {
           delete highways[n];
       });


       var intersection = {
           highways: highways,
           ways: _.values(highways),
           graph: graph
       };

       intersection.adjacentNodeId = function(fromWayId) {
           return _.find(_.keys(highways), function(k) {
               return highways[k].id === fromWayId;
           });
       };

       intersection.turns = function(fromNodeId) {
           var start = highways[fromNodeId];
           if (!start)
               return [];

           if (start.first() === vertex.id && start.tags.oneway === 'yes')
               return [];
           if (start.last() === vertex.id && start.tags.oneway === '-1')
               return [];

           function withRestriction(turn) {
               graph.parentRelations(graph.entity(turn.from.way)).forEach(function(relation) {
                   if (relation.tags.type !== 'restriction')
                       return;

                   var f = relation.memberByRole('from'),
                       t = relation.memberByRole('to'),
                       v = relation.memberByRole('via');

                   if (f && f.id === turn.from.way &&
                       v && v.id === turn.via.node &&
                       t && t.id === turn.to.way) {
                       turn.restriction = relation.id;
                   } else if (/^only_/.test(relation.tags.restriction) &&
                       f && f.id === turn.from.way &&
                       v && v.id === turn.via.node &&
                       t && t.id !== turn.to.way) {
                       turn.restriction = relation.id;
                       turn.indirect_restriction = true;
                   }
               });

               return Turn(turn);
           }

           var from = {
                   node: fromNodeId,
                   way: start.id.split(/-(a|b)/)[0]
               },
               via = { node: vertex.id },
               turns = [];

           _.each(highways, function(end, adjacentNodeId) {
               if (end === start)
                   return;

               // backward
               if (end.first() !== vertex.id && end.tags.oneway !== 'yes') {
                   turns.push(withRestriction({
                       from: from,
                       via: via,
                       to: {
                           node: adjacentNodeId,
                           way: end.id.split(/-(a|b)/)[0]
                       }
                   }));
               }

               // forward
               if (end.last() !== vertex.id && end.tags.oneway !== '-1') {
                   turns.push(withRestriction({
                       from: from,
                       via: via,
                       to: {
                           node: adjacentNodeId,
                           way: end.id.split(/-(a|b)/)[0]
                       }
                   }));
               }

           });

           // U-turn
           if (start.tags.oneway !== 'yes' && start.tags.oneway !== '-1') {
               turns.push(withRestriction({
                   from: from,
                   via: via,
                   to: from,
                   u: true
               }));
           }

           return turns;
       };

       return intersection;
   }


   function inferRestriction(graph, from, via, to, projection) {
       var fromWay = graph.entity(from.way),
           fromNode = graph.entity(from.node),
           toWay = graph.entity(to.way),
           toNode = graph.entity(to.node),
           viaNode = graph.entity(via.node),
           fromOneWay = (fromWay.tags.oneway === 'yes' && fromWay.last() === via.node) ||
               (fromWay.tags.oneway === '-1' && fromWay.first() === via.node),
           toOneWay = (toWay.tags.oneway === 'yes' && toWay.first() === via.node) ||
               (toWay.tags.oneway === '-1' && toWay.last() === via.node),
           angle = getAngle(viaNode, fromNode, projection) -
                   getAngle(viaNode, toNode, projection);

       angle = angle * 180 / Math.PI;

       while (angle < 0)
           angle += 360;

       if (fromNode === toNode)
           return 'no_u_turn';
       if ((angle < 23 || angle > 336) && fromOneWay && toOneWay)
           return 'no_u_turn';
       if (angle < 158)
           return 'no_right_turn';
       if (angle > 202)
           return 'no_left_turn';

       return 'no_straight_on';
   }

   // For fixing up rendering of multipolygons with tags on the outer member.
   // https://github.com/openstreetmap/iD/issues/613
   function isSimpleMultipolygonOuterMember(entity, graph) {
       if (entity.type !== 'way')
           return false;

       var parents = graph.parentRelations(entity);
       if (parents.length !== 1)
           return false;

       var parent = parents[0];
       if (!parent.isMultipolygon() || Object.keys(parent.tags).length > 1)
           return false;

       var members = parent.members, member;
       for (var i = 0; i < members.length; i++) {
           member = members[i];
           if (member.id === entity.id && member.role && member.role !== 'outer')
               return false; // Not outer member
           if (member.id !== entity.id && (!member.role || member.role === 'outer'))
               return false; // Not a simple multipolygon
       }

       return parent;
   }

   function simpleMultipolygonOuterMember(entity, graph) {
       if (entity.type !== 'way')
           return false;

       var parents = graph.parentRelations(entity);
       if (parents.length !== 1)
           return false;

       var parent = parents[0];
       if (!parent.isMultipolygon() || Object.keys(parent.tags).length > 1)
           return false;

       var members = parent.members, member, outerMember;
       for (var i = 0; i < members.length; i++) {
           member = members[i];
           if (!member.role || member.role === 'outer') {
               if (outerMember)
                   return false; // Not a simple multipolygon
               outerMember = member;
           }
       }

       return outerMember && graph.hasEntity(outerMember.id);
   }

   // Join `array` into sequences of connecting ways.
   //
   // Segments which share identical start/end nodes will, as much as possible,
   // be connected with each other.
   //
   // The return value is a nested array. Each constituent array contains elements
   // of `array` which have been determined to connect. Each consitituent array
   // also has a `nodes` property whose value is an ordered array of member nodes,
   // with appropriate order reversal and start/end coordinate de-duplication.
   //
   // Members of `array` must have, at minimum, `type` and `id` properties.
   // Thus either an array of `iD.Way`s or a relation member array may be
   // used.
   //
   // If an member has a `tags` property, its tags will be reversed via
   // `iD.actions.Reverse` in the output.
   //
   // Incomplete members (those for which `graph.hasEntity(element.id)` returns
   // false) and non-way members are ignored.
   //
   function joinWays(array, graph) {
       var joined = [], member, current, nodes, first, last, i, how, what;

       array = array.filter(function(member) {
           return member.type === 'way' && graph.hasEntity(member.id);
       });

       function resolve(member) {
           return graph.childNodes(graph.entity(member.id));
       }

       function reverse(member) {
           return member.tags ? iD.actions.Reverse(member.id, {reverseOneway: true})(graph).entity(member.id) : member;
       }

       while (array.length) {
           member = array.shift();
           current = [member];
           current.nodes = nodes = resolve(member).slice();
           joined.push(current);

           while (array.length && _.first(nodes) !== _.last(nodes)) {
               first = _.first(nodes);
               last  = _.last(nodes);

               for (i = 0; i < array.length; i++) {
                   member = array[i];
                   what = resolve(member);

                   if (last === _.first(what)) {
                       how  = nodes.push;
                       what = what.slice(1);
                       break;
                   } else if (last === _.last(what)) {
                       how  = nodes.push;
                       what = what.slice(0, -1).reverse();
                       member = reverse(member);
                       break;
                   } else if (first === _.last(what)) {
                       how  = nodes.unshift;
                       what = what.slice(0, -1);
                       break;
                   } else if (first === _.first(what)) {
                       how  = nodes.unshift;
                       what = what.slice(1).reverse();
                       member = reverse(member);
                       break;
                   } else {
                       what = how = null;
                   }
               }

               if (!what)
                   break; // No more joinable ways.

               how.apply(current, [member]);
               how.apply(nodes, what);

               array.splice(i, 1);
           }
       }

       return joined;
   }

   /*
       Bypasses features of D3's default projection stream pipeline that are unnecessary:
       * Antimeridian clipping
       * Spherical rotation
       * Resampling
   */
   function RawMercator() {
       var project = d3.geo.mercator.raw,
           k = 512 / Math.PI, // scale
           x = 0, y = 0, // translate
           clipExtent = [[0, 0], [0, 0]];

       function projection(point) {
           point = project(point[0] * Math.PI / 180, point[1] * Math.PI / 180);
           return [point[0] * k + x, y - point[1] * k];
       }

       projection.invert = function(point) {
           point = project.invert((point[0] - x) / k, (y - point[1]) / k);
           return point && [point[0] * 180 / Math.PI, point[1] * 180 / Math.PI];
       };

       projection.scale = function(_) {
           if (!arguments.length) return k;
           k = +_;
           return projection;
       };

       projection.translate = function(_) {
           if (!arguments.length) return [x, y];
           x = +_[0];
           y = +_[1];
           return projection;
       };

       projection.clipExtent = function(_) {
           if (!arguments.length) return clipExtent;
           clipExtent = _;
           return projection;
       };

       projection.stream = d3.geo.transform({
           point: function(x, y) {
               x = projection([x, y]);
               this.stream.point(x[0], x[1]);
           }
       }).stream;

       return projection;
   }

   function roundCoords(c) {
       return [Math.floor(c[0]), Math.floor(c[1])];
   }

   function interp(p1, p2, t) {
       return [p1[0] + (p2[0] - p1[0]) * t,
               p1[1] + (p2[1] - p1[1]) * t];
   }

   // 2D cross product of OA and OB vectors, i.e. z-component of their 3D cross product.
   // Returns a positive value, if OAB makes a counter-clockwise turn,
   // negative for clockwise turn, and zero if the points are collinear.
   function cross(o, a, b) {
       return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
   }

   // http://jsperf.com/id-dist-optimization
   function euclideanDistance(a, b) {
       var x = a[0] - b[0], y = a[1] - b[1];
       return Math.sqrt((x * x) + (y * y));
   }

   // using WGS84 polar radius (6356752.314245179 m)
   // const = 2 * PI * r / 360
   function latToMeters(dLat) {
       return dLat * 110946.257617;
   }

   // using WGS84 equatorial radius (6378137.0 m)
   // const = 2 * PI * r / 360
   function lonToMeters(dLon, atLat) {
       return Math.abs(atLat) >= 90 ? 0 :
           dLon * 111319.490793 * Math.abs(Math.cos(atLat * (Math.PI/180)));
   }

   // using WGS84 polar radius (6356752.314245179 m)
   // const = 2 * PI * r / 360
   function metersToLat(m) {
       return m / 110946.257617;
   }

   // using WGS84 equatorial radius (6378137.0 m)
   // const = 2 * PI * r / 360
   function metersToLon(m, atLat) {
       return Math.abs(atLat) >= 90 ? 0 :
           m / 111319.490793 / Math.abs(Math.cos(atLat * (Math.PI/180)));
   }

   function offsetToMeters(offset) {
       var equatRadius = 6356752.314245179,
           polarRadius = 6378137.0,
           tileSize = 256;

       return [
           offset[0] * 2 * Math.PI * equatRadius / tileSize,
           -offset[1] * 2 * Math.PI * polarRadius / tileSize
       ];
   }

   function metersToOffset(meters) {
       var equatRadius = 6356752.314245179,
           polarRadius = 6378137.0,
           tileSize = 256;

       return [
           meters[0] * tileSize / (2 * Math.PI * equatRadius),
           -meters[1] * tileSize / (2 * Math.PI * polarRadius)
       ];
   }

   // Equirectangular approximation of spherical distances on Earth
   function sphericalDistance(a, b) {
       var x = lonToMeters(a[0] - b[0], (a[1] + b[1]) / 2),
           y = latToMeters(a[1] - b[1]);
       return Math.sqrt((x * x) + (y * y));
   }

   function edgeEqual(a, b) {
       return (a[0] === b[0] && a[1] === b[1]) ||
           (a[0] === b[1] && a[1] === b[0]);
   }

   // Return the counterclockwise angle in the range (-pi, pi)
   // between the positive X axis and the line intersecting a and b.
   function getAngle(a, b, projection) {
       a = projection(a.loc);
       b = projection(b.loc);
       return Math.atan2(b[1] - a[1], b[0] - a[0]);
   }

   // Choose the edge with the minimal distance from `point` to its orthogonal
   // projection onto that edge, if such a projection exists, or the distance to
   // the closest vertex on that edge. Returns an object with the `index` of the
   // chosen edge, the chosen `loc` on that edge, and the `distance` to to it.
   function chooseEdge(nodes, point, projection) {
       var dist = euclideanDistance,
           points = nodes.map(function(n) { return projection(n.loc); }),
           min = Infinity,
           idx, loc;

       function dot(p, q) {
           return p[0] * q[0] + p[1] * q[1];
       }

       for (var i = 0; i < points.length - 1; i++) {
           var o = points[i],
               s = [points[i + 1][0] - o[0],
                    points[i + 1][1] - o[1]],
               v = [point[0] - o[0],
                    point[1] - o[1]],
               proj = dot(v, s) / dot(s, s),
               p;

           if (proj < 0) {
               p = o;
           } else if (proj > 1) {
               p = points[i + 1];
           } else {
               p = [o[0] + proj * s[0], o[1] + proj * s[1]];
           }

           var d = dist(p, point);
           if (d < min) {
               min = d;
               idx = i + 1;
               loc = projection.invert(p);
           }
       }

       return {
           index: idx,
           distance: min,
           loc: loc
       };
   }

   // Return the intersection point of 2 line segments.
   // From https://github.com/pgkelley4/line-segments-intersect
   // This uses the vector cross product approach described below:
   //  http://stackoverflow.com/a/565282/786339
   function lineIntersection(a, b) {
       function subtractPoints(point1, point2) {
           return [point1[0] - point2[0], point1[1] - point2[1]];
       }
       function crossProduct(point1, point2) {
           return point1[0] * point2[1] - point1[1] * point2[0];
       }

       var p = [a[0][0], a[0][1]],
           p2 = [a[1][0], a[1][1]],
           q = [b[0][0], b[0][1]],
           q2 = [b[1][0], b[1][1]],
           r = subtractPoints(p2, p),
           s = subtractPoints(q2, q),
           uNumerator = crossProduct(subtractPoints(q, p), r),
           denominator = crossProduct(r, s);

       if (uNumerator && denominator) {
           var u = uNumerator / denominator,
               t = crossProduct(subtractPoints(q, p), s) / denominator;

           if ((t >= 0) && (t <= 1) && (u >= 0) && (u <= 1)) {
               return interp(p, p2, t);
           }
       }

       return null;
   }

   function pathIntersections(path1, path2) {
       var intersections = [];
       for (var i = 0; i < path1.length - 1; i++) {
           for (var j = 0; j < path2.length - 1; j++) {
               var a = [ path1[i], path1[i+1] ],
                   b = [ path2[j], path2[j+1] ],
                   hit = lineIntersection(a, b);
               if (hit) intersections.push(hit);
           }
       }
       return intersections;
   }

   // Return whether point is contained in polygon.
   //
   // `point` should be a 2-item array of coordinates.
   // `polygon` should be an array of 2-item arrays of coordinates.
   //
   // From https://github.com/substack/point-in-polygon.
   // ray-casting algorithm based on
   // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
   //
   function pointInPolygon(point, polygon) {
       var x = point[0],
           y = point[1],
           inside = false;

       for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
           var xi = polygon[i][0], yi = polygon[i][1];
           var xj = polygon[j][0], yj = polygon[j][1];

           var intersect = ((yi > y) !== (yj > y)) &&
               (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
           if (intersect) inside = !inside;
       }

       return inside;
   }

   function polygonContainsPolygon(outer, inner) {
       return _.every(inner, function(point) {
           return pointInPolygon(point, outer);
       });
   }

   function polygonIntersectsPolygon(outer, inner, checkSegments) {
       function testSegments(outer, inner) {
           for (var i = 0; i < outer.length - 1; i++) {
               for (var j = 0; j < inner.length - 1; j++) {
                   var a = [ outer[i], outer[i+1] ],
                       b = [ inner[j], inner[j+1] ];
                   if (lineIntersection(a, b)) return true;
               }
           }
           return false;
       }

       function testPoints(outer, inner) {
           return _.some(inner, function(point) {
               return pointInPolygon(point, outer);
           });
       }

      return testPoints(outer, inner) || (!!checkSegments && testSegments(outer, inner));
   }

   function pathLength(path) {
       var length = 0,
           dx, dy;
       for (var i = 0; i < path.length - 1; i++) {
           dx = path[i][0] - path[i + 1][0];
           dy = path[i][1] - path[i + 1][1];
           length += Math.sqrt(dx * dx + dy * dy);
       }
       return length;
   }


   var geo = Object.freeze({
      roundCoords: roundCoords,
      interp: interp,
      cross: cross,
      euclideanDistance: euclideanDistance,
      latToMeters: latToMeters,
      lonToMeters: lonToMeters,
      metersToLat: metersToLat,
      metersToLon: metersToLon,
      offsetToMeters: offsetToMeters,
      metersToOffset: metersToOffset,
      sphericalDistance: sphericalDistance,
      edgeEqual: edgeEqual,
      angle: getAngle,
      chooseEdge: chooseEdge,
      lineIntersection: lineIntersection,
      pathIntersections: pathIntersections,
      pointInPolygon: pointInPolygon,
      polygonContainsPolygon: polygonContainsPolygon,
      polygonIntersectsPolygon: polygonIntersectsPolygon,
      pathLength: pathLength,
      Extent: Extent,
      Intersection: Intersection,
      Turn: Turn,
      inferRestriction: inferRestriction,
      isSimpleMultipolygonOuterMember: isSimpleMultipolygonOuterMember,
      simpleMultipolygonOuterMember: simpleMultipolygonOuterMember,
      joinWays: joinWays,
      RawMercator: RawMercator
   });

   function AddMember(relationId, member, memberIndex) {
       return function(graph) {
           var relation = graph.entity(relationId);

           if (isNaN(memberIndex) && member.type === 'way') {
               var members = relation.indexedMembers();
               members.push(member);

               var joined = joinWays(members, graph);
               for (var i = 0; i < joined.length; i++) {
                   var segment = joined[i];
                   for (var j = 0; j < segment.length && segment.length >= 2; j++) {
                       if (segment[j] !== member)
                           continue;

                       if (j === 0) {
                           memberIndex = segment[j + 1].index;
                       } else if (j === segment.length - 1) {
                           memberIndex = segment[j - 1].index + 1;
                       } else {
                           memberIndex = Math.min(segment[j - 1].index + 1, segment[j + 1].index + 1);
                       }
                   }
               }
           }

           return graph.replace(relation.addMember(member, memberIndex));
       };
   }

   function AddMidpoint(midpoint, node) {
       return function(graph) {
           graph = graph.replace(node.move(midpoint.loc));

           var parents = _.intersection(
               graph.parentWays(graph.entity(midpoint.edge[0])),
               graph.parentWays(graph.entity(midpoint.edge[1])));

           parents.forEach(function(way) {
               for (var i = 0; i < way.nodes.length - 1; i++) {
                   if (edgeEqual([way.nodes[i], way.nodes[i + 1]], midpoint.edge)) {
                       graph = graph.replace(graph.entity(way.id).addNode(node.id, i + 1));

                       // Add only one midpoint on doubled-back segments,
                       // turning them into self-intersections.
                       return;
                   }
               }
           });

           return graph;
       };
   }

   // https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
   function AddVertex(wayId, nodeId, index) {
       return function(graph) {
           return graph.replace(graph.entity(wayId).addNode(nodeId, index));
       };
   }

   function ChangeMember(relationId, member, memberIndex) {
       return function(graph) {
           return graph.replace(graph.entity(relationId).updateMember(member, memberIndex));
       };
   }

   function ChangePreset(entityId, oldPreset, newPreset) {
       return function(graph) {
           var entity = graph.entity(entityId),
               geometry = entity.geometry(graph),
               tags = entity.tags;

           if (oldPreset) tags = oldPreset.removeTags(tags, geometry);
           if (newPreset) tags = newPreset.applyTags(tags, geometry);

           return graph.replace(entity.update({tags: tags}));
       };
   }

   function ChangeTags(entityId, tags) {
       return function(graph) {
           var entity = graph.entity(entityId);
           return graph.replace(entity.update({tags: tags}));
       };
   }

   function Circularize$1(wayId
     , projection, maxAngle) {
       maxAngle = (maxAngle || 20) * Math.PI / 180;

       var action = function(graph) {
           var way = graph.entity(wayId);

           if (!way.isConvex(graph)) {
               graph = action.makeConvex(graph);
           }

           var nodes = _.uniq(graph.childNodes(way)),
               keyNodes = nodes.filter(function(n) { return graph.parentWays(n).length !== 1; }),
               points = nodes.map(function(n) { return projection(n.loc); }),
               keyPoints = keyNodes.map(function(n) { return projection(n.loc); }),
               centroid = (points.length === 2) ? interp(points[0], points[1], 0.5) : d3.geom.polygon(points).centroid(),
               radius = d3.median(points, function(p) { return euclideanDistance(centroid, p); }),
               sign = d3.geom.polygon(points).area() > 0 ? 1 : -1,
               ids;

           // we need atleast two key nodes for the algorithm to work
           if (!keyNodes.length) {
               keyNodes = [nodes[0]];
               keyPoints = [points[0]];
           }

           if (keyNodes.length === 1) {
               var index = nodes.indexOf(keyNodes[0]),
                   oppositeIndex = Math.floor((index + nodes.length / 2) % nodes.length);

               keyNodes.push(nodes[oppositeIndex]);
               keyPoints.push(points[oppositeIndex]);
           }

           // key points and nodes are those connected to the ways,
           // they are projected onto the circle, inbetween nodes are moved
           // to constant intervals between key nodes, extra inbetween nodes are
           // added if necessary.
           for (var i = 0; i < keyPoints.length; i++) {
               var nextKeyNodeIndex = (i + 1) % keyNodes.length,
                   startNode = keyNodes[i],
                   endNode = keyNodes[nextKeyNodeIndex],
                   startNodeIndex = nodes.indexOf(startNode),
                   endNodeIndex = nodes.indexOf(endNode),
                   numberNewPoints = -1,
                   indexRange = endNodeIndex - startNodeIndex,
                   distance, totalAngle, eachAngle, startAngle, endAngle,
                   angle, loc, node, j,
                   inBetweenNodes = [];

               if (indexRange < 0) {
                   indexRange += nodes.length;
               }

               // position this key node
               distance = euclideanDistance(centroid, keyPoints[i]);
               if (distance === 0) { distance = 1e-4; }
               keyPoints[i] = [
                   centroid[0] + (keyPoints[i][0] - centroid[0]) / distance * radius,
                   centroid[1] + (keyPoints[i][1] - centroid[1]) / distance * radius];
               graph = graph.replace(keyNodes[i].move(projection.invert(keyPoints[i])));

               // figure out the between delta angle we want to match to
               startAngle = Math.atan2(keyPoints[i][1] - centroid[1], keyPoints[i][0] - centroid[0]);
               endAngle = Math.atan2(keyPoints[nextKeyNodeIndex][1] - centroid[1], keyPoints[nextKeyNodeIndex][0] - centroid[0]);
               totalAngle = endAngle - startAngle;

               // detects looping around -pi/pi
               if (totalAngle * sign > 0) {
                   totalAngle = -sign * (2 * Math.PI - Math.abs(totalAngle));
               }

               do {
                   numberNewPoints++;
                   eachAngle = totalAngle / (indexRange + numberNewPoints);
               } while (Math.abs(eachAngle) > maxAngle);

               // move existing points
               for (j = 1; j < indexRange; j++) {
                   angle = startAngle + j * eachAngle;
                   loc = projection.invert([
                       centroid[0] + Math.cos(angle)*radius,
                       centroid[1] + Math.sin(angle)*radius]);

                   node = nodes[(j + startNodeIndex) % nodes.length].move(loc);
                   graph = graph.replace(node);
               }

               // add new inbetween nodes if necessary
               for (j = 0; j < numberNewPoints; j++) {
                   angle = startAngle + (indexRange + j) * eachAngle;
                   loc = projection.invert([
                       centroid[0] + Math.cos(angle) * radius,
                       centroid[1] + Math.sin(angle) * radius]);

                   node = Node({loc: loc});
                   graph = graph.replace(node);

                   nodes.splice(endNodeIndex + j, 0, node);
                   inBetweenNodes.push(node.id);
               }

               // Check for other ways that share these keyNodes..
               // If keyNodes are adjacent in both ways,
               // we can add inBetween nodes to that shared way too..
               if (indexRange === 1 && inBetweenNodes.length) {
                   var startIndex1 = way.nodes.lastIndexOf(startNode.id),
                       endIndex1 = way.nodes.lastIndexOf(endNode.id),
                       wayDirection1 = (endIndex1 - startIndex1);
                   if (wayDirection1 < -1) { wayDirection1 = 1; }

                   /* eslint-disable no-loop-func */
                   _.each(_.without(graph.parentWays(keyNodes[i]), way), function(sharedWay) {
                       if (sharedWay.areAdjacent(startNode.id, endNode.id)) {
                           var startIndex2 = sharedWay.nodes.lastIndexOf(startNode.id),
                               endIndex2 = sharedWay.nodes.lastIndexOf(endNode.id),
                               wayDirection2 = (endIndex2 - startIndex2),
                               insertAt = endIndex2;
                           if (wayDirection2 < -1) { wayDirection2 = 1; }

                           if (wayDirection1 !== wayDirection2) {
                               inBetweenNodes.reverse();
                               insertAt = startIndex2;
                           }
                           for (j = 0; j < inBetweenNodes.length; j++) {
                               sharedWay = sharedWay.addNode(inBetweenNodes[j], insertAt + j);
                           }
                           graph = graph.replace(sharedWay);
                       }
                   });
                   /* eslint-enable no-loop-func */
               }

           }

           // update the way to have all the new nodes
           ids = nodes.map(function(n) { return n.id; });
           ids.push(ids[0]);

           way = way.update({nodes: ids});
           graph = graph.replace(way);

           return graph;
       };

       action.makeConvex = function(graph) {
           var way = graph.entity(wayId),
               nodes = _.uniq(graph.childNodes(way)),
               points = nodes.map(function(n) { return projection(n.loc); }),
               sign = d3.geom.polygon(points).area() > 0 ? 1 : -1,
               hull = d3.geom.hull(points);

           // D3 convex hulls go counterclockwise..
           if (sign === -1) {
               nodes.reverse();
               points.reverse();
           }

           for (var i = 0; i < hull.length - 1; i++) {
               var startIndex = points.indexOf(hull[i]),
                   endIndex = points.indexOf(hull[i+1]),
                   indexRange = (endIndex - startIndex);

               if (indexRange < 0) {
                   indexRange += nodes.length;
               }

               // move interior nodes to the surface of the convex hull..
               for (var j = 1; j < indexRange; j++) {
                   var point = interp(hull[i], hull[i+1], j / indexRange),
                       node = nodes[(j + startIndex) % nodes.length].move(projection.invert(point));
                   graph = graph.replace(node);
               }
           }
           return graph;
       };

       action.disabled = function(graph) {
           if (!graph.entity(wayId).isClosed())
               return 'not_closed';
       };

       return action;
   }

   function DeleteMultiple(ids) {
       var actions = {
           way: DeleteWay,
           node: DeleteNode,
           relation: DeleteRelation
       };

       var action = function(graph) {
           ids.forEach(function(id) {
               if (graph.hasEntity(id)) { // It may have been deleted aready.
                   graph = actions[graph.entity(id).type](id)(graph);
               }
           });

           return graph;
       };

       action.disabled = function(graph) {
           for (var i = 0; i < ids.length; i++) {
               var id = ids[i],
                   disabled = actions[graph.entity(id).type](id).disabled(graph);
               if (disabled) return disabled;
           }
       };

       return action;
   }

   // https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteRelationAction.as
   function DeleteRelation(relationId) {
       function deleteEntity(entity, graph) {
           return !graph.parentWays(entity).length &&
               !graph.parentRelations(entity).length &&
               !entity.hasInterestingTags();
       }

       var action = function(graph) {
           var relation = graph.entity(relationId);

           graph.parentRelations(relation)
               .forEach(function(parent) {
                   parent = parent.removeMembersWithID(relationId);
                   graph = graph.replace(parent);

                   if (parent.isDegenerate()) {
                       graph = DeleteRelation(parent.id)(graph);
                   }
               });

           _.uniq(_.map(relation.members, 'id')).forEach(function(memberId) {
               graph = graph.replace(relation.removeMembersWithID(memberId));

               var entity = graph.entity(memberId);
               if (deleteEntity(entity, graph)) {
                   graph = DeleteMultiple([memberId])(graph);
               }
           });

           return graph.remove(relation);
       };

       action.disabled = function(graph) {
           if (!graph.entity(relationId).isComplete(graph))
               return 'incomplete_relation';
       };

       return action;
   }

   // https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteWayAction.as
   function DeleteWay(wayId) {
       function deleteNode(node, graph) {
           return !graph.parentWays(node).length &&
               !graph.parentRelations(node).length &&
               !node.hasInterestingTags();
       }

       var action = function(graph) {
           var way = graph.entity(wayId);

           graph.parentRelations(way)
               .forEach(function(parent) {
                   parent = parent.removeMembersWithID(wayId);
                   graph = graph.replace(parent);

                   if (parent.isDegenerate()) {
                       graph = DeleteRelation(parent.id)(graph);
                   }
               });

           _.uniq(way.nodes).forEach(function(nodeId) {
               graph = graph.replace(way.removeNode(nodeId));

               var node = graph.entity(nodeId);
               if (deleteNode(node, graph)) {
                   graph = graph.remove(node);
               }
           });

           return graph.remove(way);
       };

       action.disabled = function(graph) {
           var disabled = false;

           graph.parentRelations(graph.entity(wayId)).forEach(function(parent) {
               var type = parent.tags.type,
                   role = parent.memberById(wayId).role || 'outer';
               if (type === 'route' || type === 'boundary' || (type === 'multipolygon' && role === 'outer')) {
                   disabled = 'part_of_relation';
               }
           });

           return disabled;
       };

       return action;
   }

   // https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteNodeAction.as
   function DeleteNode(nodeId) {
       var action = function(graph) {
           var node = graph.entity(nodeId);

           graph.parentWays(node)
               .forEach(function(parent) {
                   parent = parent.removeNode(nodeId);
                   graph = graph.replace(parent);

                   if (parent.isDegenerate()) {
                       graph = DeleteWay(parent.id)(graph);
                   }
               });

           graph.parentRelations(node)
               .forEach(function(parent) {
                   parent = parent.removeMembersWithID(nodeId);
                   graph = graph.replace(parent);

                   if (parent.isDegenerate()) {
                       graph = DeleteRelation(parent.id)(graph);
                   }
               });

           return graph.remove(node);
       };

       action.disabled = function() {
           return false;
       };

       return action;
   }

   // Connect the ways at the given nodes.
   //
   // The last node will survive. All other nodes will be replaced with
   // the surviving node in parent ways, and then removed.
   //
   // Tags and relation memberships of of non-surviving nodes are merged
   // to the survivor.
   //
   // This is the inverse of `iD.actions.Disconnect`.
   //
   // Reference:
   //   https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MergeNodesAction.as
   //   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/MergeNodesAction.java
   //
   function Connect(nodeIds) {
       return function(graph) {
           var survivor = graph.entity(_.last(nodeIds));

           for (var i = 0; i < nodeIds.length - 1; i++) {
               var node = graph.entity(nodeIds[i]);

               /* eslint-disable no-loop-func */
               graph.parentWays(node).forEach(function(parent) {
                   if (!parent.areAdjacent(node.id, survivor.id)) {
                       graph = graph.replace(parent.replaceNode(node.id, survivor.id));
                   }
               });

               graph.parentRelations(node).forEach(function(parent) {
                   graph = graph.replace(parent.replaceMember(node, survivor));
               });
               /* eslint-enable no-loop-func */

               survivor = survivor.mergeTags(node.tags);
               graph = DeleteNode(node.id)(graph);
           }

           graph = graph.replace(survivor);

           return graph;
       };
   }

   function CopyEntities(ids, fromGraph) {
       var copies = {};

       var action = function(graph) {
           ids.forEach(function(id) {
               fromGraph.entity(id).copy(fromGraph, copies);
           });

           for (var id in copies) {
               graph = graph.replace(copies[id]);
           }

           return graph;
       };

       action.copies = function() {
           return copies;
       };

       return action;
   }

   function DeleteMember(relationId, memberIndex) {
       return function(graph) {
           var relation = graph.entity(relationId)
               .removeMember(memberIndex);

           graph = graph.replace(relation);

           if (relation.isDegenerate())
               graph = DeleteRelation(relation.id)(graph);

           return graph;
       };
   }

   function DeprecateTags(entityId) {
       return function(graph) {
           var entity = graph.entity(entityId),
               newtags = _.clone(entity.tags),
               change = false,
               rule;

           // This handles deprecated tags with a single condition
           for (var i = 0; i < iD.data.deprecated.length; i++) {

               rule = iD.data.deprecated[i];
               var match = _.toPairs(rule.old)[0],
                   replacements = rule.replace ? _.toPairs(rule.replace) : null;

               if (entity.tags[match[0]] && match[1] === '*') {

                   var value = entity.tags[match[0]];
                   if (replacements && !newtags[replacements[0][0]]) {
                       newtags[replacements[0][0]] = value;
                   }
                   delete newtags[match[0]];
                   change = true;

               } else if (entity.tags[match[0]] === match[1]) {
                   newtags = _.assign({}, rule.replace || {}, _.omit(newtags, match[0]));
                   change = true;
               }
           }

           if (change) {
               return graph.replace(entity.update({tags: newtags}));
           } else {
               return graph;
           }
       };
   }

   function DiscardTags(difference) {
       return function(graph) {
           function discardTags(entity) {
               if (!_.isEmpty(entity.tags)) {
                   var tags = {};
                   _.each(entity.tags, function(v, k) {
                       if (v) tags[k] = v;
                   });

                   graph = graph.replace(entity.update({
                       tags: _.omit(tags, iD.data.discarded)
                   }));
               }
           }

           difference.modified().forEach(discardTags);
           difference.created().forEach(discardTags);

           return graph;
       };
   }

   function Disconnect$1(nodeId, newNodeId) {
       var wayIds;

       var action = function(graph) {
           var node = graph.entity(nodeId),
               connections = action.connections(graph);

           connections.forEach(function(connection) {
               var way = graph.entity(connection.wayID),
                   newNode = Node({id: newNodeId, loc: node.loc, tags: node.tags});

               graph = graph.replace(newNode);
               if (connection.index === 0 && way.isArea()) {
                   // replace shared node with shared node..
                   graph = graph.replace(way.replaceNode(way.nodes[0], newNode.id));
               } else {
                   // replace shared node with multiple new nodes..
                   graph = graph.replace(way.updateNode(newNode.id, connection.index));
               }
           });

           return graph;
       };

       action.connections = function(graph) {
           var candidates = [],
               keeping = false,
               parentWays = graph.parentWays(graph.entity(nodeId));

           parentWays.forEach(function(way) {
               if (wayIds && wayIds.indexOf(way.id) === -1) {
                   keeping = true;
                   return;
               }
               if (way.isArea() && (way.nodes[0] === nodeId)) {
                   candidates.push({wayID: way.id, index: 0});
               } else {
                   way.nodes.forEach(function(waynode, index) {
                       if (waynode === nodeId) {
                           candidates.push({wayID: way.id, index: index});
                       }
                   });
               }
           });

           return keeping ? candidates : candidates.slice(1);
       };

       action.disabled = function(graph) {
           var connections = action.connections(graph);
           if (connections.length === 0 || (wayIds && wayIds.length !== connections.length))
               return 'not_connected';

           var parentWays = graph.parentWays(graph.entity(nodeId)),
               seenRelationIds = {},
               sharedRelation;

           parentWays.forEach(function(way) {
               if (wayIds && wayIds.indexOf(way.id) === -1)
                   return;

               var relations = graph.parentRelations(way);
               relations.forEach(function(relation) {
                   if (relation.id in seenRelationIds) {
                       sharedRelation = relation;
                   } else {
                       seenRelationIds[relation.id] = true;
                   }
               });
           });

           if (sharedRelation)
               return 'relation';
       };

       action.limitWays = function(_) {
           if (!arguments.length) return wayIds;
           wayIds = _;
           return action;
       };

       return action;
   }

   function Join(ids) {

       function groupEntitiesByGeometry(graph) {
           var entities = ids.map(function(id) { return graph.entity(id); });
           return _.extend({line: []}, _.groupBy(entities, function(entity) { return entity.geometry(graph); }));
       }

       var action = function(graph) {
           var ways = ids.map(graph.entity, graph),
               survivor = ways[0];

           // Prefer to keep an existing way.
           for (var i = 0; i < ways.length; i++) {
               if (!ways[i].isNew()) {
                   survivor = ways[i];
                   break;
               }
           }

           var joined = joinWays(ways, graph)[0];

           survivor = survivor.update({nodes: _.map(joined.nodes, 'id')});
           graph = graph.replace(survivor);

           joined.forEach(function(way) {
               if (way.id === survivor.id)
                   return;

               graph.parentRelations(way).forEach(function(parent) {
                   graph = graph.replace(parent.replaceMember(way, survivor));
               });

               survivor = survivor.mergeTags(way.tags);

               graph = graph.replace(survivor);
               graph = DeleteWay(way.id)(graph);
           });

           return graph;
       };

       action.disabled = function(graph) {
           var geometries = groupEntitiesByGeometry(graph);
           if (ids.length < 2 || ids.length !== geometries.line.length)
               return 'not_eligible';

           var joined = joinWays(ids.map(graph.entity, graph), graph);
           if (joined.length > 1)
               return 'not_adjacent';

           var nodeIds = _.map(joined[0].nodes, 'id').slice(1, -1),
               relation,
               tags = {},
               conflicting = false;

           joined[0].forEach(function(way) {
               var parents = graph.parentRelations(way);
               parents.forEach(function(parent) {
                   if (parent.isRestriction() && parent.members.some(function(m) { return nodeIds.indexOf(m.id) >= 0; }))
                       relation = parent;
               });

               for (var k in way.tags) {
                   if (!(k in tags)) {
                       tags[k] = way.tags[k];
                   } else if (tags[k] && interestingTag(k) && tags[k] !== way.tags[k]) {
                       conflicting = true;
                   }
               }
           });

           if (relation)
               return 'restriction';

           if (conflicting)
               return 'conflicting_tags';
       };

       return action;
   }

   function Merge$1(ids) {
       function groupEntitiesByGeometry(graph) {
           var entities = ids.map(function(id) { return graph.entity(id); });
           return _.extend({point: [], area: [], line: [], relation: []},
               _.groupBy(entities, function(entity) { return entity.geometry(graph); }));
       }

       var action = function(graph) {
           var geometries = groupEntitiesByGeometry(graph),
               target = geometries.area[0] || geometries.line[0],
               points = geometries.point;

           points.forEach(function(point) {
               target = target.mergeTags(point.tags);

               graph.parentRelations(point).forEach(function(parent) {
                   graph = graph.replace(parent.replaceMember(point, target));
               });

               graph = graph.remove(point);
           });

           graph = graph.replace(target);

           return graph;
       };

       action.disabled = function(graph) {
           var geometries = groupEntitiesByGeometry(graph);
           if (geometries.point.length === 0 ||
               (geometries.area.length + geometries.line.length) !== 1 ||
               geometries.relation.length !== 0)
               return 'not_eligible';
       };

       return action;
   }

   function MergePolygon(ids, newRelationId) {

       function groupEntities(graph) {
           var entities = ids.map(function (id) { return graph.entity(id); });
           return _.extend({
                   closedWay: [],
                   multipolygon: [],
                   other: []
               }, _.groupBy(entities, function(entity) {
                   if (entity.type === 'way' && entity.isClosed()) {
                       return 'closedWay';
                   } else if (entity.type === 'relation' && entity.isMultipolygon()) {
                       return 'multipolygon';
                   } else {
                       return 'other';
                   }
               }));
       }

       var action = function(graph) {
           var entities = groupEntities(graph);

           // An array representing all the polygons that are part of the multipolygon.
           //
           // Each element is itself an array of objects with an id property, and has a
           // locs property which is an array of the locations forming the polygon.
           var polygons = entities.multipolygon.reduce(function(polygons, m) {
               return polygons.concat(joinWays(m.members, graph));
           }, []).concat(entities.closedWay.map(function(d) {
               var member = [{id: d.id}];
               member.nodes = graph.childNodes(d);
               return member;
           }));

           // contained is an array of arrays of boolean values,
           // where contained[j][k] is true iff the jth way is
           // contained by the kth way.
           var contained = polygons.map(function(w, i) {
               return polygons.map(function(d, n) {
                   if (i === n) return null;
                   return polygonContainsPolygon(
                       _.map(d.nodes, 'loc'),
                       _.map(w.nodes, 'loc'));
               });
           });

           // Sort all polygons as either outer or inner ways
           var members = [],
               outer = true;

           while (polygons.length) {
               extractUncontained(polygons);
               polygons = polygons.filter(isContained);
               contained = contained.filter(isContained).map(filterContained);
           }

           function isContained(d, i) {
               return _.some(contained[i]);
           }

           function filterContained(d) {
               return d.filter(isContained);
           }

           function extractUncontained(polygons) {
               polygons.forEach(function(d, i) {
                   if (!isContained(d, i)) {
                       d.forEach(function(member) {
                           members.push({
                               type: 'way',
                               id: member.id,
                               role: outer ? 'outer' : 'inner'
                           });
                       });
                   }
               });
               outer = !outer;
           }

           // Move all tags to one relation
           var relation = entities.multipolygon[0] ||
               Relation({ id: newRelationId, tags: { type: 'multipolygon' }});

           entities.multipolygon.slice(1).forEach(function(m) {
               relation = relation.mergeTags(m.tags);
               graph = graph.remove(m);
           });

           entities.closedWay.forEach(function(way) {
               function isThisOuter(m) {
                   return m.id === way.id && m.role !== 'inner';
               }
               if (members.some(isThisOuter)) {
                   relation = relation.mergeTags(way.tags);
                   graph = graph.replace(way.update({ tags: {} }));
               }
           });

           return graph.replace(relation.update({
               members: members,
               tags: _.omit(relation.tags, 'area')
           }));
       };

       action.disabled = function(graph) {
           var entities = groupEntities(graph);
           if (entities.other.length > 0 ||
               entities.closedWay.length + entities.multipolygon.length < 2)
               return 'not_eligible';
           if (!entities.multipolygon.every(function(r) { return r.isComplete(graph); }))
               return 'incomplete_relation';
       };

       return action;
   }

   function MergeRemoteChanges(id, localGraph, remoteGraph, formatUser) {
       var option = 'safe',  // 'safe', 'force_local', 'force_remote'
           conflicts = [];

       function user(d) {
           return _.isFunction(formatUser) ? formatUser(d) : d;
       }


       function mergeLocation(remote, target) {
           function pointEqual(a, b) {
               var epsilon = 1e-6;
               return (Math.abs(a[0] - b[0]) < epsilon) && (Math.abs(a[1] - b[1]) < epsilon);
           }

           if (option === 'force_local' || pointEqual(target.loc, remote.loc)) {
               return target;
           }
           if (option === 'force_remote') {
               return target.update({loc: remote.loc});
           }

           conflicts.push(t('merge_remote_changes.conflict.location', { user: user(remote.user) }));
           return target;
       }


       function mergeNodes(base, remote, target) {
           if (option === 'force_local' || _.isEqual(target.nodes, remote.nodes)) {
               return target;
           }
           if (option === 'force_remote') {
               return target.update({nodes: remote.nodes});
           }

           var ccount = conflicts.length,
               o = base.nodes || [],
               a = target.nodes || [],
               b = remote.nodes || [],
               nodes = [],
               hunks = Diff3.diff3_merge(a, o, b, true);

           for (var i = 0; i < hunks.length; i++) {
               var hunk = hunks[i];
               if (hunk.ok) {
                   nodes.push.apply(nodes, hunk.ok);
               } else {
                   // for all conflicts, we can assume c.a !== c.b
                   // because `diff3_merge` called with `true` option to exclude false conflicts..
                   var c = hunk.conflict;
                   if (_.isEqual(c.o, c.a)) {  // only changed remotely
                       nodes.push.apply(nodes, c.b);
                   } else if (_.isEqual(c.o, c.b)) {  // only changed locally
                       nodes.push.apply(nodes, c.a);
                   } else {       // changed both locally and remotely
                       conflicts.push(t('merge_remote_changes.conflict.nodelist', { user: user(remote.user) }));
                       break;
                   }
               }
           }

           return (conflicts.length === ccount) ? target.update({nodes: nodes}) : target;
       }


       function mergeChildren(targetWay, children, updates, graph) {
           function isUsed(node, targetWay) {
               var parentWays = _.map(graph.parentWays(node), 'id');
               return node.hasInterestingTags() ||
                   _.without(parentWays, targetWay.id).length > 0 ||
                   graph.parentRelations(node).length > 0;
           }

           var ccount = conflicts.length;

           for (var i = 0; i < children.length; i++) {
               var id = children[i],
                   node = graph.hasEntity(id);

               // remove unused childNodes..
               if (targetWay.nodes.indexOf(id) === -1) {
                   if (node && !isUsed(node, targetWay)) {
                       updates.removeIds.push(id);
                   }
                   continue;
               }

               // restore used childNodes..
               var local = localGraph.hasEntity(id),
                   remote = remoteGraph.hasEntity(id),
                   target;

               if (option === 'force_remote' && remote && remote.visible) {
                   updates.replacements.push(remote);

               } else if (option === 'force_local' && local) {
                   target = Entity(local);
                   if (remote) {
                       target = target.update({ version: remote.version });
                   }
                   updates.replacements.push(target);

               } else if (option === 'safe' && local && remote && local.version !== remote.version) {
                   target = Entity(local, { version: remote.version });
                   if (remote.visible) {
                       target = mergeLocation(remote, target);
                   } else {
                       conflicts.push(t('merge_remote_changes.conflict.deleted', { user: user(remote.user) }));
                   }

                   if (conflicts.length !== ccount) break;
                   updates.replacements.push(target);
               }
           }

           return targetWay;
       }


       function updateChildren(updates, graph) {
           for (var i = 0; i < updates.replacements.length; i++) {
               graph = graph.replace(updates.replacements[i]);
           }
           if (updates.removeIds.length) {
               graph = DeleteMultiple(updates.removeIds)(graph);
           }
           return graph;
       }


       function mergeMembers(remote, target) {
           if (option === 'force_local' || _.isEqual(target.members, remote.members)) {
               return target;
           }
           if (option === 'force_remote') {
               return target.update({members: remote.members});
           }

           conflicts.push(t('merge_remote_changes.conflict.memberlist', { user: user(remote.user) }));
           return target;
       }


       function mergeTags(base, remote, target) {
           function ignoreKey(k) {
               return _.includes(iD.data.discarded, k);
           }

           if (option === 'force_local' || _.isEqual(target.tags, remote.tags)) {
               return target;
           }
           if (option === 'force_remote') {
               return target.update({tags: remote.tags});
           }

           var ccount = conflicts.length,
               o = base.tags || {},
               a = target.tags || {},
               b = remote.tags || {},
               keys = _.reject(_.union(_.keys(o), _.keys(a), _.keys(b)), ignoreKey),
               tags = _.clone(a),
               changed = false;

           for (var i = 0; i < keys.length; i++) {
               var k = keys[i];

               if (o[k] !== b[k] && a[k] !== b[k]) {    // changed remotely..
                   if (o[k] !== a[k]) {      // changed locally..
                       conflicts.push(t('merge_remote_changes.conflict.tags',
                           { tag: k, local: a[k], remote: b[k], user: user(remote.user) }));

                   } else {                  // unchanged locally, accept remote change..
                       if (b.hasOwnProperty(k)) {
                           tags[k] = b[k];
                       } else {
                           delete tags[k];
                       }
                       changed = true;
                   }
               }
           }

           return (changed && conflicts.length === ccount) ? target.update({tags: tags}) : target;
       }


       //  `graph.base()` is the common ancestor of the two graphs.
       //  `localGraph` contains user's edits up to saving
       //  `remoteGraph` contains remote edits to modified nodes
       //  `graph` must be a descendent of `localGraph` and may include
       //      some conflict resolution actions performed on it.
       //
       //                  --- ... --- `localGraph` -- ... -- `graph`
       //                 /
       //  `graph.base()` --- ... --- `remoteGraph`
       //
       var action = function(graph) {
           var updates = { replacements: [], removeIds: [] },
               base = graph.base().entities[id],
               local = localGraph.entity(id),
               remote = remoteGraph.entity(id),
               target = Entity(local, { version: remote.version });

           // delete/undelete
           if (!remote.visible) {
               if (option === 'force_remote') {
                   return DeleteMultiple([id])(graph);

               } else if (option === 'force_local') {
                   if (target.type === 'way') {
                       target = mergeChildren(target, _.uniq(local.nodes), updates, graph);
                       graph = updateChildren(updates, graph);
                   }
                   return graph.replace(target);

               } else {
                   conflicts.push(t('merge_remote_changes.conflict.deleted', { user: user(remote.user) }));
                   return graph;  // do nothing
               }
           }

           // merge
           if (target.type === 'node') {
               target = mergeLocation(remote, target);

           } else if (target.type === 'way') {
               // pull in any child nodes that may not be present locally..
               graph.rebase(remoteGraph.childNodes(remote), [graph], false);
               target = mergeNodes(base, remote, target);
               target = mergeChildren(target, _.union(local.nodes, remote.nodes), updates, graph);

           } else if (target.type === 'relation') {
               target = mergeMembers(remote, target);
           }

           target = mergeTags(base, remote, target);

           if (!conflicts.length) {
               graph = updateChildren(updates, graph).replace(target);
           }

           return graph;
       };

       action.withOption = function(opt) {
           option = opt;
           return action;
       };

       action.conflicts = function() {
           return conflicts;
       };

       return action;
   }

   function Move$1(moveIds, tryDelta, projection, cache) {
       var delta = tryDelta;

       function vecAdd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
       function vecSub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }

       function setupCache(graph) {
           function canMove(nodeId) {
               var parents = _.map(graph.parentWays(graph.entity(nodeId)), 'id');
               if (parents.length < 3) return true;

               // Don't move a vertex where >2 ways meet, unless all parentWays are moving too..
               var parentsMoving = _.all(parents, function(id) { return cache.moving[id]; });
               if (!parentsMoving) delete cache.moving[nodeId];

               return parentsMoving;
           }

           function cacheEntities(ids) {
               _.each(ids, function(id) {
                   if (cache.moving[id]) return;
                   cache.moving[id] = true;

                   var entity = graph.hasEntity(id);
                   if (!entity) return;

                   if (entity.type === 'node') {
                       cache.nodes.push(id);
                       cache.startLoc[id] = entity.loc;
                   } else if (entity.type === 'way') {
                       cache.ways.push(id);
                       cacheEntities(entity.nodes);
                   } else {
                       cacheEntities(_.map(entity.members, 'id'));
                   }
               });
           }

           function cacheIntersections(ids) {
               function isEndpoint(way, id) { return !way.isClosed() && !!way.affix(id); }

               _.each(ids, function(id) {
                   // consider only intersections with 1 moved and 1 unmoved way.
                   _.each(graph.childNodes(graph.entity(id)), function(node) {
                       var parents = graph.parentWays(node);
                       if (parents.length !== 2) return;

                       var moved = graph.entity(id),
                           unmoved = _.find(parents, function(way) { return !cache.moving[way.id]; });
                       if (!unmoved) return;

                       // exclude ways that are overly connected..
                       if (_.intersection(moved.nodes, unmoved.nodes).length > 2) return;

                       if (moved.isArea() || unmoved.isArea()) return;

                       cache.intersection[node.id] = {
                           nodeId: node.id,
                           movedId: moved.id,
                           unmovedId: unmoved.id,
                           movedIsEP: isEndpoint(moved, node.id),
                           unmovedIsEP: isEndpoint(unmoved, node.id)
                       };
                   });
               });
           }


           if (!cache) {
               cache = {};
           }
           if (!cache.ok) {
               cache.moving = {};
               cache.intersection = {};
               cache.replacedVertex = {};
               cache.startLoc = {};
               cache.nodes = [];
               cache.ways = [];

               cacheEntities(moveIds);
               cacheIntersections(cache.ways);
               cache.nodes = _.filter(cache.nodes, canMove);

               cache.ok = true;
           }
       }


       // Place a vertex where the moved vertex used to be, to preserve way shape..
       function replaceMovedVertex(nodeId, wayId, graph, delta) {
           var way = graph.entity(wayId),
               moved = graph.entity(nodeId),
               movedIndex = way.nodes.indexOf(nodeId),
               len, prevIndex, nextIndex;

           if (way.isClosed()) {
               len = way.nodes.length - 1;
               prevIndex = (movedIndex + len - 1) % len;
               nextIndex = (movedIndex + len + 1) % len;
           } else {
               len = way.nodes.length;
               prevIndex = movedIndex - 1;
               nextIndex = movedIndex + 1;
           }

           var prev = graph.hasEntity(way.nodes[prevIndex]),
               next = graph.hasEntity(way.nodes[nextIndex]);

           // Don't add orig vertex at endpoint..
           if (!prev || !next) return graph;

           var key = wayId + '_' + nodeId,
               orig = cache.replacedVertex[key];
           if (!orig) {
               orig = Node();
               cache.replacedVertex[key] = orig;
               cache.startLoc[orig.id] = cache.startLoc[nodeId];
           }

           var start, end;
           if (delta) {
               start = projection(cache.startLoc[nodeId]);
               end = projection.invert(vecAdd(start, delta));
           } else {
               end = cache.startLoc[nodeId];
           }
           orig = orig.move(end);

           var angle = Math.abs(getAngle(orig, prev, projection) -
                   getAngle(orig, next, projection)) * 180 / Math.PI;

           // Don't add orig vertex if it would just make a straight line..
           if (angle > 175 && angle < 185) return graph;

           // Don't add orig vertex if another point is already nearby (within 10m)
           if (sphericalDistance(prev.loc, orig.loc) < 10 ||
               sphericalDistance(orig.loc, next.loc) < 10) return graph;

           // moving forward or backward along way?
           var p1 = [prev.loc, orig.loc, moved.loc, next.loc].map(projection),
               p2 = [prev.loc, moved.loc, orig.loc, next.loc].map(projection),
               d1 = pathLength(p1),
               d2 = pathLength(p2),
               insertAt = (d1 < d2) ? movedIndex : nextIndex;

           // moving around closed loop?
           if (way.isClosed() && insertAt === 0) insertAt = len;

           way = way.addNode(orig.id, insertAt);
           return graph.replace(orig).replace(way);
       }

       // Reorder nodes around intersections that have moved..
       function unZorroIntersection(intersection, graph) {
           var vertex = graph.entity(intersection.nodeId),
               way1 = graph.entity(intersection.movedId),
               way2 = graph.entity(intersection.unmovedId),
               isEP1 = intersection.movedIsEP,
               isEP2 = intersection.unmovedIsEP;

           // don't move the vertex if it is the endpoint of both ways.
           if (isEP1 && isEP2) return graph;

           var nodes1 = _.without(graph.childNodes(way1), vertex),
               nodes2 = _.without(graph.childNodes(way2), vertex);

           if (way1.isClosed() && way1.first() === vertex.id) nodes1.push(nodes1[0]);
           if (way2.isClosed() && way2.first() === vertex.id) nodes2.push(nodes2[0]);

           var edge1 = !isEP1 && chooseEdge(nodes1, projection(vertex.loc), projection),
               edge2 = !isEP2 && chooseEdge(nodes2, projection(vertex.loc), projection),
               loc;

           // snap vertex to nearest edge (or some point between them)..
           if (!isEP1 && !isEP2) {
               var epsilon = 1e-4, maxIter = 10;
               for (var i = 0; i < maxIter; i++) {
                   loc = interp(edge1.loc, edge2.loc, 0.5);
                   edge1 = chooseEdge(nodes1, projection(loc), projection);
                   edge2 = chooseEdge(nodes2, projection(loc), projection);
                   if (Math.abs(edge1.distance - edge2.distance) < epsilon) break;
               }
           } else if (!isEP1) {
               loc = edge1.loc;
           } else {
               loc = edge2.loc;
           }

           graph = graph.replace(vertex.move(loc));

           // if zorro happened, reorder nodes..
           if (!isEP1 && edge1.index !== way1.nodes.indexOf(vertex.id)) {
               way1 = way1.removeNode(vertex.id).addNode(vertex.id, edge1.index);
               graph = graph.replace(way1);
           }
           if (!isEP2 && edge2.index !== way2.nodes.indexOf(vertex.id)) {
               way2 = way2.removeNode(vertex.id).addNode(vertex.id, edge2.index);
               graph = graph.replace(way2);
           }

           return graph;
       }


       function cleanupIntersections(graph) {
           _.each(cache.intersection, function(obj) {
               graph = replaceMovedVertex(obj.nodeId, obj.movedId, graph, delta);
               graph = replaceMovedVertex(obj.nodeId, obj.unmovedId, graph, null);
               graph = unZorroIntersection(obj, graph);
           });

           return graph;
       }

       // check if moving way endpoint can cross an unmoved way, if so limit delta..
       function limitDelta(graph) {
           _.each(cache.intersection, function(obj) {
               if (!obj.movedIsEP) return;

               var node = graph.entity(obj.nodeId),
                   start = projection(node.loc),
                   end = vecAdd(start, delta),
                   movedNodes = graph.childNodes(graph.entity(obj.movedId)),
                   movedPath = _.map(_.map(movedNodes, 'loc'),
                       function(loc) { return vecAdd(projection(loc), delta); }),
                   unmovedNodes = graph.childNodes(graph.entity(obj.unmovedId)),
                   unmovedPath = _.map(_.map(unmovedNodes, 'loc'), projection),
                   hits = pathIntersections(movedPath, unmovedPath);

               for (var i = 0; i < hits.length; i++) {
                   if (_.isEqual(hits[i], end)) continue;
                   var edge = chooseEdge(unmovedNodes, end, projection);
                   delta = vecSub(projection(edge.loc), start);
               }
           });
       }


       var action = function(graph) {
           if (delta[0] === 0 && delta[1] === 0) return graph;

           setupCache(graph);

           if (!_.isEmpty(cache.intersection)) {
               limitDelta(graph);
           }

           _.each(cache.nodes, function(id) {
               var node = graph.entity(id),
                   start = projection(node.loc),
                   end = vecAdd(start, delta);
               graph = graph.replace(node.move(projection.invert(end)));
           });

           if (!_.isEmpty(cache.intersection)) {
               graph = cleanupIntersections(graph);
           }

           return graph;
       };

       action.disabled = function(graph) {
           function incompleteRelation(id) {
               var entity = graph.entity(id);
               return entity.type === 'relation' && !entity.isComplete(graph);
           }

           if (_.some(moveIds, incompleteRelation))
               return 'incomplete_relation';
       };

       action.delta = function() {
           return delta;
       };

       return action;
   }

   // https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
   // https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
   function MoveNode(nodeId, loc) {
       return function(graph) {
           return graph.replace(graph.entity(nodeId).move(loc));
       };
   }

   function Noop() {
       return function(graph) {
           return graph;
       };
   }

   /*
    * Based on https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/potlatch2/tools/Quadrilateralise.as
    */

   function Orthogonalize$1(wayId, projection) {
       var threshold = 12, // degrees within right or straight to alter
           lowerThreshold = Math.cos((90 - threshold) * Math.PI / 180),
           upperThreshold = Math.cos(threshold * Math.PI / 180);

       var action = function(graph) {
           var way = graph.entity(wayId),
               nodes = graph.childNodes(way),
               points = _.uniq(nodes).map(function(n) { return projection(n.loc); }),
               corner = {i: 0, dotp: 1},
               epsilon = 1e-4,
               i, j, score, motions;

           if (nodes.length === 4) {
               for (i = 0; i < 1000; i++) {
                   motions = points.map(calcMotion);
                   points[corner.i] = addPoints(points[corner.i],motions[corner.i]);
                   score = corner.dotp;
                   if (score < epsilon) {
                       break;
                   }
               }

               graph = graph.replace(graph.entity(nodes[corner.i].id)
                   .move(projection.invert(points[corner.i])));
           } else {
               var best,
                   originalPoints = _.clone(points);
               score = Infinity;

               for (i = 0; i < 1000; i++) {
                   motions = points.map(calcMotion);
                   for (j = 0; j < motions.length; j++) {
                       points[j] = addPoints(points[j],motions[j]);
                   }
                   var newScore = squareness(points);
                   if (newScore < score) {
                       best = _.clone(points);
                       score = newScore;
                   }
                   if (score < epsilon) {
                       break;
                   }
               }

               points = best;

               for (i = 0; i < points.length; i++) {
                   // only move the points that actually moved
                   if (originalPoints[i][0] !== points[i][0] || originalPoints[i][1] !== points[i][1]) {
                       graph = graph.replace(graph.entity(nodes[i].id)
                           .move(projection.invert(points[i])));
                   }
               }

               // remove empty nodes on straight sections
               for (i = 0; i < points.length; i++) {
                   var node = nodes[i];

                   if (graph.parentWays(node).length > 1 ||
                       graph.parentRelations(node).length ||
                       node.hasInterestingTags()) {

                       continue;
                   }

                   var dotp = normalizedDotProduct(i, points);
                   if (dotp < -1 + epsilon) {
                       graph = DeleteNode(nodes[i].id)(graph);
                   }
               }
           }

           return graph;

           function calcMotion(b, i, array) {
               var a = array[(i - 1 + array.length) % array.length],
                   c = array[(i + 1) % array.length],
                   p = subtractPoints(a, b),
                   q = subtractPoints(c, b),
                   scale, dotp;

               scale = 2 * Math.min(euclideanDistance(p, [0, 0]), euclideanDistance(q, [0, 0]));
               p = normalizePoint(p, 1.0);
               q = normalizePoint(q, 1.0);

               dotp = filterDotProduct(p[0] * q[0] + p[1] * q[1]);

               // nasty hack to deal with almost-straight segments (angle is closer to 180 than to 90/270).
               if (array.length > 3) {
                   if (dotp < -0.707106781186547) {
                       dotp += 1.0;
                   }
               } else if (dotp && Math.abs(dotp) < corner.dotp) {
                   corner.i = i;
                   corner.dotp = Math.abs(dotp);
               }

               return normalizePoint(addPoints(p, q), 0.1 * dotp * scale);
           }
       };

       function squareness(points) {
           return points.reduce(function(sum, val, i, array) {
               var dotp = normalizedDotProduct(i, array);

               dotp = filterDotProduct(dotp);
               return sum + 2.0 * Math.min(Math.abs(dotp - 1.0), Math.min(Math.abs(dotp), Math.abs(dotp + 1)));
           }, 0);
       }

       function normalizedDotProduct(i, points) {
           var a = points[(i - 1 + points.length) % points.length],
               b = points[i],
               c = points[(i + 1) % points.length],
               p = subtractPoints(a, b),
               q = subtractPoints(c, b);

           p = normalizePoint(p, 1.0);
           q = normalizePoint(q, 1.0);

           return p[0] * q[0] + p[1] * q[1];
       }

       function subtractPoints(a, b) {
           return [a[0] - b[0], a[1] - b[1]];
       }

       function addPoints(a, b) {
           return [a[0] + b[0], a[1] + b[1]];
       }

       function normalizePoint(point, scale) {
           var vector = [0, 0];
           var length = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
           if (length !== 0) {
               vector[0] = point[0] / length;
               vector[1] = point[1] / length;
           }

           vector[0] *= scale;
           vector[1] *= scale;

           return vector;
       }

       function filterDotProduct(dotp) {
           if (lowerThreshold > Math.abs(dotp) || Math.abs(dotp) > upperThreshold) {
               return dotp;
           }

           return 0;
       }

       action.disabled = function(graph) {
           var way = graph.entity(wayId),
               nodes = graph.childNodes(way),
               points = _.uniq(nodes).map(function(n) { return projection(n.loc); });

           if (squareness(points)) {
               return false;
           }

           return 'not_squarish';
       };

       return action;
   }

   // Split a way at the given node.
   //
   // Optionally, split only the given ways, if multiple ways share
   // the given node.
   //
   // This is the inverse of `iD.actions.Join`.
   //
   // For testing convenience, accepts an ID to assign to the new way.
   // Normally, this will be undefined and the way will automatically
   // be assigned a new ID.
   //
   // Reference:
   //   https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/SplitWayAction.as
   //
   function Split$1(nodeId, newWayIds) {
       var wayIds;

       // if the way is closed, we need to search for a partner node
       // to split the way at.
       //
       // The following looks for a node that is both far away from
       // the initial node in terms of way segment length and nearby
       // in terms of beeline-distance. This assures that areas get
       // split on the most "natural" points (independent of the number
       // of nodes).
       // For example: bone-shaped areas get split across their waist
       // line, circles across the diameter.
       function splitArea(nodes, idxA, graph) {
           var lengths = new Array(nodes.length),
               length,
               i,
               best = 0,
               idxB;

           function wrap(index) {
               return Wrap(index, nodes.length);
           }

           function dist(nA, nB) {
               return sphericalDistance(graph.entity(nA).loc, graph.entity(nB).loc);
           }

           // calculate lengths
           length = 0;
           for (i = wrap(idxA+1); i !== idxA; i = wrap(i+1)) {
               length += dist(nodes[i], nodes[wrap(i-1)]);
               lengths[i] = length;
           }

           length = 0;
           for (i = wrap(idxA-1); i !== idxA; i = wrap(i-1)) {
               length += dist(nodes[i], nodes[wrap(i+1)]);
               if (length < lengths[i])
                   lengths[i] = length;
           }

           // determine best opposite node to split
           for (i = 0; i < nodes.length; i++) {
               var cost = lengths[i] / dist(nodes[idxA], nodes[i]);
               if (cost > best) {
                   idxB = i;
                   best = cost;
               }
           }

           return idxB;
       }

       function split(graph, wayA, newWayId) {
           var wayB = Way({id: newWayId, tags: wayA.tags}),
               nodesA,
               nodesB,
               isArea = wayA.isArea(),
               isOuter = isSimpleMultipolygonOuterMember(wayA, graph);

           if (wayA.isClosed()) {
               var nodes = wayA.nodes.slice(0, -1),
                   idxA = _.indexOf(nodes, nodeId),
                   idxB = splitArea(nodes, idxA, graph);

               if (idxB < idxA) {
                   nodesA = nodes.slice(idxA).concat(nodes.slice(0, idxB + 1));
                   nodesB = nodes.slice(idxB, idxA + 1);
               } else {
                   nodesA = nodes.slice(idxA, idxB + 1);
                   nodesB = nodes.slice(idxB).concat(nodes.slice(0, idxA + 1));
               }
           } else {
               var idx = _.indexOf(wayA.nodes, nodeId, 1);
               nodesA = wayA.nodes.slice(0, idx + 1);
               nodesB = wayA.nodes.slice(idx);
           }

           wayA = wayA.update({nodes: nodesA});
           wayB = wayB.update({nodes: nodesB});

           graph = graph.replace(wayA);
           graph = graph.replace(wayB);

           graph.parentRelations(wayA).forEach(function(relation) {
               if (relation.isRestriction()) {
                   var via = relation.memberByRole('via');
                   if (via && wayB.contains(via.id)) {
                       relation = relation.updateMember({id: wayB.id}, relation.memberById(wayA.id).index);
                       graph = graph.replace(relation);
                   }
               } else {
                   if (relation === isOuter) {
                       graph = graph.replace(relation.mergeTags(wayA.tags));
                       graph = graph.replace(wayA.update({tags: {}}));
                       graph = graph.replace(wayB.update({tags: {}}));
                   }

                   var member = {
                       id: wayB.id,
                       type: 'way',
                       role: relation.memberById(wayA.id).role
                   };

                   graph = AddMember(relation.id, member)(graph);
               }
           });

           if (!isOuter && isArea) {
               var multipolygon = Relation({
                   tags: _.extend({}, wayA.tags, {type: 'multipolygon'}),
                   members: [
                       {id: wayA.id, role: 'outer', type: 'way'},
                       {id: wayB.id, role: 'outer', type: 'way'}
                   ]});

               graph = graph.replace(multipolygon);
               graph = graph.replace(wayA.update({tags: {}}));
               graph = graph.replace(wayB.update({tags: {}}));
           }

           return graph;
       }

       var action = function(graph) {
           var candidates = action.ways(graph);
           for (var i = 0; i < candidates.length; i++) {
               graph = split(graph, candidates[i], newWayIds && newWayIds[i]);
           }
           return graph;
       };

       action.ways = function(graph) {
           var node = graph.entity(nodeId),
               parents = graph.parentWays(node),
               hasLines = _.some(parents, function(parent) { return parent.geometry(graph) === 'line'; });

           return parents.filter(function(parent) {
               if (wayIds && wayIds.indexOf(parent.id) === -1)
                   return false;

               if (!wayIds && hasLines && parent.geometry(graph) !== 'line')
                   return false;

               if (parent.isClosed()) {
                   return true;
               }

               for (var i = 1; i < parent.nodes.length - 1; i++) {
                   if (parent.nodes[i] === nodeId) {
                       return true;
                   }
               }

               return false;
           });
       };

       action.disabled = function(graph) {
           var candidates = action.ways(graph);
           if (candidates.length === 0 || (wayIds && wayIds.length !== candidates.length))
               return 'not_eligible';
       };

       action.limitWays = function(_) {
           if (!arguments.length) return wayIds;
           wayIds = _;
           return action;
       };

       return action;
   }

   // Create a restriction relation for `turn`, which must have the following structure:
   //
   //     {
   //         from: { node: <node ID>, way: <way ID> },
   //         via:  { node: <node ID> },
   //         to:   { node: <node ID>, way: <way ID> },
   //         restriction: <'no_right_turn', 'no_left_turn', etc.>
   //     }
   //
   // This specifies a restriction of type `restriction` when traveling from
   // `from.node` in `from.way` toward `to.node` in `to.way` via `via.node`.
   // (The action does not check that these entities form a valid intersection.)
   //
   // If `restriction` is not provided, it is automatically determined by
   // inferRestriction.
   //
   // If necessary, the `from` and `to` ways are split. In these cases, `from.node`
   // and `to.node` are used to determine which portion of the split ways become
   // members of the restriction.
   //
   // For testing convenience, accepts an ID to assign to the new relation.
   // Normally, this will be undefined and the relation will automatically
   // be assigned a new ID.
   //
   function RestrictTurn(turn, projection, restrictionId) {
       return function(graph) {
           var from = graph.entity(turn.from.way),
               via  = graph.entity(turn.via.node),
               to   = graph.entity(turn.to.way);

           function isClosingNode(way, nodeId) {
               return nodeId === way.first() && nodeId === way.last();
           }

           function split(toOrFrom) {
               var newID = toOrFrom.newID || Way().id;
               graph = Split$1(via.id, [newID])
                   .limitWays([toOrFrom.way])(graph);

               var a = graph.entity(newID),
                   b = graph.entity(toOrFrom.way);

               if (a.nodes.indexOf(toOrFrom.node) !== -1) {
                   return [a, b];
               } else {
                   return [b, a];
               }
           }

           if (!from.affix(via.id) || isClosingNode(from, via.id)) {
               if (turn.from.node === turn.to.node) {
                   // U-turn
                   from = to = split(turn.from)[0];
               } else if (turn.from.way === turn.to.way) {
                   // Straight-on or circular
                   var s = split(turn.from);
                   from = s[0];
                   to   = s[1];
               } else {
                   // Other
                   from = split(turn.from)[0];
               }
           }

           if (!to.affix(via.id) || isClosingNode(to, via.id)) {
               to = split(turn.to)[0];
           }

           return graph.replace(Relation({
               id: restrictionId,
               tags: {
                   type: 'restriction',
                   restriction: turn.restriction ||
                       inferRestriction(
                           graph,
                           turn.from,
                           turn.via,
                           turn.to,
                           projection)
               },
               members: [
                   {id: from.id, type: 'way',  role: 'from'},
                   {id: via.id,  type: 'node', role: 'via'},
                   {id: to.id,   type: 'way',  role: 'to'}
               ]
           }));
       };
   }

   /*
     Order the nodes of a way in reverse order and reverse any direction dependent tags
     other than `oneway`. (We assume that correcting a backwards oneway is the primary
     reason for reversing a way.)

     The following transforms are performed:

       Keys:
             *:right=* ⟺ *:left=*
           *:forward=* ⟺ *:backward=*
          direction=up ⟺ direction=down
            incline=up ⟺ incline=down
               *=right ⟺ *=left

       Relation members:
          role=forward ⟺ role=backward
            role=north ⟺ role=south
             role=east ⟺ role=west

      In addition, numeric-valued `incline` tags are negated.

      The JOSM implementation was used as a guide, but transformations that were of unclear benefit
      or adjusted tags that don't seem to be used in practice were omitted.

      References:
         http://wiki.openstreetmap.org/wiki/Forward_%26_backward,_left_%26_right
         http://wiki.openstreetmap.org/wiki/Key:direction#Steps
         http://wiki.openstreetmap.org/wiki/Key:incline
         http://wiki.openstreetmap.org/wiki/Route#Members
         http://josm.openstreetmap.de/browser/josm/trunk/src/org/openstreetmap/josm/corrector/ReverseWayTagCorrector.java
    */
   function Reverse$1(wayId, options) {
       var replacements = [
               [/:right$/, ':left'], [/:left$/, ':right'],
               [/:forward$/, ':backward'], [/:backward$/, ':forward']
           ],
           numeric = /^([+\-]?)(?=[\d.])/,
           roleReversals = {
               forward: 'backward',
               backward: 'forward',
               north: 'south',
               south: 'north',
               east: 'west',
               west: 'east'
           };

       function reverseKey(key) {
           for (var i = 0; i < replacements.length; ++i) {
               var replacement = replacements[i];
               if (replacement[0].test(key)) {
                   return key.replace(replacement[0], replacement[1]);
               }
           }
           return key;
       }

       function reverseValue(key, value) {
           if (key === 'incline' && numeric.test(value)) {
               return value.replace(numeric, function(_, sign) { return sign === '-' ? '' : '-'; });
           } else if (key === 'incline' || key === 'direction') {
               return {up: 'down', down: 'up'}[value] || value;
           } else if (options && options.reverseOneway && key === 'oneway') {
               return {yes: '-1', '1': '-1', '-1': 'yes'}[value] || value;
           } else {
               return {left: 'right', right: 'left'}[value] || value;
           }
       }

       return function(graph) {
           var way = graph.entity(wayId),
               nodes = way.nodes.slice().reverse(),
               tags = {}, key, role;

           for (key in way.tags) {
               tags[reverseKey(key)] = reverseValue(key, way.tags[key]);
           }

           graph.parentRelations(way).forEach(function(relation) {
               relation.members.forEach(function(member, index) {
                   if (member.id === way.id && (role = roleReversals[member.role])) {
                       relation = relation.updateMember({role: role}, index);
                       graph = graph.replace(relation);
                   }
               });
           });

           return graph.replace(way.update({nodes: nodes, tags: tags}));
       };
   }

   function Revert(id) {

       var action = function(graph) {
           var entity = graph.hasEntity(id),
               base = graph.base().entities[id];

           if (entity && !base) {    // entity will be removed..
               if (entity.type === 'node') {
                   graph.parentWays(entity)
                       .forEach(function(parent) {
                           parent = parent.removeNode(id);
                           graph = graph.replace(parent);

                           if (parent.isDegenerate()) {
                               graph = DeleteWay(parent.id)(graph);
                           }
                       });
               }

               graph.parentRelations(entity)
                   .forEach(function(parent) {
                       parent = parent.removeMembersWithID(id);
                       graph = graph.replace(parent);

                       if (parent.isDegenerate()) {
                           graph = DeleteRelation(parent.id)(graph);
                       }
                   });
           }

           return graph.revert(id);
       };

       return action;
   }

   function RotateWay$1(wayId, pivot, angle, projection) {
       return function(graph) {
           return graph.update(function(graph) {
               var way = graph.entity(wayId);

               _.uniq(way.nodes).forEach(function(id) {

                   var node = graph.entity(id),
                       point = projection(node.loc),
                       radial = [0,0];

                   radial[0] = point[0] - pivot[0];
                   radial[1] = point[1] - pivot[1];

                   point = [
                       radial[0] * Math.cos(angle) - radial[1] * Math.sin(angle) + pivot[0],
                       radial[0] * Math.sin(angle) + radial[1] * Math.cos(angle) + pivot[1]
                   ];

                   graph = graph.replace(node.move(projection.invert(point)));

               });

           });
       };
   }

   /*
    * Based on https://github.com/openstreetmap/potlatch2/net/systemeD/potlatch2/tools/Straighten.as
    */

   function Straighten$1(wayId, projection) {
       function positionAlongWay(n, s, e) {
           return ((n[0] - s[0]) * (e[0] - s[0]) + (n[1] - s[1]) * (e[1] - s[1]))/
                   (Math.pow(e[0] - s[0], 2) + Math.pow(e[1] - s[1], 2));
       }

       var action = function(graph) {
           var way = graph.entity(wayId),
               nodes = graph.childNodes(way),
               points = nodes.map(function(n) { return projection(n.loc); }),
               startPoint = points[0],
               endPoint = points[points.length-1],
               toDelete = [],
               i;

           for (i = 1; i < points.length-1; i++) {
               var node = nodes[i],
                   point = points[i];

               if (graph.parentWays(node).length > 1 ||
                   graph.parentRelations(node).length ||
                   node.hasInterestingTags()) {

                   var u = positionAlongWay(point, startPoint, endPoint),
                       p0 = startPoint[0] + u * (endPoint[0] - startPoint[0]),
                       p1 = startPoint[1] + u * (endPoint[1] - startPoint[1]);

                   graph = graph.replace(graph.entity(node.id)
                       .move(projection.invert([p0, p1])));
               } else {
                   // safe to delete
                   if (toDelete.indexOf(node) === -1) {
                       toDelete.push(node);
                   }
               }
           }

           for (i = 0; i < toDelete.length; i++) {
               graph = DeleteNode(toDelete[i].id)(graph);
           }

           return graph;
       };

       action.disabled = function(graph) {
           // check way isn't too bendy
           var way = graph.entity(wayId),
               nodes = graph.childNodes(way),
               points = nodes.map(function(n) { return projection(n.loc); }),
               startPoint = points[0],
               endPoint = points[points.length-1],
               threshold = 0.2 * Math.sqrt(Math.pow(startPoint[0] - endPoint[0], 2) + Math.pow(startPoint[1] - endPoint[1], 2)),
               i;

           if (threshold === 0) {
               return 'too_bendy';
           }

           for (i = 1; i < points.length-1; i++) {
               var point = points[i],
                   u = positionAlongWay(point, startPoint, endPoint),
                   p0 = startPoint[0] + u * (endPoint[0] - startPoint[0]),
                   p1 = startPoint[1] + u * (endPoint[1] - startPoint[1]),
                   dist = Math.sqrt(Math.pow(p0 - point[0], 2) + Math.pow(p1 - point[1], 2));

               // to bendy if point is off by 20% of total start/end distance in projected space
               if (isNaN(dist) || dist > threshold) {
                   return 'too_bendy';
               }
           }
       };

       return action;
   }

   // Remove the effects of `turn.restriction` on `turn`, which must have the
   // following structure:
   //
   //     {
   //         from: { node: <node ID>, way: <way ID> },
   //         via:  { node: <node ID> },
   //         to:   { node: <node ID>, way: <way ID> },
   //         restriction: <relation ID>
   //     }
   //
   // In the simple case, `restriction` is a reference to a `no_*` restriction
   // on the turn itself. In this case, it is simply deleted.
   //
   // The more complex case is where `restriction` references an `only_*`
   // restriction on a different turn in the same intersection. In that case,
   // that restriction is also deleted, but at the same time restrictions on
   // the turns other than the first two are created.
   //
   function UnrestrictTurn(turn) {
       return function(graph) {
           return DeleteRelation(turn.restriction)(graph);
       };
   }



   var actions = Object.freeze({
   	AddEntity: AddEntity,
   	AddMember: AddMember,
   	AddMidpoint: AddMidpoint,
   	AddVertex: AddVertex,
   	ChangeMember: ChangeMember,
   	ChangePreset: ChangePreset,
   	ChangeTags: ChangeTags,
   	Circularize: Circularize$1,
   	Connect: Connect,
   	CopyEntities: CopyEntities,
   	DeleteMember: DeleteMember,
   	DeleteMultiple: DeleteMultiple,
   	DeleteNode: DeleteNode,
   	DeleteRelation: DeleteRelation,
   	DeleteWay: DeleteWay,
   	DeprecateTags: DeprecateTags,
   	DiscardTags: DiscardTags,
   	Disconnect: Disconnect$1,
   	Join: Join,
   	Merge: Merge$1,
   	MergePolygon: MergePolygon,
   	MergeRemoteChanges: MergeRemoteChanges,
   	Move: Move$1,
   	MoveNode: MoveNode,
   	Noop: Noop,
   	Orthogonalize: Orthogonalize$1,
   	RestrictTurn: RestrictTurn,
   	Reverse: Reverse$1,
   	Revert: Revert,
   	RotateWay: RotateWay$1,
   	Split: Split$1,
   	Straighten: Straighten$1,
   	UnrestrictTurn: UnrestrictTurn
   });

   function Collection(collection) {
       var maxSearchResults = 50,
           maxSuggestionResults = 10;

       var presets = {

           collection: collection,

           item: function(id) {
               return _.find(collection, function(d) {
                   return d.id === id;
               });
           },

           matchGeometry: function(geometry) {
               return Collection(collection.filter(function(d) {
                   return d.matchGeometry(geometry);
               }));
           },

           search: function(value, geometry) {
               if (!value) return this;

               value = value.toLowerCase();

               var searchable = _.filter(collection, function(a) {
                       return a.searchable !== false && a.suggestion !== true;
                   }),
                   suggestions = _.filter(collection, function(a) {
                       return a.suggestion === true;
                   });

               function leading(a) {
                   var index = a.indexOf(value);
                   return index === 0 || a[index - 1] === ' ';
               }

               // matches value to preset.name
               var leading_name = _.filter(searchable, function(a) {
                       return leading(a.name().toLowerCase());
                   }).sort(function(a, b) {
                       var i = a.name().toLowerCase().indexOf(value) - b.name().toLowerCase().indexOf(value);
                       if (i === 0) return a.name().length - b.name().length;
                       else return i;
                   });

               // matches value to preset.terms values
               var leading_terms = _.filter(searchable, function(a) {
                       return _.some(a.terms() || [], leading);
                   });

               // matches value to preset.tags values
               var leading_tag_values = _.filter(searchable, function(a) {
                       return _.some(_.without(_.values(a.tags || {}), '*'), leading);
                   });


               // finds close matches to value in preset.name
               var levenstein_name = searchable.map(function(a) {
                       return {
                           preset: a,
                           dist: editDistance(value, a.name().toLowerCase())
                       };
                   }).filter(function(a) {
                       return a.dist + Math.min(value.length - a.preset.name().length, 0) < 3;
                   }).sort(function(a, b) {
                       return a.dist - b.dist;
                   }).map(function(a) {
                       return a.preset;
                   });

               // finds close matches to value in preset.terms
               var leventstein_terms = _.filter(searchable, function(a) {
                       return _.some(a.terms() || [], function(b) {
                           return editDistance(value, b) + Math.min(value.length - b.length, 0) < 3;
                       });
                   });

               function suggestionName(name) {
                   var nameArray = name.split(' - ');
                   if (nameArray.length > 1) {
                       name = nameArray.slice(0, nameArray.length-1).join(' - ');
                   }
                   return name.toLowerCase();
               }

               var leading_suggestions = _.filter(suggestions, function(a) {
                       return leading(suggestionName(a.name()));
                   }).sort(function(a, b) {
                       a = suggestionName(a.name());
                       b = suggestionName(b.name());
                       var i = a.indexOf(value) - b.indexOf(value);
                       if (i === 0) return a.length - b.length;
                       else return i;
                   });

               var leven_suggestions = suggestions.map(function(a) {
                       return {
                           preset: a,
                           dist: editDistance(value, suggestionName(a.name()))
                       };
                   }).filter(function(a) {
                       return a.dist + Math.min(value.length - suggestionName(a.preset.name()).length, 0) < 1;
                   }).sort(function(a, b) {
                       return a.dist - b.dist;
                   }).map(function(a) {
                       return a.preset;
                   });

               var other = presets.item(geometry);

               var results = leading_name.concat(
                               leading_terms,
                               leading_tag_values,
                               leading_suggestions.slice(0, maxSuggestionResults+5),
                               levenstein_name,
                               leventstein_terms,
                               leven_suggestions.slice(0, maxSuggestionResults)
                           ).slice(0, maxSearchResults-1);

               return Collection(_.uniq(
                       results.concat(other)
                   ));
           }
       };

       return presets;
   }

   function Category(id, category, all) {
       category = _.clone(category);

       category.id = id;

       category.members = Collection(category.members.map(function(id) {
           return all.item(id);
       }));

       category.matchGeometry = function(geometry) {
           return category.geometry.indexOf(geometry) >= 0;
       };

       category.matchScore = function() { return -1; };

       category.name = function() {
           return t('presets.categories.' + id + '.name', {'default': id});
       };

       category.terms = function() {
           return [];
       };

       return category;
   }

   function Field(id, field) {
       field = _.clone(field);

       field.id = id;

       field.matchGeometry = function(geometry) {
           return !field.geometry || field.geometry === geometry;
       };

       field.t = function(scope, options) {
           return t('presets.fields.' + id + '.' + scope, options);
       };

       field.label = function() {
           return field.t('label', {'default': id});
       };

       var placeholder = field.placeholder;
       field.placeholder = function() {
           return field.t('placeholder', {'default': placeholder});
       };

       return field;
   }

   function Preset(id, preset, fields) {
       preset = _.clone(preset);

       preset.id = id;
       preset.fields = (preset.fields || []).map(getFields);
       preset.geometry = (preset.geometry || []);

       function getFields(f) {
           return fields[f];
       }

       preset.matchGeometry = function(geometry) {
           return preset.geometry.indexOf(geometry) >= 0;
       };

       var matchScore = preset.matchScore || 1;
       preset.matchScore = function(entity) {
           var tags = preset.tags,
               score = 0;

           for (var t in tags) {
               if (entity.tags[t] === tags[t]) {
                   score += matchScore;
               } else if (tags[t] === '*' && t in entity.tags) {
                   score += matchScore / 2;
               } else {
                   return -1;
               }
           }

           return score;
       };

       preset.t = function(scope, options) {
           return t('presets.presets.' + id + '.' + scope, options);
       };

       var name = preset.name;
       preset.name = function() {
           if (preset.suggestion) {
               id = id.split('/');
               id = id[0] + '/' + id[1];
               return name + ' - ' + t('presets.presets.' + id + '.name');
           }
           return preset.t('name', {'default': name});
       };

       preset.terms = function() {
           return preset.t('terms', {'default': ''}).toLowerCase().trim().split(/\s*,+\s*/);
       };

       preset.isFallback = function() {
           var tagCount = Object.keys(preset.tags).length;
           return tagCount === 0 || (tagCount === 1 && preset.tags.hasOwnProperty('area'));
       };

       preset.reference = function(geometry) {
           var key = Object.keys(preset.tags)[0],
               value = preset.tags[key];

           if (geometry === 'relation' && key === 'type') {
               return { rtype: value };
           } else if (value === '*') {
               return { key: key };
           } else {
               return { key: key, value: value };
           }
       };

       var removeTags = preset.removeTags || preset.tags;
       preset.removeTags = function(tags, geometry) {
           tags = _.omit(tags, _.keys(removeTags));

           for (var f in preset.fields) {
               var field = preset.fields[f];
               if (field.matchGeometry(geometry) && field.default === tags[field.key]) {
                   delete tags[field.key];
               }
           }

           delete tags.area;
           return tags;
       };

       var applyTags = preset.addTags || preset.tags;
       preset.applyTags = function(tags, geometry) {
           var k;

           tags = _.clone(tags);

           for (k in applyTags) {
               if (applyTags[k] === '*') {
                   tags[k] = 'yes';
               } else {
                   tags[k] = applyTags[k];
               }
           }

           // Add area=yes if necessary.
           // This is necessary if the geometry is already an area (e.g. user drew an area) AND any of:
           // 1. chosen preset could be either an area or a line (`barrier=city_wall`)
           // 2. chosen preset doesn't have a key in areaKeys (`railway=station`)
           if (geometry === 'area') {
               var needsAreaTag = true;
               if (preset.geometry.indexOf('line') === -1) {
                   for (k in applyTags) {
                       if (k in iD.areaKeys) {
                           needsAreaTag = false;
                           break;
                       }
                   }
               }
               if (needsAreaTag) {
                   tags.area = 'yes';
               }
           }

           for (var f in preset.fields) {
               var field = preset.fields[f];
               if (field.matchGeometry(geometry) && field.key && !tags[field.key] && field.default) {
                   tags[field.key] = field.default;
               }
           }

           return tags;
       };

       return preset;
   }

   function presets$1() {
       // an iD.presets.Collection with methods for
       // loading new data and returning defaults

       var all = Collection([]),
           defaults = { area: all, line: all, point: all, vertex: all, relation: all },
           fields = {},
           universal = [],
           recent = Collection([]);

       // Index of presets by (geometry, tag key).
       var index = {
           point: {},
           vertex: {},
           line: {},
           area: {},
           relation: {}
       };

       all.match = function(entity, resolver) {
           var geometry = entity.geometry(resolver),
               geometryMatches = index[geometry],
               best = -1,
               match;

           for (var k in entity.tags) {
               var keyMatches = geometryMatches[k];
               if (!keyMatches) continue;

               for (var i = 0; i < keyMatches.length; i++) {
                   var score = keyMatches[i].matchScore(entity);
                   if (score > best) {
                       best = score;
                       match = keyMatches[i];
                   }
               }
           }

           return match || all.item(geometry);
       };

       // Because of the open nature of tagging, iD will never have a complete
       // list of tags used in OSM, so we want it to have logic like "assume
       // that a closed way with an amenity tag is an area, unless the amenity
       // is one of these specific types". This function computes a structure
       // that allows testing of such conditions, based on the presets designated
       // as as supporting (or not supporting) the area geometry.
       //
       // The returned object L is a whitelist/blacklist of tags. A closed way
       // with a tag (k, v) is considered to be an area if `k in L && !(v in L[k])`
       // (see `Way#isArea()`). In other words, the keys of L form the whitelist,
       // and the subkeys form the blacklist.
       all.areaKeys = function() {
           var areaKeys = {},
               ignore = ['barrier', 'highway', 'footway', 'railway', 'type'],
               presets = _.reject(all.collection, 'suggestion');

           // whitelist
           presets.forEach(function(d) {
               for (var key in d.tags) break;
               if (!key) return;
               if (ignore.indexOf(key) !== -1) return;

               if (d.geometry.indexOf('area') !== -1) {
                   areaKeys[key] = areaKeys[key] || {};
               }
           });

           // blacklist
           presets.forEach(function(d) {
               for (var key in d.tags) break;
               if (!key) return;
               if (ignore.indexOf(key) !== -1) return;

               var value = d.tags[key];
               if (d.geometry.indexOf('area') === -1 &&
                   d.geometry.indexOf('line') !== -1 &&
                   key in areaKeys && value !== '*') {
                   areaKeys[key][value] = true;
               }
           });

           return areaKeys;
       };

       all.load = function(d) {

           if (d.fields) {
               _.forEach(d.fields, function(d, id) {
                   fields[id] = Field(id, d);
                   if (d.universal) universal.push(fields[id]);
               });
           }

           if (d.presets) {
               _.forEach(d.presets, function(d, id) {
                   all.collection.push(Preset(id, d, fields));
               });
           }

           if (d.categories) {
               _.forEach(d.categories, function(d, id) {
                   all.collection.push(Category(id, d, all));
               });
           }

           if (d.defaults) {
               var getItem = _.bind(all.item, all);
               defaults = {
                   area: Collection(d.defaults.area.map(getItem)),
                   line: Collection(d.defaults.line.map(getItem)),
                   point: Collection(d.defaults.point.map(getItem)),
                   vertex: Collection(d.defaults.vertex.map(getItem)),
                   relation: Collection(d.defaults.relation.map(getItem))
               };
           }

           for (var i = 0; i < all.collection.length; i++) {
               var preset = all.collection[i],
                   geometry = preset.geometry;

               for (var j = 0; j < geometry.length; j++) {
                   var g = index[geometry[j]];
                   for (var k in preset.tags) {
                       (g[k] = g[k] || []).push(preset);
                   }
               }
           }

           return all;
       };

       all.field = function(id) {
           return fields[id];
       };

       all.universal = function() {
           return universal;
       };

       all.defaults = function(geometry, n) {
           var rec = recent.matchGeometry(geometry).collection.slice(0, 4),
               def = _.uniq(rec.concat(defaults[geometry].collection)).slice(0, n - 1);
           return Collection(_.uniq(rec.concat(def).concat(all.item(geometry))));
       };

       all.choose = function(preset) {
           if (!preset.isFallback()) {
               recent = Collection(_.uniq([preset].concat(recent.collection)));
           }
           return all;
       };

       return all;
   }



   var presets = Object.freeze({
   	Category: Category,
   	Collection: Collection,
   	Field: Field,
   	Preset: Preset,
   	presets: presets$1
   });

   function DeprecatedTag() {

       var validation = function(changes) {
           var warnings = [];
           for (var i = 0; i < changes.created.length; i++) {
               var change = changes.created[i],
                   deprecatedTags = change.deprecatedTags();

               if (!_.isEmpty(deprecatedTags)) {
                   var tags = tagText({ tags: deprecatedTags });
                   warnings.push({
                       id: 'deprecated_tags',
                       message: t('validations.deprecated_tags', { tags: tags }),
                       entity: change
                   });
               }
           }
           return warnings;
       };

       return validation;
   }

   function ManyDeletions() {
       var threshold = 100;

       var validation = function(changes) {
           var warnings = [];
           if (changes.deleted.length > threshold) {
               warnings.push({
                   id: 'many_deletions',
                   message: t('validations.many_deletions', { n: changes.deleted.length })
               });
           }
           return warnings;
       };

       return validation;
   }

   function MissingTag() {

       // Slightly stricter check than Entity#isUsed (#3091)
       function hasTags(entity, graph) {
           return _.without(Object.keys(entity.tags), 'area', 'name').length > 0 ||
               graph.parentRelations(entity).length > 0;
       }

       var validation = function(changes, graph) {
           var warnings = [];
           for (var i = 0; i < changes.created.length; i++) {
               var change = changes.created[i],
                   geometry = change.geometry(graph);

               if ((geometry === 'point' || geometry === 'line' || geometry === 'area') && !hasTags(change, graph)) {
                   warnings.push({
                       id: 'missing_tag',
                       message: t('validations.untagged_' + geometry),
                       tooltip: t('validations.untagged_' + geometry + '_tooltip'),
                       entity: change
                   });
               }
           }
           return warnings;
       };

       return validation;
   }

   function TagSuggestsArea() {

       // https://github.com/openstreetmap/josm/blob/mirror/src/org/
       // openstreetmap/josm/data/validation/tests/UnclosedWays.java#L80
       function tagSuggestsArea(tags) {
           if (_.isEmpty(tags)) return false;

           var presence = ['landuse', 'amenities', 'tourism', 'shop'];
           for (var i = 0; i < presence.length; i++) {
               if (tags[presence[i]] !== undefined) {
                   return presence[i] + '=' + tags[presence[i]];
               }
           }

           if (tags.building && tags.building === 'yes') return 'building=yes';
       }

       var validation = function(changes, graph) {
           var warnings = [];
           for (var i = 0; i < changes.created.length; i++) {
               var change = changes.created[i],
                   geometry = change.geometry(graph),
                   suggestion = (geometry === 'line' ? tagSuggestsArea(change.tags) : undefined);

               if (suggestion) {
                   warnings.push({
                       id: 'tag_suggests_area',
                       message: t('validations.tag_suggests_area', { tag: suggestion }),
                       entity: change
                   });
               }
           }
           return warnings;
       };

       return validation;
   }



   var validations = Object.freeze({
   	DeprecatedTag: DeprecatedTag,
   	ManyDeletions: ManyDeletions,
   	MissingTag: MissingTag,
   	TagSuggestsArea: TagSuggestsArea
   });

   exports.actions = actions;
   exports.geo = geo;
   exports.behavior = behavior;
   exports.modes = modes;
   exports.operations = Operations;
   exports.presets = presets;
   exports.util = util;
   exports.ui = ui;
   exports.validations = validations;
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
   exports.BackgroundSource = BackgroundSource;
   exports.Background = Background$1;
   exports.Features = Features;
   exports.Map = Map;
   exports.TileLayer = TileLayer;

   Object.defineProperty(exports, '__esModule', { value: true });

}));
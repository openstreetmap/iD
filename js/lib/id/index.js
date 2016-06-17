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

   /* eslint-disable no-proto */
   var getPrototypeOf = Object.getPrototypeOf || function(obj) { return obj.__proto__; };
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

   function modalModule(selection, blocking) {
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
               .call(iD.svg.Icon('#icon-close'));

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

   function Loading(context) {
       var message = '',
           blocking = false,
           modal;

       var loading = function(selection) {
           modal = modalModule(selection, blocking);

           var loadertext = modal.select('.content')
               .classed('loading-modal', true)
               .append('div')
               .attr('class', 'modal-section fillL');

           loadertext.append('img')
               .attr('class', 'loader')
               .attr('src', context.imagePath('loader-white.gif'));

           loadertext.append('h3')
               .text(message);

           modal.select('button.close')
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
           modal.remove();
       };

       return loading;
   }

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

   function Circularize(wayId
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

   function Disconnect(nodeId, newNodeId) {
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

   function Merge(ids) {
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

   function Move(moveIds, tryDelta, projection, cache) {
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

   function Orthogonalize(wayId, projection) {
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
   function Split(nodeId, newWayIds) {
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
               graph = Split(via.id, [newID])
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
   function Reverse(wayId, options) {
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

   function RotateWay(wayId, pivot, angle, projection) {
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

   function Straighten(wayId, projection) {
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
   	Circularize: Circularize,
   	Connect: Connect,
   	CopyEntities: CopyEntities,
   	DeleteMember: DeleteMember,
   	DeleteMultiple: DeleteMultiple,
   	DeleteNode: DeleteNode,
   	DeleteRelation: DeleteRelation,
   	DeleteWay: DeleteWay,
   	DeprecateTags: DeprecateTags,
   	DiscardTags: DiscardTags,
   	Disconnect: Disconnect,
   	Join: Join,
   	Merge: Merge,
   	MergePolygon: MergePolygon,
   	MergeRemoteChanges: MergeRemoteChanges,
   	Move: Move,
   	MoveNode: MoveNode,
   	Noop: Noop,
   	Orthogonalize: Orthogonalize,
   	RestrictTurn: RestrictTurn,
   	Reverse: Reverse,
   	Revert: Revert,
   	RotateWay: RotateWay,
   	Split: Split,
   	Straighten: Straighten,
   	UnrestrictTurn: UnrestrictTurn
   });

   exports.actions = actions;
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
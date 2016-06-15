(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
   typeof define === 'function' && define.amd ? define(['exports'], factory) :
   (factory((global.iD = global.iD || {}, global.iD.geo = global.iD.geo || {})));
}(this, function (exports) { 'use strict';

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
                   wayA = iD.Way({id: way.id + '-a', tags: way.tags, nodes: way.nodes.slice(0, splitIndex)});
                   wayB = iD.Way({id: way.id + '-b', tags: way.tags, nodes: way.nodes.slice(splitIndex)});
                   indexA = 1;
                   indexB = way.nodes.length - 2;
               } else {
                   splitIndex = _.indexOf(way.nodes, vertex.id, 1);  // split at vertexid
                   wayA = iD.Way({id: way.id + '-a', tags: way.tags, nodes: way.nodes.slice(0, splitIndex + 1)});
                   wayB = iD.Way({id: way.id + '-b', tags: way.tags, nodes: way.nodes.slice(splitIndex)});
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

   exports.roundCoords = roundCoords;
   exports.interp = interp;
   exports.cross = cross;
   exports.euclideanDistance = euclideanDistance;
   exports.latToMeters = latToMeters;
   exports.lonToMeters = lonToMeters;
   exports.metersToLat = metersToLat;
   exports.metersToLon = metersToLon;
   exports.offsetToMeters = offsetToMeters;
   exports.metersToOffset = metersToOffset;
   exports.sphericalDistance = sphericalDistance;
   exports.edgeEqual = edgeEqual;
   exports.angle = getAngle;
   exports.chooseEdge = chooseEdge;
   exports.lineIntersection = lineIntersection;
   exports.pathIntersections = pathIntersections;
   exports.pointInPolygon = pointInPolygon;
   exports.polygonContainsPolygon = polygonContainsPolygon;
   exports.polygonIntersectsPolygon = polygonIntersectsPolygon;
   exports.pathLength = pathLength;
   exports.Extent = Extent;
   exports.Intersection = Intersection;
   exports.Turn = Turn;
   exports.inferRestriction = inferRestriction;
   exports.isSimpleMultipolygonOuterMember = isSimpleMultipolygonOuterMember;
   exports.simpleMultipolygonOuterMember = simpleMultipolygonOuterMember;
   exports.joinWays = joinWays;
   exports.RawMercator = RawMercator;

   Object.defineProperty(exports, '__esModule', { value: true });

}));
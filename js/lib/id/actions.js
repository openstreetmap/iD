(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.iD = global.iD || {}, global.iD.actions = global.iD.actions || {})));
}(this, function (exports) { 'use strict';

  function AddEntity(way) {
      return function(graph) {
          return graph.replace(way);
      };
  };

  function AddMember(relationId, member, memberIndex) {
      return function(graph) {
          var relation = graph.entity(relationId);

          if (isNaN(memberIndex) && member.type === 'way') {
              var members = relation.indexedMembers();
              members.push(member);

              var joined = iD.geo.joinWays(members, graph);
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
  };

  function AddMidpoint(midpoint, node) {
      return function(graph) {
          graph = graph.replace(node.move(midpoint.loc));

          var parents = _.intersection(
              graph.parentWays(graph.entity(midpoint.edge[0])),
              graph.parentWays(graph.entity(midpoint.edge[1])));

          parents.forEach(function(way) {
              for (var i = 0; i < way.nodes.length - 1; i++) {
                  if (iD.geo.edgeEqual([way.nodes[i], way.nodes[i + 1]], midpoint.edge)) {
                      graph = graph.replace(graph.entity(way.id).addNode(node.id, i + 1));

                      // Add only one midpoint on doubled-back segments,
                      // turning them into self-intersections.
                      return;
                  }
              }
          });

          return graph;
      };
  };

  // https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
  function AddVertex(wayId, nodeId, index) {
      return function(graph) {
          return graph.replace(graph.entity(wayId).addNode(nodeId, index));
      };
  };

  function ChangeMember(relationId, member, memberIndex) {
      return function(graph) {
          return graph.replace(graph.entity(relationId).updateMember(member, memberIndex));
      };
  };

  function ChangePreset(entityId, oldPreset, newPreset) {
      return function(graph) {
          var entity = graph.entity(entityId),
              geometry = entity.geometry(graph),
              tags = entity.tags;

          if (oldPreset) tags = oldPreset.removeTags(tags, geometry);
          if (newPreset) tags = newPreset.applyTags(tags, geometry);

          return graph.replace(entity.update({tags: tags}));
      };
  };

  function ChangeTags(entityId, tags) {
      return function(graph) {
          var entity = graph.entity(entityId);
          return graph.replace(entity.update({tags: tags}));
      };
  };

  function Circularize(wayId, projection, maxAngle) {
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
              centroid = (points.length === 2) ? iD.geo.interp(points[0], points[1], 0.5) : d3.geom.polygon(points).centroid(),
              radius = d3.median(points, function(p) { return iD.geo.euclideanDistance(centroid, p); }),
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
              distance = iD.geo.euclideanDistance(centroid, keyPoints[i]);
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

                  node = iD.Node({loc: loc});
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
                  var point = iD.geo.interp(hull[i], hull[i+1], j / indexRange),
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
  };

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
  };

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
  };

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
  };

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
  };

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
  };

  function DeleteMember(relationId, memberIndex) {
      return function(graph) {
          var relation = graph.entity(relationId)
              .removeMember(memberIndex);

          graph = graph.replace(relation);

          if (relation.isDegenerate())
              graph = DeleteRelation(relation.id)(graph);

          return graph;
      };
  };

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

  // Disconect the ways at the given node.
  //
  // Optionally, disconnect only the given ways.
  //
  // For testing convenience, accepts an ID to assign to the (first) new node.
  // Normally, this will be undefined and the way will automatically
  // be assigned a new ID.
  //
  // This is the inverse of `iD.actions.Connect`.
  //
  // Reference:
  //   https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/UnjoinNodeAction.as
  //   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/UnGlueAction.java
  //
  function Disconnect(nodeId, newNodeId) {
      var wayIds;

      var action = function(graph) {
          var node = graph.entity(nodeId),
              connections = action.connections(graph);

          connections.forEach(function(connection) {
              var way = graph.entity(connection.wayID),
                  newNode = iD.Node({id: newNodeId, loc: node.loc, tags: node.tags});

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

  // Join ways at the end node they share.
  //
  // This is the inverse of `iD.actions.Split`.
  //
  // Reference:
  //   https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MergeWaysAction.as
  //   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/CombineWayAction.java
  //
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

          var joined = iD.geo.joinWays(ways, graph)[0];

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

          var joined = iD.geo.joinWays(ids.map(graph.entity, graph), graph);
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
                  } else if (tags[k] && iD.interestingTag(k) && tags[k] !== way.tags[k]) {
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
              return polygons.concat(iD.geo.joinWays(m.members, graph));
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
                  return iD.geo.polygonContainsPolygon(
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
              iD.Relation({ id: newRelationId, tags: { type: 'multipolygon' }});

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
                  target = iD.Entity(local);
                  if (remote) {
                      target = target.update({ version: remote.version });
                  }
                  updates.replacements.push(target);

              } else if (option === 'safe' && local && remote && local.version !== remote.version) {
                  target = iD.Entity(local, { version: remote.version });
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
              target = iD.Entity(local, { version: remote.version });

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
  };

  // https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
  // https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
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
              orig = iD.Node();
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

          var angle = Math.abs(iD.geo.angle(orig, prev, projection) -
                  iD.geo.angle(orig, next, projection)) * 180 / Math.PI;

          // Don't add orig vertex if it would just make a straight line..
          if (angle > 175 && angle < 185) return graph;

          // Don't add orig vertex if another point is already nearby (within 10m)
          if (iD.geo.sphericalDistance(prev.loc, orig.loc) < 10 ||
              iD.geo.sphericalDistance(orig.loc, next.loc) < 10) return graph;

          // moving forward or backward along way?
          var p1 = [prev.loc, orig.loc, moved.loc, next.loc].map(projection),
              p2 = [prev.loc, moved.loc, orig.loc, next.loc].map(projection),
              d1 = iD.geo.pathLength(p1),
              d2 = iD.geo.pathLength(p2),
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

          var edge1 = !isEP1 && iD.geo.chooseEdge(nodes1, projection(vertex.loc), projection),
              edge2 = !isEP2 && iD.geo.chooseEdge(nodes2, projection(vertex.loc), projection),
              loc;

          // snap vertex to nearest edge (or some point between them)..
          if (!isEP1 && !isEP2) {
              var epsilon = 1e-4, maxIter = 10;
              for (var i = 0; i < maxIter; i++) {
                  loc = iD.geo.interp(edge1.loc, edge2.loc, 0.5);
                  edge1 = iD.geo.chooseEdge(nodes1, projection(loc), projection);
                  edge2 = iD.geo.chooseEdge(nodes2, projection(loc), projection);
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
                  hits = iD.geo.pathIntersections(movedPath, unmovedPath);

              for (var i = 0; i < hits.length; i++) {
                  if (_.isEqual(hits[i], end)) continue;
                  var edge = iD.geo.chooseEdge(unmovedNodes, end, projection);
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
  };

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

              scale = 2 * Math.min(iD.geo.euclideanDistance(p, [0, 0]), iD.geo.euclideanDistance(q, [0, 0]));
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
              return iD.util.wrap(index, nodes.length);
          }

          function dist(nA, nB) {
              return iD.geo.sphericalDistance(graph.entity(nA).loc, graph.entity(nB).loc);
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
          var wayB = iD.Way({id: newWayId, tags: wayA.tags}),
              nodesA,
              nodesB,
              isArea = wayA.isArea(),
              isOuter = iD.geo.isSimpleMultipolygonOuterMember(wayA, graph);

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
              var multipolygon = iD.Relation({
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
  // iD.geo.inferRestriction.
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
              var newID = toOrFrom.newID || iD.Way().id;
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

          return graph.replace(iD.Relation({
              id: restrictionId,
              tags: {
                  type: 'restriction',
                  restriction: turn.restriction ||
                      iD.geo.inferRestriction(
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

  exports.AddEntity = AddEntity;
  exports.AddMember = AddMember;
  exports.AddMidpoint = AddMidpoint;
  exports.AddVertex = AddVertex;
  exports.ChangeMember = ChangeMember;
  exports.ChangePreset = ChangePreset;
  exports.ChangeTags = ChangeTags;
  exports.Circularize = Circularize;
  exports.Connect = Connect;
  exports.CopyEntities = CopyEntities;
  exports.DeleteMember = DeleteMember;
  exports.DeleteMultiple = DeleteMultiple;
  exports.DeleteNode = DeleteNode;
  exports.DeleteRelation = DeleteRelation;
  exports.DeleteWay = DeleteWay;
  exports.DeprecateTags = DeprecateTags;
  exports.DiscardTags = DiscardTags;
  exports.Disconnect = Disconnect;
  exports.Join = Join;
  exports.Merge = Merge;
  exports.MergePolygon = MergePolygon;
  exports.MergeRemoteChanges = MergeRemoteChanges;
  exports.Move = Move;
  exports.MoveNode = MoveNode;
  exports.Noop = Noop;
  exports.Orthogonalize = Orthogonalize;
  exports.RestrictTurn = RestrictTurn;
  exports.Reverse = Reverse;
  exports.Revert = Revert;
  exports.RotateWay = RotateWay;
  exports.Split = Split;
  exports.Straighten = Straighten;
  exports.UnrestrictTurn = UnrestrictTurn;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
   typeof define === 'function' && define.amd ? define(['exports'], factory) :
   (factory((global.iD = global.iD || {}, global.iD.services = global.iD.services || {})));
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

   var require$$0$5 = {};

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
           serializer = new (require$$0$5.XMLSerializer)();
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

   var require$$0$6 = (index$7 && typeof index$7 === 'object' && 'default' in index$7 ? index$7['default'] : index$7);

   var index$6 = createCommonjsModule(function (module) {
   'use strict';

   module.exports = rbush;

   var quickselect = require$$0$6;

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

   var endpoint;
   var cache;
   function init() {
       endpoint = 'https://nominatim.openstreetmap.org/reverse?';
       if (!cache) {
           reset();
       }
   }

   function reset() {
       cache = rbush();
   }

   function countryCode(location, callback) {
           var countryCodes = cache.search({ minX: location[0], minY: location[1], maxX: location[0], maxY: location[1] });

           if (countryCodes.length > 0)
               return callback(null, countryCodes[0].data);

           d3.json(endpoint +
               qsString({
                   format: 'json',
                   addressdetails: 1,
                   lat: location[1],
                   lon: location[0]
               }), function(err, result) {
                   if (err)
                       return callback(err);
                   else if (result && result.error)
                       return callback(result.error);

                   var extent = Extent(location).padByMeters(1000);

                   cache.insert(Object.assign(extent.bbox(), { data: result.address.country_code }));

                   callback(null, result.address.country_code);
               });
   }


   var nominatim = Object.freeze({
       init: init,
       reset: reset,
       countryCode: countryCode
   });

   function mapillary() {
       var mapillary = {},
           apibase = 'https://a.mapillary.com/v2/',
           viewercss = 'https://npmcdn.com/mapillary-js@1.3.0/dist/mapillary-js.min.css',
           viewerjs = 'https://npmcdn.com/mapillary-js@1.3.0/dist/mapillary-js.min.js',
           clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi',
           maxResults = 1000,
           maxPages = 10,
           tileZoom = 14,
           dispatch = d3.dispatch('loadedImages', 'loadedSigns');


       function loadSignStyles(context) {
           d3.select('head').selectAll('#traffico')
               .data([0])
               .enter()
               .append('link')
               .attr('id', 'traffico')
               .attr('rel', 'stylesheet')
               .attr('href', context.asset('traffico/stylesheets/traffico.css'));
       }

       function loadSignDefs(context) {
           if (mapillary.sign_defs) return;
           mapillary.sign_defs = {};

           _.each(['au', 'br', 'ca', 'de', 'us'], function(region) {
               d3.json(context.asset('traffico/string-maps/' + region + '-map.json'), function(err, data) {
                   if (err) return;
                   if (region === 'de') region = 'eu';
                   mapillary.sign_defs[region] = data;
               });
           });
       }

       function loadViewer() {
           // mapillary-wrap
           var wrap = d3.select('#content').selectAll('.mapillary-wrap')
               .data([0]);

           var enter = wrap.enter().append('div')
               .attr('class', 'mapillary-wrap')
               .classed('al', true)       // 'al'=left,  'ar'=right
               .classed('hidden', true);

           enter.append('button')
               .attr('class', 'thumb-hide')
               .on('click', function () { mapillary.hideViewer(); })
               .append('div')
               .call(Icon('#icon-close'));

           enter.append('div')
               .attr('id', 'mly')
               .attr('class', 'mly-wrapper')
               .classed('active', false);

           // mapillary-viewercss
           d3.select('head').selectAll('#mapillary-viewercss')
               .data([0])
               .enter()
               .append('link')
               .attr('id', 'mapillary-viewercss')
               .attr('rel', 'stylesheet')
               .attr('href', viewercss);

           // mapillary-viewerjs
           d3.select('head').selectAll('#mapillary-viewerjs')
               .data([0])
               .enter()
               .append('script')
               .attr('id', 'mapillary-viewerjs')
               .attr('src', viewerjs);
       }

       function initViewer(imageKey, context) {

           function nodeChanged(d) {
               var clicks = mapillary.clicks;
               var index = clicks.indexOf(d.key);
               if (index > -1) {    // nodechange initiated from clicking on a marker..
                   clicks.splice(index, 1);
               } else {             // nodechange initiated from the Mapillary viewer controls..
                   var loc = d.apiNavImIm ? [d.apiNavImIm.lon, d.apiNavImIm.lat] : [d.latLon.lon, d.latLon.lat];
                   context.map().centerEase(loc);
                   mapillary.setSelectedImage(d.key, false);
               }
           }

           if (Mapillary && imageKey) {
               var opts = {
                   baseImageSize: 320,
                   cover: false,
                   cache: true,
                   debug: false,
                   imagePlane: true,
                   loading: true,
                   sequence: true
               };

               var viewer = new Mapillary.Viewer('mly', clientId, imageKey, opts);
               viewer.on('nodechanged', nodeChanged);
               viewer.on('loadingchanged', mapillary.setViewerLoading);
               mapillary.viewer = viewer;
           }
       }

       function abortRequest(i) {
           i.abort();
       }

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

       function getTiles(projection, dimensions) {
           var s = projection.scale() * 2 * Math.PI,
               z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
               ts = 256 * Math.pow(2, z - tileZoom),
               origin = [
                   s / 2 - projection.translate()[0],
                   s / 2 - projection.translate()[1]];

           return d3.geo.tile()
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
       }


       function loadTiles(which, url, projection, dimensions) {
           var tiles = getTiles(projection, dimensions).filter(function(t) {
                 var xyz = t.id.split(',');
                 return !nearNullIsland(xyz[0], xyz[1], xyz[2]);
               });

           _.filter(which.inflight, function(v, k) {
               var wanted = _.find(tiles, function(tile) { return k === (tile.id + ',0'); });
               if (!wanted) delete which.inflight[k];
               return !wanted;
           }).map(abortRequest);

           tiles.forEach(function(tile) {
               loadTilePage(which, url, tile, 0);
           });
       }

       function loadTilePage(which, url, tile, page) {
           var cache = mapillary.cache[which],
               id = tile.id + ',' + String(page),
               rect = tile.extent.rectangle();

           if (cache.loaded[id] || cache.inflight[id]) return;

           cache.inflight[id] = d3.json(url +
               qsString({
                   geojson: 'true',
                   limit: maxResults,
                   page: page,
                   client_id: clientId,
                   min_lon: rect[0],
                   min_lat: rect[1],
                   max_lon: rect[2],
                   max_lat: rect[3]
               }), function(err, data) {
                   cache.loaded[id] = true;
                   delete cache.inflight[id];
                   if (err || !data.features || !data.features.length) return;

                   var features = [],
                       nextPage = page + 1,
                       feature, loc, d;

                   for (var i = 0; i < data.features.length; i++) {
                       feature = data.features[i];
                       loc = feature.geometry.coordinates;
                       d = { key: feature.properties.key, loc: loc };
                       if (which === 'images') d.ca = feature.properties.ca;
                       if (which === 'signs') d.signs = feature.properties.rects;

                       features.push({minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d});
                   }

                   cache.rtree.load(features);

                   if (which === 'images') dispatch.loadedImages();
                   if (which === 'signs') dispatch.loadedSigns();

                   if (data.features.length === maxResults && nextPage < maxPages) {
                       loadTilePage(which, url, tile, nextPage);
                   }
               }
           );
       }

       mapillary.loadImages = function(projection, dimensions) {
           var url = apibase + 'search/im/geojson?';
           loadTiles('images', url, projection, dimensions);
       };

       mapillary.loadSigns = function(context, projection, dimensions) {
           var url = apibase + 'search/im/geojson/or?';
           loadSignStyles(context);
           loadSignDefs(context);
           loadTiles('signs', url, projection, dimensions);
       };

       mapillary.loadViewer = function() {
           loadViewer();
       };


       // partition viewport into `psize` x `psize` regions
       function partitionViewport(psize, projection, dimensions) {
           psize = psize || 16;
           var cols = d3.range(0, dimensions[0], psize),
               rows = d3.range(0, dimensions[1], psize),
               partitions = [];

           rows.forEach(function(y) {
               cols.forEach(function(x) {
                   var min = [x, y + psize],
                       max = [x + psize, y];
                   partitions.push(
                       Extent(projection.invert(min), projection.invert(max)));
               });
           });

           return partitions;
       }

       // no more than `limit` results per partition.
       function searchLimited(psize, limit, projection, dimensions, rtree) {
           limit = limit || 3;

           var partitions = partitionViewport(psize, projection, dimensions);
           return _.flatten(_.compact(_.map(partitions, function(extent) {
               return rtree.search(extent.bbox())
                   .slice(0, limit)
                   .map(function(d) { return d.data; });
           })));
       }

       mapillary.images = function(projection, dimensions) {
           var psize = 16, limit = 3;
           return searchLimited(psize, limit, projection, dimensions, mapillary.cache.images.rtree);
       };

       mapillary.signs = function(projection, dimensions) {
           var psize = 32, limit = 3;
           return searchLimited(psize, limit, projection, dimensions, mapillary.cache.signs.rtree);
       };

       mapillary.signsSupported = function() {
           var detected = iD.detect();
           return (!(detected.ie || detected.browser.toLowerCase() === 'safari'));
       };

       mapillary.signHTML = function(d) {
           if (!mapillary.sign_defs) return;

           var detectionPackage = d.signs[0].package,
               type = d.signs[0].type,
               country = detectionPackage.split('_')[1];

           return mapillary.sign_defs[country][type];
       };

       mapillary.showViewer = function() {
           d3.select('#content')
               .selectAll('.mapillary-wrap')
               .classed('hidden', false)
               .selectAll('.mly-wrapper')
               .classed('active', true);

           return mapillary;
       };

       mapillary.hideViewer = function() {
           d3.select('#content')
               .selectAll('.mapillary-wrap')
               .classed('hidden', true)
               .selectAll('.mly-wrapper')
               .classed('active', false);

           d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
               .classed('selected', false);

           mapillary.image = null;

           return mapillary;
       };

       mapillary.setViewerLoading = function(loading) {
           var canvas = d3.select('#content')
               .selectAll('.mly-wrapper canvas');

           if (canvas.empty()) return;   // viewer not loaded yet

           var cover = d3.select('#content')
               .selectAll('.mly-wrapper .Cover');

           cover.classed('CoverDone', !loading);

           var button = cover.selectAll('.CoverButton')
               .data(loading ? [0] : []);

           button.enter()
               .append('div')
               .attr('class', 'CoverButton')
               .append('div')
               .attr('class', 'uil-ripple-css')
               .append('div');

           button.exit()
               .remove();

           return mapillary;
       };

       mapillary.updateViewer = function(imageKey, context) {
           if (!mapillary) return;
           if (!imageKey) return;

           if (!mapillary.viewer) {
               initViewer(imageKey, context);
           } else {
               mapillary.viewer.moveToKey(imageKey);
           }

           return mapillary;
       };

       mapillary.getSelectedImage = function() {
           if (!mapillary) return null;
           return mapillary.image;
       };

       mapillary.setSelectedImage = function(imageKey, fromClick) {
           if (!mapillary) return null;

           mapillary.image = imageKey;
           if (fromClick) {
               mapillary.clicks.push(imageKey);
           }

           d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
               .classed('selected', function(d) { return d.key === imageKey; });

           return mapillary;
       };

       mapillary.reset = function() {
           var cache = mapillary.cache;

           if (cache) {
               _.forEach(cache.images.inflight, abortRequest);
               _.forEach(cache.signs.inflight, abortRequest);
           }

           mapillary.cache = {
               images: { inflight: {}, loaded: {}, rtree: rbush() },
               signs:  { inflight: {}, loaded: {}, rtree: rbush() }
           };

           mapillary.image = null;
           mapillary.clicks = [];

           return mapillary;
       };


       if (!mapillary.cache) {
           mapillary.reset();
       }

       return d3.rebind(mapillary, dispatch, 'on');
   }

   function taginfo() {
       var taginfo = {},
           endpoint = 'https://taginfo.openstreetmap.org/api/4/',
           tag_sorts = {
               point: 'count_nodes',
               vertex: 'count_nodes',
               area: 'count_ways',
               line: 'count_ways'
           },
           tag_filters = {
               point: 'nodes',
               vertex: 'nodes',
               area: 'ways',
               line: 'ways'
           };


       function sets(parameters, n, o) {
           if (parameters.geometry && o[parameters.geometry]) {
               parameters[n] = o[parameters.geometry];
           }
           return parameters;
       }

       function setFilter(parameters) {
           return sets(parameters, 'filter', tag_filters);
       }

       function setSort(parameters) {
           return sets(parameters, 'sortname', tag_sorts);
       }

       function clean(parameters) {
           return _.omit(parameters, 'geometry', 'debounce');
       }

       function filterKeys(type) {
           var count_type = type ? 'count_' + type : 'count_all';
           return function(d) {
               return parseFloat(d[count_type]) > 2500 || d.in_wiki;
           };
       }

       function filterMultikeys() {
           return function(d) {
               return (d.key.match(/:/g) || []).length === 1;  // exactly one ':'
           };
       }

       function filterValues() {
           return function(d) {
               if (d.value.match(/[A-Z*;,]/) !== null) return false;  // exclude some punctuation, uppercase letters
               return parseFloat(d.fraction) > 0.0 || d.in_wiki;
           };
       }

       function valKey(d) {
           return {
               value: d.key,
               title: d.key
           };
       }

       function valKeyDescription(d) {
           return {
               value: d.value,
               title: d.description || d.value
           };
       }

       // sort keys with ':' lower than keys without ':'
       function sortKeys(a, b) {
           return (a.key.indexOf(':') === -1 && b.key.indexOf(':') !== -1) ? -1
               : (a.key.indexOf(':') !== -1 && b.key.indexOf(':') === -1) ? 1
               : 0;
       }

       var debounced = _.debounce(d3.json, 100, true);

       function request(url, debounce, callback) {
           var cache = iD.services.taginfo.cache;

           if (cache[url]) {
               callback(null, cache[url]);
           } else if (debounce) {
               debounced(url, done);
           } else {
               d3.json(url, done);
           }

           function done(err, data) {
               if (!err) cache[url] = data;
               callback(err, data);
           }
       }

       taginfo.keys = function(parameters, callback) {
           var debounce = parameters.debounce;
           parameters = clean(setSort(parameters));
           request(endpoint + 'keys/all?' +
               qsString(_.extend({
                   rp: 10,
                   sortname: 'count_all',
                   sortorder: 'desc',
                   page: 1
               }, parameters)), debounce, function(err, d) {
                   if (err) return callback(err);
                   var f = filterKeys(parameters.filter);
                   callback(null, d.data.filter(f).sort(sortKeys).map(valKey));
               });
       };

       taginfo.multikeys = function(parameters, callback) {
           var debounce = parameters.debounce;
           parameters = clean(setSort(parameters));
           request(endpoint + 'keys/all?' +
               qsString(_.extend({
                   rp: 25,
                   sortname: 'count_all',
                   sortorder: 'desc',
                   page: 1
               }, parameters)), debounce, function(err, d) {
                   if (err) return callback(err);
                   var f = filterMultikeys();
                   callback(null, d.data.filter(f).map(valKey));
               });
       };

       taginfo.values = function(parameters, callback) {
           var debounce = parameters.debounce;
           parameters = clean(setSort(setFilter(parameters)));
           request(endpoint + 'key/values?' +
               qsString(_.extend({
                   rp: 25,
                   sortname: 'count_all',
                   sortorder: 'desc',
                   page: 1
               }, parameters)), debounce, function(err, d) {
                   if (err) return callback(err);
                   var f = filterValues();
                   callback(null, d.data.filter(f).map(valKeyDescription));
               });
       };

       taginfo.docs = function(parameters, callback) {
           var debounce = parameters.debounce;
           parameters = clean(setSort(parameters));

           var path = 'key/wiki_pages?';
           if (parameters.value) path = 'tag/wiki_pages?';
           else if (parameters.rtype) path = 'relation/wiki_pages?';

           request(endpoint + path + qsString(parameters), debounce, function(err, d) {
               if (err) return callback(err);
               callback(null, d.data);
           });
       };

       taginfo.endpoint = function(_) {
           if (!arguments.length) return endpoint;
           endpoint = _;
           return taginfo;
       };

       taginfo.reset = function() {
           iD.services.taginfo.cache = {};
           return taginfo;
       };


       if (!iD.services.taginfo.cache) {
           taginfo.reset();
       }

       return taginfo;
   }

   function wikidata() {
       var wikidata = {},
           endpoint = 'https://www.wikidata.org/w/api.php?';


       // Given a Wikipedia language and article title, return an array of
       // corresponding Wikidata entities.
       wikidata.itemsByTitle = function(lang, title, callback) {
           lang = lang || 'en';
           d3.jsonp(endpoint + qsString({
               action: 'wbgetentities',
               format: 'json',
               sites: lang.replace(/-/g, '_') + 'wiki',
               titles: title,
               languages: 'en', // shrink response by filtering to one language
               callback: '{callback}'
           }), function(data) {
               callback(title, data.entities || {});
           });
       };

       return wikidata;
   }

   function wikipedia$1() {
       var wikipedia = {},
           endpoint = 'https://en.wikipedia.org/w/api.php?';


       wikipedia.search = function(lang, query, callback) {
           lang = lang || 'en';
           d3.jsonp(endpoint.replace('en', lang) +
               qsString({
                   action: 'query',
                   list: 'search',
                   srlimit: '10',
                   srinfo: 'suggestion',
                   format: 'json',
                   callback: '{callback}',
                   srsearch: query
               }), function(data) {
                   if (!data.query) return;
                   callback(query, data.query.search.map(function(d) {
                       return d.title;
                   }));
               });
       };

       wikipedia.suggestions = function(lang, query, callback) {
           lang = lang || 'en';
           d3.jsonp(endpoint.replace('en', lang) +
               qsString({
                   action: 'opensearch',
                   namespace: 0,
                   suggest: '',
                   format: 'json',
                   callback: '{callback}',
                   search: query
               }), function(d) {
                   callback(d[0], d[1]);
               });
       };

       wikipedia.translations = function(lang, title, callback) {
           d3.jsonp(endpoint.replace('en', lang) +
               qsString({
                   action: 'query',
                   prop: 'langlinks',
                   format: 'json',
                   callback: '{callback}',
                   lllimit: 500,
                   titles: title
               }), function(d) {
                   var list = d.query.pages[Object.keys(d.query.pages)[0]],
                       translations = {};
                   if (list && list.langlinks) {
                       list.langlinks.forEach(function(d) {
                           translations[d.lang] = d['*'];
                       });
                       callback(translations);
                   }
               });
       };

       return wikipedia;
   }

   exports.nominatim = nominatim;
   exports.mapillary = mapillary;
   exports.taginfo = taginfo;
   exports.wikidata = wikidata;
   exports.wikipedia = wikipedia$1;

   Object.defineProperty(exports, '__esModule', { value: true });

}));
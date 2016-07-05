(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.iD = global.iD || {}, global.iD.svg = global.iD.svg || {})));
}(this, function (exports) { 'use strict';

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

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var dom = createCommonjsModule(function (module, exports) {
	/*
	 * DOM Level 2
	 * Object DOMException
	 * @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
	 */

	function copy(src,dest){
		for(var p in src){
			dest[p] = src[p];
		}
	}
	/**
	^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
	^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
	 */
	function _extends(Class,Super){
		var pt = Class.prototype;
		if(Object.create){
			var ppt = Object.create(Super.prototype)
			pt.__proto__ = ppt;
		}
		if(!(pt instanceof Super)){
			function t(){};
			t.prototype = Super.prototype;
			t = new t();
			copy(pt,t);
			Class.prototype = pt = t;
		}
		if(pt.constructor != Class){
			if(typeof Class != 'function'){
				console.error("unknow Class:"+Class)
			}
			pt.constructor = Class
		}
	}
	var htmlns = 'http://www.w3.org/1999/xhtml' ;
	// Node Types
	var NodeType = {}
	var ELEMENT_NODE                = NodeType.ELEMENT_NODE                = 1;
	var ATTRIBUTE_NODE              = NodeType.ATTRIBUTE_NODE              = 2;
	var TEXT_NODE                   = NodeType.TEXT_NODE                   = 3;
	var CDATA_SECTION_NODE          = NodeType.CDATA_SECTION_NODE          = 4;
	var ENTITY_REFERENCE_NODE       = NodeType.ENTITY_REFERENCE_NODE       = 5;
	var ENTITY_NODE                 = NodeType.ENTITY_NODE                 = 6;
	var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
	var COMMENT_NODE                = NodeType.COMMENT_NODE                = 8;
	var DOCUMENT_NODE               = NodeType.DOCUMENT_NODE               = 9;
	var DOCUMENT_TYPE_NODE          = NodeType.DOCUMENT_TYPE_NODE          = 10;
	var DOCUMENT_FRAGMENT_NODE      = NodeType.DOCUMENT_FRAGMENT_NODE      = 11;
	var NOTATION_NODE               = NodeType.NOTATION_NODE               = 12;

	// ExceptionCode
	var ExceptionCode = {}
	var ExceptionMessage = {};
	var INDEX_SIZE_ERR              = ExceptionCode.INDEX_SIZE_ERR              = ((ExceptionMessage[1]="Index size error"),1);
	var DOMSTRING_SIZE_ERR          = ExceptionCode.DOMSTRING_SIZE_ERR          = ((ExceptionMessage[2]="DOMString size error"),2);
	var HIERARCHY_REQUEST_ERR       = ExceptionCode.HIERARCHY_REQUEST_ERR       = ((ExceptionMessage[3]="Hierarchy request error"),3);
	var WRONG_DOCUMENT_ERR          = ExceptionCode.WRONG_DOCUMENT_ERR          = ((ExceptionMessage[4]="Wrong document"),4);
	var INVALID_CHARACTER_ERR       = ExceptionCode.INVALID_CHARACTER_ERR       = ((ExceptionMessage[5]="Invalid character"),5);
	var NO_DATA_ALLOWED_ERR         = ExceptionCode.NO_DATA_ALLOWED_ERR         = ((ExceptionMessage[6]="No data allowed"),6);
	var NO_MODIFICATION_ALLOWED_ERR = ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = ((ExceptionMessage[7]="No modification allowed"),7);
	var NOT_FOUND_ERR               = ExceptionCode.NOT_FOUND_ERR               = ((ExceptionMessage[8]="Not found"),8);
	var NOT_SUPPORTED_ERR           = ExceptionCode.NOT_SUPPORTED_ERR           = ((ExceptionMessage[9]="Not supported"),9);
	var INUSE_ATTRIBUTE_ERR         = ExceptionCode.INUSE_ATTRIBUTE_ERR         = ((ExceptionMessage[10]="Attribute in use"),10);
	//level2
	var INVALID_STATE_ERR        	= ExceptionCode.INVALID_STATE_ERR        	= ((ExceptionMessage[11]="Invalid state"),11);
	var SYNTAX_ERR               	= ExceptionCode.SYNTAX_ERR               	= ((ExceptionMessage[12]="Syntax error"),12);
	var INVALID_MODIFICATION_ERR 	= ExceptionCode.INVALID_MODIFICATION_ERR 	= ((ExceptionMessage[13]="Invalid modification"),13);
	var NAMESPACE_ERR            	= ExceptionCode.NAMESPACE_ERR           	= ((ExceptionMessage[14]="Invalid namespace"),14);
	var INVALID_ACCESS_ERR       	= ExceptionCode.INVALID_ACCESS_ERR      	= ((ExceptionMessage[15]="Invalid access"),15);


	function DOMException(code, message) {
		if(message instanceof Error){
			var error = message;
		}else{
			error = this;
			Error.call(this, ExceptionMessage[code]);
			this.message = ExceptionMessage[code];
			if(Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
		}
		error.code = code;
		if(message) this.message = this.message + ": " + message;
		return error;
	};
	DOMException.prototype = Error.prototype;
	copy(ExceptionCode,DOMException)
	/**
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
	 * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
	 * The items in the NodeList are accessible via an integral index, starting from 0.
	 */
	function NodeList() {
	};
	NodeList.prototype = {
		/**
		 * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
		 * @standard level1
		 */
		length:0, 
		/**
		 * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
		 * @standard level1
		 * @param index  unsigned long 
		 *   Index into the collection.
		 * @return Node
		 * 	The node at the indexth position in the NodeList, or null if that is not a valid index. 
		 */
		item: function(index) {
			return this[index] || null;
		},
		toString:function(){
			for(var buf = [], i = 0;i<this.length;i++){
				serializeToString(this[i],buf);
			}
			return buf.join('');
		}
	};
	function LiveNodeList(node,refresh){
		this._node = node;
		this._refresh = refresh
		_updateLiveList(this);
	}
	function _updateLiveList(list){
		var inc = list._node._inc || list._node.ownerDocument._inc;
		if(list._inc != inc){
			var ls = list._refresh(list._node);
			//console.log(ls.length)
			__set__(list,'length',ls.length);
			copy(ls,list);
			list._inc = inc;
		}
	}
	LiveNodeList.prototype.item = function(i){
		_updateLiveList(this);
		return this[i];
	}

	_extends(LiveNodeList,NodeList);
	/**
	 * 
	 * Objects implementing the NamedNodeMap interface are used to represent collections of nodes that can be accessed by name. Note that NamedNodeMap does not inherit from NodeList; NamedNodeMaps are not maintained in any particular order. Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index, but this is simply to allow convenient enumeration of the contents of a NamedNodeMap, and does not imply that the DOM specifies an order to these Nodes.
	 * NamedNodeMap objects in the DOM are live.
	 * used for attributes or DocumentType entities 
	 */
	function NamedNodeMap() {
	};

	function _findNodeIndex(list,node){
		var i = list.length;
		while(i--){
			if(list[i] === node){return i}
		}
	}

	function _addNamedNode(el,list,newAttr,oldAttr){
		if(oldAttr){
			list[_findNodeIndex(list,oldAttr)] = newAttr;
		}else{
			list[list.length++] = newAttr;
		}
		if(el){
			newAttr.ownerElement = el;
			var doc = el.ownerDocument;
			if(doc){
				oldAttr && _onRemoveAttribute(doc,el,oldAttr);
				_onAddAttribute(doc,el,newAttr);
			}
		}
	}
	function _removeNamedNode(el,list,attr){
		var i = _findNodeIndex(list,attr);
		if(i>=0){
			var lastIndex = list.length-1
			while(i<lastIndex){
				list[i] = list[++i]
			}
			list.length = lastIndex;
			if(el){
				var doc = el.ownerDocument;
				if(doc){
					_onRemoveAttribute(doc,el,attr);
					attr.ownerElement = null;
				}
			}
		}else{
			throw DOMException(NOT_FOUND_ERR,new Error())
		}
	}
	NamedNodeMap.prototype = {
		length:0,
		item:NodeList.prototype.item,
		getNamedItem: function(key) {
	//		if(key.indexOf(':')>0 || key == 'xmlns'){
	//			return null;
	//		}
			var i = this.length;
			while(i--){
				var attr = this[i];
				if(attr.nodeName == key){
					return attr;
				}
			}
		},
		setNamedItem: function(attr) {
			var el = attr.ownerElement;
			if(el && el!=this._ownerElement){
				throw new DOMException(INUSE_ATTRIBUTE_ERR);
			}
			var oldAttr = this.getNamedItem(attr.nodeName);
			_addNamedNode(this._ownerElement,this,attr,oldAttr);
			return oldAttr;
		},
		/* returns Node */
		setNamedItemNS: function(attr) {// raises: WRONG_DOCUMENT_ERR,NO_MODIFICATION_ALLOWED_ERR,INUSE_ATTRIBUTE_ERR
			var el = attr.ownerElement, oldAttr;
			if(el && el!=this._ownerElement){
				throw new DOMException(INUSE_ATTRIBUTE_ERR);
			}
			oldAttr = this.getNamedItemNS(attr.namespaceURI,attr.localName);
			_addNamedNode(this._ownerElement,this,attr,oldAttr);
			return oldAttr;
		},

		/* returns Node */
		removeNamedItem: function(key) {
			var attr = this.getNamedItem(key);
			_removeNamedNode(this._ownerElement,this,attr);
			return attr;
			
			
		},// raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
		
		//for level2
		removeNamedItemNS:function(namespaceURI,localName){
			var attr = this.getNamedItemNS(namespaceURI,localName);
			_removeNamedNode(this._ownerElement,this,attr);
			return attr;
		},
		getNamedItemNS: function(namespaceURI, localName) {
			var i = this.length;
			while(i--){
				var node = this[i];
				if(node.localName == localName && node.namespaceURI == namespaceURI){
					return node;
				}
			}
			return null;
		}
	};
	/**
	 * @see http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490
	 */
	function DOMImplementation(/* Object */ features) {
		this._features = {};
		if (features) {
			for (var feature in features) {
				 this._features = features[feature];
			}
		}
	};

	DOMImplementation.prototype = {
		hasFeature: function(/* string */ feature, /* string */ version) {
			var versions = this._features[feature.toLowerCase()];
			if (versions && (!version || version in versions)) {
				return true;
			} else {
				return false;
			}
		},
		// Introduced in DOM Level 2:
		createDocument:function(namespaceURI,  qualifiedName, doctype){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR,WRONG_DOCUMENT_ERR
			var doc = new Document();
			doc.implementation = this;
			doc.childNodes = new NodeList();
			doc.doctype = doctype;
			if(doctype){
				doc.appendChild(doctype);
			}
			if(qualifiedName){
				var root = doc.createElementNS(namespaceURI,qualifiedName);
				doc.appendChild(root);
			}
			return doc;
		},
		// Introduced in DOM Level 2:
		createDocumentType:function(qualifiedName, publicId, systemId){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR
			var node = new DocumentType();
			node.name = qualifiedName;
			node.nodeName = qualifiedName;
			node.publicId = publicId;
			node.systemId = systemId;
			// Introduced in DOM Level 2:
			//readonly attribute DOMString        internalSubset;
			
			//TODO:..
			//  readonly attribute NamedNodeMap     entities;
			//  readonly attribute NamedNodeMap     notations;
			return node;
		}
	};


	/**
	 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
	 */

	function Node() {
	};

	Node.prototype = {
		firstChild : null,
		lastChild : null,
		previousSibling : null,
		nextSibling : null,
		attributes : null,
		parentNode : null,
		childNodes : null,
		ownerDocument : null,
		nodeValue : null,
		namespaceURI : null,
		prefix : null,
		localName : null,
		// Modified in DOM Level 2:
		insertBefore:function(newChild, refChild){//raises 
			return _insertBefore(this,newChild,refChild);
		},
		replaceChild:function(newChild, oldChild){//raises 
			this.insertBefore(newChild,oldChild);
			if(oldChild){
				this.removeChild(oldChild);
			}
		},
		removeChild:function(oldChild){
			return _removeChild(this,oldChild);
		},
		appendChild:function(newChild){
			return this.insertBefore(newChild,null);
		},
		hasChildNodes:function(){
			return this.firstChild != null;
		},
		cloneNode:function(deep){
			return cloneNode(this.ownerDocument||this,this,deep);
		},
		// Modified in DOM Level 2:
		normalize:function(){
			var child = this.firstChild;
			while(child){
				var next = child.nextSibling;
				if(next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE){
					this.removeChild(next);
					child.appendData(next.data);
				}else{
					child.normalize();
					child = next;
				}
			}
		},
	  	// Introduced in DOM Level 2:
		isSupported:function(feature, version){
			return this.ownerDocument.implementation.hasFeature(feature,version);
		},
	    // Introduced in DOM Level 2:
	    hasAttributes:function(){
	    	return this.attributes.length>0;
	    },
	    lookupPrefix:function(namespaceURI){
	    	var el = this;
	    	while(el){
	    		var map = el._nsMap;
	    		//console.dir(map)
	    		if(map){
	    			for(var n in map){
	    				if(map[n] == namespaceURI){
	    					return n;
	    				}
	    			}
	    		}
	    		el = el.nodeType == 2?el.ownerDocument : el.parentNode;
	    	}
	    	return null;
	    },
	    // Introduced in DOM Level 3:
	    lookupNamespaceURI:function(prefix){
	    	var el = this;
	    	while(el){
	    		var map = el._nsMap;
	    		//console.dir(map)
	    		if(map){
	    			if(prefix in map){
	    				return map[prefix] ;
	    			}
	    		}
	    		el = el.nodeType == 2?el.ownerDocument : el.parentNode;
	    	}
	    	return null;
	    },
	    // Introduced in DOM Level 3:
	    isDefaultNamespace:function(namespaceURI){
	    	var prefix = this.lookupPrefix(namespaceURI);
	    	return prefix == null;
	    }
	};


	function _xmlEncoder(c){
		return c == '<' && '&lt;' ||
	         c == '>' && '&gt;' ||
	         c == '&' && '&amp;' ||
	         c == '"' && '&quot;' ||
	         '&#'+c.charCodeAt()+';'
	}


	copy(NodeType,Node);
	copy(NodeType,Node.prototype);

	/**
	 * @param callback return true for continue,false for break
	 * @return boolean true: break visit;
	 */
	function _visitNode(node,callback){
		if(callback(node)){
			return true;
		}
		if(node = node.firstChild){
			do{
				if(_visitNode(node,callback)){return true}
	        }while(node=node.nextSibling)
	    }
	}



	function Document(){
	}
	function _onAddAttribute(doc,el,newAttr){
		doc && doc._inc++;
		var ns = newAttr.namespaceURI ;
		if(ns == 'http://www.w3.org/2000/xmlns/'){
			//update namespace
			el._nsMap[newAttr.prefix?newAttr.localName:''] = newAttr.value
		}
	}
	function _onRemoveAttribute(doc,el,newAttr,remove){
		doc && doc._inc++;
		var ns = newAttr.namespaceURI ;
		if(ns == 'http://www.w3.org/2000/xmlns/'){
			//update namespace
			delete el._nsMap[newAttr.prefix?newAttr.localName:'']
		}
	}
	function _onUpdateChild(doc,el,newChild){
		if(doc && doc._inc){
			doc._inc++;
			//update childNodes
			var cs = el.childNodes;
			if(newChild){
				cs[cs.length++] = newChild;
			}else{
				//console.log(1)
				var child = el.firstChild;
				var i = 0;
				while(child){
					cs[i++] = child;
					child =child.nextSibling;
				}
				cs.length = i;
			}
		}
	}

	/**
	 * attributes;
	 * children;
	 * 
	 * writeable properties:
	 * nodeValue,Attr:value,CharacterData:data
	 * prefix
	 */
	function _removeChild(parentNode,child){
		var previous = child.previousSibling;
		var next = child.nextSibling;
		if(previous){
			previous.nextSibling = next;
		}else{
			parentNode.firstChild = next
		}
		if(next){
			next.previousSibling = previous;
		}else{
			parentNode.lastChild = previous;
		}
		_onUpdateChild(parentNode.ownerDocument,parentNode);
		return child;
	}
	/**
	 * preformance key(refChild == null)
	 */
	function _insertBefore(parentNode,newChild,nextChild){
		var cp = newChild.parentNode;
		if(cp){
			cp.removeChild(newChild);//remove and update
		}
		if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
			var newFirst = newChild.firstChild;
			if (newFirst == null) {
				return newChild;
			}
			var newLast = newChild.lastChild;
		}else{
			newFirst = newLast = newChild;
		}
		var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;

		newFirst.previousSibling = pre;
		newLast.nextSibling = nextChild;
		
		
		if(pre){
			pre.nextSibling = newFirst;
		}else{
			parentNode.firstChild = newFirst;
		}
		if(nextChild == null){
			parentNode.lastChild = newLast;
		}else{
			nextChild.previousSibling = newLast;
		}
		do{
			newFirst.parentNode = parentNode;
		}while(newFirst !== newLast && (newFirst= newFirst.nextSibling))
		_onUpdateChild(parentNode.ownerDocument||parentNode,parentNode);
		//console.log(parentNode.lastChild.nextSibling == null)
		if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
			newChild.firstChild = newChild.lastChild = null;
		}
		return newChild;
	}
	function _appendSingleChild(parentNode,newChild){
		var cp = newChild.parentNode;
		if(cp){
			var pre = parentNode.lastChild;
			cp.removeChild(newChild);//remove and update
			var pre = parentNode.lastChild;
		}
		var pre = parentNode.lastChild;
		newChild.parentNode = parentNode;
		newChild.previousSibling = pre;
		newChild.nextSibling = null;
		if(pre){
			pre.nextSibling = newChild;
		}else{
			parentNode.firstChild = newChild;
		}
		parentNode.lastChild = newChild;
		_onUpdateChild(parentNode.ownerDocument,parentNode,newChild);
		return newChild;
		//console.log("__aa",parentNode.lastChild.nextSibling == null)
	}
	Document.prototype = {
		//implementation : null,
		nodeName :  '#document',
		nodeType :  DOCUMENT_NODE,
		doctype :  null,
		documentElement :  null,
		_inc : 1,
		
		insertBefore :  function(newChild, refChild){//raises 
			if(newChild.nodeType == DOCUMENT_FRAGMENT_NODE){
				var child = newChild.firstChild;
				while(child){
					var next = child.nextSibling;
					this.insertBefore(child,refChild);
					child = next;
				}
				return newChild;
			}
			if(this.documentElement == null && newChild.nodeType == 1){
				this.documentElement = newChild;
			}
			
			return _insertBefore(this,newChild,refChild),(newChild.ownerDocument = this),newChild;
		},
		removeChild :  function(oldChild){
			if(this.documentElement == oldChild){
				this.documentElement = null;
			}
			return _removeChild(this,oldChild);
		},
		// Introduced in DOM Level 2:
		importNode : function(importedNode,deep){
			return importNode(this,importedNode,deep);
		},
		// Introduced in DOM Level 2:
		getElementById :	function(id){
			var rtv = null;
			_visitNode(this.documentElement,function(node){
				if(node.nodeType == 1){
					if(node.getAttribute('id') == id){
						rtv = node;
						return true;
					}
				}
			})
			return rtv;
		},
		
		//document factory method:
		createElement :	function(tagName){
			var node = new Element();
			node.ownerDocument = this;
			node.nodeName = tagName;
			node.tagName = tagName;
			node.childNodes = new NodeList();
			var attrs	= node.attributes = new NamedNodeMap();
			attrs._ownerElement = node;
			return node;
		},
		createDocumentFragment :	function(){
			var node = new DocumentFragment();
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			return node;
		},
		createTextNode :	function(data){
			var node = new Text();
			node.ownerDocument = this;
			node.appendData(data)
			return node;
		},
		createComment :	function(data){
			var node = new Comment();
			node.ownerDocument = this;
			node.appendData(data)
			return node;
		},
		createCDATASection :	function(data){
			var node = new CDATASection();
			node.ownerDocument = this;
			node.appendData(data)
			return node;
		},
		createProcessingInstruction :	function(target,data){
			var node = new ProcessingInstruction();
			node.ownerDocument = this;
			node.tagName = node.target = target;
			node.nodeValue= node.data = data;
			return node;
		},
		createAttribute :	function(name){
			var node = new Attr();
			node.ownerDocument	= this;
			node.name = name;
			node.nodeName	= name;
			node.localName = name;
			node.specified = true;
			return node;
		},
		createEntityReference :	function(name){
			var node = new EntityReference();
			node.ownerDocument	= this;
			node.nodeName	= name;
			return node;
		},
		// Introduced in DOM Level 2:
		createElementNS :	function(namespaceURI,qualifiedName){
			var node = new Element();
			var pl = qualifiedName.split(':');
			var attrs	= node.attributes = new NamedNodeMap();
			node.childNodes = new NodeList();
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.tagName = qualifiedName;
			node.namespaceURI = namespaceURI;
			if(pl.length == 2){
				node.prefix = pl[0];
				node.localName = pl[1];
			}else{
				//el.prefix = null;
				node.localName = qualifiedName;
			}
			attrs._ownerElement = node;
			return node;
		},
		// Introduced in DOM Level 2:
		createAttributeNS :	function(namespaceURI,qualifiedName){
			var node = new Attr();
			var pl = qualifiedName.split(':');
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.name = qualifiedName;
			node.namespaceURI = namespaceURI;
			node.specified = true;
			if(pl.length == 2){
				node.prefix = pl[0];
				node.localName = pl[1];
			}else{
				//el.prefix = null;
				node.localName = qualifiedName;
			}
			return node;
		}
	};
	_extends(Document,Node);


	function Element() {
		this._nsMap = {};
	};
	Element.prototype = {
		nodeType : ELEMENT_NODE,
		hasAttribute : function(name){
			return this.getAttributeNode(name)!=null;
		},
		getAttribute : function(name){
			var attr = this.getAttributeNode(name);
			return attr && attr.value || '';
		},
		getAttributeNode : function(name){
			return this.attributes.getNamedItem(name);
		},
		setAttribute : function(name, value){
			var attr = this.ownerDocument.createAttribute(name);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr)
		},
		removeAttribute : function(name){
			var attr = this.getAttributeNode(name)
			attr && this.removeAttributeNode(attr);
		},
		
		//four real opeartion method
		appendChild:function(newChild){
			if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
				return this.insertBefore(newChild,null);
			}else{
				return _appendSingleChild(this,newChild);
			}
		},
		setAttributeNode : function(newAttr){
			return this.attributes.setNamedItem(newAttr);
		},
		setAttributeNodeNS : function(newAttr){
			return this.attributes.setNamedItemNS(newAttr);
		},
		removeAttributeNode : function(oldAttr){
			return this.attributes.removeNamedItem(oldAttr.nodeName);
		},
		//get real attribute name,and remove it by removeAttributeNode
		removeAttributeNS : function(namespaceURI, localName){
			var old = this.getAttributeNodeNS(namespaceURI, localName);
			old && this.removeAttributeNode(old);
		},
		
		hasAttributeNS : function(namespaceURI, localName){
			return this.getAttributeNodeNS(namespaceURI, localName)!=null;
		},
		getAttributeNS : function(namespaceURI, localName){
			var attr = this.getAttributeNodeNS(namespaceURI, localName);
			return attr && attr.value || '';
		},
		setAttributeNS : function(namespaceURI, qualifiedName, value){
			var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr)
		},
		getAttributeNodeNS : function(namespaceURI, localName){
			return this.attributes.getNamedItemNS(namespaceURI, localName);
		},
		
		getElementsByTagName : function(tagName){
			return new LiveNodeList(this,function(base){
				var ls = [];
				_visitNode(base,function(node){
					if(node !== base && node.nodeType == ELEMENT_NODE && (tagName === '*' || node.tagName == tagName)){
						ls.push(node);
					}
				});
				return ls;
			});
		},
		getElementsByTagNameNS : function(namespaceURI, localName){
			return new LiveNodeList(this,function(base){
				var ls = [];
				_visitNode(base,function(node){
					if(node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === '*' || node.namespaceURI === namespaceURI) && (localName === '*' || node.localName == localName)){
						ls.push(node);
					}
				});
				return ls;
			});
		}
	};
	Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
	Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;


	_extends(Element,Node);
	function Attr() {
	};
	Attr.prototype.nodeType = ATTRIBUTE_NODE;
	_extends(Attr,Node);


	function CharacterData() {
	};
	CharacterData.prototype = {
		data : '',
		substringData : function(offset, count) {
			return this.data.substring(offset, offset+count);
		},
		appendData: function(text) {
			text = this.data+text;
			this.nodeValue = this.data = text;
			this.length = text.length;
		},
		insertData: function(offset,text) {
			this.replaceData(offset,0,text);
		
		},
		appendChild:function(newChild){
			//if(!(newChild instanceof CharacterData)){
				throw new Error(ExceptionMessage[3])
			//}
			return Node.prototype.appendChild.apply(this,arguments)
		},
		deleteData: function(offset, count) {
			this.replaceData(offset,count,"");
		},
		replaceData: function(offset, count, text) {
			var start = this.data.substring(0,offset);
			var end = this.data.substring(offset+count);
			text = start + text + end;
			this.nodeValue = this.data = text;
			this.length = text.length;
		}
	}
	_extends(CharacterData,Node);
	function Text() {
	};
	Text.prototype = {
		nodeName : "#text",
		nodeType : TEXT_NODE,
		splitText : function(offset) {
			var text = this.data;
			var newText = text.substring(offset);
			text = text.substring(0, offset);
			this.data = this.nodeValue = text;
			this.length = text.length;
			var newNode = this.ownerDocument.createTextNode(newText);
			if(this.parentNode){
				this.parentNode.insertBefore(newNode, this.nextSibling);
			}
			return newNode;
		}
	}
	_extends(Text,CharacterData);
	function Comment() {
	};
	Comment.prototype = {
		nodeName : "#comment",
		nodeType : COMMENT_NODE
	}
	_extends(Comment,CharacterData);

	function CDATASection() {
	};
	CDATASection.prototype = {
		nodeName : "#cdata-section",
		nodeType : CDATA_SECTION_NODE
	}
	_extends(CDATASection,CharacterData);


	function DocumentType() {
	};
	DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
	_extends(DocumentType,Node);

	function Notation() {
	};
	Notation.prototype.nodeType = NOTATION_NODE;
	_extends(Notation,Node);

	function Entity() {
	};
	Entity.prototype.nodeType = ENTITY_NODE;
	_extends(Entity,Node);

	function EntityReference() {
	};
	EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
	_extends(EntityReference,Node);

	function DocumentFragment() {
	};
	DocumentFragment.prototype.nodeName =	"#document-fragment";
	DocumentFragment.prototype.nodeType =	DOCUMENT_FRAGMENT_NODE;
	_extends(DocumentFragment,Node);


	function ProcessingInstruction() {
	}
	ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
	_extends(ProcessingInstruction,Node);
	function XMLSerializer(){}
	XMLSerializer.prototype.serializeToString = function(node,attributeSorter){
		return node.toString(attributeSorter);
	}
	Node.prototype.toString =function(attributeSorter){
		var buf = [];
		serializeToString(this,buf,attributeSorter);
		return buf.join('');
	}
	function serializeToString(node,buf,attributeSorter,isHTML){
		switch(node.nodeType){
		case ELEMENT_NODE:
			var attrs = node.attributes;
			var len = attrs.length;
			var child = node.firstChild;
			var nodeName = node.tagName;
			isHTML =  (htmlns === node.namespaceURI) ||isHTML 
			buf.push('<',nodeName);
			if(attributeSorter){
				buf.sort.apply(attrs, attributeSorter);
			}
			for(var i=0;i<len;i++){
				serializeToString(attrs.item(i),buf,attributeSorter,isHTML);
			}
			if(child || isHTML && !/^(?:meta|link|img|br|hr|input|button)$/i.test(nodeName)){
				buf.push('>');
				//if is cdata child node
				if(isHTML && /^script$/i.test(nodeName)){
					if(child){
						buf.push(child.data);
					}
				}else{
					while(child){
						serializeToString(child,buf,attributeSorter,isHTML);
						child = child.nextSibling;
					}
				}
				buf.push('</',nodeName,'>');
			}else{
				buf.push('/>');
			}
			return;
		case DOCUMENT_NODE:
		case DOCUMENT_FRAGMENT_NODE:
			var child = node.firstChild;
			while(child){
				serializeToString(child,buf,attributeSorter,isHTML);
				child = child.nextSibling;
			}
			return;
		case ATTRIBUTE_NODE:
			return buf.push(' ',node.name,'="',node.value.replace(/[<&"]/g,_xmlEncoder),'"');
		case TEXT_NODE:
			return buf.push(node.data.replace(/[<&]/g,_xmlEncoder));
		case CDATA_SECTION_NODE:
			return buf.push( '<![CDATA[',node.data,']]>');
		case COMMENT_NODE:
			return buf.push( "<!--",node.data,"-->");
		case DOCUMENT_TYPE_NODE:
			var pubid = node.publicId;
			var sysid = node.systemId;
			buf.push('<!DOCTYPE ',node.name);
			if(pubid){
				buf.push(' PUBLIC "',pubid);
				if (sysid && sysid!='.') {
					buf.push( '" "',sysid);
				}
				buf.push('">');
			}else if(sysid && sysid!='.'){
				buf.push(' SYSTEM "',sysid,'">');
			}else{
				var sub = node.internalSubset;
				if(sub){
					buf.push(" [",sub,"]");
				}
				buf.push(">");
			}
			return;
		case PROCESSING_INSTRUCTION_NODE:
			return buf.push( "<?",node.target," ",node.data,"?>");
		case ENTITY_REFERENCE_NODE:
			return buf.push( '&',node.nodeName,';');
		//case ENTITY_NODE:
		//case NOTATION_NODE:
		default:
			buf.push('??',node.nodeName);
		}
	}
	function importNode(doc,node,deep){
		var node2;
		switch (node.nodeType) {
		case ELEMENT_NODE:
			node2 = node.cloneNode(false);
			node2.ownerDocument = doc;
			//var attrs = node2.attributes;
			//var len = attrs.length;
			//for(var i=0;i<len;i++){
				//node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
			//}
		case DOCUMENT_FRAGMENT_NODE:
			break;
		case ATTRIBUTE_NODE:
			deep = true;
			break;
		//case ENTITY_REFERENCE_NODE:
		//case PROCESSING_INSTRUCTION_NODE:
		////case TEXT_NODE:
		//case CDATA_SECTION_NODE:
		//case COMMENT_NODE:
		//	deep = false;
		//	break;
		//case DOCUMENT_NODE:
		//case DOCUMENT_TYPE_NODE:
		//cannot be imported.
		//case ENTITY_NODE:
		//case NOTATION_NODE：
		//can not hit in level3
		//default:throw e;
		}
		if(!node2){
			node2 = node.cloneNode(false);//false
		}
		node2.ownerDocument = doc;
		node2.parentNode = null;
		if(deep){
			var child = node.firstChild;
			while(child){
				node2.appendChild(importNode(doc,child,deep));
				child = child.nextSibling;
			}
		}
		return node2;
	}
	//
	//var _relationMap = {firstChild:1,lastChild:1,previousSibling:1,nextSibling:1,
	//					attributes:1,childNodes:1,parentNode:1,documentElement:1,doctype,};
	function cloneNode(doc,node,deep){
		var node2 = new node.constructor();
		for(var n in node){
			var v = node[n];
			if(typeof v != 'object' ){
				if(v != node2[n]){
					node2[n] = v;
				}
			}
		}
		if(node.childNodes){
			node2.childNodes = new NodeList();
		}
		node2.ownerDocument = doc;
		switch (node2.nodeType) {
		case ELEMENT_NODE:
			var attrs	= node.attributes;
			var attrs2	= node2.attributes = new NamedNodeMap();
			var len = attrs.length
			attrs2._ownerElement = node2;
			for(var i=0;i<len;i++){
				node2.setAttributeNode(cloneNode(doc,attrs.item(i),true));
			}
			break;;
		case ATTRIBUTE_NODE:
			deep = true;
		}
		if(deep){
			var child = node.firstChild;
			while(child){
				node2.appendChild(cloneNode(doc,child,deep));
				child = child.nextSibling;
			}
		}
		return node2;
	}

	function __set__(object,key,value){
		object[key] = value
	}
	//do dynamic
	try{
		if(Object.defineProperty){
			Object.defineProperty(LiveNodeList.prototype,'length',{
				get:function(){
					_updateLiveList(this);
					return this.$$length;
				}
			});
			Object.defineProperty(Node.prototype,'textContent',{
				get:function(){
					return getTextContent(this);
				},
				set:function(data){
					switch(this.nodeType){
					case 1:
					case 11:
						while(this.firstChild){
							this.removeChild(this.firstChild);
						}
						if(data || String(data)){
							this.appendChild(this.ownerDocument.createTextNode(data));
						}
						break;
					default:
						//TODO:
						this.data = data;
						this.value = value;
						this.nodeValue = data;
					}
				}
			})
			
			function getTextContent(node){
				switch(node.nodeType){
				case 1:
				case 11:
					var buf = [];
					node = node.firstChild;
					while(node){
						if(node.nodeType!==7 && node.nodeType !==8){
							buf.push(getTextContent(node));
						}
						node = node.nextSibling;
					}
					return buf.join('');
				default:
					return node.nodeValue;
				}
			}
			__set__ = function(object,key,value){
				//console.log(value)
				object['$$'+key] = value
			}
		}
	}catch(e){//ie8
	}

	if('function' == 'function'){
		exports.DOMImplementation = DOMImplementation;
		exports.XMLSerializer = XMLSerializer;
	}
	});

	var require$$0$1 = (dom && typeof dom === 'object' && 'default' in dom ? dom['default'] : dom);

	var sax = createCommonjsModule(function (module, exports) {
	//[4]   	NameStartChar	   ::=   	":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
	//[4a]   	NameChar	   ::=   	NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
	//[5]   	Name	   ::=   	NameStartChar (NameChar)*
	var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]///\u10000-\uEFFFF
	var nameChar = new RegExp("[\\-\\.0-9"+nameStartChar.source.slice(1,-1)+"\u00B7\u0300-\u036F\\u203F-\u2040]");
	var tagNamePattern = new RegExp('^'+nameStartChar.source+nameChar.source+'*(?:\:'+nameStartChar.source+nameChar.source+'*)?$');
	//var tagNamePattern = /^[a-zA-Z_][\w\-\.]*(?:\:[a-zA-Z_][\w\-\.]*)?$/
	//var handlers = 'resolveEntity,getExternalSubset,characters,endDocument,endElement,endPrefixMapping,ignorableWhitespace,processingInstruction,setDocumentLocator,skippedEntity,startDocument,startElement,startPrefixMapping,notationDecl,unparsedEntityDecl,error,fatalError,warning,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,comment,endCDATA,endDTD,endEntity,startCDATA,startDTD,startEntity'.split(',')

	//S_TAG,	S_ATTR,	S_EQ,	S_V
	//S_ATTR_S,	S_E,	S_S,	S_C
	var S_TAG = 0;//tag name offerring
	var S_ATTR = 1;//attr name offerring 
	var S_ATTR_S=2;//attr name end and space offer
	var S_EQ = 3;//=space?
	var S_V = 4;//attr value(no quot value only)
	var S_E = 5;//attr value end and no space(quot end)
	var S_S = 6;//(attr value end || tag end ) && (space offer)
	var S_C = 7;//closed el<el />

	function XMLReader(){
		
	}

	XMLReader.prototype = {
		parse:function(source,defaultNSMap,entityMap){
			var domBuilder = this.domBuilder;
			domBuilder.startDocument();
			_copy(defaultNSMap ,defaultNSMap = {})
			parse(source,defaultNSMap,entityMap,
					domBuilder,this.errorHandler);
			domBuilder.endDocument();
		}
	}
	function parse(source,defaultNSMapCopy,entityMap,domBuilder,errorHandler){
	  function fixedFromCharCode(code) {
			// String.prototype.fromCharCode does not supports
			// > 2 bytes unicode chars directly
			if (code > 0xffff) {
				code -= 0x10000;
				var surrogate1 = 0xd800 + (code >> 10)
					, surrogate2 = 0xdc00 + (code & 0x3ff);

				return String.fromCharCode(surrogate1, surrogate2);
			} else {
				return String.fromCharCode(code);
			}
		}
		function entityReplacer(a){
			var k = a.slice(1,-1);
			if(k in entityMap){
				return entityMap[k]; 
			}else if(k.charAt(0) === '#'){
				return fixedFromCharCode(parseInt(k.substr(1).replace('x','0x')))
			}else{
				errorHandler.error('entity not found:'+a);
				return a;
			}
		}
		function appendText(end){//has some bugs
			if(end>start){
				var xt = source.substring(start,end).replace(/&#?\w+;/g,entityReplacer);
				locator&&position(start);
				domBuilder.characters(xt,0,end-start);
				start = end
			}
		}
		function position(p,m){
			while(p>=lineEnd && (m = linePattern.exec(source))){
				lineStart = m.index;
				lineEnd = lineStart + m[0].length;
				locator.lineNumber++;
				//console.log('line++:',locator,startPos,endPos)
			}
			locator.columnNumber = p-lineStart+1;
		}
		var lineStart = 0;
		var lineEnd = 0;
		var linePattern = /.+(?:\r\n?|\n)|.*$/g
		var locator = domBuilder.locator;
		
		var parseStack = [{currentNSMap:defaultNSMapCopy}]
		var closeMap = {};
		var start = 0;
		while(true){
			try{
				var tagStart = source.indexOf('<',start);
				if(tagStart<0){
					if(!source.substr(start).match(/^\s*$/)){
						var doc = domBuilder.document;
		    			var text = doc.createTextNode(source.substr(start));
		    			doc.appendChild(text);
		    			domBuilder.currentElement = text;
					}
					return;
				}
				if(tagStart>start){
					appendText(tagStart);
				}
				switch(source.charAt(tagStart+1)){
				case '/':
					var end = source.indexOf('>',tagStart+3);
					var tagName = source.substring(tagStart+2,end);
					var config = parseStack.pop();
					var localNSMap = config.localNSMap;
			        if(config.tagName != tagName){
			            errorHandler.fatalError("end tag name: "+tagName+' is not match the current start tagName:'+config.tagName );
			        }
					domBuilder.endElement(config.uri,config.localName,tagName);
					if(localNSMap){
						for(var prefix in localNSMap){
							domBuilder.endPrefixMapping(prefix) ;
						}
					}
					end++;
					break;
					// end elment
				case '?':// <?...?>
					locator&&position(tagStart);
					end = parseInstruction(source,tagStart,domBuilder);
					break;
				case '!':// <!doctype,<![CDATA,<!--
					locator&&position(tagStart);
					end = parseDCC(source,tagStart,domBuilder,errorHandler);
					break;
				default:
				
					locator&&position(tagStart);
					
					var el = new ElementAttributes();
					
					//elStartEnd
					var end = parseElementStartPart(source,tagStart,el,entityReplacer,errorHandler);
					var len = el.length;
					
					if(locator){
						if(len){
							//attribute position fixed
							for(var i = 0;i<len;i++){
								var a = el[i];
								position(a.offset);
								a.offset = copyLocator(locator,{});
							}
						}
						position(end);
					}
					if(!el.closed && fixSelfClosed(source,end,el.tagName,closeMap)){
						el.closed = true;
						if(!entityMap.nbsp){
							errorHandler.warning('unclosed xml attribute');
						}
					}
					appendElement(el,domBuilder,parseStack);
					
					
					if(el.uri === 'http://www.w3.org/1999/xhtml' && !el.closed){
						end = parseHtmlSpecialContent(source,end,el.tagName,entityReplacer,domBuilder)
					}else{
						end++;
					}
				}
			}catch(e){
				errorHandler.error('element parse error: '+e);
				end = -1;
			}
			if(end>start){
				start = end;
			}else{
				//TODO: 这里有可能sax回退，有位置错误风险
				appendText(Math.max(tagStart,start)+1);
			}
		}
	}
	function copyLocator(f,t){
		t.lineNumber = f.lineNumber;
		t.columnNumber = f.columnNumber;
		return t;
	}

	/**
	 * @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
	 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
	 */
	function parseElementStartPart(source,start,el,entityReplacer,errorHandler){
		var attrName;
		var value;
		var p = ++start;
		var s = S_TAG;//status
		while(true){
			var c = source.charAt(p);
			switch(c){
			case '=':
				if(s === S_ATTR){//attrName
					attrName = source.slice(start,p);
					s = S_EQ;
				}else if(s === S_ATTR_S){
					s = S_EQ;
				}else{
					//fatalError: equal must after attrName or space after attrName
					throw new Error('attribute equal must after attrName');
				}
				break;
			case '\'':
			case '"':
				if(s === S_EQ){//equal
					start = p+1;
					p = source.indexOf(c,start)
					if(p>0){
						value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
						el.add(attrName,value,start-1);
						s = S_E;
					}else{
						//fatalError: no end quot match
						throw new Error('attribute value no end \''+c+'\' match');
					}
				}else if(s == S_V){
					value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					//console.log(attrName,value,start,p)
					el.add(attrName,value,start);
					//console.dir(el)
					errorHandler.warning('attribute "'+attrName+'" missed start quot('+c+')!!');
					start = p+1;
					s = S_E
				}else{
					//fatalError: no equal before
					throw new Error('attribute value must after "="');
				}
				break;
			case '/':
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));
				case S_E:
				case S_S:
				case S_C:
					s = S_C;
					el.closed = true;
				case S_V:
				case S_ATTR:
				case S_ATTR_S:
					break;
				//case S_EQ:
				default:
					throw new Error("attribute invalid close char('/')")
				}
				break;
			case ''://end document
				//throw new Error('unexpected end of input')
				errorHandler.error('unexpected end of input');
			case '>':
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));
				case S_E:
				case S_S:
				case S_C:
					break;//normal
				case S_V://Compatible state
				case S_ATTR:
					value = source.slice(start,p);
					if(value.slice(-1) === '/'){
						el.closed  = true;
						value = value.slice(0,-1)
					}
				case S_ATTR_S:
					if(s === S_ATTR_S){
						value = attrName;
					}
					if(s == S_V){
						errorHandler.warning('attribute "'+value+'" missed quot(")!!');
						el.add(attrName,value.replace(/&#?\w+;/g,entityReplacer),start)
					}else{
						errorHandler.warning('attribute "'+value+'" missed value!! "'+value+'" instead!!')
						el.add(value,value,start)
					}
					break;
				case S_EQ:
					throw new Error('attribute value missed!!');
				}
	//			console.log(tagName,tagNamePattern,tagNamePattern.test(tagName))
				return p;
			/*xml space '\x20' | #x9 | #xD | #xA; */
			case '\u0080':
				c = ' ';
			default:
				if(c<= ' '){//space
					switch(s){
					case S_TAG:
						el.setTagName(source.slice(start,p));//tagName
						s = S_S;
						break;
					case S_ATTR:
						attrName = source.slice(start,p)
						s = S_ATTR_S;
						break;
					case S_V:
						var value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
						errorHandler.warning('attribute "'+value+'" missed quot(")!!');
						el.add(attrName,value,start)
					case S_E:
						s = S_S;
						break;
					//case S_S:
					//case S_EQ:
					//case S_ATTR_S:
					//	void();break;
					//case S_C:
						//ignore warning
					}
				}else{//not space
	//S_TAG,	S_ATTR,	S_EQ,	S_V
	//S_ATTR_S,	S_E,	S_S,	S_C
					switch(s){
					//case S_TAG:void();break;
					//case S_ATTR:void();break;
					//case S_V:void();break;
					case S_ATTR_S:
						errorHandler.warning('attribute "'+attrName+'" missed value!! "'+attrName+'" instead!!')
						el.add(attrName,attrName,start);
						start = p;
						s = S_ATTR;
						break;
					case S_E:
						errorHandler.warning('attribute space is required"'+attrName+'"!!')
					case S_S:
						s = S_ATTR;
						start = p;
						break;
					case S_EQ:
						s = S_V;
						start = p;
						break;
					case S_C:
						throw new Error("elements closed character '/' and '>' must be connected to");
					}
				}
			}
			p++;
		}
	}
	/**
	 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
	 */
	function appendElement(el,domBuilder,parseStack){
		var tagName = el.tagName;
		var localNSMap = null;
		var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
		var i = el.length;
		while(i--){
			var a = el[i];
			var qName = a.qName;
			var value = a.value;
			var nsp = qName.indexOf(':');
			if(nsp>0){
				var prefix = a.prefix = qName.slice(0,nsp);
				var localName = qName.slice(nsp+1);
				var nsPrefix = prefix === 'xmlns' && localName
			}else{
				localName = qName;
				prefix = null
				nsPrefix = qName === 'xmlns' && ''
			}
			//can not set prefix,because prefix !== ''
			a.localName = localName ;
			//prefix == null for no ns prefix attribute 
			if(nsPrefix !== false){//hack!!
				if(localNSMap == null){
					localNSMap = {}
					//console.log(currentNSMap,0)
					_copy(currentNSMap,currentNSMap={})
					//console.log(currentNSMap,1)
				}
				currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
				a.uri = 'http://www.w3.org/2000/xmlns/'
				domBuilder.startPrefixMapping(nsPrefix, value) 
			}
		}
		var i = el.length;
		while(i--){
			a = el[i];
			var prefix = a.prefix;
			if(prefix){//no prefix attribute has no namespace
				if(prefix === 'xml'){
					a.uri = 'http://www.w3.org/XML/1998/namespace';
				}if(prefix !== 'xmlns'){
					a.uri = currentNSMap[prefix]
					
					//{console.log('###'+a.qName,domBuilder.locator.systemId+'',currentNSMap,a.uri)}
				}
			}
		}
		var nsp = tagName.indexOf(':');
		if(nsp>0){
			prefix = el.prefix = tagName.slice(0,nsp);
			localName = el.localName = tagName.slice(nsp+1);
		}else{
			prefix = null;//important!!
			localName = el.localName = tagName;
		}
		//no prefix element has default namespace
		var ns = el.uri = currentNSMap[prefix || ''];
		domBuilder.startElement(ns,localName,tagName,el);
		//endPrefixMapping and startPrefixMapping have not any help for dom builder
		//localNSMap = null
		if(el.closed){
			domBuilder.endElement(ns,localName,tagName);
			if(localNSMap){
				for(prefix in localNSMap){
					domBuilder.endPrefixMapping(prefix) 
				}
			}
		}else{
			el.currentNSMap = currentNSMap;
			el.localNSMap = localNSMap;
			parseStack.push(el);
		}
	}
	function parseHtmlSpecialContent(source,elStartEnd,tagName,entityReplacer,domBuilder){
		if(/^(?:script|textarea)$/i.test(tagName)){
			var elEndStart =  source.indexOf('</'+tagName+'>',elStartEnd);
			var text = source.substring(elStartEnd+1,elEndStart);
			if(/[&<]/.test(text)){
				if(/^script$/i.test(tagName)){
					//if(!/\]\]>/.test(text)){
						//lexHandler.startCDATA();
						domBuilder.characters(text,0,text.length);
						//lexHandler.endCDATA();
						return elEndStart;
					//}
				}//}else{//text area
					text = text.replace(/&#?\w+;/g,entityReplacer);
					domBuilder.characters(text,0,text.length);
					return elEndStart;
				//}
				
			}
		}
		return elStartEnd+1;
	}
	function fixSelfClosed(source,elStartEnd,tagName,closeMap){
		//if(tagName in closeMap){
		var pos = closeMap[tagName];
		if(pos == null){
			//console.log(tagName)
			pos = closeMap[tagName] = source.lastIndexOf('</'+tagName+'>')
		}
		return pos<elStartEnd;
		//} 
	}
	function _copy(source,target){
		for(var n in source){target[n] = source[n]}
	}
	function parseDCC(source,start,domBuilder,errorHandler){//sure start with '<!'
		var next= source.charAt(start+2)
		switch(next){
		case '-':
			if(source.charAt(start + 3) === '-'){
				var end = source.indexOf('-->',start+4);
				//append comment source.substring(4,end)//<!--
				if(end>start){
					domBuilder.comment(source,start+4,end-start-4);
					return end+3;
				}else{
					errorHandler.error("Unclosed comment");
					return -1;
				}
			}else{
				//error
				return -1;
			}
		default:
			if(source.substr(start+3,6) == 'CDATA['){
				var end = source.indexOf(']]>',start+9);
				domBuilder.startCDATA();
				domBuilder.characters(source,start+9,end-start-9);
				domBuilder.endCDATA() 
				return end+3;
			}
			//<!DOCTYPE
			//startDTD(java.lang.String name, java.lang.String publicId, java.lang.String systemId) 
			var matchs = split(source,start);
			var len = matchs.length;
			if(len>1 && /!doctype/i.test(matchs[0][0])){
				var name = matchs[1][0];
				var pubid = len>3 && /^public$/i.test(matchs[2][0]) && matchs[3][0]
				var sysid = len>4 && matchs[4][0];
				var lastMatch = matchs[len-1]
				domBuilder.startDTD(name,pubid && pubid.replace(/^(['"])(.*?)\1$/,'$2'),
						sysid && sysid.replace(/^(['"])(.*?)\1$/,'$2'));
				domBuilder.endDTD();
				
				return lastMatch.index+lastMatch[0].length
			}
		}
		return -1;
	}



	function parseInstruction(source,start,domBuilder){
		var end = source.indexOf('?>',start);
		if(end){
			var match = source.substring(start,end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
			if(match){
				var len = match[0].length;
				domBuilder.processingInstruction(match[1], match[2]) ;
				return end+2;
			}else{//error
				return -1;
			}
		}
		return -1;
	}

	/**
	 * @param source
	 */
	function ElementAttributes(source){
		
	}
	ElementAttributes.prototype = {
		setTagName:function(tagName){
			if(!tagNamePattern.test(tagName)){
				throw new Error('invalid tagName:'+tagName)
			}
			this.tagName = tagName
		},
		add:function(qName,value,offset){
			if(!tagNamePattern.test(qName)){
				throw new Error('invalid attribute:'+qName)
			}
			this[this.length++] = {qName:qName,value:value,offset:offset}
		},
		length:0,
		getLocalName:function(i){return this[i].localName},
		getOffset:function(i){return this[i].offset},
		getQName:function(i){return this[i].qName},
		getURI:function(i){return this[i].uri},
		getValue:function(i){return this[i].value}
	//	,getIndex:function(uri, localName)){
	//		if(localName){
	//			
	//		}else{
	//			var qName = uri
	//		}
	//	},
	//	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
	//	getType:function(uri,localName){}
	//	getType:function(i){},
	}




	function _set_proto_(thiz,parent){
		thiz.__proto__ = parent;
		return thiz;
	}
	if(!(_set_proto_({},_set_proto_.prototype) instanceof _set_proto_)){
		_set_proto_ = function(thiz,parent){
			function p(){};
			p.prototype = parent;
			p = new p();
			for(parent in thiz){
				p[parent] = thiz[parent];
			}
			return p;
		}
	}

	function split(source,start){
		var match;
		var buf = [];
		var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
		reg.lastIndex = start;
		reg.exec(source);//skip <
		while(match = reg.exec(source)){
			buf.push(match);
			if(match[1])return buf;
		}
	}

	if('function' == 'function'){
		exports.XMLReader = XMLReader;
	}
	});

	var require$$1 = (sax && typeof sax === 'object' && 'default' in sax ? sax['default'] : sax);

	var domParser = createCommonjsModule(function (module, exports) {
	function DOMParser(options){
		this.options = options ||{locator:{}};
		
	}
	DOMParser.prototype.parseFromString = function(source,mimeType){	
		var options = this.options;
		var sax =  new XMLReader();
		var domBuilder = options.domBuilder || new DOMHandler();//contentHandler and LexicalHandler
		var errorHandler = options.errorHandler;
		var locator = options.locator;
		var defaultNSMap = options.xmlns||{};
		var entityMap = {'lt':'<','gt':'>','amp':'&','quot':'"','apos':"'"}
		if(locator){
			domBuilder.setDocumentLocator(locator)
		}
		
		sax.errorHandler = buildErrorHandler(errorHandler,domBuilder,locator);
		sax.domBuilder = options.domBuilder || domBuilder;
		if(/\/x?html?$/.test(mimeType)){
			entityMap.nbsp = '\xa0';
			entityMap.copy = '\xa9';
			defaultNSMap['']= 'http://www.w3.org/1999/xhtml';
		}
		defaultNSMap.xml = defaultNSMap.xml || 'http://www.w3.org/XML/1998/namespace';
		if(source){
			sax.parse(source,defaultNSMap,entityMap);
		}else{
			sax.errorHandler.error("invalid document source");
		}
		return domBuilder.document;
	}
	function buildErrorHandler(errorImpl,domBuilder,locator){
		if(!errorImpl){
			if(domBuilder instanceof DOMHandler){
				return domBuilder;
			}
			errorImpl = domBuilder ;
		}
		var errorHandler = {}
		var isCallback = errorImpl instanceof Function;
		locator = locator||{}
		function build(key){
			var fn = errorImpl[key];
			if(!fn && isCallback){
				fn = errorImpl.length == 2?function(msg){errorImpl(key,msg)}:errorImpl;
			}
			errorHandler[key] = fn && function(msg){
				fn('[xmldom '+key+']\t'+msg+_locator(locator));
			}||function(){};
		}
		build('warning');
		build('error');
		build('fatalError');
		return errorHandler;
	}

	//console.log('#\n\n\n\n\n\n\n####')
	/**
	 * +ContentHandler+ErrorHandler
	 * +LexicalHandler+EntityResolver2
	 * -DeclHandler-DTDHandler 
	 * 
	 * DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
	 * DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
	 */
	function DOMHandler() {
	    this.cdata = false;
	}
	function position(locator,node){
		node.lineNumber = locator.lineNumber;
		node.columnNumber = locator.columnNumber;
	}
	/**
	 * @see org.xml.sax.ContentHandler#startDocument
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
	 */ 
	DOMHandler.prototype = {
		startDocument : function() {
	    	this.document = new DOMImplementation().createDocument(null, null, null);
	    	if (this.locator) {
	        	this.document.documentURI = this.locator.systemId;
	    	}
		},
		startElement:function(namespaceURI, localName, qName, attrs) {
			var doc = this.document;
		    var el = doc.createElementNS(namespaceURI, qName||localName);
		    var len = attrs.length;
		    appendElement(this, el);
		    this.currentElement = el;
		    
			this.locator && position(this.locator,el)
		    for (var i = 0 ; i < len; i++) {
		        var namespaceURI = attrs.getURI(i);
		        var value = attrs.getValue(i);
		        var qName = attrs.getQName(i);
				var attr = doc.createAttributeNS(namespaceURI, qName);
				if( attr.getOffset){
					position(attr.getOffset(1),attr)
				}
				attr.value = attr.nodeValue = value;
				el.setAttributeNode(attr)
		    }
		},
		endElement:function(namespaceURI, localName, qName) {
			var current = this.currentElement
		    var tagName = current.tagName;
		    this.currentElement = current.parentNode;
		},
		startPrefixMapping:function(prefix, uri) {
		},
		endPrefixMapping:function(prefix) {
		},
		processingInstruction:function(target, data) {
		    var ins = this.document.createProcessingInstruction(target, data);
		    this.locator && position(this.locator,ins)
		    appendElement(this, ins);
		},
		ignorableWhitespace:function(ch, start, length) {
		},
		characters:function(chars, start, length) {
			chars = _toString.apply(this,arguments)
			//console.log(chars)
			if(this.currentElement && chars){
				if (this.cdata) {
					var charNode = this.document.createCDATASection(chars);
					this.currentElement.appendChild(charNode);
				} else {
					var charNode = this.document.createTextNode(chars);
					this.currentElement.appendChild(charNode);
				}
				this.locator && position(this.locator,charNode)
			}
		},
		skippedEntity:function(name) {
		},
		endDocument:function() {
			this.document.normalize();
		},
		setDocumentLocator:function (locator) {
		    if(this.locator = locator){// && !('lineNumber' in locator)){
		    	locator.lineNumber = 0;
		    }
		},
		//LexicalHandler
		comment:function(chars, start, length) {
			chars = _toString.apply(this,arguments)
		    var comm = this.document.createComment(chars);
		    this.locator && position(this.locator,comm)
		    appendElement(this, comm);
		},
		
		startCDATA:function() {
		    //used in characters() methods
		    this.cdata = true;
		},
		endCDATA:function() {
		    this.cdata = false;
		},
		
		startDTD:function(name, publicId, systemId) {
			var impl = this.document.implementation;
		    if (impl && impl.createDocumentType) {
		        var dt = impl.createDocumentType(name, publicId, systemId);
		        this.locator && position(this.locator,dt)
		        appendElement(this, dt);
		    }
		},
		/**
		 * @see org.xml.sax.ErrorHandler
		 * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
		 */
		warning:function(error) {
			console.warn('[xmldom warning]\t'+error,_locator(this.locator));
		},
		error:function(error) {
			console.error('[xmldom error]\t'+error,_locator(this.locator));
		},
		fatalError:function(error) {
			console.error('[xmldom fatalError]\t'+error,_locator(this.locator));
		    throw error;
		}
	}
	function _locator(l){
		if(l){
			return '\n@'+(l.systemId ||'')+'#[line:'+l.lineNumber+',col:'+l.columnNumber+']'
		}
	}
	function _toString(chars,start,length){
		if(typeof chars == 'string'){
			return chars.substr(start,length)
		}else{//java sax connect width xmldom on rhino(what about: "? && !(chars instanceof String)")
			if(chars.length >= start+length || start){
				return new java.lang.String(chars,start,length)+'';
			}
			return chars;
		}
	}

	/*
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
	 * used method of org.xml.sax.ext.LexicalHandler:
	 *  #comment(chars, start, length)
	 *  #startCDATA()
	 *  #endCDATA()
	 *  #startDTD(name, publicId, systemId)
	 *
	 *
	 * IGNORED method of org.xml.sax.ext.LexicalHandler:
	 *  #endDTD()
	 *  #startEntity(name)
	 *  #endEntity(name)
	 *
	 *
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
	 * IGNORED method of org.xml.sax.ext.DeclHandler
	 * 	#attributeDecl(eName, aName, type, mode, value)
	 *  #elementDecl(name, model)
	 *  #externalEntityDecl(name, publicId, systemId)
	 *  #internalEntityDecl(name, value)
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/EntityResolver2.html
	 * IGNORED method of org.xml.sax.EntityResolver2
	 *  #resolveEntity(String name,String publicId,String baseURI,String systemId)
	 *  #resolveEntity(publicId, systemId)
	 *  #getExternalSubset(name, baseURI)
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
	 * IGNORED method of org.xml.sax.DTDHandler
	 *  #notationDecl(name, publicId, systemId) {};
	 *  #unparsedEntityDecl(name, publicId, systemId, notationName) {};
	 */
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(key){
		DOMHandler.prototype[key] = function(){return null}
	})

	/* Private static helpers treated below as private instance methods, so don't need to add these to the public API; we might use a Relator to also get rid of non-standard public properties */
	function appendElement (hander,node) {
	    if (!hander.currentElement) {
	        hander.document.appendChild(node);
	    } else {
	        hander.currentElement.appendChild(node);
	    }
	}//appendChild and setAttributeNS are preformance key

	if('function' == 'function'){
		var XMLReader = require$$1.XMLReader;
		var DOMImplementation = exports.DOMImplementation = require$$0$1.DOMImplementation;
		exports.XMLSerializer = require$$0$1.XMLSerializer ;
		exports.DOMParser = DOMParser;
	}
	});

	var require$$0 = (domParser && typeof domParser === 'object' && 'default' in domParser ? domParser['default'] : domParser);

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
	        serializer = new (require$$0.XMLSerializer)();
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

	var index$1 = createCommonjsModule(function (module) {
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

	var require$$0$2 = (index$1 && typeof index$1 === 'object' && 'default' in index$1 ? index$1['default'] : index$1);

	var index = createCommonjsModule(function (module) {
	'use strict';

	module.exports = rbush;

	var quickselect = require$$0$2;

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

	var rbush = (index && typeof index === 'object' && 'default' in index ? index['default'] : index);

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

	function MapillaryImages(projection, context, dispatch) {
	    var debouncedRedraw = _.debounce(function () { dispatch.change(); }, 1000),
	        minZoom = 12,
	        layer = d3.select(null),
	        _mapillary;


	    function init() {
	        if (iD.svg.MapillaryImages.initialized) return;  // run once
	        iD.svg.MapillaryImages.enabled = false;
	        iD.svg.MapillaryImages.initialized = true;
	    }

	    function getMapillary() {
	        if (iD.services.mapillary && !_mapillary) {
	            _mapillary = iD.services.mapillary();
	            _mapillary.on('loadedImages', debouncedRedraw);
	        } else if (!iD.services.mapillary && _mapillary) {
	            _mapillary = null;
	        }

	        return _mapillary;
	    }

	    function showLayer() {
	        var mapillary = getMapillary();
	        if (!mapillary) return;

	        mapillary.loadViewer();
	        editOn();

	        layer
	            .style('opacity', 0)
	            .transition()
	            .duration(500)
	            .style('opacity', 1)
	            .each('end', debouncedRedraw);
	    }

	    function hideLayer() {
	        var mapillary = getMapillary();
	        if (mapillary) {
	            mapillary.hideViewer();
	        }

	        debouncedRedraw.cancel();

	        layer
	            .transition()
	            .duration(500)
	            .style('opacity', 0)
	            .each('end', editOff);
	    }

	    function editOn() {
	        layer.style('display', 'block');
	    }

	    function editOff() {
	        layer.selectAll('.viewfield-group').remove();
	        layer.style('display', 'none');
	    }

	    function click(d) {
	        var mapillary = getMapillary();
	        if (!mapillary) return;

	        context.map().centerEase(d.loc);

	        mapillary
	            .setSelectedImage(d.key, true)
	            .updateViewer(d.key, context)
	            .showViewer();
	    }

	    function transform(d) {
	        var t = iD.svg.PointTransform(projection)(d);
	        if (d.ca) t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
	        return t;
	    }

	    function update() {
	        var mapillary = getMapillary(),
	            data = (mapillary ? mapillary.images(projection, layer.dimensions()) : []),
	            imageKey = mapillary ? mapillary.getSelectedImage() : null;

	        var markers = layer.selectAll('.viewfield-group')
	            .data(data, function(d) { return d.key; });

	        // Enter
	        var enter = markers.enter()
	            .append('g')
	            .attr('class', 'viewfield-group')
	            .classed('selected', function(d) { return d.key === imageKey; })
	            .on('click', click);

	        enter.append('path')
	            .attr('class', 'viewfield')
	            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
	            .attr('d', 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z');

	        enter.append('circle')
	            .attr('dx', '0')
	            .attr('dy', '0')
	            .attr('r', '6');

	        // Exit
	        markers.exit()
	            .remove();

	        // Update
	        markers
	            .attr('transform', transform);
	    }

	    function drawImages(selection) {
	        var enabled = iD.svg.MapillaryImages.enabled,
	            mapillary = getMapillary();

	        layer = selection.selectAll('.layer-mapillary-images')
	            .data(mapillary ? [0] : []);

	        layer.enter()
	            .append('g')
	            .attr('class', 'layer-mapillary-images')
	            .style('display', enabled ? 'block' : 'none');

	        layer.exit()
	            .remove();

	        if (enabled) {
	            if (mapillary && ~~context.map().zoom() >= minZoom) {
	                editOn();
	                update();
	                mapillary.loadImages(projection, layer.dimensions());
	            } else {
	                editOff();
	            }
	        }
	    }

	    drawImages.enabled = function(_) {
	        if (!arguments.length) return iD.svg.MapillaryImages.enabled;
	        iD.svg.MapillaryImages.enabled = _;
	        if (iD.svg.MapillaryImages.enabled) {
	            showLayer();
	        } else {
	            hideLayer();
	        }
	        dispatch.change();
	        return this;
	    };

	    drawImages.supported = function() {
	        return !!getMapillary();
	    };

	    drawImages.dimensions = function(_) {
	        if (!arguments.length) return layer.dimensions();
	        layer.dimensions(_);
	        return this;
	    };

	    init();
	    return drawImages;
	}

	function MapillarySigns(projection, context, dispatch) {
	    var debouncedRedraw = _.debounce(function () { dispatch.change(); }, 1000),
	        minZoom = 12,
	        layer = d3.select(null),
	        _mapillary;


	    function init() {
	        if (iD.svg.MapillarySigns.initialized) return;  // run once
	        iD.svg.MapillarySigns.enabled = false;
	        iD.svg.MapillarySigns.initialized = true;
	    }

	    function getMapillary() {
	        if (iD.services.mapillary && !_mapillary) {
	            _mapillary = iD.services.mapillary().on('loadedSigns', debouncedRedraw);
	        } else if (!iD.services.mapillary && _mapillary) {
	            _mapillary = null;
	        }
	        return _mapillary;
	    }

	    function showLayer() {
	        editOn();
	        debouncedRedraw();
	    }

	    function hideLayer() {
	        debouncedRedraw.cancel();
	        editOff();
	    }

	    function editOn() {
	        layer.style('display', 'block');
	    }

	    function editOff() {
	        layer.selectAll('.icon-sign').remove();
	        layer.style('display', 'none');
	    }

	    function click(d) {
	        var mapillary = getMapillary();
	        if (!mapillary) return;

	        context.map().centerEase(d.loc);

	        mapillary
	            .setSelectedImage(d.key, true)
	            .updateViewer(d.key, context)
	            .showViewer();
	    }

	    function update() {
	        var mapillary = getMapillary(),
	            data = (mapillary ? mapillary.signs(projection, layer.dimensions()) : []),
	            imageKey = mapillary ? mapillary.getSelectedImage() : null;

	        var signs = layer.selectAll('.icon-sign')
	            .data(data, function(d) { return d.key; });

	        // Enter
	        var enter = signs.enter()
	            .append('foreignObject')
	            .attr('class', 'icon-sign')
	            .attr('width', '32px')      // for Firefox
	            .attr('height', '32px')     // for Firefox
	            .classed('selected', function(d) { return d.key === imageKey; })
	            .on('click', click);

	        enter
	            .append('xhtml:body')
	            .html(mapillary.signHTML);

	        // Exit
	        signs.exit()
	            .remove();

	        // Update
	        signs
	            .attr('transform', iD.svg.PointTransform(projection));
	    }

	    function drawSigns(selection) {
	        var enabled = iD.svg.MapillarySigns.enabled,
	            mapillary = getMapillary();

	        layer = selection.selectAll('.layer-mapillary-signs')
	            .data(mapillary ? [0] : []);

	        layer.enter()
	            .append('g')
	            .attr('class', 'layer-mapillary-signs')
	            .style('display', enabled ? 'block' : 'none')
	            .attr('transform', 'translate(-16, -16)');  // center signs on loc

	        layer.exit()
	            .remove();

	        if (enabled) {
	            if (mapillary && ~~context.map().zoom() >= minZoom) {
	                editOn();
	                update();
	                mapillary.loadSigns(context, projection, layer.dimensions());
	            } else {
	                editOff();
	            }
	        }
	    }

	    drawSigns.enabled = function(_) {
	        if (!arguments.length) return iD.svg.MapillarySigns.enabled;
	        iD.svg.MapillarySigns.enabled = _;
	        if (iD.svg.MapillarySigns.enabled) {
	            showLayer();
	        } else {
	            hideLayer();
	        }
	        dispatch.change();
	        return this;
	    };

	    drawSigns.supported = function() {
	        var mapillary = getMapillary();
	        return (mapillary && mapillary.signsSupported());
	    };

	    drawSigns.dimensions = function(_) {
	        if (!arguments.length) return layer.dimensions();
	        layer.dimensions(_);
	        return this;
	    };

	    init();
	    return drawSigns;
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

	function OneWaySegments(projection, graph, dt) {
	    return function(entity) {
	        var a,
	            b,
	            i = 0,
	            offset = dt,
	            segments = [],
	            clip = d3.geo.clipExtent().extent(projection.clipExtent()).stream,
	            coordinates = graph.childNodes(entity).map(function(n) {
	                return n.loc;
	            });

	        if (entity.tags.oneway === '-1') coordinates.reverse();

	        d3.geo.stream({
	            type: 'LineString',
	            coordinates: coordinates
	        }, projection.stream(clip({
	            lineStart: function() {},
	            lineEnd: function() {
	                a = null;
	            },
	            point: function(x, y) {
	                b = [x, y];

	                if (a) {
	                    var span = iD.geo.euclideanDistance(a, b) - offset;

	                    if (span >= 0) {
	                        var angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
	                            dx = dt * Math.cos(angle),
	                            dy = dt * Math.sin(angle),
	                            p = [a[0] + offset * Math.cos(angle),
	                                 a[1] + offset * Math.sin(angle)];

	                        var segment = 'M' + a[0] + ',' + a[1] +
	                                      'L' + p[0] + ',' + p[1];

	                        for (span -= dt; span >= 0; span -= dt) {
	                            p[0] += dx;
	                            p[1] += dy;
	                            segment += 'L' + p[0] + ',' + p[1];
	                        }

	                        segment += 'L' + b[0] + ',' + b[1];
	                        segments.push({id: entity.id, index: i, d: segment});
	                    }

	                    offset = -span;
	                    i++;
	                }

	                a = b;
	            }
	        })));

	        return segments;
	    };
	}

	function Osm() {
	    return function drawOsm(selection) {
	        var layers = selection.selectAll('.layer-osm')
	            .data(['areas', 'lines', 'hit', 'halo', 'label']);

	        layers.enter().append('g')
	            .attr('class', function(d) { return 'layer-osm layer-' + d; });
	    };
	}

	function Path(projection, graph, polygon) {
	    var cache = {},
	        clip = d3.geo.clipExtent().extent(projection.clipExtent()).stream,
	        project = projection.stream,
	        path = d3.geo.path()
	            .projection({stream: function(output) { return polygon ? project(output) : project(clip(output)); }});

	    return function(entity) {
	        if (entity.id in cache) {
	            return cache[entity.id];
	        } else {
	            return cache[entity.id] = path(entity.asGeoJSON(graph));
	        }
	    };
	}

	function PointTransform(projection) {
	    return function(entity) {
	        // http://jsperf.com/short-array-join
	        var pt = projection(entity.loc);
	        return 'translate(' + pt[0] + ',' + pt[1] + ')';
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

	function RelationMemberTags(graph) {
	    return function(entity) {
	        var tags = entity.tags;
	        graph.parentRelations(entity).forEach(function(relation) {
	            var type = relation.tags.type;
	            if (type === 'multipolygon' || type === 'boundary') {
	                tags = _.extend({}, relation.tags, tags);
	            }
	        });
	        return tags;
	    };
	}

	function TagClasses() {
	    var primaries = [
	            'building', 'highway', 'railway', 'waterway', 'aeroway',
	            'motorway', 'boundary', 'power', 'amenity', 'natural', 'landuse',
	            'leisure', 'place'
	        ],
	        statuses = [
	            'proposed', 'construction', 'disused', 'abandoned', 'dismantled',
	            'razed', 'demolished', 'obliterated'
	        ],
	        secondaries = [
	            'oneway', 'bridge', 'tunnel', 'embankment', 'cutting', 'barrier',
	            'surface', 'tracktype', 'crossing'
	        ],
	        tagClassRe = /^tag-/,
	        tags = function(entity) { return entity.tags; };


	    var tagClasses = function(selection) {
	        selection.each(function tagClassesEach(entity) {
	            var value = this.className,
	                classes, primary, status;

	            if (value.baseVal !== undefined) value = value.baseVal;

	            classes = value.trim().split(/\s+/).filter(function(name) {
	                return name.length && !tagClassRe.test(name);
	            }).join(' ');

	            var t = tags(entity), i, k, v;

	            // pick at most one primary classification tag..
	            for (i = 0; i < primaries.length; i++) {
	                k = primaries[i];
	                v = t[k];
	                if (!v || v === 'no') continue;

	                primary = k;
	                if (statuses.indexOf(v) !== -1) {   // e.g. `railway=abandoned`
	                    status = v;
	                    classes += ' tag-' + k;
	                } else {
	                    classes += ' tag-' + k + ' tag-' + k + '-' + v;
	                }

	                break;
	            }

	            // add at most one status tag, only if relates to primary tag..
	            if (!status) {
	                for (i = 0; i < statuses.length; i++) {
	                    k = statuses[i];
	                    v = t[k];
	                    if (!v || v === 'no') continue;

	                    if (v === 'yes') {   // e.g. `railway=rail + abandoned=yes`
	                        status = k;
	                    }
	                    else if (primary && primary === v) {  // e.g. `railway=rail + abandoned=railway`
	                        status = k;
	                    } else if (!primary && primaries.indexOf(v) !== -1) {  // e.g. `abandoned=railway`
	                        status = k;
	                        primary = v;
	                        classes += ' tag-' + v;
	                    }  // else ignore e.g.  `highway=path + abandoned=railway`

	                    if (status) break;
	                }
	            }

	            if (status) {
	                classes += ' tag-status tag-status-' + status;
	            }

	            // add any secondary (structure) tags
	            for (i = 0; i < secondaries.length; i++) {
	                k = secondaries[i];
	                v = t[k];
	                if (!v || v === 'no') continue;
	                classes += ' tag-' + k + ' tag-' + k + '-' + v;
	            }

	            // For highways, look for surface tagging..
	            if (primary === 'highway') {
	                var paved = (t.highway !== 'track');
	                for (k in t) {
	                    v = t[k];
	                    if (k in iD.pavedTags) {
	                        paved = !!iD.pavedTags[k][v];
	                        break;
	                    }
	                }
	                if (!paved) {
	                    classes += ' tag-unpaved';
	                }
	            }

	            classes = classes.trim();

	            if (classes !== value) {
	                d3.select(this).attr('class', classes);
	            }
	        });
	    };

	    tagClasses.tags = function(_) {
	        if (!arguments.length) return tags;
	        tags = _;
	        return tagClasses;
	    };

	    return tagClasses;
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

	exports.Areas = Areas;
	exports.Debug = Debug;
	exports.Defs = Defs;
	exports.Gpx = Gpx;
	exports.Icon = Icon;
	exports.Labels = Labels;
	exports.Layers = Layers;
	exports.Lines = Lines;
	exports.MapillaryImages = MapillaryImages;
	exports.MapillarySigns = MapillarySigns;
	exports.Midpoints = Midpoints;
	exports.OneWaySegments = OneWaySegments;
	exports.Osm = Osm;
	exports.Path = Path;
	exports.PointTransform = PointTransform;
	exports.Points = Points;
	exports.RelationMemberTags = RelationMemberTags;
	exports.TagClasses = TagClasses;
	exports.Turns = Turns;
	exports.Vertices = Vertices;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
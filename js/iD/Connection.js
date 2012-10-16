define(["dojo/_base/xhr","dojo/_base/lang","dojox/xml/DomParser","dojo/_base/array",'dojo/_base/declare',
        "iD/Entity","iD/Node","iD/Way","iD/Relation","iD/actions/CreateEntityAction"],
       function(xhr,lang,DomParser,array,declare,Entity){

// ----------------------------------------------------------------------
// Connection base class

declare("iD.Connection", null, {
	nodes: {},			// hash of node objects
	ways: {},			// hash of way objects
	relations: {},		// hash of relation objects
	pois: null,			// list of nodes which are POIs
	maps: [],			// list of Map objects listening to this
	callback: null,		// callback once .osm is parsed
	modified: false,	// data has been changed

	nextNode: -1,		// next negative ids
	nextWay: -1,		//  |
	nextRelation: -1,	//  |

	apiBaseURL: '',		// root API address

	constructor:function(apiURL) {
		// summary:		The data store, including methods to fetch data from (and, eventually, save data to)
		// an OSM API server.
		this.nodes={};
		this.ways={};
		this.relations={};
		this.pois=new Hashtable();
		this.maps=[];
		this.modified=false;
		this.apiBaseURL=apiURL;
	},

	_assign:function(obj) {
		// summary:		Save an entity to the data store.
		switch (obj.entityType) {
			case "node": this.nodes[obj.id]=obj; break;
			case "way": this.ways[obj.id]=obj; break;
			case "relation": this.relations[obj.id]=obj; break;
		}
	},

	getNode:function(id) {
		// summary:		Return a node by id.
		return this.nodes[id];		// iD.Node
	},
	getWay:function(id) {
		// summary:		Return a way by id.
		return this.ways[id];		// iD.Way
	},
	getRelation:function(id) {
		// summary:		Return a relation by id.
		return this.relations[id];	// iD.Relation
	},

	_getOrCreate:function(id,type) {
		// summary:		Return an entity if it exists: if not, create an empty one with the given id, and return that.
		switch (type) {
			case "node":
				if (!this.nodes[id]) this._assign(new iD.Node(this, id, NaN, NaN, {}, false));
				return this.nodes[id];
			case "way":
				if (!this.ways[id]) this._assign(new iD.Way(this, id, [], {}, false));
				return this.ways[id];
			case "relation":
				if (!this.relations[id]) this._assign(new iD.Relation(this, id, [], {}, false));
				return this.relations[id];
		}
	},

	doCreateNode:function(tags, lat, lon, perform) {
		// summary:		Create a new node and save it in the data store, using an undo stack.
		var node = new iD.Node(this, this.nextNode--, lat, lon, tags, true);
		perform(new iD.actions.CreateEntityAction(node, lang.hitch(this,this._assign) ));
		return node;	// iD.Node
	},
	doCreateWay:function(tags, nodes, perform) {
		// summary:		Create a new way and save it in the data store, using an undo stack.
		var way = new iD.Way(this, this.nextWay--, nodes.concat(), tags, true);
		perform(new iD.actions.CreateEntityAction(way, lang.hitch(this,this._assign) ));
		return way;
	},
	doCreateRelation:function(tags, members, perform) {
		// summary:		Create a new relation and save it in the data store, using an undo stack.
		var relation = new iD.Relation(this, this.nextRelation--, members.concat(), tags, true);
		perform(new iD.actions.CreateEntityAction(relation, lang.hitch(this,this._assign) ));
		return relation;
	},

	getObjectsByBbox:function(left,right,top,bottom) {
		// summary:			Find all drawable entities that are within a given bounding box.
		// returns: Object	An object with four properties: .poisInside, .poisOutside, .waysInside, .waysOutside.
		// 					Each one is an array of entities.
		var o={ poisInside: [], poisOutside: [],
		        waysInside: [], waysOutside: [] };
		for (var id in this.ways) {
			var way=this.ways[id];
			if (way.within(left,right,top,bottom)) { o.waysInside.push(way); }
			                                  else { o.waysOutside.push(way); }
		}
		this.pois.each(function(node,v) {
			if (node.within(left,right,top,bottom)) { o.poisInside.push(node); }
			                                   else { o.poisOutside.push(node); }
		});
		return o;
	},

	// ---------------
	// Redraw handling

	registerMap:function(map) {
		// summary:		Record that a Map object wants updates from this Connection.
		this.maps.push(map);
	},

	refreshMaps:function() {
		// summary:		Redraw all the Map objects that take data from this Connection.
		_.each(this.maps, function(map) {
			map.updateUIs(false,true);
		});
	},

	refreshEntity:function(_entity) {
		// summary:		Redraw a particular entity on all the Map objects that take data from this Connection.
		_.each(this.maps, function(map) {
			map.refreshUI(_entity);
		});
	},

	// ------------
	// POI handling

	updatePOIs:function(nodelist) {
		// summary:		Update the list of POIs (nodes not in ways) from a supplied array of nodes.
		for (var i in nodelist) {
			if (nodelist[i].entity.hasParentWays()) {
				this.pois.remove(nodelist[i]);
			} else {
				this.pois.put(nodelist[i],true);
			}
		}
	},
	
	getPOIs:function() {
		// summary:		Return a list of all the POIs in this Connection.
		return this.pois.keys();	// Array
	},
	
	registerPOI:function(node) {
		// summary:		Register a node as a POI (not in a way).
		this.pois.put(node,true);
	},
	
	unregisterPOI:function(node) {
		// summary:		Mark a node as no longer being a POI (it's now in a way).
		this.pois.remove(node);
	},

	// ----------
	// OSM parser

	loadFromAPI:function(left,right,top,bottom) {
		// summary:		Request data within the bbox from an external OSM server. Currently hardcoded
		// 				to use Overpass API (which has the relevant CORS headers).
		var url="http://www.overpass-api.de/api/xapi?map?bbox="+left+","+bottom+","+right+","+top;
		xhr.get({ url: url,
		          headers: { "X-Requested-With": null },
		          load: lang.hitch(this, "_processOSM") });
	},

	loadFromURL:function(url) {
		// summary:		Load all data from a given URL.
		xhr.get({ url: url, load: lang.hitch(this, "_processOSM") });
	},

	_processOSM:function(result) {
		var jsdom = DomParser.parse(result).childNodes[1];
		var nodelist = [];
		for (var i in jsdom.childNodes) {
			var obj=jsdom.childNodes[i];
			switch(obj.nodeName) {

				case "node":
                    var node = new iD.Node(this,
                        +getAttribute(obj,'id'),
                        +getAttribute(obj,'lat'),
                        +getAttribute(obj,'lon'),
                        getTags(obj));
                    this._assign(node);
					nodelist.push(node);
					break;

				case "way":
                    var way = new iD.Way(this,
                        getAttribute(obj,'id'),
                        getNodes(obj,this),
                        getTags(obj));
					this._assign(way);
					break;

				case "relation":
                    var relation = new iD.Relation(this,
                        getAttribute(obj,'id'),
                        getMembers(obj,this),
                        getTags(obj));
					this._assign(relation);
					break;
			}
		}
		this.updatePOIs(nodelist);
		this.refreshMaps();
		if (this.callback) { this.callback(); }

		// Private functions to parse DOM created from XML file
        function filterNodeName(n) {
            return function(item) {
                return item.nodeName === n;
            };
        }

		function getAttribute(obj,name) {
            return _.find(obj.attributes, filterNodeName(name)).nodeValue;
		}

		function getTags(obj) {
            return _(obj.childNodes).chain()
                .filter(filterNodeName('tag'))
                .map(function(item) {
                    return [getAttribute(item,'k'), getAttribute(item,'v')];
                }).object().value();
		}

		function getNodes(obj,conn) {
            return _(obj.childNodes).chain()
                .filter(filterNodeName('nd'))
                .map(function(item) {
                    return conn.getNode(getAttribute(item,'ref'));
                }).value();
		}

		function getMembers(obj,conn) {
            return _(obj.childNodes).chain()
                .filter(filterNodeName('member'))
                .map(function(item) {
                    var id = getAttribute(item,'ref'),
                        type = getAttribute(item,'type'),
                        role = getAttribute(item,'role');

					var obj = conn._getOrCreate(id,type);
					return new iD.RelationMember(obj,role);
                }).value();
		}
	}
});

// ----------------------------------------------------------------------
// End of module
});

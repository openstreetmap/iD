// iD/Connection.js

define(["dojo/_base/xhr","dojo/_base/lang","dojox/xml/DomParser","dojo/_base/array",'dojo/_base/declare',
        "iD/Entity","iD/actions/CreateEntityAction"], function(xhr,lang,DomParser,array,declare,Entity){

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

	constructor:function(_apiURL) {
		console.log("Created a connection");
		this.nodes={};
		this.ways={};
		this.relations={};
		this.pois=new Hashtable();
		this.maps=[];
		this.modified=false;
		this.apiBaseURL=_apiURL;
	},

	assign:function(obj) {
		switch (obj.entityType) {
			case "node": 		this.nodes[obj.id]=obj; break;
			case "way": 		this.ways[obj.id]=obj; break;
			case "relation": 	this.relations[obj.id]=obj; break;
		}
	},
	
	getNode:function(id) { return this.nodes[id]; },
	getWay:function(id) { return this.ways[id]; },
	getRelation:function(id) { return this.relations[id]; },

	getOrCreate:function(id,type) {
		switch (type) {
			case "node":
				if (!this.nodes[id]) this.assign(new iD.Node(this, id, NaN, NaN, {}, false));
				return this.nodes[id];
			case "way":
				if (!this.ways[id]) this.assign(new iD.Way(this, id, [], {}, false));
				return this.ways[id];
			case "relation":
				if (!this.relations[id]) this.assign(new iD.Relation(this, id, [], {}, false));
				return this.relations[id];
		}
	},

	createNode:function(tags, lat, lon, perform) {
		var node = new iD.Node(this, this.nextNode--, lat, lon, tags, true);
		perform(new iD.actions.CreateEntityAction(node, lang.hitch(this,this.assign) ));
		return node;
	},
	createWay:function(tags, nodes, perform) {
		var way = new iD.Way(this, this.nextWay--, nodes.concat(), tags, true);
		perform(new iD.actions.CreateEntityAction(way, lang.hitch(this,this.assign) ));
		return way;
	},
	createRelation:function(tags, members, perform) {
		var relation = new iD.Relation(this, this.nextRelation--, members.concat(), tags, true);
		perform(new iD.actions.CreateEntityAction(relation, lang.hitch(this,this.assign) ));
		return relation;
	},

	markClean:function() { this.modified=false; },
	markDirty:function() { this.modified=true; },
	isDirty:function() { return this.modified; },

	getObjectsByBbox:function(left,right,top,bottom) {
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

	// Redraw handling

	registerMap:function(map) {
		this.maps.push(map);
	},

	refreshMaps:function() {
		array.forEach(this.maps, function(map) {
			map.updateUIs(false,true);
		});
	},
	
	refreshEntity:function(_entity) {
		array.forEach(this.maps, function(map) {
			map.refreshUI(_entity);
		});
	},
	
	// Callback when completed loading (used in initialisation)
	
	registerCallback:function(_callback) {
		this.callback=_callback;
	},

	// POI handling

	updatePOIs:function(nodelist) {
		for (var i in nodelist) {
			if (nodelist[i].hasParentWays()) {
				this.pois.remove(nodelist[i]);
			} else {
				this.pois.put(nodelist[i],true);
			}
		}
	},
	
	getPOIs:function() {
		return this.pois.keys();
	},
	
	registerPOI:function(node) {
		this.pois.put(node,true);
	},
	
	unregisterPOI:function(node) {
		this.pois.remove(node);
	},

	// OSM parser

	loadFromAPI:function(left,right,top,bottom) {
		var url="http://www.overpass-api.de/api/xapi?map?bbox="+left+","+bottom+","+right+","+top;
		xhr.get({ url: url,
		          headers: { "X-Requested-With": null },
		          load: lang.hitch(this, "processOSM") });
	},

	loadFromURL:function(url) {
		xhr.get({ url: url, load: lang.hitch(this, "processOSM") });
	},

	processOSM:function(result) {
		var jsdom = DomParser.parse(result).childNodes[1];
		var nodelist = [];
		for (var i in jsdom.childNodes) {
			var obj=jsdom.childNodes[i];
			switch(obj.nodeName) {

				case "node": 		
					var node = new iD.Node(this,
					                       getAttribute(obj,'id'),
					                       getAttribute(obj,'lat'),
					                       getAttribute(obj,'lon'),
					                       getTags(obj));
					this.assign(node);
					nodelist.push(node);
					break;

				case "way":
					var way = new iD.Way(this,
					                     getAttribute(obj,'id'),
					                     getNodes(obj,this),
					                     getTags(obj));
					this.assign(way);
					break;

				case "relation":
					var relation = new iD.Relation(this,
					                               getAttribute(obj,'id'),
					                               getMembers(obj,this),
					                               getTags(obj));
					this.assign(relation);
					break;
			}
		}
		this.updatePOIs(nodelist);
		this.refreshMaps();
		if (this.callback) { this.callback(); }

		// Private functions to parse DOM created from XML file

		function getAttribute(obj,name) {
			var result=array.filter(obj.attributes,function(item) {
				return item.nodeName==name;
			});
			return result[0].nodeValue;
		}

		function getTags(obj) {
			var tags={};
			array.forEach(obj.childNodes,function(item) {
				if (item.nodeName=='tag') {
					tags[getAttribute(item,'k')]=getAttribute(item,'v');
				}
			});
			return tags;
		}

		function getNodes(obj,conn) {
			var nodes=[];
			array.forEach(obj.childNodes,function(item) {
				if (item.nodeName=='nd') {
					var id=getAttribute(item,'ref');
					nodes.push(conn.getNode(id));
				}
			});
			return nodes;
		}

		function getMembers(obj,conn) {
			var members=[];
			array.forEach(obj.childNodes,function(item) {
				if (item.nodeName=='member') {
					var id  =getAttribute(item,'ref');
					var type=getAttribute(item,'type');
					var role=getAttribute(item,'role');

					var obj=conn.getOrCreate(id,type);
					members.push(new iD.RelationMember(obj,role));
				}
			});
			return members;
		}

	},
});




// ----------------------------------------------------------------------
// End of module
});

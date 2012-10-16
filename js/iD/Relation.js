// iD/Relation.js

define(['dojo/_base/declare','dojo/_base/array','dojo/_base/lang',
        'iD/Entity','iD/actions/AddNodeToWayAction','iD/actions/MoveNodeAction'
       ], function(declare,array,lang){

// ----------------------------------------------------------------------
// Relation class

declare("iD.Relation", [iD.Entity], {
	members:null,
	entityType:"relation",

	constructor:function(conn,id,members,tags,loaded) {
		// summary:		An OSM relation.
		this.connection=conn;
		this.id=Number(id);
		this.members=members;
		this.tags=tags;
		this.modified=this.id<0;
		this.loaded=(loaded===undefined) ? true : loaded;
		_.each(members, _.bind(function(member) {
			member.entity.addParent(this);
		}, this));
	}
});

// ----------------------------------------------------------------------
// RelationMember class

declare("iD.RelationMember", [], {
	entity:null,
	role:"",
	constructor:function(entity,role) {
		// summary:		An object containing both the entity that is in the relation, and its role.
		this.entity=entity;
		this.role=role;
	}
});

// ----------------------------------------------------------------------
// End of module
});

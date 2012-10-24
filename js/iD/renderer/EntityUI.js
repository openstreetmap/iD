// iD/renderer/EntityUI.js
// EntityUI classes for iD
// **** TODO:
// multipolygon support - http://mail.dojotoolkit.org/pipermail/dojo-interest/2011-January/052042.html
// support 'interactive'
// line decoration, dots etc.
// fill images
// opacity

// ----------------------------------------------------------------------
// EntityUI base class

iD.renderer.EntityUI = function() {
    this.entity=entity;
    this.map=map;
    this.stateClasses=stateClasses ? stateClasses.slice() : [];
    this.sprites=[];
};
iD.renderer.EntityUI.prototype = {

    entity:null,				// Entity this represents
    map:null,					// the Map object containing this
    layer:0,					// OSM layer
    sprites:null,				// array of sprites created for this EntityUI
    styleList:null,				// current StyleList
    stateClasses:null,			// list of stateClass tags to apply

    getConnection: function() {
        // summary:		Get the Connection from where the map draws its data.
        return this.map.connection;	// iD.Connection
    },
    targetGroup: function(groupType,sublayer) {
        // summary:		Find a gfx.Group to render on.
        return this.map.sublayer(this.layer,groupType,sublayer);	// dojox.gfx.Group
    },
    recordSprite: function(sprite) {
        // summary:		Record that an individual sprite (one stroke, icon or text item) has been added.
        if (!_.include(this.sprites, sprite)) {
            this.sprites.push(sprite);
        }
        return sprite;
    },
    removeSprites: function() {
        // summary:		Clear all sprites currently used.
        for (var i=0; i<this.sprites.length; i++) {
            this.sprites[i].removeShape();
        }
        this.sprites=[];
    },
    refreshStyleList: function(tags) {
        // summary:		Calculate the list of styles that apply to this UI at this zoom level.
        if (!this.styleList || !this.styleList.isValidAt(this.map.zoom)) {
            this.styleList=this.map.ruleset.getStyles(this.entity,tags, this.map.zoom);
        }
        this.layer=this.styleList.layerOverride();
        if (isNaN(this.layer)) {
            this.layer=0;
            if (tags.layer) { this.layer = +tags.layer; }
        }

        // Iterate through each subpart, drawing any styles on that layer
        var drawn=false;
        for (i=0; i<this.styleList.subparts.length; i++) {
            var subpart=this.styleList.subparts[i];
        }
    },
    getEnhancedTags: function() {
        // summary:		Return tags for this entity augmented by the EntityUI's state classes.
        var tags = _.clone(this.entity.tags);
        // Apply stateClasses (hover, selected, hoverway, selectedway)
        for (var i in this.stateClasses) {
            tags[':'+this.stateClasses[i]] = 'yes';
        }
        // todo - Add any common 'special-case' tags, e.g. :hasTags
        return tags;	// Object
    },

    // --------------------
    // State class handling

    setStateClasses:function(stateClasses) {
        // summary:		Set all state classes at once, and prompt a redraw if they're different to previously,
        if (stateClasses && this.stateClasses.join(',')!=stateClasses.join(',')) {
            this.stateClasses=stateClasses.slice();
            this.invalidateStyleList();
        }
        return this;
    },

    setStateClass:function(sc) {
        // summary:		Set a single state class, and prompt a redraw if it wasn't set previously.
        if (this.stateClasses.indexOf(sc)==-1) {
            this.stateClasses.push(sc);
            this.invalidateStyleList();
        }
        return this;
    },

    resetStateClass:function(sc) {
        // summary:		Reset a single state class, and prompt a redraw if it was set previously.
        if (this.stateClasses.indexOf(sc)>-1) {
            this.stateClasses.splice(this.stateClasses.indexOf(sc),1);
            this.invalidateStyleList();
        }
        return this;
    },

    hasStateClass:function(sc) {
        // summary:		Is a particular state class set for this UI?
        return this.stateClasses.indexOf(sc) > -1;
    },

    invalidateStyleList:function() {
        // summary:		Invalidate the StyleList so it's recalculated on next redraw.
        this.styleList = null;
    },

    // --------------------
    // Mouse event handling

    entityMouseEvent:function(event) {
        // summary:		Receive a mouse event (e.g. clicking on the UI), and forward it to the Controller.
        this.map.controller.entityMouseEvent(event, event.gfxTarget.source);
        event.stopPropagation();
    }
};

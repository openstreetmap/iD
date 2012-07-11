// iD/ui/DragAndDrop.js

/*
	Singleton-like class for POI drag and drop.
	Could potentially be a ControllerState.
*/


define(['dojo/_base/declare','dojo/_base/lang','dojo/_base/xhr','dojo/dom','dojo/dom-geometry','dojo/dnd/Target'], function(declare,lang,xhr,dom,domGeom){

// ----------------------------------------------------------------------
// DragAndDrop class

declare("iD.ui.DragAndDrop", null, {

	mapdiv:null,
	map:null,
	divname:"",
	grid:null,
	dragmove:null,
	dragevent:null,

	ICONPATH: 'icons/',
	ITEMSPERROW: 5,

	constructor:function(_divname,_map,_gridname) {
		this.divname=_divname;
		dom.byId(_divname).ondragover = lang.hitch(this,this.update);
		dom.byId(_divname).ondrop = function(e) { e.preventDefault(); };	// required by Firefox
		this.map=_map;
		this.grid=dom.byId(_gridname);

		// Load drag and drop config file
		dojo.xhrGet({
			url: "draganddrop.json",
			handleAs: "json",
			load: lang.hitch(this, function(obj) { this.drawGrid(obj); } ),
			error: function(err) { console.log("couldn't load"); }
		});

	},

	drawGrid:function(obj) {
		var row;
		for (var i=0; i<obj.length; i++) {
			var item=obj[i];
			if (!row || row.cells.length==this.ITEMSPERROW) {
				row=document.createElement('tr');
				this.grid.appendChild(row);
			}
			var cell=document.createElement('td');
			var img=document.createElement('img');
			img.setAttribute('src',this.ICONPATH+item.icon)
			img.setAttribute('alt',item.tags);
			img.setAttribute('draggable',true);
			img.ondragend=lang.hitch(this,this.end);
			img.style.float='left';
			cell.appendChild(img);
			cell.appendChild(document.createTextNode(item.name));
			row.appendChild(cell);
		}
	},

	update:function(event) {
		this.dragevent=event;
		event.preventDefault();
	},

	end:function(event) {
		var lon=this.map.coord2lon(this.map.mouseX(this.dragevent));
		var lat=this.map.coord2lat(this.map.mouseY(this.dragevent));
		var tags=this.parseKeyValues(event.target.getAttribute('alt'));

		var action=new iD.actions.CreatePOIAction(this.map.conn,tags,lat,lon);
		this.map.controller.undoStack.addAction(action);
		var node=action.getNode();
		this.map.createUI(node);
		
		dijit.byId('addPOI').closeDropDown();
		this.map.controller.setState(new iD.controller.edit.SelectedPOINode(node));
	},

	parseKeyValues:function(string) {
		var pairs=string.split(';');
		var tags={};
		for (var i in pairs) {
			var kv=pairs[i].split('=');
			tags[kv[0]]=kv[1];
		}
		return tags;
	},

});

// ----------------------------------------------------------------------
// End of module
});

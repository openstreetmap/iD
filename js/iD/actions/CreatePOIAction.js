// iD/actions/CreatePOIAction.js

define(['dojo/_base/declare', 'iD/actions/UndoableAction'],
       function(declare) {

           // ----------------------------------------------------------------------
           // CreatePOIAction class

           declare("iD.actions.CreatePOIAction", [iD.actions.CompositeUndoableAction], {

               newNode: null,
               tags: null,
               lat: NaN,
               lon: NaN,
               connection: null,

               constructor: function(connection, tags, lat, lon) {
                   // summary:		Create a new node and set it as a POI. Used by drag-and-drop. Note that the
                   //				node is remembered, so that on redo we can just reinstate it.
                   this.setName('Create POI: ' + iD.Util.friendlyName(tags));
                   this.connection = connection;
                   this.tags = tags;
                   this.lat = lat;
                   this.lon = lon;
               },

               run: function() {
                   if (this.newNode === null) {
                       this.newNode = this.connection.doCreateNode(this.tags,
                                                                   this.lat, this.lon,
                                                                   _.bind(this.push, this));
                   }
                   this.connection.registerPOI(this.newNode);
                   return true;
               },

               undo: function() {
                   this.connection.unregisterPOI(this.newNode);
                   return true;
               },

               getNode: function() {
                   return this.newNode;
               }
           });

           // ----------------------------------------------------------------------
           // End of module
       });

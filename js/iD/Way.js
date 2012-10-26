if (typeof iD === 'undefined') iD = {};

// Way
// wiki: http://wiki.openstreetmap.org/wiki/Way
//
// Ways can either be open or closed. A closed way is such that the
// last node is the first node.
//
// If a a way is _closed_, it is assumed to be an area unless it has a
// `highway` or `barrier` tag and is not also tagged `area`.
iD.Way = function(connection, id, nodes, tags, loaded) {
    // summary:		An OSM way.
    this.connection = connection;
    this.entityType = 'way';
    this.id = id;
    this._id = iD.Util.id();
    this.deleted = false;
    this.entity = iD.Entity();
    this.tags = tags || {};
    this.loaded = (loaded === undefined) ? true : loaded;
    this.modified = this.id < 0;
    this.nodes = [];
    this.extent = {};

    if (nodes) {
        for (var i = 0; i < nodes.length; i++) {
            this.addNode(nodes[i]);
        }
    }
};

iD.Way.prototype = {
    addNode: function(node) {
        node.entity.addParent(this);
        this.nodes.push(node);
        return this;
    },

    // JOSM: http://josm.openstreetmap.de/browser/josm/trunk/src/org/openstreetmap/josm/data/osm/Way.java#L466
    isClosed: function() {
        // summary:	Is this a closed way (first and last nodes the same)?
        if (!this.nodes.length) return true;
        return this.nodes[this.nodes.length - 1] === this.nodes[0];
    },

    isType: function(type) {
        // summary:	Is this a 'way' (always true), an 'area' (closed) or a 'line' (unclosed)?
        if (type === 'way') return true;
        if (type === 'area') return this.isClosed();
        if (type === 'line') return !(this.isClosed());
        return false;	// Boolean
    },

    toGeoJSON: function() {
        return {
            type: 'Feature',
            properties: this.tags,
            geometry: {
                'type': 'LineString',
                'coordinates': _.map(this.nodes, function(node) {
                    return [node.lon, node.lat];
                })
            }
        };
    },

    bounds: function() {
        // TODO: cache
        return d3.geo.bounds(this.toGeoJSON());
    },

    // ---------------------
    // Bounding-box handling
    intersects: function(extent) {
        // No-node ways are inside of nothing.
        if (!this.nodes.length) return false;
        var bounds = this.bounds();
        // left
        return !(
            // the bottom right is to the top-left
            // of the top-left
            bounds[1][0] < extent[0][0] &&
            bounds[1][1] < extent[0][1] ||
            // The top left is to the bottom-right
            // of the top-left
            bounds[0][0] > extent[1][0] &&
            bounds[0][1] > extent[1][1]);
    },

    // --------------
    // Action callers

    doAppendNode: function(node, performAction) {
        // summary:		Add a node to the end of the way, using an undo stack.
        // returns:		New length of the way.
        if (node!=this.getLastNode()) performAction(new iD.actions.AddNodeToWayAction(this, node, this.nodes, -1, true));
        return this.nodes.length + 1;	// int
    },

    doPrependNode: function(node, performAction) {
        // summary:		Add a node to the start of the way, using an undo stack.
        // returns:		New length of the way.
        if (node!=this.nodes[0]) performAction(new iD.actions.AddNodeToWayAction(this, node, this.nodes, 0, true));
        return this.nodes.length + 1;	// int
    },

    doInsertNode:function(index, node, performAction) {
        // summary:		Add a node at a given index within the way, using an undo stack.
        if (index > 0 && this.nodes[index - 1]==node) return;
        if (index < this.nodes.length - 1 && this.nodes[index]==node) return;
        performAction(new iD.actions.AddNodeToWayAction(this, node, this.nodes, index, false));
    },

    doInsertNodeAtClosestPosition:function(newNode, isSnap, performAction) {
        // summary:			Add a node into whichever segment of the way is nearest, using an undo stack.
        // isSnap: Boolean	Should the node position be snapped to be exactly on the segment?
        // returns:			The index at which the node was inserted.
        var closestProportion = 1,
            newIndex = 0,
            snapped;

        for (var i = 0; i < this.nodes.length - 1; i++) {
            var node1 = this.nodes[i],
                node2 = this.nodes[i + 1],
                directDist = this._pythagoras(node1, node2),
                viaNewDist = this._pythagoras(node1, newNode) +
                    this._pythagoras(node2, newNode),
                proportion = Math.abs(viaNewDist/directDist - 1);
            if (proportion < closestProportion) {
                newIndex = i+1;
                closestProportion = proportion;
                snapped = this._calculateSnappedPoint(node1, node2, newNode);
            }
        }

        // splice in new node
        if (isSnap) { newNode.doSetLonLatp(snapped.x, snapped.y, performAction); }
        this.doInsertNode(newIndex, newNode, performAction);
        return newIndex;	// int
    },

    _pythagoras:function(node1, node2) {
        return (Math.sqrt(Math.pow(node1.lon-node2.lon,2) +
            Math.pow(node1.latp-node2.latp,2)));
    },

    _calculateSnappedPoint:function(node1, node2, newNode) {
        var w = node2.lon  - node1.lon;
        var h = node2.latp - node1.latp;
        var u = ((newNode.lon-node1.lon) * w + (newNode.latp-node1.latp) * h) / (w*w + h*h);
        return { x: node1.lon + u*w, y: node1.latp + u*h };
    }
};

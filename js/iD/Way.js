if (typeof iD === 'undefined') iD = {};

iD.Way = function(conn, id, nodes, tags, loaded) {
    // summary:		An OSM way.
    this.connection = conn;
    this.entityType = 'way';
    this.id = id;
    this._id = iD.Util.id();
    this.deleted = false;
    this.entity = new iD.Entity();
    this.tags = tags || {};
    this.loaded = (loaded === undefined) ? true : loaded;
    this.modified = this.id < 0;
    this.nodes = nodes || [];
    this.extent = {};
    _.each(nodes, _.bind(function(node) {
        node.entity.addParent(this);
    }, this));
    this._calculateBbox();
};

iD.Way.prototype = {
    isClosed: function() {
        // summary:	Is this a closed way (first and last nodes the same)?
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

    // ---------------------
    // Bounding-box handling
    within:function(left,right,top,bottom) {
        // TODO invert and just return
        if (!this.extent.west ||
            (this.extent.west < left   && this.extent.east < left  ) ||
            (this.extent.west > right  && this.extent.east > right ) ||
            (this.extent.south < bottom && this.extent.north < bottom) ||
            (this.extent.south > top    && this.extent.south > top)) {
            return false;
        } else {
            return true;
        }
    },

    _calculateBbox:function() {
        this.extent = {
            west: Infinity,
            east: -Infinity,
            south: Infinity,
            north: -Infinity
        };
        _.each(this.nodes, _.bind(function(n) { this.expandBbox(n); }, this));
    },

    expandBbox:function(node) {
        // summary:	Enlarge the way's bounding box to make sure it
        // includes the co-ordinates of a supplied node.
        this.extent.west = Math.min(this.extent.west, node.lon);
        this.extent.east = Math.max(this.extent.east, node.lon);
        this.extent.south = Math.min(this.extent.south, node.lat);
        this.extent.north = Math.max(this.extent.north, node.lat);
    },

    // --------------
    // Action callers

    doAppendNode:function(node, performAction) {
        // summary:		Add a node to the end of the way, using an undo stack.
        // returns:		New length of the way.
        if (node!=this.getLastNode()) performAction(new iD.actions.AddNodeToWayAction(this, node, this.nodes, -1, true));
        return this.nodes.length + 1;	// int
    },

    doPrependNode:function(node, performAction) {
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

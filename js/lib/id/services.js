(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.iD = global.iD || {}, global.iD.services = global.iD.services || {})));
}(this, function (exports) { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var rbush = createCommonjsModule(function (module) {
	/*
	 (c) 2015, Vladimir Agafonkin
	 RBush, a JavaScript library for high-performance 2D spatial indexing of points and rectangles.
	 https://github.com/mourner/rbush
	*/

	(function () {
	'use strict';

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

	        if (!intersects(bbox, node.bbox)) return result;

	        var nodesToSearch = [],
	            i, len, child, childBBox;

	        while (node) {
	            for (i = 0, len = node.children.length; i < len; i++) {

	                child = node.children[i];
	                childBBox = node.leaf ? toBBox(child) : child.bbox;

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

	        if (!intersects(bbox, node.bbox)) return false;

	        var nodesToSearch = [],
	            i, len, child, childBBox;

	        while (node) {
	            for (i = 0, len = node.children.length; i < len; i++) {

	                child = node.children[i];
	                childBBox = node.leaf ? toBBox(child) : child.bbox;

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
	        this.data = {
	            children: [],
	            height: 1,
	            bbox: empty(),
	            leaf: true
	        };
	        return this;
	    },

	    remove: function (item) {
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
	                index = node.children.indexOf(item);

	                if (index !== -1) {
	                    // item found, remove the item and condense tree upwards
	                    node.children.splice(index, 1);
	                    path.push(node);
	                    this._condense(path);
	                    return this;
	                }
	            }

	            if (!goingUp && !node.leaf && contains(node.bbox, bbox)) { // go down
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

	    compareMinX: function (a, b) { return a[0] - b[0]; },
	    compareMinY: function (a, b) { return a[1] - b[1]; },

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
	            node = {
	                children: items.slice(left, right + 1),
	                height: 1,
	                bbox: null,
	                leaf: true
	            };
	            calcBBox(node, this.toBBox);
	            return node;
	        }

	        if (!height) {
	            // target height of the bulk-loaded tree
	            height = Math.ceil(Math.log(N) / Math.log(M));

	            // target number of root entries to maximize storage utilization
	            M = Math.ceil(N / Math.pow(M, height - 1));
	        }

	        node = {
	            children: [],
	            height: height,
	            bbox: null,
	            leaf: false
	        };

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
	                area = bboxArea(child.bbox);
	                enlargement = enlargedArea(bbox, child.bbox) - area;

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
	            bbox = isNode ? item.bbox : toBBox(item),
	            insertPath = [];

	        // find the best node for accommodating the item, saving all nodes along the path too
	        var node = this._chooseSubtree(bbox, this.data, level, insertPath);

	        // put the item into the node
	        node.children.push(item);
	        extend(node.bbox, bbox);

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

	        var newNode = {
	            children: node.children.splice(splitIndex, node.children.length - splitIndex),
	            height: node.height,
	            bbox: null,
	            leaf: false
	        };

	        if (node.leaf) newNode.leaf = true;

	        calcBBox(node, this.toBBox);
	        calcBBox(newNode, this.toBBox);

	        if (level) insertPath[level - 1].children.push(newNode);
	        else this._splitRoot(node, newNode);
	    },

	    _splitRoot: function (node, newNode) {
	        // split root node
	        this.data = {
	            children: [node, newNode],
	            height: node.height + 1,
	            bbox: null,
	            leaf: false
	        };
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
	            extend(leftBBox, node.leaf ? toBBox(child) : child.bbox);
	            margin += bboxMargin(leftBBox);
	        }

	        for (i = M - m - 1; i >= m; i--) {
	            child = node.children[i];
	            extend(rightBBox, node.leaf ? toBBox(child) : child.bbox);
	            margin += bboxMargin(rightBBox);
	        }

	        return margin;
	    },

	    _adjustParentBBoxes: function (bbox, path, level) {
	        // adjust bboxes along the given tree path
	        for (var i = level; i >= 0; i--) {
	            extend(path[i].bbox, bbox);
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

	        this.toBBox = new Function('a', 'return [a' + format.join(', a') + '];');
	    }
	};


	// calculate node's bbox from bboxes of its children
	function calcBBox(node, toBBox) {
	    node.bbox = distBBox(node, 0, node.children.length, toBBox);
	}

	// min bounding rectangle of node children from k to p-1
	function distBBox(node, k, p, toBBox) {
	    var bbox = empty();

	    for (var i = k, child; i < p; i++) {
	        child = node.children[i];
	        extend(bbox, node.leaf ? toBBox(child) : child.bbox);
	    }

	    return bbox;
	}

	function empty() { return [Infinity, Infinity, -Infinity, -Infinity]; }

	function extend(a, b) {
	    a[0] = Math.min(a[0], b[0]);
	    a[1] = Math.min(a[1], b[1]);
	    a[2] = Math.max(a[2], b[2]);
	    a[3] = Math.max(a[3], b[3]);
	    return a;
	}

	function compareNodeMinX(a, b) { return a.bbox[0] - b.bbox[0]; }
	function compareNodeMinY(a, b) { return a.bbox[1] - b.bbox[1]; }

	function bboxArea(a)   { return (a[2] - a[0]) * (a[3] - a[1]); }
	function bboxMargin(a) { return (a[2] - a[0]) + (a[3] - a[1]); }

	function enlargedArea(a, b) {
	    return (Math.max(b[2], a[2]) - Math.min(b[0], a[0])) *
	           (Math.max(b[3], a[3]) - Math.min(b[1], a[1]));
	}

	function intersectionArea(a, b) {
	    var minX = Math.max(a[0], b[0]),
	        minY = Math.max(a[1], b[1]),
	        maxX = Math.min(a[2], b[2]),
	        maxY = Math.min(a[3], b[3]);

	    return Math.max(0, maxX - minX) *
	           Math.max(0, maxY - minY);
	}

	function contains(a, b) {
	    return a[0] <= b[0] &&
	           a[1] <= b[1] &&
	           b[2] <= a[2] &&
	           b[3] <= a[3];
	}

	function intersects(a, b) {
	    return b[0] <= a[2] &&
	           b[1] <= a[3] &&
	           b[2] >= a[0] &&
	           b[3] >= a[1];
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
	        select(arr, left, right, mid, compare);

	        stack.push(left, mid, mid, right);
	    }
	}

	// Floyd-Rivest selection algorithm:
	// sort an array between left and right (inclusive) so that the smallest k elements come first (unordered)
	function select(arr, left, right, k, compare) {
	    var n, i, z, s, sd, newLeft, newRight, t, j;

	    while (right > left) {
	        if (right - left > 600) {
	            n = right - left + 1;
	            i = k - left + 1;
	            z = Math.log(n);
	            s = 0.5 * Math.exp(2 * z / 3);
	            sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (i - n / 2 < 0 ? -1 : 1);
	            newLeft = Math.max(left, Math.floor(k - i * s / n + sd));
	            newRight = Math.min(right, Math.floor(k + (n - i) * s / n + sd));
	            select(arr, newLeft, newRight, k, compare);
	        }

	        t = arr[k];
	        i = left;
	        j = right;

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


	// export as AMD/CommonJS module or global variable
	if (typeof define === 'function' && define.amd) define('rbush', function () { return rbush; });
	else if (typeof module !== 'undefined') module.exports = rbush;
	else if (typeof self !== 'undefined') self.rbush = rbush;
	else window.rbush = rbush;

	})();
	});

	var rbush$1 = (rbush && typeof rbush === 'object' && 'default' in rbush ? rbush['default'] : rbush);

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
	        if (iD.services.mapillary.sign_defs) return;
	        iD.services.mapillary.sign_defs = {};

	        _.each(['au', 'br', 'ca', 'de', 'us'], function(region) {
	            d3.json(context.asset('traffico/string-maps/' + region + '-map.json'), function(err, data) {
	                if (err) return;
	                if (region === 'de') region = 'eu';
	                iD.services.mapillary.sign_defs[region] = data;
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
	            .call(iD.svg.Icon('#icon-close'));

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
	            var clicks = iD.services.mapillary.clicks;
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
	            iD.services.mapillary.viewer = viewer;
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
	                    extent: iD.geo.Extent(
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
	        var cache = iD.services.mapillary.cache[which],
	            id = tile.id + ',' + String(page),
	            rect = tile.extent.rectangle();

	        if (cache.loaded[id] || cache.inflight[id]) return;

	        cache.inflight[id] = d3.json(url +
	            iD.util.qsString({
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

	                    features.push([loc[0], loc[1], loc[0], loc[1], d]);
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
	                    iD.geo.Extent(projection.invert(min), projection.invert(max)));
	            });
	        });

	        return partitions;
	    }

	    // no more than `limit` results per partition.
	    function searchLimited(psize, limit, projection, dimensions, rtree) {
	        limit = limit || 3;

	        var partitions = partitionViewport(psize, projection, dimensions);
	        return _.flatten(_.compact(_.map(partitions, function(extent) {
	            return rtree.search(extent.rectangle())
	                .slice(0, limit)
	                .map(function(d) { return d[4]; });
	        })));
	    }

	    mapillary.images = function(projection, dimensions) {
	        var psize = 16, limit = 3;
	        return searchLimited(psize, limit, projection, dimensions, iD.services.mapillary.cache.images.rtree);
	    };

	    mapillary.signs = function(projection, dimensions) {
	        var psize = 32, limit = 3;
	        return searchLimited(psize, limit, projection, dimensions, iD.services.mapillary.cache.signs.rtree);
	    };

	    mapillary.signsSupported = function() {
	        var detected = iD.detect();
	        return (!(detected.ie || detected.browser.toLowerCase() === 'safari'));
	    };

	    mapillary.signHTML = function(d) {
	        if (!iD.services.mapillary.sign_defs) return;

	        var detectionPackage = d.signs[0].package,
	            type = d.signs[0].type,
	            country = detectionPackage.split('_')[1];

	        return iD.services.mapillary.sign_defs[country][type];
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

	        iD.services.mapillary.image = null;

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
	        if (!iD.services.mapillary) return;
	        if (!imageKey) return;

	        if (!iD.services.mapillary.viewer) {
	            initViewer(imageKey, context);
	        } else {
	            iD.services.mapillary.viewer.moveToKey(imageKey);
	        }

	        return mapillary;
	    };

	    mapillary.getSelectedImage = function() {
	        if (!iD.services.mapillary) return null;
	        return iD.services.mapillary.image;
	    };

	    mapillary.setSelectedImage = function(imageKey, fromClick) {
	        if (!iD.services.mapillary) return null;

	        iD.services.mapillary.image = imageKey;
	        if (fromClick) {
	            iD.services.mapillary.clicks.push(imageKey);
	        }

	        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
	            .classed('selected', function(d) { return d.key === imageKey; });

	        return mapillary;
	    };

	    mapillary.reset = function() {
	        var cache = iD.services.mapillary.cache;

	        if (cache) {
	            _.forEach(cache.images.inflight, abortRequest);
	            _.forEach(cache.signs.inflight, abortRequest);
	        }

	        iD.services.mapillary.cache = {
	            images: { inflight: {}, loaded: {}, rtree: rbush$1() },
	            signs:  { inflight: {}, loaded: {}, rtree: rbush$1() }
	        };

	        iD.services.mapillary.image = null;
	        iD.services.mapillary.clicks = [];

	        return mapillary;
	    };


	    if (!iD.services.mapillary.cache) {
	        mapillary.reset();
	    }

	    return d3.rebind(mapillary, dispatch, 'on');
	}

	function nominatim() {
	    var nominatim = {},
	        endpoint = 'https://nominatim.openstreetmap.org/reverse?';


	    nominatim.countryCode = function(location, callback) {
	        var cache = iD.services.nominatim.cache,
	            countryCodes = cache.search([location[0], location[1], location[0], location[1]]);

	        if (countryCodes.length > 0)
	            return callback(null, countryCodes[0][4]);

	        d3.json(endpoint +
	            iD.util.qsString({
	                format: 'json',
	                addressdetails: 1,
	                lat: location[1],
	                lon: location[0]
	            }), function(err, result) {
	                if (err)
	                    return callback(err);
	                else if (result && result.error)
	                    return callback(result.error);

	                var extent = iD.geo.Extent(location).padByMeters(1000);

	                cache.insert(extent.rectangle().concat(result.address.country_code));

	                callback(null, result.address.country_code);
	            });
	    };

	    nominatim.reset = function() {
	        iD.services.nominatim.cache = rbush$1();
	        return this;
	    };

	    if (!iD.services.nominatim.cache) {
	        nominatim.reset();
	    }

	    return nominatim;
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
	            iD.util.qsString(_.extend({
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
	            iD.util.qsString(_.extend({
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
	            iD.util.qsString(_.extend({
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

	        request(endpoint + path + iD.util.qsString(parameters), debounce, function(err, d) {
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
	        d3.jsonp(endpoint + iD.util.qsString({
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

	function wikipedia() {
	    var wikipedia = {},
	        endpoint = 'https://en.wikipedia.org/w/api.php?';


	    wikipedia.search = function(lang, query, callback) {
	        lang = lang || 'en';
	        d3.jsonp(endpoint.replace('en', lang) +
	            iD.util.qsString({
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
	            iD.util.qsString({
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
	            iD.util.qsString({
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

	exports.mapillary = mapillary;
	exports.nominatim = nominatim;
	exports.taginfo = taginfo;
	exports.wikidata = wikidata;
	exports.wikipedia = wikipedia;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
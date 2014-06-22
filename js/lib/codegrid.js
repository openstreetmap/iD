// Country Code Grid
// Query country code information from geographical coordinates
//

// Boilerplate from https://github.com/umdjs/umd/blob/master/returnExports.js
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // Assume browser only
        define([], factory(window, null));
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        // Requires fs under node for local file access
        module.exports = factory(null,require('fs'));
    } else {
        // Browser globals (root is window)
        root.codegrid = factory(root,null);
    }
}(this, function (root,fs) {
// ----------------


// Configuration. Should match generator settings
var gridPath = '../tiles/',
    worldFile = 'worldgrid.json',
    cellzoom = 5,
    zList = [9, 13];

// Cache of json file across zoom levels
var jsonCache = {};

// Global attribute list for compressed grids
var worldAttr;

// Internal classes
var Grid, Zoomgrids;

// Return module
var g={};

// Class for a single utf-grid
Grid = function (tx, ty, zoom, json){
    var grid = {},
        size = 0,
        data, keys, attrs, elezoom, elex, eley;

    // set public members
    grid.x = tx;
    grid.y = ty;
    grid.zoom = zoom;

    // initialise
    if (!(json.hasOwnProperty('grid') && json.hasOwnProperty('keys'))) {
        console.warn('Error in creating grid - no grid/keys attribute');
        return null;
    }
    data = json.grid;
    keys = json.keys;
    if (json.hasOwnProperty('data')) {
        attrs = json.data;
    }
    size = json.grid.length;
    elezoom = Math.round ( Math.log(size) / Math.log(2)) + zoom;
    elex = tx * Math.pow (2, (elezoom - zoom));
    eley = ty * Math.pow (2, (elezoom - zoom));

    function utfDecode (c) {
        if (c >= 93) c--;
        if (c >= 35) c--;
        return c - 32;
    }

    function isInt (n) {
        return n % 1 === 0;
    }

    function getAttr(x, y) {
        // resolve redirects and decompress
        var dataY = data[y];
        var dataYLen = dataY.length;
        if ((dataYLen > 1) && (dataYLen < 4)) {
            var redir = parseInt(dataY);
            if (redir.isNaN || redir < 0 || redir >= size) {
                console.warn('Error in decoding compressed grid');
                return null;
            }
            dataY = data[redir];
            dataYLen = dataY.length;
        }
        var codeX = 0;
        if (dataYLen === size) {
            codeX = dataY.charCodeAt(x);
        } else if (dataYLen === 1) {
            codeX = dataY.charCodeAt(0);
        } else {
            for (var pos = 0, x0 = x; pos < dataYLen-1; pos +=2) {
                x0 -= utfDecode(dataY.charCodeAt(pos+1));
                if (x0 < 0) {
                    codeX = dataY.charCodeAt(pos);
                    break;
                }
            }
        }
        // decode
        var idx = utfDecode (codeX);
        if (!idx.isNaN) {
            if (keys.length > idx) {
                var key = keys[idx];
                if (key === '') return {};
                if (typeof attrs === 'undefined') {
                    if (worldAttr.hasOwnProperty(key)) {
                        return worldAttr[key];
                    }
                } else if (attrs.hasOwnProperty(key)) {
                    return attrs[key];
                }
            }
        }
        console.warn('Error in decoding grid data.');
        return null;
    }

    grid.getCode = function (lat, lng, callback) {
        var x = long2tile (lng, elezoom) - elex;
        var y = lat2tile (lat, elezoom) - eley;

        // check error in parameters
        if ((!isInt(x)) || (!isInt(y)) || (x<0) || (y<0) ||
            (x>=size) || (y>=size)) {
            console.warn('Error in arguments to retrieve grid');
            callback ('Error in input coordinates: out of range');
            return;
        }
        var attr = getAttr (x, y);
        if (attr !== null) {
            var code = 'None';
            if (attr.hasOwnProperty('code')) {
                code = attr.code;
                if (attr.hasOwnProperty('subcode')) {
                    code = code + ':' + attr.subcode;
                }
            }
            callback (null, code);
            return;
        }
        callback ('Error reading geocode data');
        return;
    };
    return grid;
};

// Manage grids of one zoom level
Zoomgrids = function (zlist) {
    var zoomgrids = {},
        zGrids = [],
        zoom = zlist[0],
        nextZoomgrids;

    if (zlist.length > 1) {
        nextZoomgrids = Zoomgrids (zlist.slice(1));
    }

    function getGrid (x, y, callback) {
        // check if already loaded
        for (var i=0; i<zGrids.length; i++) {
            if ((zGrids[i].x === x) && (zGrids[i].y === y)) {
                callback(null, zGrids[i]);
                return;
            }
        }
        // append zoom, x, y into zGrids and return
        retrieveGrid (x, y, function (error, rGrid) {
            if (!error) {
                zGrids.push (rGrid);
                callback (null, rGrid);
                return;
            }
            callback (error);
        });
        return;
    }

    function retrieveGrid (x, y, callback) {
        // Get json tile path
        var cellx = Math.floor (x / Math.pow (2, zoom - cellzoom));
        var celly = Math.floor (y / Math.pow (2, zoom - cellzoom));

        if ((typeof jsonCache[cellx] !== 'undefined') &&
            (typeof jsonCache[cellx][celly] !== 'undefined') &&
            (typeof jsonCache[cellx][celly][zoom] !== 'undefined'))
        {
            // Cache hit
            handleJson (x, y, jsonCache[cellx][celly][zoom], callback);
            return;
        }

        //Cache miss

        var tilePath = gridPath + cellx.toString() + '/' + celly.toString() + '.json';
        loadjson (tilePath, function (error, json) {
            if (error) {
                callback ('Grid data loading error.');
                return console.warn('Error loading grid tile data: ' + error);
            }
            if (typeof json[zoom] !== 'undefined') {
                handleJson (x, y, json[zoom], callback);
                if (typeof jsonCache[cellx] === 'undefined') {
                    jsonCache[cellx] = {};
                }
                jsonCache[cellx][celly] = json;
            } else {
                callback ('Zoom level ' + zoom.toString() + ' not in loaded data.');
                return console.warn ('Zoom level ' + zoom.toString() + ' not in loaded data.');
            }
        });
        return null;
    }

    function handleJson (x, y, json, callback) {
        if ((typeof json[x] !== 'undefined') &&
            (typeof json[x][y] !== 'undefined'))
        {
            var rGrid = Grid(x, y, zoom, json[x][y]);
            callback (null, rGrid);
        } else {
            callback ('Grid tile not found in loaded data.');
            return console.warn('Grid tile ' + zoom.toString() + '/' +
                   x.toString() + '/' + y.toString() +
                   ' not found in loaded data.');
        }
        return null;
    }

    zoomgrids.getCode = function (lat, lng, callback) {

        var x = long2tile (lng, zoom),
            y = lat2tile (lat, zoom);

        getGrid (x,y, function (error, rGrid) {
            if (!error) {
                rGrid.getCode (lat, lng, function (error, result) {
                    if (!error) {
                        if (result === '*') {
                            // Search in nextzoomGrids
                            nextZoomgrids.getCode (lat, lng, callback);
                        } else {
                            callback (error, result);
                        }
                    } else {
                        callback (error, result);
                    }
                    return;
                });
            } else {
                callback ('Error getting grid data: ' + error);
            }
            return;
        });
        return;
    };
    return zoomgrids;
};

// Public function for retrieving country codes
// First parameter (optional): URL path to the tiles directory
// Second parameter (optional): worldGrid object (parsed JSON)
g.CodeGrid = function (path, wgrid) {
    var codegrid = {},
        zoomGrids,
        worldGrid,
        initialized = false,
        initializing = true,
        pendingcb = [];

    if (path) {
        gridPath = path;
    } else if ((typeof __dirname !== 'undefined') && fs.readFile) {
        // points to directory in node module
        gridPath = __dirname + '/' + gridPath;
    }

    if ((!root) && (!fs.readFile) && window) {
        // probably been browserified
        root=window;
    }

    if (wgrid) {
        loadWorldJSON (wgrid);
    } else {
        initWorldGrid ();
    }

    zoomGrids = Zoomgrids(zList);

    function initWorldGrid() {
        var worldPath = gridPath + worldFile;
        loadjson (worldPath, function (error, json) {
            if (error)
                return console.warn('Error loading geocoding data: ' + error);
            loadWorldJSON (json);
            // Clear pending calls to getCode
            var param;
            while (param = pendingcb.shift()) {
                codegrid.getCode (param[0], param[1], param[2]);
            }
            return null;
        });
    }

    function loadWorldJSON (json) {
        worldAttr = json.data;
        worldGrid = Grid(0,0,0,json);
        if (worldGrid !== null) initialized = true;
        initializing = false;
    }

    codegrid.getCode = function (lat, lng, callback) {
        if (!initialized) {
            if (initializing) {
                // Callback after initialization
                pendingcb.push ([lat, lng, callback]);
                return;
            }
            console.warn('Error : grid not initialized.');
            callback ('Error: grid not initialized.');
            return;
        }
        worldGrid.getCode (lat, lng, function (error, result) {
            if (!error) {
                if (result === '*') {
                    // Search in zoomGrids
                    zoomGrids.getCode (lat, lng, callback);
                } else {
                    callback (error, result);
                }
            } else {
                callback (error, result);
            }
            return;
        });
        return;
    };
    return codegrid;
};

// Utility functions
// http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
function long2tile (lon,zoom) {
    // http://javascript.about.com/od/problemsolving/a/modulobug.htm
    return (Math.floor((((((lon+180)/360)%1)+1)%1)*Math.pow(2,zoom)));
}

var latlimit =  Math.atan((Math.exp(Math.PI) - Math.exp(-Math.PI))/2) / Math.PI * 180;

function lat2tile (lat,zoom) {
    if (Math.abs(lat)>= latlimit) return -1;
    return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) +
            1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}

function loadjson (path, callback) {

    if (root) {
    // browser
    // Assume (a) not <= IE6 (b) native JSON in Javascript
    if (root.XMLHttpRequest && typeof JSON !== 'undefined') {
        var xhr = new XMLHttpRequest();

        if (xhr) {
            xhr.open ('GET', path, true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('Content-type', 'application/json');

            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4 && xhr.status === 200) {
                    var result = JSON.parse(xhr.responseText);
                    callback (null, result);
                } else if (xhr.readyState === 4) {
                    callback ('HTTP request returned ' + xhr.status.toString());
                }
            };
            xhr.send();
        }
    } else {
        callback ('JSON request not supported.');
    }
    }
    // nodejs
    else if (fs) {
        fs.readFile(path, function (e, data) {
            if (!e) {
                var result = JSON.parse(data);
                callback (null, result);
            } else {
                if (e.code === 'ENOENT') {
                    console.warn ('File ' + path + ' not found.');
                    callback ('File ' + path + ' not found.');
                } else {
                    console.warn (e.message);
                    callback (e.message);
                }
            }
        });
    }

}

// ----------------

return g;
}));


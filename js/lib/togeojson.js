toGeoJSON = (function() {
    var removeSpace = (/\s*/g), trimSpace = (/^\s*|\s*$/g), splitSpace = (/\s+/);
    function okhash(x) {
        if (!x || !x.length) return 0;
        for (var i = 0, h = 0; i < x.length; i++) {
            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
        } return h;
    }
    function get(x, y) { return x.getElementsByTagName(y); }
    function attr(x, y) { return x.getAttribute(y); }
    function attrf(x, y) { return parseFloat(attr(x, y)); }
    function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
    function numarray(x) {
        for (var j = 0, o = []; j < x.length; j++) o[j] = parseFloat(x[j]);
        return o;
    }
    function nodeVal(x) { return x && x.firstChild && x.firstChild.nodeValue; }
    function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
    function coord(v) {
        var coords = v.replace(trimSpace, '').split(splitSpace), o = [];
        for (var i = 0; i < coords.length; i++) o.push(coord1(coords[i]));
        return o;
    }
    function fc() { return { type: 'FeatureCollection', features: [] }; }
    t = {
        kml: function(doc, o) {
            o = o || {};
            var gj = fc(), styleIndex = {},
                geotypes = ['Polygon', 'LineString', 'Point'],
                placemarks = get(doc, 'Placemark'), styles = get(doc, 'Style');

            if (o.styles) for (var k = 0; k < styles.length; k++) {
                styleIndex['#' + styles[k].id] = okhash(styles[k].innerHTML).toString(16);
            }
            for (var j = 0; j < placemarks.length; j++) {
                gj.features = gj.features.concat(getPlacemark(placemarks[j]));
            }
            function getGeometry(root) {
                var geomNode, geomNodes, i, j, k, geoms = [];
                if (get1(root, 'MultiGeometry')) return getGeometry(get1(root, 'MultiGeometry'));
                for (i = 0; i < geotypes.length; i++) {
                    geomNodes = get(root, geotypes[i]);
                    if (geomNodes) {
                        for (j = 0; j < geomNodes.length; j++) {
                            geomNode = geomNodes[j];
                            if (geotypes[i] == 'Point') {
                                geoms.push({ type: 'Point',
                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'LineString') {
                                geoms.push({ type: 'LineString',
                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'Polygon') {
                                var rings = get(geomNode, 'LinearRing'), coords = [];
                                for (k = 0; k < rings.length; k++) {
                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                }
                                geoms.push({ type: 'Polygon', coordinates: coords });
                            }
                        }
                    }
                }
                return geoms;
            }
            function getPlacemark(root) {
                var geoms = getGeometry(root), i, properties = {},
                    name = nodeVal(get1(root, 'name')),
                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                    description = nodeVal(get1(root, 'description')),
                    extendedData = get1(root, 'ExtendedData');

                if (!geoms.length) return false;
                if (name) properties.name = name;
                if (styleUrl && styleIndex[styleUrl]) {
                    properties.styleUrl = styleUrl;
                    properties.styleHash = styleIndex[styleUrl];
                }
                if (description) properties.description = description;
                if (extendedData) {
                    var datas = get(extendedData, 'Data'),
                        simpleDatas = get(extendedData, 'SimpleData');

                    for (i = 0; i < datas.length; i++) {
                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                    }
                    for (i = 0; i < simpleDatas.length; i++) {
                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                    }
                }
                return [{ type: 'Feature', geometry: (geoms.length === 1) ? geoms[0] : {
                    type: 'GeometryCollection',
                    geometries: geoms }, properties: properties }];
            }
            return gj;
        },
        gpx: function(doc, o) {
            var i, j, tracks = get(doc, 'trk'), track, pt, gj = fc();
            for (i = 0; i < tracks.length; i++) {
                track = tracks[i];
                var name = nodeVal(get1(track, 'name'));
                var pts = get(track, 'trkpt'), line = [];
                for (j = 0; j < pts.length; j++) {
                    line.push([attrf(pts[j], 'lon'), attrf(pts[j], 'lat')]);
                }
                gj.features.push({
                    type: 'Feature',
                    properties: {
                        name: name || ''
                    },
                    geometry: { type: 'LineString', coordinates: line }
                });
            }
            return gj;
        }
    };
    return t;
})();

if (typeof module !== 'undefined') module.exports = toGeoJSON;

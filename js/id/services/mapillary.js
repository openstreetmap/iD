iD.services.mapillary = function() {
    var mapillary = {},
        dispatch = d3.dispatch('loadedImages', 'loadedSigns'),
        apibase = 'https://a.mapillary.com/v2/',
        urlImage = 'https://www.mapillary.com/map/im/',
        urlThumb = 'https://d1cuyjsrcm0gby.cloudfront.net/',
        clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi',
        maxResults = 1000,
        mly, thumbnail,
        tileZoom = 14;


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
        if (!iD.services.mapillary.sign_defs) {
            iD.services.mapillary.sign_defs = {};
            _.each(['au', 'br', 'ca', 'de', 'us'], function(region) {
                d3.json(context.asset('traffico/string-maps/' + region + '-map.json'), function(err, data) {
                    if (err) return;
                    if (region === 'de') region = 'eu';
                    iD.services.mapillary.sign_defs[region] = data;
                });
            });
        }
    }

    function abortRequest(i) {
        i.abort();
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
        var tiles = getTiles(projection, dimensions);

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

                if (data.features.length === maxResults) {
                    loadTilePage(which, url, tile, ++page);
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

    mapillary.showThumbnail = function(imageKey, position) {
        if (!imageKey) return;

        var positionClass = {
            'ar': (position !== 'left'),
            'al': (position === 'left')
        };

        if(thumbnail === undefined) {

            thumbnail = d3.select('#content').selectAll('.mapillary-image')
                .data([0]);

            // Enter
            var enter = thumbnail.enter().append('div')
                .attr('class', 'mapillary-image ar');

            enter.append('button')
                .on('click', function () {
                    mapillary.hideThumbnail();
                })
                .append('div')
                .call(iD.svg.Icon('#icon-close'));
            enter.append('div')
                .attr('class', 'mly-wrapper')
                .attr('id', 'mly');
        } else {
            d3.select('#content').selectAll('.mapillary-image')
                .transition()
                .duration(200)
                .style('opacity', 100);

        }
        if(mly == undefined) {
            mly = new Mapillary.Viewer('mly', 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi',imageKey, {
                'imagePlane': false,
                'image': true,
                'cover': false,
                'debug': true
            });
        }
        mly.moveToKey(imageKey);
        mly.on('nodechanged', function (node) {
            d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
                .classed('selected', function (d) {
                    return d.key === node.key;
                });
        });

    };

    mapillary.hideThumbnail = function() {
        if (iD.services.mapillary && iD.services.mapillary.thumb != null) {
            console.log(iD.services.mapillary.thumb);
            d3.select('#content').selectAll('.mapillary-image')
                .transition()
                .duration(200)
                .style('opacity', 0);
        }
    };

    mapillary.selectedThumbnail = function(d) {
        if (!iD.services.mapillary) return null;
        if (!arguments.length) return iD.services.mapillary.thumb;
        iD.services.mapillary.thumb = d;
    };

    mapillary.reset = function() {
        var cache = iD.services.mapillary.cache;

        if (cache) {
            _.forEach(cache.images.inflight, abortRequest);
            _.forEach(cache.signs.inflight, abortRequest);
        }

        iD.services.mapillary.cache = {
            images: { inflight: {}, loaded: {}, rtree: rbush() },
            signs:  { inflight: {}, loaded: {}, rtree: rbush() }
        };

        iD.services.mapillary.thumb = null;

        return mapillary;
    };


    if (!iD.services.mapillary.cache) {
        mapillary.reset();
    }

    return d3.rebind(mapillary, dispatch, 'on');
};

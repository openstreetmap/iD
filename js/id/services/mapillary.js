iD.services.mapillary  = function() {
    var mapillary = {},
        dispatch = d3.dispatch('loadedImages', 'loadedSigns'),
        apibase = 'https://a.mapillary.com/v2/',
        urlImage = 'https://www.mapillary.com/map/im/',
        urlThumb = 'https://d1cuyjsrcm0gby.cloudfront.net/',
        clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi',
        tileZoom = 17;


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
        var cache = iD.services.mapillary.cache,
            tiles = getTiles(projection, dimensions);

        _.filter(which.inflight, function(v, k) {
            var wanted = _.find(tiles, function(tile) { return k === tile.id; });
            if (!wanted) delete which.inflight[k];
            return !wanted;
        }).map(abortRequest);

        tiles.forEach(function(tile) {
            var id = tile.id,
                extent = tile.extent;

            if (which.loaded[id] || which.inflight[id]) return;

            which.inflight[id] = d3.json(url +
                iD.util.qsString({
                    geojson: 'true',
                    client_id: clientId,
                    min_lat: extent[0][1],
                    max_lat: extent[1][1],
                    min_lon: extent[0][0],
                    max_lon: extent[1][0]
                }), function(err, data) {
                    which.loaded[id] = true;
                    delete which.inflight[id];
                    if (err) return;

                    if (which === cache.images)
                        dispatch.loadedImages(data);
                    else if (which === cache.signs)
                        dispatch.loadedSigns(data);
                }
            );
        });
    }

    mapillary.loadImages = function(projection, dimensions) {
        var cache = iD.services.mapillary.cache,
            url = apibase + 'search/s/geojson?';
        loadTiles(cache.images, url, projection, dimensions);
    };

    mapillary.loadSigns = function(projection, dimensions) {
        var cache = iD.services.mapillary.cache,
            url = apibase + 'search/im/geojson/or?';
        loadTiles(cache.signs, url, projection, dimensions);
    };

    mapillary.showThumbnail = function(selection, image) {
        if (!(image && image.key)) return;

        var thumbnail = selection.selectAll('.mapillary-image')
            .data([0]);

        /* Enter */

        var enter = thumbnail.enter().append('div')
            .attr('class', 'mapillary-image');

        enter.append('button')
            .on('click', mapillary.hideThumbnail)
            .append('div')
            .call(iD.svg.Icon('#icon-close'));

        enter.append('img');

        var link = enter
            .append('a')
            .attr('class', 'link')
            .attr('target', '_blank')
            .call(iD.svg.Icon('#icon-out-link', 'inline'))
            .append('span')
            .text(t('mapillary.view_on_mapillary'));

        /* Update */

        thumbnail
            .transition()
            .duration(200)
            .style('opacity', 1);

        thumbnail.selectAll('img')
            .attr('src', urlThumb + image.key + '/thumb-320.jpg');

        thumbnail.selectAll('a')
            .attr('href', urlImage + image.key);

    };

    mapillary.hideThumbnail = function(selection) {
        selection.selectAll('.mapillary-image')
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();
    }

    mapillary.reset = function() {
        var cache = iD.services.mapillary.cache;

        if (cache) {
            _.forEach(cache.images.inflight, abortRequest);
            _.forEach(cache.signs.inflight, abortRequest);
        }

        iD.services.mapillary.cache = {
            images: { inflight: {}, loaded: {}, rbush: rbush() },
            signs:  { inflight: {}, loaded: {}, rbush: rbush() }
        };

        return mapillary;
    };


    if (!iD.services.mapillary.cache) {
        mapillary.reset();
    }

    return d3.rebind(mapillary, dispatch, 'on');
};


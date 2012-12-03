var iD = function(container) {
    var connection = iD.Connection()
            .url('http://api06.dev.openstreetmap.org'),
        map = iD.Map()
            .connection(connection),
        controller = iD.Controller(map);

    map.background.source(iD.Background.Bing);

    function editor() {
        if (!iD.supported()) {
            this.html('This editor is supported in Firefox, Chrome, Safari, Opera, ' +
                      'and Internet Explorer 9 and above. Please upgrade your browser ' +
                      'or use Potlatch 2 to edit the map.')
                .style('text-align:center;font-style:italic;');
            return;
        }

        var m = this.append('div')
            .attr('id', 'map')
            .call(map);

        var bar = this.append('div')
            .attr('id', 'bar');

        var buttons = bar.selectAll('button.add-button')
            .data([iD.modes.AddPlace, iD.modes.AddRoad, iD.modes.AddArea])
            .enter().append('button').attr('class', 'add-button')
            .text(function (mode) { return mode.title; })
            .on('click', function (mode) { controller.enter(mode); });

        controller.on('enter', function (entered) {
            buttons.classed('active', function (mode) { return entered === mode; });
        });

        bar.append('button')
            .attr({ id: 'undo', 'class': 'mini' })
            .property('disabled', true)
            .html('&larr;<small></small>')
            .on('click', map.undo);

        bar.append('button')
            .attr({ id: 'redo', 'class': 'mini' })
            .property('disabled', true)
            .html('&rarr;<small></small>')
            .on('click', map.redo);

        bar.append('input')
            .attr({ type: 'text', placeholder: 'find a place', id: 'geocode-location' })
            .on('keydown', function () {
                if (d3.event.keyCode !== 13) return;
                d3.event.preventDefault();
                var val = d3.select('#geocode-location').node().value;
                d3.select(document.body).append('script')
                    .attr('src', 'http://api.tiles.mapbox.com/v3/mapbox/geocode/' +
                        encodeURIComponent(val) + '.jsonp?callback=grid');
            });

        window.grid = function(resp) {
            map.setCenter([resp.results[0][0].lon, resp.results[0][0].lat]);
        };

        bar.append('div')
            .attr('class', 'messages');

        bar.append('div')
            .attr('class', 'user')
            .append('div')
            .attr('class', 'hello');

        bar.append('button')
            .attr('class', 'save')
            .html("Upload<small id='as-username'></small>")
            .on('click', function() {
                function save(e) {
                    d3.select('.shaded').remove();
                    var l = iD.loading('uploading changes to openstreetmap');
                    connection.putChangeset(map.history.changes(), e.comment, function() {
                        l.remove();
                        map.history = iD.History();
                        map.flush().redraw();
                    });
                }
                connection.authenticate(function() {
                    shaded = d3.select(document.body)
                        .append('div').attr('class', 'shaded')
                        .on('click', function() {
                            if (d3.event.target == this) shaded.remove();
                        });
                    var modal = shaded.append('div')
                        .attr('class', 'modal commit-pane')
                        .datum(map.history.changes());
                    modal.call(iD.commit()
                        .on('cancel', function() {
                            shaded.remove();
                        })
                        .on('save', save));
                });
            });

        var zoom = bar.append('div')
            .attr('class', 'zoombuttons')
            .selectAll('button')
                .data([['zoom-in', '+', map.zoomIn], ['zoom-out', '-', map.zoomOut]])
                .enter().append('button').attr('class', function(d) { return d[0]; })
                .text(function(d) { return d[1]; })
                .on('click', function(d) { return d[2](); });

        this.append('div')
            .attr('class', 'inspector-wrap').style('display', 'none');

        this.append('div')
            .attr('id', 'about')
            .html("<p>Work in progress: <a href='http://www.geowiki.com/'>introduction</a>," +
                  "<a href='http://github.com/systemed/iD'>code</a>," +
                  "<a href='http://www.geowiki.com/docs'>docs</a>." +
                  "Imagery <a href='http://opengeodata.org/microsoft-imagery-details'>&copy; 2012</a> Bing, GeoEye, Getmapping, Intermap, Microsoft.</p>");

        map.on('update', function() {
            var undo = map.history.undoAnnotation(),
                redo = map.history.redoAnnotation();

            bar.select('#undo')
                .property('disabled', !undo)
                .select('small')
                .text(undo);

            bar.select('#redo')
                .property('disabled', !redo)
                .select('small')
                .text(redo);
        });

        window.onresize = function() {
            map.size(m.size());
        };

        d3.select(document).on('keydown', function() {
            // cmd-z
            if (d3.event.which === 90 && d3.event.metaKey) {
                map.undo();
            }
            // cmd-shift-z
            if (d3.event.which === 90 && d3.event.metaKey && d3.event.shiftKey) {
                map.redo();
            }
        });

        var hash = iD.Hash().map(map);

        if (!hash.hadHash) {
            map.zoom(20)
                .center([-77.02405, 38.87952]);
        }

        d3.select('.user').call(iD.userpanel(connection)
            .on('logout', connection.logout)
            .on('login', connection.authenticate));
    }

    editor.connection = function(_) {
        if (!arguments.length) return connection;
        connection = _;
        return editor;
    }

    editor.map = function() {
        return map;
    }

    if (arguments.length) {
        d3.select(container).call(editor);
    }

    return editor;
};

iD.supported = function() {
    if (navigator.appName !== 'Microsoft Internet Explorer') {
        return true;
    } else {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");
        if (re.exec(ua) !== null) {
            rv = parseFloat( RegExp.$1 );
        }
        if (rv && rv < 9) return false;
        else return true;
    }
};

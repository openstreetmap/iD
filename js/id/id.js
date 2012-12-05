window.iD = function(container) {
    var connection = iD.Connection()
            .url('http://api06.dev.openstreetmap.org'),
        history = iD.History(),
        map = iD.Map()
            .connection(connection)
            .history(history),
        controller = iD.Controller(map, history);

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

        var buttons_joined = bar.append('div')
            .attr('class', 'buttons-joined');

        var buttons = buttons_joined.selectAll('button.add-button')
            .data([iD.modes.AddPlace(), iD.modes.AddRoad(), iD.modes.AddArea()])
            .enter().append('button')
                .attr('class', 'add-button')
            .text(function (mode) { return mode.title; })
            .on('click', function (mode) { controller.enter(mode); });

        controller.on('enter', function (entered) {
            buttons.classed('active', function (mode) { return entered === mode; });
        });

        var undo_buttons = bar.append('div')
            .attr('class', 'buttons-joined');

        undo_buttons.append('button')
            .attr({ id: 'undo', 'class': 'mini' })
            .property('disabled', true)
            .html('&larr;<small></small>')
            .on('click', history.undo);

        undo_buttons.append('button')
            .attr({ id: 'redo', 'class': 'mini' })
            .property('disabled', true)
            .html('&rarr;<small></small>')
            .on('click', history.redo);

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
            map.center([resp.results[0][0].lon, resp.results[0][0].lat]);
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
                    connection.putChangeset(history.changes(), e.comment, function() {
                        l.remove();
                        history.reset();
                        map.flush().redraw();
                    });
                }
                var changes = history.changes();
                var has_changes = d3.sum(d3.values(changes).map(function(c) {
                    return c.length;
                })) > 0;

                if (has_changes) {
                    connection.authenticate(function(err) {
                        var modal = iD.modal();
                        modal.select('.content')
                            .classed('commit-modal', true)
                            .datum(history.changes())
                            .call(iD.commit()
                                .on('cancel', function() {
                                    modal.remove();
                                })
                                .on('save', save));
                    });
                } else {
                    iD.confirm().select('.description')
                        .text('You don\'t have any changes to save.');
                }
            });

        var zoom = bar.append('div')
            .attr('class', 'zoombuttons')
            .selectAll('button')
                .data([['zoom-in', '+', map.zoomIn], ['zoom-out', '-', map.zoomOut]])
                .enter().append('button').attr('class', function(d) { return d[0]; })
                .text(function(d) { return d[1]; })
                .on('click', function(d) { return d[2](); });

        this.append('div')
            .attr('class', 'inspector-wrap')
            .style('display', 'none');

        this.append('div')
            .attr('id', 'about')
            .html("<a href='http://github.com/systemed/iD'>code</a>, " +
                  "<a href='http://github.com/systemed/iD/issues'>report a bug</a> " +
                  "/ imagery <a href='http://opengeodata.org/microsoft-imagery-details'>&copy; 2012</a> Bing, GeoEye, Getmapping, Intermap, Microsoft.</p>");

        history.on('change.buttons', function() {
            var undo = history.undoAnnotation(),
                redo = history.redoAnnotation();

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

        var keybinding = d3.keybinding()
            .on('a', function(evt, mods) {
                controller.enter(iD.modes.AddArea());
            })
            .on('p', function(evt, mods) {
                controller.enter(iD.modes.AddPlace());
            })
            .on('r', function(evt, mods) {
                controller.enter(iD.modes.AddRoad());
            })
            .on('z', function(evt, mods) {
                if (mods === '⇧⌘') history.redo();
                if (mods === '⌘') history.undo();
            });
        d3.select(document).call(keybinding);
        map.keybinding(keybinding);

        var hash = iD.Hash().map(map);

        if (!hash.hadHash) {
            map.zoom(20)
                .center([-77.02405, 38.87952]);
        }

        d3.select('.user').call(iD.userpanel(connection)
            .on('logout', connection.logout)
            .on('login', connection.authenticate));

        controller.enter(iD.modes.Browse());
    }

    editor.connection = function(_) {
        if (!arguments.length) return connection;
        connection = _;
        return editor;
    };

    editor.map = function() {
        return map;
    };

    editor.controller = function() {
        return controller;
    };

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

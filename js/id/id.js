window.iD = function(container) {
    var connection = iD.Connection(),
        history = iD.History(),
        map = iD.Map()
            .connection(connection)
            .history(history),
        controller = iD.Controller(map, history);

    map.background.source(iD.BackgroundSource.Bing);

    function editor(container) {
        if (!iD.supported()) {
            container.html('This editor is supported in Firefox, Chrome, Safari, Opera, ' +
                      'and Internet Explorer 9 and above. Please upgrade your browser ' +
                      'or use Potlatch 2 to edit the map.')
                .style('text-align:center;font-style:italic;');
            return;
        }

        var m = container.append('div')
            .attr('id', 'map')
            .call(map);

        var bar = container.append('div')
            .attr('id', 'bar').attr('class', 'fillL2');

        var buttons_joined = bar.append('div')
            .attr('class', 'buttons-joined');

        var buttons = buttons_joined.selectAll('button.add-button')
            .data([iD.modes.Browse(), iD.modes.AddPoint(), iD.modes.AddLine(), iD.modes.AddArea()])
            .enter().append('button')
                .attr('class', function (mode) { return mode.title + ' add-button'; })
            .attr('data-original-title', function (mode) { return mode.description; })
            .call(bootstrap.tooltip().placement('bottom'))
            .on('click', function (mode) { controller.enter(mode); });

        function disableTooHigh() {
            if (map.zoom() < 16) {
                buttons.attr('disabled', 'disabled');
                controller.enter(iD.modes.Browse());
            } else {
                buttons.attr('disabled', null);
            }
        }

        var showUsers = _.debounce(function() {
            var users = {},
                entities = map.history().graph().intersects(map.extent());
            for (var i in entities) {
                if (entities[i].user) {
                    users[entities[i].user] = true;
                    if (Object.keys(users).length > 10) break;
                }
            }
            var u = Object.keys(users);
            var l = d3.select('#user-list')
                .selectAll('a.user-link').data(u);
            l.enter().append('a')
                .attr('class', 'user-link')
                .attr('href', function(d) { return connection.userUrl(d); })
                .attr('target', '_blank')
                .text(String);
            l.exit().remove();
        }, 1000);

        map.on('move.disable-buttons', disableTooHigh)
            .on('move.show-users', showUsers);

        buttons.append('span')
            .attr('class', function(d) {
                return d.id + ' icon icon-pre-text';
            });

        buttons.append('span').attr('class', 'label').text(function (mode) { return mode.title; });

        controller.on('enter', function (entered) {
            buttons.classed('active', function (mode) { return entered.button === mode.button; });
            container.classed("mode-" + entered.id, true);
        });

        controller.on('exit', function (exited) {
            container.classed("mode-" + exited.id, false);
        });

        var undo_buttons = bar.append('div')
            .attr('class', 'buttons-joined');

        undo_buttons.append('button')
            .attr({ id: 'undo', 'class': 'narrow' })
            .property('disabled', true)
            .html("<span class='undo icon'></span><small></small>")
            .on('click', history.undo)
            .call(bootstrap.tooltip()
                .placement('bottom'));

        undo_buttons.append('button')
            .attr({ id: 'redo', 'class': 'narrow' })
            .property('disabled', true)
            .html("<span class='redo icon'><small></small>")
            .on('click', history.redo)
            .call(bootstrap.tooltip()
                .placement('bottom'));

        container.append('div')
            .attr('class', 'user-container pad1 fillD about-block')
            .append('div')
                .attr('class', 'hello');

        var save_button = bar.append('button')
            .attr('class', 'save action wide')
            .html("<span class='icon icon-pre-text save'></span><span class='label'>Save</span><small id='as-username'></small>")
            .attr('title', 'Save changes to OpenStreetMap, making them visible to other users')
            .property('disabled', true)
            .call(bootstrap.tooltip()
                .placement('bottom'))
            .on('click', function() {
                function save(e) {
                    d3.select('.shaded').remove();
                    var l = iD.loading('Uploading changes to OpenStreetMap.');
                    connection.putChangeset(history.changes(), e.comment, function(err, changeset_id) {
                        l.remove();
                        history.reset();
                        map.flush().redraw();
                        var modal = iD.modal();
                        modal.select('.content')
                            .classed('success-modal', true)
                            .datum({
                                id: changeset_id,
                                comment: e.comment
                            })
                            .call(iD.success()
                                .on('cancel', function() {
                                    modal.remove();
                                }));
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
                        .append('h3').text('You don\'t have any changes to save.');
                }
            });

        save_button.append('span')
            .attr('class', 'count');

        history.on('change.save-button', function() {
            var changes = history.changes(),
                num_changes = d3.sum(d3.values(changes).map(function(c) {
                    return c.length;
                }));

            save_button.property('disabled', num_changes === 0);

            save_button
                .classed('has-count', num_changes > 0);

            save_button.select('span.count')
                .text(num_changes);
        });

        bar.append('div')
            .attr('class', 'messages');

        var zoom = container.append('div')
            .attr('class', 'zoombuttons map-control')
            .selectAll('button')
                .data([['zoom-in', '+', map.zoomIn], ['zoom-out', '-', map.zoomOut]])
                .enter().append('button').attr('class', function(d) { return d[0] + ' narrow'; })
                .on('click', function(d) { return d[2](); })
                .append('span')
                    .attr('class', function(d) {
                        return d[0] + ' icon';
                    });

        function geolocateSuccess(position) {
            map.center([position.coords.longitude, position.coords.latitude]);
        }
        function geolocateError() { }
        if (navigator.geolocation) {
            container.append('div')
                .attr('class', 'geolocate-control map-control')
                .append('button')
                .attr('class', 'narrow')
                .text('G')
                .on('click', function() {
                    navigator.geolocation.getCurrentPosition(geolocateSuccess, geolocateError);
                });
        }

        var gc = container.append('div').attr('class', 'geocode-control map-control')
            .call(iD.geocoder().map(map));

        container.append('div').attr('class', 'map-control layerswitcher-control')
            .call(iD.layerswitcher(map));

        container.append('div')
            .attr('class', 'inspector-wrap fillL')
            .style('display', 'none');

        var about = container.append('div');

        about.append('ul')
            .attr('id','about')
            .attr('class','pad1 fillD about-block link-list')
            .html("<li><a target='_blank' href='http://github.com/systemed/iD'>view code</a></li> " +
                  "<li><a target='_blank' href='http://github.com/systemed/iD/issues'>report a bug</a></li>" +
                  " <li>imagery <a target='_blank' href='http://opengeodata.org/microsoft-imagery-details'>provided by bing</a></li>");

        var contributors = about.append('div')
            .attr('id', 'user-list')
            .attr('class','about-block fillD pad1');
            contributors.append('span')
                .attr('class', 'icon nearby icon-pre-text');
            contributors.append('pan')
                .text('Viewing contributions by ');

        history.on('change.buttons', function() {
            var undo = history.undoAnnotation(),
                redo = history.redoAnnotation();

            bar.select('#undo')
                .property('disabled', !undo)
                .attr('data-original-title', undo);

            bar.select('#redo')
                .property('disabled', !redo)
                .attr('data-original-title', redo);
        });

        window.onresize = function() {
            map.size(m.size());
        };

        map.keybinding()
            .on('a', function(evt, mods) {
                controller.enter(iD.modes.AddArea());
            })
            .on('⌫.prevent_navigation', function(evt, mods) {
                evt.preventDefault();
            })
            .on('p', function(evt, mods) {
                controller.enter(iD.modes.AddPoint());
            })
            .on('r', function(evt, mods) {
                controller.enter(iD.modes.AddLine());
            })
            .on('z', function(evt, mods) {
                if (mods === '⇧⌘') history.redo();
                if (mods === '⌘') history.undo();
            });

        var hash = iD.Hash().map(map);

        if (!hash.hadHash) {
            map.zoom(20)
                .center([-77.02271,38.90085]);
        }

        d3.select('.user-container').call(iD.userpanel(connection)
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

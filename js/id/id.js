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
            .attr('id', 'bar')
            .attr('class','pad1 fillD');

        var limiter = bar.append('div')
            .attr('class', 'limiter');

        var buttons_joined = limiter.append('div')
            .attr('class', 'button-wrap joined col4');

        var buttons = buttons_joined.selectAll('button.add-button')
            .data([iD.modes.Browse(), iD.modes.AddPoint(), iD.modes.AddLine(), iD.modes.AddArea()])
            .enter().append('button')
                .attr('class', function (mode) { return mode.title + ' add-button col3'; })
            .attr('data-original-title', function (mode) { return mode.description; })
            .call(bootstrap.tooltip().placement('bottom'))
            .on('click', function (mode) { controller.enter(mode); });

        function disableTooHigh() {
            if (map.zoom() < 16) {
                buttons.attr('disabled', 'disabled');
                notice.message('Zoom in to edit the map');
                controller.enter(iD.modes.Browse());
            } else {
                notice.message('');
                buttons.attr('disabled', null);
            }
        }

        var notice = iD.ui.notice(limiter
            .append('div')
            .attr('class', 'notice'));

        map.on('move.disable-buttons', disableTooHigh)
            .on('move.contributors', _.debounce(function() {
                contributors.call(iD.ui.contributors(map));
            }, 1000));

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

        var undo_buttons = limiter.append('div')
            .attr('class', 'button-wrap joined col1'),
            undo_tooltip = bootstrap.tooltip().placement('bottom');

        undo_buttons.append('button')
            .attr({ id: 'undo', 'class': 'col6' })
            .property('disabled', true)
            .html("<span class='undo icon'></span><small></small>")
            .on('click', history.undo)
            .call(undo_tooltip);

        undo_buttons.append('button')
            .attr({ id: 'redo', 'class': 'col6' })
            .property('disabled', true)
            .html("<span class='redo icon'><small></small>")
            .on('click', history.redo)
            .call(undo_tooltip);

        var save_button = limiter.append('div').attr('class','button-wrap col1').append('button')
            .attr('class', 'save action col12')
            .call(iD.ui.save().map(map).controller(controller));

        history.on('change.warn-unload', function() {
            var changes = history.changes(),

                has_changes = !!d3.sum(d3.values(changes).map(function(c) {
                    return c.length;
                }));

            window.onbeforeunload = has_changes ? function() {
                return 'You have unsaved changes.';
            } : null;
        });

        limiter.append('div')
            .attr('class', 'messages');

        var zoom = container.append('div')
            .attr('class', 'zoombuttons map-control')
            .selectAll('button')
                .data([['zoom-in', '+', map.zoomIn, 'Zoom In'], ['zoom-out', '-', map.zoomOut, 'Zoom Out']])
                .enter()
                .append('button')
                .attr('class', function(d) { return d[0]; })
                .attr('title', function(d) { return d[3]; })
                .on('click', function(d) { return d[2](); })
                .append('span')
                    .attr('class', function(d) {
                        return d[0] + ' icon';
                    });

        if (navigator.geolocation) {
            container.append('div')
                .call(iD.ui.geolocate(map));
        }

        var gc = container.append('div').attr('class', 'geocode-control map-control')
            .call(iD.ui.geocoder().map(map));

        container.append('div').attr('class', 'map-control layerswitcher-control')
            .call(iD.ui.layerswitcher(map));

        container.append('div')
            .style('display', 'none')
            .attr('class', 'inspector-wrap fr col5');

        var about = container.append('div')
            .attr('class','col12 about-block fillD pad1')

        about.append('div')
            .attr('class', 'user-container')
            .append('div')
                .attr('class', 'hello');

        var aboutList = about.append('ul')
                .attr('id','about')
                .attr('class','link-list');

            aboutList.html("<li><a target='_blank' href='http://github.com/systemed/iD'>view code</a></li> " +
                  "<li><a target='_blank' href='http://github.com/systemed/iD/issues'>report a bug</a></li>" +
                  " <li id='attribution'>imagery <a target='_blank' href='http://opengeodata.org/microsoft-imagery-details'>provided by bing</a></li>");

        var contributors = aboutList.append('li')
            .attr('id', 'user-list')
        contributors.append('span')
            .attr('class', 'icon nearby icon-pre-text');
        contributors.append('span')
            .text('Viewing contributions by ');
        contributors.append('span')
            .attr('class', 'contributor-list');
        contributors.append('span')
            .attr('class', 'contributor-count');

        history.on('change.buttons', function() {
            var undo = history.undoAnnotation(),
                redo = history.redoAnnotation();

            function refreshTooltip(selection) {
                if (selection.property('tooltipVisible')) {
                    selection.call(undo_tooltip.show);
                }
            }

            limiter.select('#undo')
                .property('disabled', !undo)
                .attr('data-original-title', undo)
                .call(undo ? refreshTooltip : undo_tooltip.hide);

            limiter.select('#redo')
                .property('disabled', !redo)
                .attr('data-original-title', redo)
                .call(redo ? refreshTooltip : undo_tooltip.hide);
        });

        d3.select(window).on('resize.map-size', function() {
            map.size(m.size());
        });

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
            .on('l', function(evt, mods) {
                controller.enter(iD.modes.AddLine());
            })
            .on('z', function(evt, mods) {
                if (mods === '⇧⌘' || mods === '⌃⇧') history.redo();
                if (mods === '⌘' || mods === '⌃') history.undo();
            });

        var hash = iD.Hash().map(map);

        if (!hash.hadHash) {
            map.centerZoom([-77.02271, 38.90085], 20);
        }

        d3.select('.user-container').call(iD.ui.userpanel(connection)
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

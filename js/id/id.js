window.iD = function(container) {
    // the reported, displayed version of iD.
    var version = '0.0.0-alpha1';

    var connection = iD.Connection()
        .version(version),
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
                .attr('tabindex', -1)
                .attr('class', function (mode) { return mode.title + ' add-button col3'; })
            .attr('data-original-title', function (mode) { return mode.description; })
            .call(bootstrap.tooltip().placement('bottom'))
            .on('click.editor', function (mode) { controller.enter(mode); });

        function disableTooHigh() {
            if (map.editable()) {
                notice.message(false);
                buttons.attr('disabled', null);
            } else {
                buttons.attr('disabled', 'disabled');
                notice.message(true);
                controller.enter(iD.modes.Browse());
            }
        }

        var notice = iD.ui.notice(limiter)
            .message(false)
            .on('zoom', function() { map.zoom(16); });

        map.on('move.editor', _.debounce(function() {
            disableTooHigh();
            contributors.call(iD.ui.contributors(map));
        }, 500));

        buttons.append('span')
            .attr('class', function(d) {
                return d.id + ' icon icon-pre-text';
            });

        buttons.append('span').attr('class', 'label').text(function (mode) { return mode.title; });

        controller.on('enter.editor', function (entered) {
            buttons.classed('active', function (mode) { return entered.button === mode.button; });
            container.classed("mode-" + entered.id, true);
        });

        controller.on('exit.editor', function (exited) {
            container.classed("mode-" + exited.id, false);
        });

        var undo_buttons = limiter.append('div')
            .attr('class', 'button-wrap joined col1'),
            undo_tooltip = bootstrap.tooltip().placement('bottom');

        undo_buttons.append('button')
            .attr({ id: 'undo', 'class': 'col6' })
            .property('disabled', true)
            .html("<span class='undo icon'></span><small></small>")
            .on('click.editor', history.undo)
            .call(undo_tooltip);

        undo_buttons.append('button')
            .attr({ id: 'redo', 'class': 'col6' })
            .property('disabled', true)
            .html("<span class='redo icon'><small></small>")
            .on('click.editor', history.redo)
            .call(undo_tooltip);

        var save_button = limiter.append('div').attr('class','button-wrap col1').append('button')
            .attr('class', 'save col12')
            .call(iD.ui.save().map(map).controller(controller));

        var zoom = container.append('div')
            .attr('class', 'zoombuttons map-control')
            .selectAll('button')
                .data([['zoom-in', '+', map.zoomIn, 'Zoom In'], ['zoom-out', '-', map.zoomOut, 'Zoom Out']])
                .enter()
                .append('button')
                .attr('tabindex', -1)
                .attr('class', function(d) { return d[0]; })
                .attr('title', function(d) { return d[3]; })
                .on('click.editor', function(d) { return d[2](); })
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
            .attr('class','col12 about-block fillD pad1');

        about.append('div')
            .attr('class', 'user-container')
            .append('div')
                .attr('class', 'hello');

        var aboutList = about.append('ul')
                .attr('id','about')
                .attr('class','link-list');

        var linkList = aboutList.append('ul')
            .attr('id','about')
            .attr('class','pad1 fillD about-block link-list');
        linkList.append('li').append('a').attr('target', '_blank')
            .attr('href', 'http://github.com/systemed/iD').text(version);
        linkList.append('li').append('a').attr('target', '_blank')
            .attr('href', 'http://github.com/systemed/iD/issues').text('report a bug');

        var imagery = linkList.append('li').attr('id', 'attribution');
        imagery.append('span').text('imagery');
        imagery.append('a').attr('target', '_blank')
            .attr('href', 'http://opengeodata.org/microsoft-imagery-details').text(' provided by bing');

        linkList.append('li').attr('class', 'source-switch').append('a').attr('href', '#')
            .text('dev')
            .on('click.editor', function() {
                d3.event.preventDefault();
                if (d3.select(this).classed('live')) {
                    map.flush().connection()
                        .url('http://api06.dev.openstreetmap.org');
                    d3.select(this).text('dev').classed('live', false);
                } else {
                    map.flush().connection()
                        .url('http://www.openstreetmap.org');
                    d3.select(this).text('live').classed('live', true);
                }
            });

        var contributors = linkList.append('li')
            .attr('id', 'user-list');
        contributors.append('span')
            .attr('class', 'icon nearby icon-pre-text');
        contributors.append('span')
            .text('Viewing contributions by ');
        contributors.append('span')
            .attr('class', 'contributor-list');
        contributors.append('span')
            .attr('class', 'contributor-count');

        history.on('change.editor', function() {
            window.onbeforeunload = history.hasChanges() ? function() {
                return 'You have unsaved changes.';
            } : null;

            var undo = history.undoAnnotation(),
                redo = history.redoAnnotation();

            function refreshTooltip(selection) {
                if (selection.property('disabled')) {
                    selection.call(undo_tooltip.hide);
                } else if (selection.property('tooltipVisible')) {
                    selection.call(undo_tooltip.show);
                }
            }

            limiter.select('#undo')
                .property('disabled', !undo)
                .attr('data-original-title', undo)
                .call(refreshTooltip);

            limiter.select('#redo')
                .property('disabled', !redo)
                .attr('data-original-title', redo)
                .call(refreshTooltip);
        });

        d3.select(window).on('resize.editor', function() {
            map.size(m.size());
        });

        var keybinding = d3.keybinding('main')
            .on('M', function() { if (map.editable()) controller.enter(iD.modes.Browse()); })
            .on('P', function() { if (map.editable()) controller.enter(iD.modes.AddPoint()); })
            .on('L', function() { if (map.editable()) controller.enter(iD.modes.AddLine()); })
            .on('A', function() { if (map.editable()) controller.enter(iD.modes.AddArea()); })
            .on('⌘+Z', function() { history.undo(); })
            .on('⌃+Z', function() { history.undo(); })
            .on('⌘+⇧+Z', function() { history.redo(); })
            .on('⌃+⇧+Z', function() { history.redo(); })
            .on('⌫', function() { d3.event.preventDefault(); });

        d3.select(document)
            .call(keybinding);

        var hash = iD.Hash().controller(controller).map(map);

        if (!hash.hadHash) {
            map.centerZoom([-77.02271, 38.90085], 20);
        }

        d3.select('.user-container').call(iD.ui.userpanel(connection)
            .on('logout.editor', connection.logout)
            .on('login.editor', connection.authenticate));

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

iD.ui = function (context) {
    return function(container) {
        context.container(container);

        var connection = context.connection(),
            history = context.history(),
            map = context.map();

        if (!iD.supported()) {
            container.html('This editor is supported in Firefox, Chrome, Safari, Opera, ' +
                      'and Internet Explorer 9 and above. Please upgrade your browser ' +
                      'or use Potlatch 2 to edit the map.')
                .style('text-align:center;font-style:italic;');
            return;
        }

        function hintprefix(x, y) {
            return '<span>' + y + '</span>' + '<div class="keyhint-wrap"><span class="keyhint"> ' + x + '</span></div>';
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

        var modes = [
            iD.modes.Browse(context),
            iD.modes.AddPoint(context),
            iD.modes.AddLine(context),
            iD.modes.AddArea(context)];

        var buttons = buttons_joined.selectAll('button.add-button')
            .data(modes)
            .enter().append('button')
                .attr('tabindex', -1)
                .attr('class', function (mode) { return mode.title + ' add-button col3'; })
            .call(bootstrap.tooltip().placement('bottom').html(true))
            .attr('data-original-title', function (mode) {
                return hintprefix(mode.key, mode.description);
            })
            .on('click.editor', function (mode) { context.enter(mode); });

        function disableTooHigh() {
            if (map.editable()) {
                notice.message(false);
                buttons.attr('disabled', null);
            } else {
                buttons.attr('disabled', 'disabled');
                notice.message(true);
                context.enter(iD.modes.Browse(context));
            }
        }

        var notice = iD.ui.notice(limiter)
            .message(false)
            .on('zoom', function() { map.zoom(16); });

        map.on('move.editor', _.debounce(function() {
            disableTooHigh();
            contributors.call(iD.ui.contributors(context));
        }, 500));

        buttons.append('span')
            .attr('class', function(d) {
                return d.id + ' icon icon-pre-text';
            });

        buttons.append('span').attr('class', 'label').text(function (mode) { return mode.title; });

        context.on('enter.editor', function (entered) {
            buttons.classed('active', function (mode) { return entered.button === mode.button; });
            container.classed("mode-" + entered.id, true);
        });

        context.on('exit.editor', function (exited) {
            container.classed("mode-" + exited.id, false);
        });

        var undo_buttons = limiter.append('div')
            .attr('class', 'button-wrap joined col1'),
            undo_tooltip = bootstrap.tooltip().placement('bottom').html(true);

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

        limiter.append('div').attr('class','button-wrap col1').append('button')
            .attr('class', 'save col12')
            .call(iD.ui.save(context));

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

        container.append('div').attr('class', 'geocode-control map-control')
            .call(iD.ui.geocoder().map(map));

        container.append('div').attr('class', 'map-control layerswitcher-control')
            .call(iD.ui.layerswitcher(context));

        container.append('div')
            .style('display', 'none')
            .attr('class', 'inspector-wrap fr col5');

        var about = container.append('div')
            .attr('class','col12 about-block fillD pad1');

        var userContainer = about.append('div')
            .attr('class', 'user-container');

        userContainer
            .append('div')
                .attr('class', 'hello');

        var aboutList = about.append('ul')
                .attr('id','about')
                .attr('class','link-list');

        var linkList = aboutList.append('ul')
            .attr('id','about')
            .attr('class','pad1 fillD about-block link-list');
        linkList.append('li').append('a').attr('target', '_blank')
            .attr('href', 'http://github.com/systemed/iD').text(iD.version);
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
                    map.flush();
                    context.connection()
                        .url('http://api06.dev.openstreetmap.org');
                    d3.select(this).text('dev').classed('live', false);
                } else {
                    map.flush();
                    context.connection()
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
                .attr('data-original-title', hintprefix('⌘ + Z', undo))
                .call(refreshTooltip);

            limiter.select('#redo')
                .property('disabled', !redo)
                .attr('data-original-title', hintprefix('⌘ + ⇧ + Z', redo))
                .call(refreshTooltip);
        });

        d3.select(window).on('resize.editor', function() {
            map.size(m.size());
        });

        var keybinding = d3.keybinding('main')
            .on('⌘+Z', function() { history.undo(); })
            .on('⌃+Z', function() { history.undo(); })
            .on('⌘+⇧+Z', function() { history.redo(); })
            .on('⌃+⇧+Z', function() { history.redo(); })
            .on('⌫', function() { d3.event.preventDefault(); });

        modes.forEach(function(m) {
            keybinding.on(m.key, function() { if (map.editable()) context.enter(m); });
        });

        d3.select(document)
            .call(keybinding);

        var hash = iD.behavior.Hash(context);

        hash();

        if (!hash.hadHash) {
            map.centerZoom([-77.02271, 38.90085], 20);
        }

        userContainer.call(iD.ui.userpanel(connection)
            .on('logout.editor', connection.logout)
            .on('login.editor', connection.authenticate));

        context.enter(iD.modes.Browse(context));

        if (!context.storage('sawSplash')) {
            iD.ui.splash();
            context.storage('sawSplash', true);
        }
    };
};

iD.ui = function(context) {
    function render(container) {
        var history = context.history(),
            map = context.map();

        if (iD.detect().opera) container.classed('opera', true);

        var hash = iD.behavior.Hash(context);

        hash();

        if (!hash.hadHash) {
            map.centerZoom([-77.02271, 38.90085], 20);
        }

        var sidebar = container.append('div')
            .attr('id', 'sidebar')
            .attr('class', 'col4')

        var bar = sidebar.append('div')
            .attr('id', 'bar');

        paneWrap = sidebar.append('div')
            .attr('class','panes');

        paneWrap.call(ui.sidebar);

        var content = container.append('div')
            .attr('id', 'content');

        var m = content.append('div')
            .attr('id', 'map')
            .call(map);

        bar.append('div')
            .attr('class', 'mode-buttons col9')
            .call(iD.ui.Modes(context), bar);

        bar.append('div')
            .attr('class', 'undoredo-buttons col3')
            .call(iD.ui.UndoRedo(context));

       bar.append('div')
            .attr('class', 'button-wrap save-button col3')
            .call(iD.ui.Save(context));

        bar.append('div')
            .attr('class', 'spinner')
            .call(iD.ui.Spinner(context));

        content.append('div')
            .attr('class', 'attribution')
            .attr('tabindex', -1)
            .call(iD.ui.Attribution(context));

        content.append('div')
            .style('display', 'none')
            .attr('class', 'help-wrap fillL col5 content');

        var controls = content.append('div')
            .attr('class', 'map-controls');

        controls.append('div')
            .attr('class', 'map-control background-control')
            .call(iD.ui.Background(context));

        controls.append('div')
            .attr('class', 'map-control help-control')
            .call(iD.ui.Help(context));

        controls.append('div')
            .attr('class', 'map-control zoombuttons')
            .call(iD.ui.Zoom(context));

        if (!context.embed()) {
            controls.append('div')
                .attr('class', 'map-control geocode-control')
                .call(iD.ui.Geocoder(context));
        }

        controls.append('div')
            .attr('class', 'map-control geolocate-control')
            .call(iD.ui.Geolocate(map));

        window.onbeforeunload = function() {
            history.save();
            if (history.hasChanges()) return t('save.unsaved_changes');
        };

        d3.select(window).on('resize.editor', function() {
            map.dimensions(m.dimensions());
        });

        function pan(d) {
            return function() {
                context.pan(d);
            };
        }

        // pan amount
        var pa = 5;

        var keybinding = d3.keybinding('main')
            .on('⌫', function() { d3.event.preventDefault(); })
            .on('←', pan([pa, 0]))
            .on('↑', pan([0, pa]))
            .on('→', pan([-pa, 0]))
            .on('↓', pan([0, -pa]))
            .on('M', function() { context.toggleFullscreen(); });

        d3.select(document)
            .call(keybinding);

        context.enter(iD.modes.Browse(context));

        context.container()
            .call(iD.ui.Splash(context))
            .call(iD.ui.Restore(context));

        var authenticating = iD.ui.Loading(context)
            .message(t('loading_auth'));

        context.connection()
            .on('authenticating.ui', function() {
                context.container()
                    .call(authenticating);
            })
            .on('authenticated.ui', function() {
                authenticating.close();
            });
    }

    function ui(container) {
        context.container(container);
        context.loadLocale(function() {
            render(container);
        });
    }

    ui.sidebar = iD.ui.Sidebar(context);

    return ui;
};

iD.ui.tooltipHtml = function(text, key) {
    return '<span>' + text + '</span>' + '<div class="keyhint-wrap">' + '<span> ' + (t('tooltip_keyhint')) + ' </span>' + '<span class="keyhint"> ' + key + '</span></div>';
};

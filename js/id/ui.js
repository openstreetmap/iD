iD.ui = function(context) {
    return function(container) {
        context.container(container);

        var connection = context.connection(),
            history = context.history(),
            map = context.map();

        if (!iD.detect().support) {
            container.text(t('browser_notice'))
                .style('text-align:center;font-style:italic;');
            return;
        }

        if (iD.detect().opera) container.classed('opera', true);

        var m = container.append('div')
            .attr('id', 'map')
            .call(map);

        var bar = container.append('div')
            .attr('id', 'bar')
            .attr('class','pad1 fillD');

        var limiter = bar.append('div')
            .attr('class', 'limiter');

        limiter.append('div')
            .attr('class', 'button-wrap joined col4')
            .call(iD.ui.Modes(context), limiter);

        limiter.append('div')
            .attr('class', 'button-wrap joined col1')
            .call(iD.ui.UndoRedo(context));

        limiter.append('div')
            .attr('class', 'button-wrap col1')
            .call(iD.ui.Save(context));

        container.append('div')
            .attr('class', 'map-control zoombuttons')
            .call(iD.ui.Zoom(context));

        container.append('div')
            .attr('class', 'map-control geocode-control')
            .call(iD.ui.Geocoder(context));

        container.append('div')
            .attr('class', 'map-control layerswitcher-control')
            .call(iD.ui.LayerSwitcher(context));

        container.append('div')
            .attr('class', 'map-control geolocate-control')
            .call(iD.ui.Geolocate(map));

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

        linkList.append('li')
            .append('a')
            .attr('target', '_blank')
            .attr('href', 'http://github.com/systemed/iD')
            .text(iD.version);

        linkList.append('li')
            .append('a')
            .attr('target', '_blank')
            .attr('href', 'http://github.com/systemed/iD/issues')
            .text(t('report_a_bug'));

        var imagery = linkList.append('li')
            .attr('id', 'attribution');

        imagery.append('span')
            .text('imagery');

        imagery
            .append('span')
            .attr('class', 'provided-by');

        linkList.append('li')
            .attr('class', 'source-switch')
            .call(iD.ui.SourceSwitch(context));

        linkList.append('li')
            .attr('id', 'user-list')
            .call(iD.ui.Contributors(context));

        window.onbeforeunload = function() {
            history.save();
            if (history.hasChanges()) return t('save.unsaved_changes');
        };

        d3.select(window).on('resize.editor', function() {
            map.size(m.size());
        });

        function pan(d) {
            return function() {
                map.pan(d);
                map.redraw();
            };
        }

        // pan amount
        var pa = 5;

        var keybinding = d3.keybinding('main')
            .on('⌫', function() { d3.event.preventDefault(); })
            .on('←', pan([pa, 0]))
            .on('↑', pan([0, pa]))
            .on('→', pan([-pa, 0]))
            .on('↓', pan([0, -pa]));

        d3.select(document)
            .call(keybinding);

        var hash = iD.behavior.Hash(context);

        hash();

        if (!hash.hadHash) {
            map.centerZoom([-77.02271, 38.90085], 20);
        }

        userContainer.call(iD.ui.UserPanel(connection)
            .on('logout.editor', connection.logout)
            .on('login.editor', connection.authenticate));

        context.enter(iD.modes.Browse(context));

        if (!context.storage('sawSplash')) {
            iD.ui.splash(context.container());
            context.storage('sawSplash', true);
        }

        if (history.lock() && history.restorableChanges()) {
            iD.ui.restore(context.container(), history);
        }

    };
};

iD.ui.tooltipHtml = function(text, key) {
    return '<span>' + text + '</span>' + '<div class="keyhint-wrap"><span class="keyhint"> ' + key + '</span></div>';
};

iD.ui = function(context) {
    return function(container) {
        context.container(container);

        var history = context.history(),
            map = context.map();

        if (!iD.detect().support) {
            container
                .text(t('browser_notice'))
                .style({
                    'text-align': 'center',
                    'font-style': 'italic'
                });
            return;
        }

        if (iD.detect().opera) container.classed('opera', true);

        var hash = iD.behavior.Hash(context);

        hash();

        if (!hash.hadHash) {
            map.centerZoom([-77.02271, 38.90085], 20);
        }

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

        bar.append('div')
            .attr('class', 'spinner')
            .call(iD.ui.Spinner(context));

        container.append('div')
            .attr('class', 'map-control zoombuttons')
            .call(iD.ui.Zoom(context));

        container.append('div')
            .attr('class', 'map-control geocode-control')
            .call(iD.ui.Geocoder(context));

        container.append('div')
            .attr('class', 'map-control background-control')
            .call(iD.ui.Background(context));

        container.append('div')
            .attr('class', 'map-control geolocate-control')
            .call(iD.ui.Geolocate(map));

        container.append('div')
            .style('display', 'none')
            .attr('class', 'inspector-wrap fr content col5');

        var about = container.append('div')
            .attr('class','col12 about-block fillD');

        about.append('div')
            .attr('class', 'account')
            .call(iD.ui.Account(context));

        var linkList = about.append('ul')
            .attr('id', 'about')
            .attr('class', 'link-list');

        linkList.append('li')
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'http://github.com/systemed/iD')
            .text(iD.version);

        linkList.append('li')
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'http://github.com/systemed/iD/issues')
            .text(t('report_a_bug'));

        linkList.append('li')
            .attr('class', 'attribution')
            .attr('tabindex', -1)
            .call(iD.ui.Attribution(context));

        linkList.append('li')
            .attr('class', 'source-switch')
            .call(iD.ui.SourceSwitch(context));

        linkList.append('li')
            .attr('class', 'user-list')
            .attr('tabindex', -1)
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
            .on('↓', pan([0, -pa]));

        d3.select(document)
            .call(keybinding);

        context.enter(iD.modes.Browse(context));

        context.container()
            .call(iD.ui.Splash(context))
            .call(iD.ui.Restore(context));
    };
};

iD.ui.tooltipHtml = function(text, key) {
    return '<span>' + text + '</span>' + '<div class="keyhint-wrap"><span class="keyhint"> ' + key + '</span></div>';
};

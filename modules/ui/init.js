import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';
import { setDimensions } from '../util/dimensions';
import { tooltip } from '../util/tooltip';
import { Defs, Icon } from '../svg/index';
import { Account } from './account';
import { Attribution } from './attribution';
import { Background } from './background';
import { Browse } from '../modes/index';
import { Contributors } from './contributors';
import { Detect } from '../util/detect';
import { FeatureInfo } from './feature_info';
import { FullScreen } from './full_screen';
import { Geolocate } from './geolocate';
import { Hash } from '../behavior/index';
import { Help } from './help';
import { Info } from './info';
import { Loading } from './loading';
import { MapData } from './map_data';
import { MapInMap } from './map_in_map';
import { Modes } from './modes';
import { Restore } from './restore';
import { Save } from './save';
import { Scale } from './scale';
import { Sidebar } from './sidebar';
import { Spinner } from './spinner';
import { Splash } from './splash';
import { Status } from './status';
import { UndoRedo } from './undo_redo';
import { Zoom } from './zoom';
import { cmd } from './cmd';

export function init(context) {
    function render(container) {
        var map = context.map();

        if (Detect().opera) container.classed('opera', true);

        var hash = Hash(context);
        hash();

        if (!hash.hadHash) {
            map.centerZoom([0, 0], 2);
        }

        container.append('svg')
            .attr('id', 'defs')
            .call(Defs(context));

        container.append('div')
            .attr('id', 'sidebar')
            .attr('class', 'col4')
            .call(ui.sidebar);

        var content = container.append('div')
            .attr('id', 'content');

        var bar = content.append('div')
            .attr('id', 'bar')
            .attr('class', 'fillD');

        content.append('div')
            .attr('id', 'map')
            .call(map);

        content
            .call(MapInMap(context));

        content.append('div')
            .call(Info(context));

        bar.append('div')
            .attr('class', 'spacer col4');

        var limiter = bar.append('div')
            .attr('class', 'limiter');

        limiter.append('div')
            .attr('class', 'button-wrap joined col3')
            .call(Modes(context), limiter);

        limiter.append('div')
            .attr('class', 'button-wrap joined col1')
            .call(UndoRedo(context));

        limiter.append('div')
            .attr('class', 'button-wrap col1')
            .call(Save(context));

        bar.append('div')
            .attr('class', 'full-screen')
            .call(FullScreen(context));

        bar.append('div')
            .attr('class', 'spinner')
            .call(Spinner(context));

        var controls = bar.append('div')
            .attr('class', 'map-controls');

        controls.append('div')
            .attr('class', 'map-control zoombuttons')
            .call(Zoom(context));

        controls.append('div')
            .attr('class', 'map-control geolocate-control')
            .call(Geolocate(context));

        controls.append('div')
            .attr('class', 'map-control background-control')
            .call(Background(context));

        controls.append('div')
            .attr('class', 'map-control map-data-control')
            .call(MapData(context));

        controls.append('div')
            .attr('class', 'map-control help-control')
            .call(Help(context));

        var about = content.append('div')
            .attr('id', 'about');

        about.append('div')
            .attr('id', 'attrib')
            .call(Attribution(context));

        var footer = about.append('div')
            .attr('id', 'footer')
            .attr('class', 'fillD');

        footer.append('div')
            .attr('class', 'api-status')
            .call(Status(context));

        footer.append('div')
            .attr('id', 'scale-block')
            .call(Scale(context));

        var aboutList = footer.append('div')
            .attr('id', 'info-block')
            .append('ul')
            .attr('id', 'about-list');

        if (!context.embed()) {
            aboutList.call(Account(context));
        }

        aboutList.append('li')
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'https://github.com/openstreetmap/iD')
            .text(context.version);

        var issueLinks = aboutList.append('li');

        issueLinks.append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'https://github.com/openstreetmap/iD/issues')
            .call(Icon('#icon-bug', 'light'))
            .call(tooltip()
                .title(t('report_a_bug'))
                .placement('top')
            );

        issueLinks.append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'https://github.com/openstreetmap/iD/blob/master/CONTRIBUTING.md#translating')
            .call(Icon('#icon-translate', 'light'))
            .call(tooltip()
                .title(t('help_translate'))
                .placement('top')
            );

        aboutList.append('li')
            .attr('class', 'feature-warning')
            .attr('tabindex', -1)
            .call(FeatureInfo(context));

        aboutList.append('li')
            .attr('class', 'user-list')
            .attr('tabindex', -1)
            .call(Contributors(context));

        window.onbeforeunload = function() {
            return context.save();
        };

        window.onunload = function() {
            context.history().unlock();
        };

        var mapDimensions = map.dimensions();

        function onResize() {
            mapDimensions = setDimensions(content, null);
            map.dimensions(mapDimensions);
        }

        d3.select(window).on('resize.editor', onResize);
        onResize();

        function pan(d) {
            return function() {
                d3.event.preventDefault();
                if (!context.inIntro()) context.pan(d);
            };
        }

        // pan amount
        var pa = 10;

        var keybinding = d3keybinding('main')
            .on('⌫', function() { d3.event.preventDefault(); })
            .on('←', pan([pa, 0]))
            .on('↑', pan([0, pa]))
            .on('→', pan([-pa, 0]))
            .on('↓', pan([0, -pa]))
            .on('⇧←', pan([mapDimensions[0], 0]))
            .on('⇧↑', pan([0, mapDimensions[1]]))
            .on('⇧→', pan([-mapDimensions[0], 0]))
            .on('⇧↓', pan([0, -mapDimensions[1]]))
            .on(cmd('⌘←'), pan([mapDimensions[0], 0]))
            .on(cmd('⌘↑'), pan([0, mapDimensions[1]]))
            .on(cmd('⌘→'), pan([-mapDimensions[0], 0]))
            .on(cmd('⌘↓'), pan([0, -mapDimensions[1]]));

        d3.select(document)
            .call(keybinding);

        context.enter(Browse(context));

        context.container()
            .call(Splash(context))
            .call(Restore(context));

        var authenticating = Loading(context)
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

    function ui(node) {
        var container = d3.select(node);
        context.container(container);
        context.loadLocale(function() {
            render(container);
        });
    }

    ui.sidebar = Sidebar(context);

    return ui;
}

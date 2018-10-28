import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';

import { behaviorHash } from '../behavior';
import { modeBrowse } from '../modes';
import { svgDefs, svgIcon } from '../svg';
import { utilGetDimensions } from '../util/dimensions';

import { uiAccount } from './account';
import { uiAttribution } from './attribution';
import { uiBackground } from './background';
import { uiContributors } from './contributors';
import { uiFeatureInfo } from './feature_info';
import { uiFullScreen } from './full_screen';
import { uiGeolocate } from './geolocate';
import { uiHelp } from './help';
import { uiInfo } from './info';
import { uiIntro } from './intro';
import { uiLoading } from './loading';
import { uiMapData } from './map_data';
import { uiMapInMap } from './map_in_map';
import { uiModes } from './modes';
import { uiNotice } from './notice';
import { uiPhotoviewer } from './photoviewer';
import { uiRestore } from './restore';
import { uiSave } from './save';
import { uiScale } from './scale';
import { uiShortcuts } from './shortcuts';
import { uiSidebar } from './sidebar';
import { uiSpinner } from './spinner';
import { uiSplash } from './splash';
import { uiStatus } from './status';
import { uiUndoRedo } from './undo_redo';
import { uiVersion } from './version';
import { uiZoom } from './zoom';
import { uiCmd } from './cmd';


export function uiInit(context) {
    var uiInitCounter = 0;

    function render(container) {
        container
            .attr('dir', textDirection);

        var map = context.map();

        var hash = behaviorHash(context);
        hash();

        if (!hash.hadHash) {
            map.centerZoom([0, 0], 2);
        }

        container
            .append('svg')
            .attr('id', 'defs')
            .call(svgDefs(context));

        container
            .append('div')
            .attr('id', 'sidebar')
            .call(ui.sidebar);

        var content = container
            .append('div')
            .attr('id', 'content')
            .attr('class', 'active');

        var bar = content
            .append('div')
            .attr('id', 'bar')
            .attr('class', 'fillD');

        content
            .append('div')
            .attr('id', 'map')
            .attr('dir', 'ltr')
            .call(map);

        content
            .call(uiMapInMap(context))
            .call(uiInfo(context))
            .call(uiNotice(context));

        var leadingArea = bar
            .append('div')
            .attr('class', 'leading-area');

        var sidebarButton = leadingArea
            .append('div')
            .attr('class', 'button-wrap sidebar-collapse')
            .append('button')
            .attr('class', 'col12')
            .attr('tabindex', -1)
            .on('click', ui.sidebar.toggleCollapse)
            .call(tooltip().title(t('sidebar_button.tooltip')).placement('bottom'));
        var iconSuffix = textDirection === 'rtl' ? 'right' : 'left';
        sidebarButton
            .call(svgIcon('#iD-icon-sidebar-'+iconSuffix, 'pre-text'))
            .append('span')
            .attr('class', 'label')
            .text(t('sidebar_button.title'));

        bar
            .append('div')
            .attr('class', 'center-area')
            .append('div')
            .attr('class', 'modes button-wrap joined')
            .call(uiModes(context), bar);

        var trailingArea = bar
            .append('div')
            .attr('class', 'trailing-area');

        trailingArea
            .append('div')
            .attr('class', 'full-screen')
            .call(uiFullScreen(context));

        trailingArea
            .append('div')
            .attr('class', 'spinner')
            .call(uiSpinner(context));

        trailingArea
            .append('div')
            .attr('class', 'button-wrap joined')
            .call(uiUndoRedo(context));

        trailingArea
            .append('div')
            .attr('class', 'button-wrap save-wrap')
            .call(uiSave(context));

        var controls = bar
            .append('div')
            .attr('class', 'map-controls');

        controls
            .append('div')
            .attr('class', 'map-control zoombuttons')
            .call(uiZoom(context));

        controls
            .append('div')
            .attr('class', 'map-control geolocate-control')
            .call(uiGeolocate(context));

        controls
            .append('div')
            .attr('class', 'map-control background-control')
            .call(uiBackground(context));

        controls
            .append('div')
            .attr('class', 'map-control map-data-control')
            .call(uiMapData(context));

        controls
            .append('div')
            .attr('class', 'map-control help-control')
            .call(uiHelp(context));


        var about = content
            .append('div')
            .attr('id', 'about');

        about
            .append('div')
            .attr('id', 'attrib')
            .attr('dir', 'ltr')
            .call(uiAttribution(context));

        about
            .append('div')
            .attr('class', 'api-status')
            .call(uiStatus(context));


        var footer = about
            .append('div')
            .attr('id', 'footer')
            .attr('class', 'fillD');

        footer
            .append('div')
            .attr('id', 'flash-wrap')
            .attr('class', 'footer-hide');

        var footerWrap = footer
            .append('div')
            .attr('id', 'footer-wrap')
            .attr('class', 'footer-show');

        footerWrap
            .append('div')
            .attr('id', 'scale-block')
            .call(uiScale(context));

        var aboutList = footerWrap
            .append('div')
            .attr('id', 'info-block')
            .append('ul')
            .attr('id', 'about-list');

        if (!context.embed()) {
            aboutList
                .call(uiAccount(context));
        }

        aboutList
            .append('li')
            .attr('class', 'version')
            .call(uiVersion(context));

        var issueLinks = aboutList
            .append('li');

        issueLinks
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'https://github.com/openstreetmap/iD/issues')
            .call(svgIcon('#iD-icon-bug', 'light'))
            .call(tooltip().title(t('report_a_bug')).placement('top'));

        issueLinks
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'https://github.com/openstreetmap/iD/blob/master/CONTRIBUTING.md#translating')
            .call(svgIcon('#iD-icon-translate', 'light'))
            .call(tooltip().title(t('help_translate')).placement('top'));

        aboutList
            .append('li')
            .attr('class', 'feature-warning')
            .attr('tabindex', -1)
            .call(uiFeatureInfo(context));

        aboutList
            .append('li')
            .attr('class', 'user-list')
            .attr('tabindex', -1)
            .call(uiContributors(context));


        content
            .append('div')
            .attr('id', 'photoviewer')
            .classed('al', true)       // 'al'=left,  'ar'=right
            .classed('hide', true)
            .call(ui.photoviewer);

        var mapDimensions = map.dimensions();

        // bind events
        window.onbeforeunload = function() {
            return context.save();
        };

        window.onunload = function() {
            context.history().unlock();
        };

        d3_select(window)
            .on('resize.editor', ui.onResize);

        ui.onResize();

        var pa = 80;  // pan amount
        var keybinding = d3_keybinding('main')
            .on('⌫', function() { d3_event.preventDefault(); })
            .on('←', pan([pa, 0]))
            .on('↑', pan([0, pa]))
            .on('→', pan([-pa, 0]))
            .on('↓', pan([0, -pa]))
            .on(['⇧←', uiCmd('⌘←')], pan([mapDimensions[0], 0]))
            .on(['⇧↑', uiCmd('⌘↑')], pan([0, mapDimensions[1]]))
            .on(['⇧→', uiCmd('⌘→')], pan([-mapDimensions[0], 0]))
            .on(['⇧↓', uiCmd('⌘↓')], pan([0, -mapDimensions[1]]));

        d3_select(document)
            .call(keybinding);

        context.enter(modeBrowse(context));

        if (!uiInitCounter++) {
            if (!hash.startWalkthrough) {
                context.container()
                    .call(uiSplash(context))
                    .call(uiRestore(context));
            }

            context.container()
                .call(uiShortcuts(context));
        }

        var osm = context.connection();
        var auth = uiLoading(context).message(t('loading_auth')).blocking(true);

        if (osm && auth) {
            osm
                .on('authLoading.ui', function() {
                    context.container()
                        .call(auth);
                })
                .on('authDone.ui', function() {
                    auth.close();
                });
        }

        uiInitCounter++;

        if (hash.startWalkthrough) {
            hash.startWalkthrough = false;
            context.container().call(uiIntro(context));
        }


        function pan(d) {
            return function() {
                d3_event.preventDefault();
                context.pan(d, 100);
            };
        }
    }


    var renderCallback;

    function ui(node, callback) {
        renderCallback = callback;
        var container = d3_select(node);
        context.container(container);
        context.loadLocale(function(err) {
            if (!err) {
                render(container);
            }
            if (callback) {
                callback(err);
            }
        });
    }


    ui.restart = function(arg) {
        context.locale(arg);
        context.loadLocale(function(err) {
            if (!err) {
                context.container().selectAll('*').remove();
                render(context.container());
                if (renderCallback) renderCallback();
            }
        });
    };


    ui.sidebar = uiSidebar(context);

    ui.photoviewer = uiPhotoviewer(context);

    ui.onResize = function() {
        var content = d3_select('#content');
        var mapDimensions = utilGetDimensions(content, true);
        context.map().dimensions(mapDimensions);

        ui.photoviewer.onMapResize();
    };

    return ui;
}

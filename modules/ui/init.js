import {
    event as d3_event,
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import { t, textDirection, setLocale } from '../util/locale';

import { tooltip } from '../util/tooltip';

import { behaviorHash } from '../behavior';
import { modeBrowse } from '../modes/browse';
import { svgDefs, svgIcon } from '../svg';
import { utilGetDimensions } from '../util/dimensions';
import { utilDetect } from '../util/detect';

import { uiAccount } from './account';
import { uiAttribution } from './attribution';
import { uiContributors } from './contributors';
import { uiFeatureInfo } from './feature_info';
import { uiFullScreen } from './full_screen';
import { uiGeolocate } from './geolocate';
import { uiInfo } from './info';
import { uiIntro } from './intro';
import { uiIssuesInfo } from './issues_info';
import { uiLoading } from './loading';
import { uiMapInMap } from './map_in_map';
import { uiNotice } from './notice';
import { uiPhotoviewer } from './photoviewer';
import { uiRestore } from './restore';
import { uiScale } from './scale';
import { uiShortcuts } from './shortcuts';
import { uiSidebar } from './sidebar';
import { uiSpinner } from './spinner';
import { uiSplash } from './splash';
import { uiStatus } from './status';
import { uiTopToolbar } from './top_toolbar';
import { uiVersion } from './version';
import { uiZoom } from './zoom';
import { uiZoomToSelection } from './zoom_to_selection';
import { uiCmd } from './cmd';

import { uiPaneBackground } from './panes/background';
import { uiPaneHelp } from './panes/help';
import { uiPaneIssues } from './panes/issues';
import { uiPaneMapData } from './panes/map_data';
import { uiPanePreferences } from './panes/preferences';

export function uiInit(context) {
    var _initCounter = 0;
    var _initCallback;
    var _needWidth = {};


    function render(container) {
        container
            .attr('dir', textDirection);

        // setup fullscreen keybindings (no button shown at this time)
        container
            .call(uiFullScreen(context));

        var map = context.map();
        map.redrawEnable(false);  // don't draw until we've set zoom/lat/long

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

        // Top toolbar
        content
            .append('div')
            .attr('id', 'bar-wrap')
            .append('div')
            .attr('id', 'bar')
            .attr('class', 'fillD')
            .call(uiTopToolbar(context));

        content
            .append('div')
            .attr('id', 'map')
            .attr('dir', 'ltr')
            .call(map);


        // Map controls
        var controls = content
            .append('div')
            .attr('class', 'map-controls');

        controls
            .append('div')
            .attr('class', 'map-control zoombuttons')
            .call(uiZoom(context));

        controls
            .append('div')
            .attr('class', 'map-control zoom-to-selection-control')
            .call(uiZoomToSelection(context));

        controls
            .append('div')
            .attr('class', 'map-control geolocate-control')
            .call(uiGeolocate(context));

        var uiPanes = [
            uiPaneBackground(context),
            uiPaneMapData(context),
            uiPaneIssues(context),
            uiPanePreferences(context),
            uiPaneHelp(context)
        ];

        uiPanes.forEach(function(pane) {
            controls
                .append('div')
                .attr('class', 'map-control map-pane-control ' + pane.id + '-control')
                .call(pane.renderToggleButton);
        });

        content
            .append('div')
            .attr('class', 'spinner')
            .call(uiSpinner(context));

        // Add attribution and footer
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
            .attr('href', 'https://github.com/openstreetmap/iD/issues')
            .call(svgIcon('#iD-icon-bug', 'light'))
            .call(tooltip().title(t('report_a_bug')).placement('top'));

        issueLinks
            .append('a')
            .attr('target', '_blank')
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
            .attr('class', 'issues-info')
            .attr('tabindex', -1)
            .call(uiIssuesInfo(context));

        aboutList
            .append('li')
            .attr('class', 'user-list')
            .attr('tabindex', -1)
            .call(uiContributors(context));


        // Setup map dimensions and move map to initial center/zoom.
        // This should happen after #content and toolbars exist.
        ui.onResize();
        map.redrawEnable(true);

        ui.hash = behaviorHash(context);
        ui.hash();
        if (!ui.hash.hadHash) {
            map.centerZoom([0, 0], 2);
        }


        var overMap = content
            .append('div')
            .attr('class', 'over-map');

        // Add panes
        // This should happen after map is initialized, as some require surface()
        var panes = overMap
            .append('div')
            .attr('class', 'map-panes');

        uiPanes.forEach(function(pane) {
            panes
                .call(pane.renderPane);
        });

        ui.info = uiInfo(context);

        // Add absolutely-positioned elements that sit on top of the map
        // This should happen after the map is ready (center/zoom)
        overMap
            .call(uiMapInMap(context))
            .call(ui.info)
            .call(uiNotice(context));


        overMap
            .append('div')
            .attr('id', 'photoviewer')
            .classed('al', true)       // 'al'=left,  'ar'=right
            .classed('hide', true)
            .call(ui.photoviewer);


        // Bind events
        window.onbeforeunload = function() {
            return context.save();
        };
        window.onunload = function() {
            context.history().unlock();
        };

        d3_select(window)
            .on('gesturestart.editor', eventCancel)
            .on('gesturechange.editor', eventCancel)
            .on('gestureend.editor', eventCancel)
            .on('resize.editor', ui.onResize);


        var panPixels = 80;
        context.keybinding()
            .on('⌫', function() { d3_event.preventDefault(); })
            .on([t('sidebar.key'), '`', '²', '@'], ui.sidebar.toggle)   // #5663, #6864 - common QWERTY, AZERTY
            .on('←', pan([panPixels, 0]))
            .on('↑', pan([0, panPixels]))
            .on('→', pan([-panPixels, 0]))
            .on('↓', pan([0, -panPixels]))
            .on(['⇧←', uiCmd('⌘←')], pan([map.dimensions()[0], 0]))
            .on(['⇧↑', uiCmd('⌘↑')], pan([0, map.dimensions()[1]]))
            .on(['⇧→', uiCmd('⌘→')], pan([-map.dimensions()[0], 0]))
            .on(['⇧↓', uiCmd('⌘↓')], pan([0, -map.dimensions()[1]]));

        context.enter(modeBrowse(context));

        if (!_initCounter++) {
            if (!ui.hash.startWalkthrough) {
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

        _initCounter++;

        if (ui.hash.startWalkthrough) {
            ui.hash.startWalkthrough = false;
            context.container().call(uiIntro(context));
        }


        function pan(d) {
            return function() {
                if (d3_select('.combobox').size()) return;
                d3_event.preventDefault();
                context.pan(d, 100);
            };
        }

        function eventCancel() {
            d3_event.preventDefault();
        }
    }


    // `ui()` renders the iD interface into the given node, assigning
    // that node as the `container`.  We need to delay rendering until the
    // locale data has been loaded (i.e. promises all settled), because the
    // UI code expects localized strings to be available.
    function ui(node, callback) {
        _initCallback = callback;
        var container = d3_select(node);
        context.container(container);

        const current = utilDetect().locale;

        context.data().get('locales')
            .then(function () {
                return context.loadLocale(current);
            })
            .then(function() {
                render(container);
                if (callback) callback();
            })
            .catch(function(err) {
                console.error(err);  // eslint-disable-line
                if (callback) callback(err);
            });
    }


    // `ui.restart()` will destroy and rebuild the entire iD interface,
    // for example to switch the locale while iD is running.
    ui.restart = function(locale) {
        context.keybinding().clear();

        var requested = locale || utilDetect().locale;
        context.loadLocale(requested)
            .then(function(received) {   // `received` may not match `requested`.
                setLocale(received);     // (e.g. 'es-FAKE' will return 'es')
                utilDetect(true);        // Then force redetection

                context.container().selectAll('*').remove();
                render(context.container());

                if (_initCallback) _initCallback();
            })
            .catch(function(err) {
                console.error(err);  // eslint-disable-line
                if (_initCallback) _initCallback(err);
            });
    };

    ui.sidebar = uiSidebar(context);

    ui.photoviewer = uiPhotoviewer(context);

    ui.onResize = function(withPan) {
        var map = context.map();

        // Recalc dimensions of map and sidebar.. (`true` = force recalc)
        // This will call `getBoundingClientRect` and trigger reflow,
        //  but the values will be cached for later use.
        var mapDimensions = utilGetDimensions(d3_select('#content'), true);
        utilGetDimensions(d3_select('#sidebar'), true);

        if (withPan !== undefined) {
            map.redrawEnable(false);
            map.pan(withPan);
            map.redrawEnable(true);
        }
        map.dimensions(mapDimensions);

        ui.photoviewer.onMapResize();

        // check if header or footer have overflowed
        ui.checkOverflow('#bar');
        ui.checkOverflow('#footer');

        // Use outdated code so it works on Explorer
        var resizeWindowEvent = document.createEvent('Event');

        resizeWindowEvent.initEvent('resizeWindow', true, true);

        document.dispatchEvent(resizeWindowEvent);
    };


    // Call checkOverflow when resizing or whenever the contents change.
    ui.checkOverflow = function(selector, reset) {
        if (reset) {
            delete _needWidth[selector];
        }

        var element = d3_select(selector);
        var scrollWidth = element.property('scrollWidth');
        var clientWidth = element.property('clientWidth');
        var needed = _needWidth[selector] || scrollWidth;

        if (scrollWidth > clientWidth) {    // overflow happening
            element.classed('narrow', true);
            if (!_needWidth[selector]) {
                _needWidth[selector] = scrollWidth;
            }

        } else if (scrollWidth >= needed) {
            element.classed('narrow', false);
        }
    };

    ui.togglePanes = function(showPane) {
        var shownPanes = d3_selectAll('.map-pane.shown');

        var side = textDirection === 'ltr' ? 'right' : 'left';

        shownPanes
            .classed('shown', false);

        d3_selectAll('.map-pane-control button')
            .classed('active', false);

        if (showPane) {
            shownPanes
                .style('display', 'none')
                .style(side, '-500px');

            d3_selectAll('.' + showPane.attr('pane') + '-control button')
                .classed('active', true);

            showPane
                .classed('shown', true)
                .style('display', 'block');
            if (shownPanes.empty()) {
                showPane
                    .style('display', 'block')
                    .style(side, '-500px')
                    .transition()
                    .duration(200)
                    .style(side, '0px');
            } else {
                showPane
                    .style(side, '0px');
            }
        } else {
            shownPanes
                .style('display', 'block')
                .style(side, '0px')
                .transition()
                .duration(200)
                .style(side, '-500px')
                .on('end', function() {
                    d3_select(this).style('display', 'none');
                });
        }
    };


    var _saveLoading = d3_select(null);

    context.uploader()
        .on('saveStarted.ui', function() {
            _saveLoading = uiLoading(context)
                .message(t('save.uploading'))
                .blocking(true);
            context.container().call(_saveLoading);  // block input during upload
        })
        .on('saveEnded.ui', function() {
            _saveLoading.close();
            _saveLoading = d3_select(null);
        });

    return ui;
}

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { prefs } from '../core/preferences';
import { t, localizer } from '../core/localizer';
import { presetManager } from '../presets';
import { behaviorHash } from '../behavior';
import { modeBrowse } from '../modes/browse';
import { svgDefs, svgIcon } from '../svg';
import { utilGetDimensions } from '../util/dimensions';

import { uiAccount } from './account';
import { uiAttribution } from './attribution';
import { uiContributors } from './contributors';
import { uiEditMenu } from './edit_menu';
import { uiFeatureInfo } from './feature_info';
import { uiFlash } from './flash';
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
import { uiSourceSwitch } from './source_switch';
import { uiSpinner } from './spinner';
import { uiSplash } from './splash';
import { uiStatus } from './status';
import { uiTooltip } from './tooltip';
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
    var _needWidth = {};


    function render(container) {

        container
            .on('click.ui', function() {
                // some targets have default click events we don't want to override
                var isOkayTarget = d3_event.composedPath().some(function(node) {
                    // clicking <label> affects its <input> by default
                    return node.nodeName === 'LABEL' ||
                        // clicking <a> opens a hyperlink by default
                        node.nodeName === 'A';
                });
                if (isOkayTarget) return;

                // disable double-tap-to-zoom on touchscreens
                d3_event.preventDefault();
            })
            // disable pinch-to-zoom in Safari
            .on('gesturestart.ui', eventCancel)
            .on('gesturechange.ui', eventCancel)
            .on('gestureend.ui', eventCancel);

        container
            .attr('dir', localizer.textDirection());

        // setup fullscreen keybindings (no button shown at this time)
        container
            .call(uiFullScreen(context));

        var map = context.map();
        map.redrawEnable(false);  // don't draw until we've set zoom/lat/long

        map
            .on('hitMinZoom.ui', function() {
                ui.flash.text(t('cannot_zoom'))();
            });

        container
            .append('svg')
            .attr('id', 'ideditor-defs')
            .call(svgDefs(context));

        container
            .append('div')
            .attr('class', 'sidebar')
            .call(ui.sidebar);

        var content = container
            .append('div')
            .attr('class', 'main-content active');

        // Top toolbar
        content
            .append('div')
            .attr('class', 'top-toolbar-wrap')
            .append('div')
            .attr('class', 'top-toolbar fillD')
            .call(uiTopToolbar(context));

        content
            .append('div')
            .attr('class', 'main-map')
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
            .attr('class', 'map-footer');

        about
            .append('div')
            .attr('class', 'attribution-wrap')
            .attr('dir', 'ltr')
            .call(uiAttribution(context));

        about
            .append('div')
            .attr('class', 'api-status')
            .call(uiStatus(context));


        var footer = about
            .append('div')
            .attr('class', 'map-footer-bar fillD');

        footer
            .append('div')
            .attr('class', 'flash-wrap footer-hide');

        var footerWrap = footer
            .append('div')
            .attr('class', 'main-footer-wrap footer-show');

        footerWrap
            .append('div')
            .attr('class', 'scale-block')
            .call(uiScale(context));

        var aboutList = footerWrap
            .append('div')
            .attr('class', 'info-block')
            .append('ul')
            .attr('class', 'map-footer-list');

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
            .call(uiTooltip().title(t('report_a_bug')).placement('top'));

        issueLinks
            .append('a')
            .attr('target', '_blank')
            .attr('href', 'https://github.com/openstreetmap/iD/blob/develop/CONTRIBUTING.md#translating')
            .call(svgIcon('#iD-icon-translate', 'light'))
            .call(uiTooltip().title(t('help_translate')).placement('top'));

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

        var apiConnections = context.apiConnections();
        if (apiConnections && apiConnections.length > 1) {
            aboutList
                .append('li')
                .attr('class', 'source-switch')
                .attr('tabindex', -1)
                .call(uiSourceSwitch(context)
                    .keys(apiConnections)
                );
        }

        aboutList
            .append('li')
            .attr('class', 'user-list')
            .attr('tabindex', -1)
            .call(uiContributors(context));


        // Setup map dimensions and move map to initial center/zoom.
        // This should happen after .main-content and toolbars exist.
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
            .attr('class', 'photoviewer')
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
            .on('resize.editor', ui.onResize);


        var panPixels = 80;
        context.keybinding()
            .on('⌫', function() { d3_event.preventDefault(); })
            .on([t('sidebar.key'), '`', '²', '@'], ui.sidebar.toggle)   // #5663, #6864 - common QWERTY, AZERTY
            .on('←', pan([panPixels, 0]))
            .on('↑', pan([0, panPixels]))
            .on('→', pan([-panPixels, 0]))
            .on('↓', pan([0, -panPixels]))
            .on(uiCmd('⌘←'), pan([map.dimensions()[0], 0]))
            .on(uiCmd('⌘↑'), pan([0, map.dimensions()[1]]))
            .on(uiCmd('⌘→'), pan([-map.dimensions()[0], 0]))
            .on(uiCmd('⌘↓'), pan([0, -map.dimensions()[1]]))
            .on(uiCmd('⌘' + t('background.key')), function quickSwitch() {
                if (d3_event) {
                    d3_event.stopImmediatePropagation();
                    d3_event.preventDefault();
                }
                var previousBackground = context.background().findSource(prefs('background-last-used-toggle'));
                if (previousBackground) {
                    var currentBackground = context.background().baseLayerSource();
                    prefs('background-last-used-toggle', currentBackground.id);
                    prefs('background-last-used', previousBackground.id);
                    context.background().baseLayerSource(previousBackground);
                }
            })
            .on(t('area_fill.wireframe.key'), function toggleWireframe() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                context.map().toggleWireframe();
            })
            .on(uiCmd('⌥' + t('area_fill.wireframe.key')), function toggleOsmData() {
                d3_event.preventDefault();
                d3_event.stopPropagation();

                // Don't allow layer changes while drawing - #6584
                var mode = context.mode();
                if (mode && /^draw/.test(mode.id)) return;

                var layer = context.layers().layer('osm');
                if (layer) {
                    layer.enabled(!layer.enabled());
                    if (!layer.enabled()) {
                        context.enter(modeBrowse(context));
                    }
                }
            })
            .on(t('map_data.highlight_edits.key'), function toggleHighlightEdited() {
                d3_event.preventDefault();
                context.map().toggleHighlightEdited();
            });

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
                if (d3_event.shiftKey) return;
                if (context.container().select('.combobox').size()) return;
                d3_event.preventDefault();
                context.map().pan(d, 100);
            };
        }

        function eventCancel() {
            d3_event.preventDefault();
        }
    }


    let ui = {};

    let _loadPromise;
    // renders the iD interface into the container node
    ui.ensureLoaded = () => {

        if (_loadPromise) return _loadPromise;

        return _loadPromise = Promise.all([
                // must have strings and presets before loading the UI
                localizer.ensureLoaded(),
                presetManager.ensureLoaded()
            ])
            .then(() => {
                if (!context.container().empty()) render(context.container());
            })
            .catch(err => console.error(err));  // eslint-disable-line
    };


    // `ui.restart()` will destroy and rebuild the entire iD interface,
    // for example to switch the locale while iD is running.
    ui.restart = function() {
        context.keybinding().clear();

        _loadPromise = null;

        context.container().selectAll('*').remove();

        ui.ensureLoaded();
    };

    ui.flash = uiFlash(context);

    ui.sidebar = uiSidebar(context);

    ui.photoviewer = uiPhotoviewer(context);

    ui.onResize = function(withPan) {
        var map = context.map();

        // Recalc dimensions of map and sidebar.. (`true` = force recalc)
        // This will call `getBoundingClientRect` and trigger reflow,
        //  but the values will be cached for later use.
        var mapDimensions = utilGetDimensions(context.container().select('.main-content'), true);
        utilGetDimensions(context.container().select('.sidebar'), true);

        if (withPan !== undefined) {
            map.redrawEnable(false);
            map.pan(withPan);
            map.redrawEnable(true);
        }
        map.dimensions(mapDimensions);

        ui.photoviewer.onMapResize();

        // check if header or footer have overflowed
        ui.checkOverflow('.top-toolbar');
        ui.checkOverflow('.map-footer-bar');

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
        var shownPanes = context.container().selectAll('.map-pane.shown');

        var side = localizer.textDirection() === 'ltr' ? 'right' : 'left';

        shownPanes
            .classed('shown', false);

        context.container().selectAll('.map-pane-control button')
            .classed('active', false);

        if (showPane) {
            shownPanes
                .style('display', 'none')
                .style(side, '-500px');

            context.container().selectAll('.' + showPane.attr('pane') + '-control button')
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


    var _editMenu; // uiEditMenu

    ui.showEditMenu = function(anchorPoint, triggerType, operations) {

        // remove any displayed menu
        ui.closeEditMenu();

        if (!operations && context.mode().operations) operations = context.mode().operations();
        if (!operations || !operations.length) return;

        // disable menu if in wide selection, for example
        if (!context.map().editableDataEnabled()) return;

        var surfaceNode = context.surface().node();
        if (surfaceNode.focus) {   // FF doesn't support it
            // focus the surface or else clicking off the menu may not trigger modeBrowse
            surfaceNode.focus();
        }

        // don't load the menu until it's needed
        if (!_editMenu) _editMenu = uiEditMenu(context);

        operations.forEach(function(operation) {
            if (operation.point) operation.point(anchorPoint);
        });

        _editMenu
            .anchorLoc(anchorPoint)
            .triggerType(triggerType)
            .operations(operations);

        // render the menu
        context.map().supersurface.call(_editMenu);
    };

    ui.closeEditMenu = function() {
        // remove any existing menu no matter how it was added
        context.map().supersurface
            .select('.edit-menu').remove();
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

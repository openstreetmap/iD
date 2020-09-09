import _throttle from 'lodash-es/throttle';

import { interpolateNumber as d3_interpolateNumber } from 'd3-interpolate';
import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { utilArrayIdentical } from '../util/array';
import { utilFastMouse } from '../util';
import { osmEntity, osmNote, QAItem } from '../osm';
import { services } from '../services';
import { uiDataEditor } from './data_editor';
import { uiFeatureList } from './feature_list';
import { uiInspector } from './inspector';
import { uiImproveOsmEditor } from './improveOSM_editor';
import { uiKeepRightEditor } from './keepRight_editor';
import { uiOsmoseEditor } from './osmose_editor';
import { uiNoteEditor } from './note_editor';
import { localizer } from '../core/localizer';


export function uiSidebar(context) {
    var inspector = uiInspector(context);
    var dataEditor = uiDataEditor(context);
    var noteEditor = uiNoteEditor(context);
    var improveOsmEditor = uiImproveOsmEditor(context);
    var keepRightEditor = uiKeepRightEditor(context);
    var osmoseEditor = uiOsmoseEditor(context);
    var _current;
    var _wasData = false;
    var _wasNote = false;
    var _wasQaItem = false;

    // use pointer events on supported platforms; fallback to mouse events
    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';


    function sidebar(selection) {
        var container = context.container();
        var minWidth = 240;
        var sidebarWidth;
        var containerWidth;
        var dragOffset;

        // Set the initial width constraints
        selection
            .style('min-width', minWidth + 'px')
            .style('max-width', '400px')
            .style('width', '33.3333%');

        var resizer = selection
            .append('div')
            .attr('class', 'sidebar-resizer')
            .on(_pointerPrefix + 'down.sidebar-resizer', pointerdown);

        var downPointerId, lastClientX, containerLocGetter;

        function pointerdown() {
            if (downPointerId) return;

            if ('button' in d3_event && d3_event.button !== 0) return;

            downPointerId = d3_event.pointerId || 'mouse';

            lastClientX = d3_event.clientX;

            containerLocGetter = utilFastMouse(container.node());

            // offset from edge of sidebar-resizer
            dragOffset = utilFastMouse(resizer.node())(d3_event)[0] - 1;

            sidebarWidth = selection.node().getBoundingClientRect().width;
            containerWidth = container.node().getBoundingClientRect().width;
            var widthPct = (sidebarWidth / containerWidth) * 100;
            selection
                .style('width', widthPct + '%')    // lock in current width
                .style('max-width', '85%');        // but allow larger widths

            resizer.classed('dragging', true);

            d3_select(window)
                .on('touchmove.sidebar-resizer', function() {
                    // disable page scrolling while resizing on touch input
                    d3_event.preventDefault();
                }, { passive: false })
                .on(_pointerPrefix + 'move.sidebar-resizer', pointermove)
                .on(_pointerPrefix + 'up.sidebar-resizer pointercancel.sidebar-resizer', pointerup);
        }

        function pointermove() {

            if (downPointerId !== (d3_event.pointerId || 'mouse')) return;

            d3_event.preventDefault();

            var dx = d3_event.clientX - lastClientX;

            lastClientX = d3_event.clientX;

            var isRTL = (localizer.textDirection() === 'rtl');
            var scaleX = isRTL ? 0 : 1;
            var xMarginProperty = isRTL ? 'margin-right' : 'margin-left';

            var x = containerLocGetter(d3_event)[0] - dragOffset;
            sidebarWidth = isRTL ? containerWidth - x : x;

            var isCollapsed = selection.classed('collapsed');
            var shouldCollapse = sidebarWidth < minWidth;

            selection.classed('collapsed', shouldCollapse);

            if (shouldCollapse) {
                if (!isCollapsed) {
                    selection
                        .style(xMarginProperty, '-400px')
                        .style('width', '400px');

                    context.ui().onResize([(sidebarWidth - dx) * scaleX, 0]);
                }

            } else {
                var widthPct = (sidebarWidth / containerWidth) * 100;
                selection
                    .style(xMarginProperty, null)
                    .style('width', widthPct + '%');

                if (isCollapsed) {
                    context.ui().onResize([-sidebarWidth * scaleX, 0]);
                } else {
                    context.ui().onResize([-dx * scaleX, 0]);
                }
            }
        }

        function pointerup() {
            if (downPointerId !== (d3_event.pointerId || 'mouse')) return;

            downPointerId = null;

            resizer.classed('dragging', false);

            d3_select(window)
                .on('touchmove.sidebar-resizer', null)
                .on(_pointerPrefix + 'move.sidebar-resizer', null)
                .on(_pointerPrefix + 'up.sidebar-resizer pointercancel.sidebar-resizer', null);
        }

        var featureListWrap = selection
            .append('div')
            .attr('class', 'feature-list-pane')
            .call(uiFeatureList(context));

        var inspectorWrap = selection
            .append('div')
            .attr('class', 'inspector-hidden inspector-wrap');

        var hoverModeSelect = function(targets) {
            context.container().selectAll('.feature-list-item').classed('hover', false);

            if (context.selectedIDs().length > 1 &&
                targets && targets.length) {

                var elements = context.container().selectAll('.feature-list-item')
                    .filter(function (node) {
                        return targets.indexOf(node) !== -1;
                    });

                if (!elements.empty()) {
                    elements.classed('hover', true);
                }
            }
        };

        sidebar.hoverModeSelect = _throttle(hoverModeSelect, 200);

        function hover(targets) {
            var datum = targets && targets.length && targets[0];
            if (datum && datum.__featurehash__) {   // hovering on data
                _wasData = true;
                sidebar
                    .show(dataEditor.datum(datum));

                selection.selectAll('.sidebar-component')
                    .classed('inspector-hover', true);

            } else if (datum instanceof osmNote) {
                if (context.mode().id === 'drag-note') return;
                _wasNote = true;

                var osm = services.osm;
                if (osm) {
                    datum = osm.getNote(datum.id);   // marker may contain stale data - get latest
                }

                sidebar
                    .show(noteEditor.note(datum));

                selection.selectAll('.sidebar-component')
                    .classed('inspector-hover', true);

            } else if (datum instanceof QAItem) {
                _wasQaItem = true;

                var errService = services[datum.service];
                if (errService) {
                    // marker may contain stale data - get latest
                    datum = errService.getError(datum.id);
                }

                // Currently only three possible services
                var errEditor;
                if (datum.service === 'keepRight') {
                    errEditor = keepRightEditor;
                } else if (datum.service === 'osmose') {
                    errEditor = osmoseEditor;
                } else {
                    errEditor = improveOsmEditor;
                }

                context.container().selectAll('.qaItem.' + datum.service)
                    .classed('hover', function(d) { return d.id === datum.id; });

                sidebar
                    .show(errEditor.error(datum));

                selection.selectAll('.sidebar-component')
                    .classed('inspector-hover', true);

            } else if (!_current && (datum instanceof osmEntity)) {
                featureListWrap
                    .classed('inspector-hidden', true);

                inspectorWrap
                    .classed('inspector-hidden', false)
                    .classed('inspector-hover', true);

                if (!inspector.entityIDs() || !utilArrayIdentical(inspector.entityIDs(), [datum.id]) || inspector.state() !== 'hover') {
                    inspector
                        .state('hover')
                        .entityIDs([datum.id])
                        .newFeature(false);

                    inspectorWrap
                        .call(inspector);
                }

            } else if (!_current) {
                featureListWrap
                    .classed('inspector-hidden', false);
                inspectorWrap
                    .classed('inspector-hidden', true);
                inspector
                    .state('hide');

            } else if (_wasData || _wasNote || _wasQaItem) {
                _wasNote = false;
                _wasData = false;
                _wasQaItem = false;
                context.container().selectAll('.note').classed('hover', false);
                context.container().selectAll('.qaItem').classed('hover', false);
                sidebar.hide();
            }
        }

        sidebar.hover = _throttle(hover, 200);


        sidebar.intersects = function(extent) {
            var rect = selection.node().getBoundingClientRect();
            return extent.intersects([
                context.projection.invert([0, rect.height]),
                context.projection.invert([rect.width, 0])
            ]);
        };


        sidebar.select = function(ids, newFeature) {
            sidebar.hide();

            if (ids && ids.length) {

                var entity = ids.length === 1 && context.entity(ids[0]);
                if (entity && newFeature && selection.classed('collapsed')) {
                    // uncollapse the sidebar
                    var extent = entity.extent(context.graph());
                    sidebar.expand(sidebar.intersects(extent));
                }

                featureListWrap
                    .classed('inspector-hidden', true);

                inspectorWrap
                    .classed('inspector-hidden', false)
                    .classed('inspector-hover', false);

                // reload the UI even if the ids are the same since the entities
                // themselves may have changed
                inspector
                    .state('select')
                    .entityIDs(ids)
                    .newFeature(newFeature);

                inspectorWrap
                    .call(inspector);

            } else {
                inspector
                    .state('hide');
            }
        };


        sidebar.showPresetList = function() {
            inspector.showList();
        };


        sidebar.show = function(component, element) {
            featureListWrap
                .classed('inspector-hidden', true);
            inspectorWrap
                .classed('inspector-hidden', true);

            if (_current) _current.remove();
            _current = selection
                .append('div')
                .attr('class', 'sidebar-component')
                .call(component, element);
        };


        sidebar.hide = function() {
            featureListWrap
                .classed('inspector-hidden', false);
            inspectorWrap
                .classed('inspector-hidden', true);

            if (_current) _current.remove();
            _current = null;
        };


        sidebar.expand = function(moveMap) {
            if (selection.classed('collapsed')) {
                sidebar.toggle(moveMap);
            }
        };


        sidebar.collapse = function(moveMap) {
            if (!selection.classed('collapsed')) {
                sidebar.toggle(moveMap);
            }
        };


        sidebar.toggle = function(moveMap) {
            var e = d3_event;
            if (e && e.sourceEvent) {
                e.sourceEvent.preventDefault();
            } else if (e) {
                e.preventDefault();
            }

            // Don't allow sidebar to toggle when the user is in the walkthrough.
            if (context.inIntro()) return;

            var isCollapsed = selection.classed('collapsed');
            var isCollapsing = !isCollapsed;
            var isRTL = (localizer.textDirection() === 'rtl');
            var scaleX = isRTL ? 0 : 1;
            var xMarginProperty = isRTL ? 'margin-right' : 'margin-left';

            sidebarWidth = selection.node().getBoundingClientRect().width;

            // switch from % to px
            selection.style('width', sidebarWidth + 'px');

            var startMargin, endMargin, lastMargin;
            if (isCollapsing) {
                startMargin = lastMargin = 0;
                endMargin = -sidebarWidth;
            } else {
                startMargin = lastMargin = -sidebarWidth;
                endMargin = 0;
            }

            selection.transition()
                .style(xMarginProperty, endMargin + 'px')
                .tween('panner', function() {
                    var i = d3_interpolateNumber(startMargin, endMargin);
                    return function(t) {
                        var dx = lastMargin - Math.round(i(t));
                        lastMargin = lastMargin - dx;
                        context.ui().onResize(moveMap ? undefined : [dx * scaleX, 0]);
                    };
                })
                .on('end', function() {
                    selection.classed('collapsed', isCollapsing);

                    // switch back from px to %
                    if (!isCollapsing) {
                        var containerWidth = container.node().getBoundingClientRect().width;
                        var widthPct = (sidebarWidth / containerWidth) * 100;
                        selection
                            .style(xMarginProperty, null)
                            .style('width', widthPct + '%');
                    }
                });
        };

        // toggle the sidebar collapse when double-clicking the resizer
        resizer.on('dblclick', sidebar.toggle);

        // ensure hover sidebar is closed when zooming out beyond editable zoom
        context.map().on('crossEditableZoom.sidebar', function(within) {
            if (!within && !selection.select('.inspector-hover').empty()) {
                hover([]);
            }
        });
    }

    sidebar.showPresetList = function() {};
    sidebar.hover = function() {};
    sidebar.hover.cancel = function() {};
    sidebar.intersects = function() {};
    sidebar.select = function() {};
    sidebar.show = function() {};
    sidebar.hide = function() {};
    sidebar.expand = function() {};
    sidebar.collapse = function() {};
    sidebar.toggle = function() {};

    return sidebar;
}

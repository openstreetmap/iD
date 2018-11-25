import _throttle from 'lodash-es/throttle';

import { drag as d3_drag } from 'd3-drag';
import { interpolateNumber as d3_interpolateNumber } from 'd3-interpolate';

import {
    select as d3_select,
    event as d3_event,
    selectAll as d3_selectAll
} from 'd3-selection';

import {
    osmEntity,
    osmNote
} from '../osm';

import {
    uiDataEditor,
    uiFeatureList,
    uiInspector,
    uiNoteEditor
} from './index';

import { textDirection } from '../util/locale';


export function uiSidebar(context) {
    var inspector = uiInspector(context);
    var dataEditor = uiDataEditor(context);
    var noteEditor = uiNoteEditor(context);
    var _current;
    var _wasData = false;
    var _wasNote = false;


    function sidebar(selection) {
        var container = d3_select('#id-container');
        var minWidth = 280;
        var sidebarWidth;
        var containerWidth;
        var dragOffset;

        var resizer = selection
            .append('div')
            .attr('id', 'sidebar-resizer');

        // Set the initial width constraints
        selection
            .style('min-width', minWidth + 'px')
            .style('max-width', '400px')
            .style('width', '33.3333%');

        resizer.call(d3_drag()
            .container(container.node())
            .on('start', function() {
                // offset from edge of sidebar-resizer
                dragOffset = d3_event.sourceEvent.offsetX - 1;

                sidebarWidth = selection.node().getBoundingClientRect().width;
                containerWidth = container.node().getBoundingClientRect().width;
                var widthPct = (sidebarWidth / containerWidth) * 100;
                selection
                    .style('width', widthPct + '%')    // lock in current width
                    .style('max-width', '85%');        // but allow larger widths
            })
            .on('drag', function() {
                var isRTL = (textDirection === 'rtl');
                var xMarginProperty = isRTL ? 'margin-right' : 'margin-left';

                var x = d3_event.x - dragOffset;
                sidebarWidth = isRTL ? containerWidth - x : x;

                var isCollapsed = selection.classed('collapsed');
                var shouldCollapse = sidebarWidth < minWidth;

                selection.classed('collapsed', shouldCollapse);

                if (shouldCollapse) {
                    if (!isCollapsed) {
                        selection
                            .style(xMarginProperty, '-400px')
                            .style('width', '400px');

                        context.ui().onResize([sidebarWidth - d3_event.dx, 0]);
                    }

                } else {
                    var widthPct = (sidebarWidth / containerWidth) * 100;
                    selection
                        .style(xMarginProperty, null)
                        .style('width', widthPct + '%');

                    if (isCollapsed) {
                        context.ui().onResize([-sidebarWidth, 0]);
                    } else {
                        context.ui().onResize([-d3_event.dx, 0]);
                    }
                }
            })
        );

        var featureListWrap = selection
            .append('div')
            .attr('class', 'feature-list-pane')
            .call(uiFeatureList(context));

        var inspectorWrap = selection
            .append('div')
            .attr('class', 'inspector-hidden inspector-wrap fr');


        function hover(datum) {
            if (datum && datum.__featurehash__) {   // hovering on data
                _wasData = true;
                sidebar
                    .show(dataEditor.datum(datum));

                selection.selectAll('.sidebar-component')
                    .classed('inspector-hover', true);

            } else if (datum instanceof osmNote) {
                if (context.mode().id === 'drag-note') return;
                _wasNote = true;

                sidebar
                    .show(noteEditor.note(datum));

                selection.selectAll('.sidebar-component')
                    .classed('inspector-hover', true);

            } else if (!_current && (datum instanceof osmEntity)) {
                featureListWrap
                    .classed('inspector-hidden', true);

                inspectorWrap
                    .classed('inspector-hidden', false)
                    .classed('inspector-hover', true);

                if (inspector.entityID() !== datum.id || inspector.state() !== 'hover') {
                    inspector
                        .state('hover')
                        .entityID(datum.id);

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

            } else if (_wasData || _wasNote) {
                _wasNote = false;
                _wasData = false;
                d3_selectAll('.note').classed('hover', false);
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


        sidebar.select = function(id, newFeature) {
            if (!_current && id) {
                // uncollapse the sidebar
                if (selection.classed('collapsed')) {
                    var entity = context.entity(id);
                    var extent = entity.extent(context.graph());
                    sidebar.expand(sidebar.intersects(extent));
                }

                featureListWrap
                    .classed('inspector-hidden', true);

                inspectorWrap
                    .classed('inspector-hidden', false)
                    .classed('inspector-hover', false);

                if (inspector.entityID() !== id || inspector.state() !== 'select') {
                    inspector
                        .state('select')
                        .entityID(id)
                        .newFeature(newFeature);

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
            }
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
            var xMarginProperty = textDirection === 'rtl' ? 'margin-right' : 'margin-left';

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
                        context.ui().onResize(moveMap ? undefined : [dx, 0]);
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
    }


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

import _throttle from 'lodash-es/throttle';

import { drag as d3_drag } from 'd3-drag';
import { interpolateNumber as d3_interpolateNumber } from 'd3-interpolate';

import {
    select as d3_select,
    event as d3_event,
    selectAll as d3_selectAll
} from 'd3-selection';

import { uiDataEditor } from './data_editor';
import { textDirection } from '../util/locale';


export function uiSidebar(context) {
    var dataEditor = uiDataEditor(context);
    var _current;
    var _wasData = false;
    var _wasNote = false;
    var _wasQAError = false;


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
            .style('width', '350px');

        resizer.call(d3_drag()
            .container(container.node())
            .on('start', function() {
                // offset from edge of sidebar-resizer
                dragOffset = d3_event.sourceEvent.offsetX - 1;

                resizer.classed('dragging', true);
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
                            .style(xMarginProperty, '-410px')
                            .style('width', '400px');
                    }

                } else {
                    selection
                        .style(xMarginProperty, null)
                        .style('width', sidebarWidth + 'px');
                }
            })
            .on('end', function() {
                resizer.classed('dragging', false);
            })
        );

        var inspectorWrap = selection
            .append('div')
            .attr('class', 'inspector-hidden inspector-wrap entity-editor-pane');


        function hover(datum) {
            // disable hover preview for now
            return;

            if (datum && datum.__featurehash__) {   // hovering on data
                _wasData = true;
                sidebar
                    .show(dataEditor.datum(datum));

                selection.selectAll('.sidebar-component')
                    .classed('inspector-hover', true);

            } else if (!_current) {
                inspectorWrap
                    .classed('inspector-hidden', true);

            } else if (_wasData || _wasNote || _wasQAError) {
                _wasNote = false;
                _wasData = false;
                _wasQAError = false;
                d3_selectAll('.note').classed('hover', false);
                d3_selectAll('.qa_error').classed('hover', false);
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


        sidebar.show = function(component, element) {
            inspectorWrap
                .classed('inspector-hidden', true);

            if (_current) _current.remove();
            _current = selection
                .append('div')
                .attr('class', 'sidebar-component')
                .call(component, element);
        };


        sidebar.hide = function() {
            inspectorWrap
                .classed('inspector-hidden', true);

            if (_current) _current.remove();
            _current = null;
        };


        sidebar.expand = function() {
            if (selection.classed('collapsed')) {
                sidebar.toggle();
            }
        };


        sidebar.collapse = function() {
            if (!selection.classed('collapsed')) {
                sidebar.toggle();
            }
        };


        sidebar.toggle = function() {
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
            var isRTL = (textDirection === 'rtl');
            var xMarginProperty = isRTL ? 'margin-right' : 'margin-left';

            sidebarWidth = selection.node().getBoundingClientRect().width;

            var startMargin, endMargin, lastMargin;
            if (isCollapsing) {
                startMargin = lastMargin = 0;
                endMargin = -sidebarWidth - 10;
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
                    };
                })
                .on('end', function() {
                    selection.classed('collapsed', isCollapsing);

                    if (!isCollapsing) {
                        selection
                            .style(xMarginProperty, null);
                    }
                });
        };

        // toggle the sidebar collapse when double-clicking the resizer
        resizer.on('dblclick', sidebar.toggle);
    }

    sidebar.hover = function() {};
    sidebar.hover.cancel = function() {};
    sidebar.intersects = function() {};
    sidebar.show = function() {};
    sidebar.hide = function() {};
    sidebar.expand = function() {};
    sidebar.collapse = function() {};
    sidebar.toggle = function() {};

    return sidebar;
}

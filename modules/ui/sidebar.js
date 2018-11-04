import _throttle from 'lodash-es/throttle';

import { drag as d3_drag } from 'd3-drag';
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

        var resizer = selection
            .append('div')
            .attr('id', 'sidebar-resizer');

        // set the initial width constraints
        selection.style('min-width', '280px');
        selection.style('max-width', '400px');
        selection.style('width', '33.3333%');

        var container = d3_select('#id-container');
        resizer.call(d3_drag()
            .container(container.node())
            .on('drag', function() {

                var containerWidthPx = container.node().getBoundingClientRect().width;

                var xMarginProperty = textDirection === 'rtl' ? 'margin-right' : 'margin-left';

                // subtact 1px so the mouse stays in the div and maintains the col-resize cursor
                var newWidthPx = textDirection === 'rtl' ? containerWidthPx - d3_event.x-1 : d3_event.x-1;

                var shouldCollapse = newWidthPx < 280;
                container.classed('sidebar-collapsed', shouldCollapse);
                // allow large widths
                selection.style('max-width', '85%');
                if (shouldCollapse) {
                    selection.style(xMarginProperty,'-400px')
                        .style('width', '400px');
                }
                else {

                    var newWidthPercent = (newWidthPx / containerWidthPx) * 100;
                    selection.style(xMarginProperty, null)
                        .style('width', newWidthPercent+'%');
                }
                context.ui().onResize();
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


        sidebar.select = function(id, newFeature) {
            if (!_current && id) {
                // uncollapse the sidebar to show the editor
                sidebar.toggleCollapse(false);

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

        sidebar.toggleCollapse = function(shouldCollapse) {

            if (d3_event && typeof d3_event.preventDefault == 'function') {
                d3_event.preventDefault();
            }

            var container = d3_select('#id-container');
            var collapsing;
            var isCollapsed = container.classed('sidebar-collapsed');
            if (typeof shouldCollapse !== 'undefined') {
                if (shouldCollapse === isCollapsed) {
                    return;
                }
                collapsing = shouldCollapse;
            } else {
                collapsing = !isCollapsed;
            }
            var sidebar = d3_select('#sidebar');
            var xMarginProperty = textDirection === 'rtl' ? 'margin-right' : 'margin-left';
            if (collapsing) {
                var preSidebarWidthInPx = sidebar.node().getBoundingClientRect().width;
                sidebar.style('width', preSidebarWidthInPx+'px');
                sidebar.transition()
                    .style('width', '400px')
                    .style(xMarginProperty,'-400px')
                    .on('end',function(){
                        context.ui().onResize();
                    });
                    container.classed('sidebar-collapsed', true);
            }  else {
                var containerWidthPx = container.node().getBoundingClientRect().width;
                var postSidebarWidthInPx = Math.max(containerWidthPx*0.333333, 280);
                sidebar.transition()
                    .style('width', postSidebarWidthInPx)
                    .style(xMarginProperty, '0px')
                    .on('end',function(){
                        sidebar.style('width', '33.3333%');
                        context.ui().onResize();
                    });
                    container.classed('sidebar-collapsed', false);
            }
        };
        // toggle the sidebar collapse when double-clicking the resizer
        resizer.on('dblclick', sidebar.toggleCollapse);
    }


    sidebar.hover = function() {};
    sidebar.hover.cancel = function() {};
    sidebar.select = function() {};
    sidebar.show = function() {};
    sidebar.hide = function() {};
    sidebar.toggleCollapse = function() {};

    return sidebar;
}

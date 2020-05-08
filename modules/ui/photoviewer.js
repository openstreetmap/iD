import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { svgIcon } from '../svg/icon';
import { utilGetDimensions } from '../util/dimensions';
import { utilRebind } from '../util';
import { services } from '../services';

export function uiPhotoviewer(context) {

    var dispatch = d3_dispatch('resize');

    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';

    function photoviewer(selection) {
        selection
            .append('button')
            .attr('class', 'thumb-hide')
            .on('click', function () {
                if (services.streetside) { services.streetside.hideViewer(context); }
                if (services.mapillary) { services.mapillary.hideViewer(context); }
                if (services.openstreetcam) { services.openstreetcam.hideViewer(context); }
            })
            .append('div')
            .call(svgIcon('#iD-icon-close'));

        function preventDefault() {
            d3_event.preventDefault();
        }

        selection
            .append('button')
            .attr('class', 'resize-handle-xy')
            .on('touchstart touchdown touchend', preventDefault)
            .on(
                _pointerPrefix + 'down',
                buildResizeListener(selection, 'resize', dispatch, { resizeOnX: true, resizeOnY: true })
            );

        selection
            .append('button')
            .attr('class', 'resize-handle-x')
            .on('touchstart touchdown touchend', preventDefault)
            .on(
                _pointerPrefix + 'down',
                buildResizeListener(selection, 'resize', dispatch, { resizeOnX: true })
            );

        selection
            .append('button')
            .attr('class', 'resize-handle-y')
            .on('touchstart touchdown touchend', preventDefault)
            .on(
                _pointerPrefix + 'down',
                buildResizeListener(selection, 'resize', dispatch, { resizeOnY: true })
            );

        services.streetside.loadViewer(context);
        services.mapillary.loadViewer(context);
        services.openstreetcam.loadViewer(context);

        function buildResizeListener(target, eventName, dispatch, options) {

            var resizeOnX = !!options.resizeOnX;
            var resizeOnY = !!options.resizeOnY;
            var minHeight = options.minHeight || 240;
            var minWidth = options.minWidth || 320;
            var pointerId;
            var startX;
            var startY;
            var startWidth;
            var startHeight;

            function startResize() {
                if (pointerId !== (d3_event.pointerId || 'mouse')) return;

                d3_event.preventDefault();
                d3_event.stopPropagation();

                var mapSize = context.map().dimensions();

                if (resizeOnX) {
                    var maxWidth = mapSize[0];
                    var newWidth = clamp((startWidth + d3_event.clientX - startX), minWidth, maxWidth);
                    target.style('width', newWidth + 'px');
                }

                if (resizeOnY) {
                    var maxHeight = mapSize[1] - 90;  // preserve space at top/bottom of map
                    var newHeight = clamp((startHeight + startY - d3_event.clientY), minHeight, maxHeight);
                    target.style('height', newHeight + 'px');
                }

                dispatch.call(eventName, target, utilGetDimensions(target, true));
            }

            function clamp(num, min, max) {
                return Math.max(min, Math.min(num, max));
            }

            function stopResize() {
                if (pointerId !== (d3_event.pointerId || 'mouse')) return;

                d3_event.preventDefault();
                d3_event.stopPropagation();

                // remove all the listeners we added
                d3_select(window)
                    .on('.' + eventName, null);
            }

            return function initResize() {
                d3_event.preventDefault();
                d3_event.stopPropagation();

                pointerId = d3_event.pointerId || 'mouse';

                startX = d3_event.clientX;
                startY = d3_event.clientY;
                var targetRect = target.node().getBoundingClientRect();
                startWidth = targetRect.width;
                startHeight = targetRect.height;

                d3_select(window)
                    .on(_pointerPrefix + 'move.' + eventName, startResize, false)
                    .on(_pointerPrefix + 'up.' + eventName, stopResize, false);

                if (_pointerPrefix === 'pointer') {
                    d3_select(window)
                        .on('pointercancel.' + eventName, stopResize, false);
                }
            };
        }
    }

    photoviewer.onMapResize = function() {
        var photoviewer = context.container().select('.photoviewer');
        var content = context.container().select('.main-content');
        var mapDimensions = utilGetDimensions(content, true);
        // shrink photo viewer if it is too big
        // (-90 preserves space at top and bottom of map used by menus)
        var photoDimensions = utilGetDimensions(photoviewer, true);
        if (photoDimensions[0] > mapDimensions[0] || photoDimensions[1] > (mapDimensions[1] - 90)) {
            var setPhotoDimensions = [
                Math.min(photoDimensions[0], mapDimensions[0]),
                Math.min(photoDimensions[1], mapDimensions[1] - 90),
            ];

            photoviewer
                .style('width', setPhotoDimensions[0] + 'px')
                .style('height', setPhotoDimensions[1] + 'px');

            dispatch.call('resize', photoviewer, setPhotoDimensions);
        }
    };

    return utilRebind(photoviewer, dispatch, 'on');
}

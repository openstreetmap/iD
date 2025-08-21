import {
    select as d3_select
} from 'd3-selection';
import { clamp } from 'lodash-es';

import { t } from '../core/localizer';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { svgIcon } from '../svg/icon';
import { utilGetDimensions } from '../util/dimensions';
import { utilRebind } from '../util';
import { services } from '../services';
import { uiTooltip } from './tooltip';
import { actionChangeTags } from '../actions';
import { geoSphericalDistance } from '../geo';

export function uiPhotoviewer(context) {

    var dispatch = d3_dispatch('resize');

    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';

    const addPhotoIdButton = new Set(['mapillary', 'panoramax']);

    function photoviewer(selection) {
        selection
            .append('button')
            .attr('class', 'thumb-hide')
            .attr('title', t('icons.close'))
            .on('click', function () {
                for (const service of Object.values(services)) {
                    if (typeof service.hideViewer === 'function') {
                        service.hideViewer(context);
                    }
                }
            })
            .append('div')
            .call(svgIcon('#iD-icon-close'));

        function preventDefault(d3_event) {
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

        // update sett_photo_from_viewer button on selection change and when tags change
        context.features().on('change.setPhotoFromViewer', function() {
            setPhotoTagButton();
        });
        context.history().on('change.setPhotoFromViewer', function() {
            setPhotoTagButton();
        });


        function setPhotoTagButton() {
            const service = getServiceId();
            const isActiveForService = addPhotoIdButton.has(service) &&
                services[service].isViewerOpen() &&
                layerEnabled(service) &&
                context.mode().id === 'select';

            renderAddPhotoIdButton(service, isActiveForService);

            function layerEnabled(which) {
                const layers = context.layers();
                const layer = layers.layer(which);
                return layer.enabled();
            }

            function getServiceId() {
                for (const serviceId in services) {
                    const service = services[serviceId];
                    if (typeof service.isViewerOpen === 'function') {
                        if (service.isViewerOpen()) {
                            return serviceId;
                        }
                    }
                }
                return false;
            }

            function renderAddPhotoIdButton(service, shouldDisplay) {
                const button = selection.selectAll('.set-photo-from-viewer')
                    .data(shouldDisplay ? [0] : []);

                button.exit()
                    .remove();

                const buttonEnter = button.enter()
                    .append('button')
                    .attr('class', 'set-photo-from-viewer')
                    .call(svgIcon('#fas-eye-dropper'))
                    .call(uiTooltip()
                        .title(() => t.append('inspector.set_photo_from_viewer.enable'))
                        .placement('right')
                    );

                buttonEnter
                    .select('.tooltip')
                    .classed('dark', true)
                    .style('width', '300px');

                buttonEnter
                    .merge(button)
                    .on('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const activeServiceId = getServiceId();
                        const image = services[activeServiceId].getActiveImage();

                        const action = graph =>
                            context.selectedIDs().reduce((graph, entityID) => {
                                const tags = graph.entity(entityID).tags;
                                const action = actionChangeTags(entityID, {...tags, [activeServiceId]: image.id});
                                return action(graph);
                            }, graph);

                        const annotation = t('operations.change_tags.annotation');
                        context.perform(action, annotation);
                        buttonDisable('already_set');
                    });

                if (service === 'panoramax') {
                    const panoramaxControls = selection.select('.panoramax-wrapper .pnlm-zoom-controls.pnlm-controls');

                    panoramaxControls
                        .style('margin-top', shouldDisplay ? '36px' : '6px');
                }

                if (!shouldDisplay) return;

                const activeImage = services[service].getActiveImage();

                const graph = context.graph();
                const entities = context.selectedIDs()
                    .map(id => graph.hasEntity(id))
                    .filter(Boolean);

                if (entities.map(entity => entity.tags[service])
                    .every(value => value === activeImage?.id)) {
                    buttonDisable('already_set');
                } else if (activeImage && entities
                    .map(entity => entity.extent(context.graph()).center())
                    .every(loc => geoSphericalDistance(loc, activeImage.loc) > 100)) {
                    buttonDisable('too_far');
                } else {
                    buttonDisable(false);
                }
            }

            function buttonDisable(reason) {
                const disabled = reason !== false;
                const button = selection.selectAll('.set-photo-from-viewer').data([0]);
                button.attr('disabled', disabled ? 'true' : null);
                button.classed('disabled', disabled);
                button.call(uiTooltip().destroyAny);
                if (disabled) {
                    button.call(uiTooltip()
                        .title(() => t.append(`inspector.set_photo_from_viewer.disable.${reason}`))
                        .placement('right')
                    );
                } else {
                    button.call(uiTooltip()
                        .title(() => t.append('inspector.set_photo_from_viewer.enable'))
                        .placement('right')
                    );
                }

                button.select('.tooltip')
                    .classed('dark', true)
                    .style('width', '300px');
            }
        }

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

            function startResize(d3_event) {
                if (pointerId !== (d3_event.pointerId || 'mouse')) return;

                d3_event.preventDefault();
                d3_event.stopPropagation();

                var mapSize = context.map().dimensions();

                if (resizeOnX) {
                    var mapWidth = mapSize[0];
                    const viewerMargin = parseInt(d3_select('.photoviewer').style('margin-left'), 10);
                    var newWidth = clamp((startWidth + d3_event.clientX - startX), minWidth, mapWidth - viewerMargin * 2);
                    target.style('width', newWidth + 'px');
                }

                if (resizeOnY) {
                    const menuHeight = utilGetDimensions(d3_select('.top-toolbar'))[1] +
                                       utilGetDimensions(d3_select('.map-footer'))[1];
                    const viewerMargin = parseInt(d3_select('.photoviewer').style('margin-bottom'), 10);
                    var maxHeight = mapSize[1] - menuHeight - viewerMargin * 2;  // preserve space at top/bottom of map
                    var newHeight = clamp((startHeight + startY - d3_event.clientY), minHeight, maxHeight);
                    target.style('height', newHeight + 'px');
                }

                dispatch.call(eventName, target, subtractPadding(utilGetDimensions(target, true), target));
            }

            function stopResize(d3_event) {
                if (pointerId !== (d3_event.pointerId || 'mouse')) return;

                d3_event.preventDefault();
                d3_event.stopPropagation();

                // remove all the listeners we added
                d3_select(window)
                    .on('.' + eventName, null);
            }

            return function initResize(d3_event) {
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
        const menuHeight = utilGetDimensions(d3_select('.top-toolbar'))[1] +
                           utilGetDimensions(d3_select('.map-footer'))[1];
        const viewerMargin = parseInt(d3_select('.photoviewer').style('margin-bottom'), 10);
        // shrink photo viewer if it is too big (preserves space at top and bottom of map used by menus)
        var photoDimensions = utilGetDimensions(photoviewer, true);
        if (photoDimensions[0] > mapDimensions[0] || photoDimensions[1] > (mapDimensions[1] - menuHeight - viewerMargin * 2)) {
            var setPhotoDimensions = [
                Math.min(photoDimensions[0], mapDimensions[0]),
                Math.min(photoDimensions[1], mapDimensions[1] - menuHeight - viewerMargin * 2),
            ];

            photoviewer
                .style('width', setPhotoDimensions[0] + 'px')
                .style('height', setPhotoDimensions[1] + 'px');

            dispatch.call('resize', photoviewer, subtractPadding(setPhotoDimensions, photoviewer));
        }
    };

    function subtractPadding(dimensions, selection) {
        return [
            dimensions[0] - parseFloat(selection.style('padding-left')) - parseFloat(selection.style('padding-right')),
            dimensions[1] - parseFloat(selection.style('padding-top')) - parseFloat(selection.style('padding-bottom'))
        ];
    }

    return utilRebind(photoviewer, dispatch, 'on');
}

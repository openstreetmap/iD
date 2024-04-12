import {
    select as d3_select
} from 'd3-selection';

import { t } from '../core/localizer';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { svgIcon } from '../svg/icon';
import { utilGetDimensions } from '../util/dimensions';
import { utilRebind, utilGetSetValue, utilStringQs } from '../util';
import { services } from '../services';
import { uiTooltip } from './tooltip';

export function uiPhotoviewer(context) {

    var dispatch = d3_dispatch('resize');

    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';

    function photoviewer(selection) {
        selection
            .append('button')
            .attr('class', 'thumb-hide')
            .attr('title', t('icons.close'))
            .on('click', function () {
                if (services.streetside) { services.streetside.hideViewer(context); }
                if (services.mapillary) { services.mapillary.hideViewer(context); }
                if (services.kartaview) { services.kartaview.hideViewer(context); }
                if (services.mapilio) { services.mapilio.hideViewer(context); }
                if (services.vegbilder) { services.vegbilder.hideViewer(context); }
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

        // set_photo_from_viewer button
        let _selectedID = context.selectedIDs();
        context.container().on('click.setPhotoFromViewer', function(e) {
            setPhotoFromViewerButton(e);
        });

        function setPhotoFromViewerButton(e) {
            services.mapillary.ensureViewerLoaded(context).then(() => {
                if (e.target.closest('.mly-wrapper')) {
                    services.mapillary.on('imageChanged.set', function() {
                        MapillaryButtonDisabledUpdate();
                    });
                    return;
                }

                if (!services.mapillary.isViewerOpen()) return;

                if (context.mode().id !== 'select' || !paneCheck() || !(layerStatus('mapillary') && getServiceId() === 'mapillary')) {
                    buttonRemove();
                } else {
                    if (selection.select('.set-photo-from-viewer').empty()) {
                        const button = buttonCreate();
                        button.on('click', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            setMapillaryPhotoId();
                            buttonDisable(true);
                        });
                        MapillaryButtonDisabledUpdate();
                    } else {
                        if (isSelectedIDChanged()) {
                            MapillaryButtonDisabledUpdate();
                            updateSelectedID();
                        }
                    }
                }

                function MapillaryButtonDisabledUpdate() {
                    let activeImageId = services.mapillary.getActiveImage()?.id;

                    const fieldInput = d3_select('.wrap-form-field-mapillary .identifier');
                    if (!fieldInput.empty()) {
                        if (activeImageId === utilGetSetValue(fieldInput)) {
                            buttonDisable(true);
                        } else {
                            buttonDisable(false);
                        }
                    } else {
                        buttonDisable(false);
                    }
                }

                function setMapillaryPhotoId() {
                    function insertIdAndTriggerChangeAtField() {
                        const changeEvent = new Event('change');
                        const service = services.mapillary;
                        // insert id
                        const image = service.getActiveImage();
                        const fieldInput = d3_select('.wrap-form-field-mapillary .identifier');
                        utilGetSetValue(fieldInput, image.id);

                        // trigger change at field
                        fieldInput.node().focus();
                        fieldInput.node().dispatchEvent(changeEvent);
                    }
                    // check if mapillary image id field exist
                    const mapillaryImageIDField = d3_select('.wrap-form-field-mapillary');
                    if (!mapillaryImageIDField.empty()) {
                        insertIdAndTriggerChangeAtField();
                    } else {
                        // open the Mapillary field
                        const comboboxInput = d3_select('.value.combobox-input');
                        const EnterEvent = new KeyboardEvent('keydown', { keyCode: 13 });
                        utilGetSetValue(comboboxInput, 'Mapillary Image ID');
                        comboboxInput.node().focus();
                        comboboxInput.node().dispatchEvent(EnterEvent);

                        insertIdAndTriggerChangeAtField();
                    }
                }
            });


            function layerStatus(which) {
                const layers = context.layers();
                const layer = layers.layer(which);
                return layer.enabled();
            }

            function getServiceId() {
                const hash = utilStringQs(window.location.hash);
                let serviceId;
                if (hash.photo) {
                    let result = hash.photo.split('/');
                    serviceId = result[0];
                }
                return serviceId;
            }

            function paneCheck() {
                const inspectorWrap = d3_select('.inspector-wrap');
                const editorPane = d3_select('.entity-editor-pane');
                const presetPane = d3_select('.preset-list-pane');

                return !inspectorWrap.classed('inspector-hidden') &&
                    !editorPane.classed('hide') &&
                    presetPane.classed('hide');
            }

            function isSelectedIDChanged() {
                const currentSelectId = context.selectedIDs();
                if (JSON.stringify(_selectedID) === JSON.stringify(currentSelectId)) {
                    return false;
                } else {
                    return true;
                }
            }

            function updateSelectedID() {
                _selectedID = context.selectedIDs();
            }

            function buttonCreate() {
                const button = selection.selectAll('.set-photo-from-viewer').data([0]);
                const buttonEnter = button.enter()
                    .append('button')
                    .attr('class', 'set-photo-from-viewer')
                    .call(svgIcon('#iD-operation-merge'))
                    .call(uiTooltip()
                        .title(() => t.append('inspector.set_photo_from_viewer'))
                        .placement('right')
                    );

                buttonEnter.select('.tooltip')
                    .classed('dark', true)
                    .style('width', '300px');

                return buttonEnter;
            }

            function buttonRemove() {
                const button = selection.selectAll('.set-photo-from-viewer').data([0]);
                button.remove();
            }

            function buttonDisable(disabled) {
                const button = selection.selectAll('.set-photo-from-viewer').data([0]);
                button.attr('disabled', disabled ? 'true' : null);
                button.classed('disabled', disabled);
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
                    var maxWidth = mapSize[0];
                    var newWidth = clamp((startWidth + d3_event.clientX - startX), minWidth, maxWidth);
                    target.style('width', newWidth + 'px');
                }

                if (resizeOnY) {
                    var maxHeight = mapSize[1] - 90;  // preserve space at top/bottom of map
                    var newHeight = clamp((startHeight + startY - d3_event.clientY), minHeight, maxHeight);
                    target.style('height', newHeight + 'px');
                }

                dispatch.call(eventName, target, subtractPadding(utilGetDimensions(target, true), target));
            }

            function clamp(num, min, max) {
                return Math.max(min, Math.min(num, max));
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

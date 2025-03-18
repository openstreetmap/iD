import _debounce from 'lodash-es/debounce';
import { select as d3_select } from 'd3-selection';

import { localizer, t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';
import { utilNoAuto } from '../../util';
import { uiSettingsLocalPhotos } from '../settings/local_photos';
import { svgIcon } from '../../svg';

export function uiSectionPhotoOverlays(context) {

    let _savedLayers = [];
    let _layersHidden = false;
    const _streetLayerIDs = ['streetside', 'mapillary', 'mapillary-map-features', 'mapillary-signs', 'kartaview', 'mapilio', 'vegbilder', 'panoramax'];

    var settingsLocalPhotos = uiSettingsLocalPhotos(context)
        .on('change',  localPhotosChanged);

    var layers = context.layers();

    var section = uiSection('photo-overlays', context)
        .label(() => t.append('photo_overlays.title'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    const photoDates = {};
    const now = +new Date();

    /**
     * Calls all draw function
     * @param {*} selection Current HTML selection
     */
    function renderDisclosureContent(selection) {
        var container = selection.selectAll('.photo-overlay-container')
            .data([0]);

        container.enter()
            .append('div')
            .attr('class', 'photo-overlay-container')
            .merge(container)
            .call(drawPhotoItems)
            .call(drawPhotoTypeItems)
            .call(drawDateSlider)
            .call(drawUsernameFilter)
            .call(drawLocalPhotos);
    }

    /**
     * Draws the streetlevels in the right panel
     */
    function drawPhotoItems(selection) {
        var photoKeys = context.photos().overlayLayerIDs();
        var photoLayers = layers.all().filter(function(obj) { return photoKeys.indexOf(obj.id) !== -1; });
        var data = photoLayers.filter(function(obj) {
            if (!obj.layer.supported()) return false;
            if (layerEnabled(obj)) return true;
            if (typeof obj.layer.validHere === 'function') {
                return obj.layer.validHere(context.map().extent(), context.map().zoom());
            }
            return true;
        });

        function layerSupported(d) {
            return d.layer && d.layer.supported();
        }
        function layerEnabled(d) {
            return layerSupported(d) && (d.layer.enabled() || _savedLayers.includes(d.id));
        }
        function layerRendered(d) {
            return d.layer.rendered?.(context.map().zoom()) ?? true;
        }

        var ul = selection
            .selectAll('.layer-list-photos')
            .data([0]);

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-photos')
            .merge(ul);

        var li = ul.selectAll('.list-item-photos')
            .data(data, d => d.id);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', function(d) {
                var classes = 'list-item-photos list-item-' + d.id;
                if (d.id === 'mapillary-signs' || d.id === 'mapillary-map-features') {
                    classes += ' indented';
                }
                return classes;
            });

        var labelEnter = liEnter
            .append('label')
            .each(function(d) {
                var titleID;
                if (d.id === 'mapillary-signs') titleID = 'mapillary.signs.tooltip';
                else if (d.id === 'mapillary') titleID = 'mapillary_images.tooltip';
                else if (d.id === 'kartaview') titleID = 'kartaview_images.tooltip';
                else titleID = d.id.replace(/-/g, '_') + '.tooltip';
                d3_select(this)
                    .call(uiTooltip()
                        .title(() => {
                            if (!layerRendered(d)) {
                                return t.append('street_side.minzoom_tooltip');
                            } else {
                                return t.append(titleID);
                            }
                        })
                        .placement('top')
                    );
            });

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event, d) { toggleLayer(d.id); });

        labelEnter
            .append('span')
            .html(function(d) {
                var id = d.id;
                if (id === 'mapillary-signs') id = 'photo_overlays.traffic_signs';
                return t.html(id.replace(/-/g, '_') + '.title');
            });

        // Update
        li
            .merge(liEnter)
            .classed('active', layerEnabled)
            .selectAll('input')
            .property('disabled', d => !layerRendered(d))
            .property('checked', layerEnabled);
    }

    /**
     * Draws the photo type filter in the right panel
     */
    function drawPhotoTypeItems(selection) {
        var data = context.photos().allPhotoTypes();

        function typeEnabled(d) {
            return context.photos().showsPhotoType(d);
        }

        var ul = selection
            .selectAll('.layer-list-photo-types')
            .data([0]);

        ul.exit()
            .remove();

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-photo-types')
            .merge(ul);

        var li = ul.selectAll('.list-item-photo-types')
            .data(context.photos().shouldFilterByPhotoType() ? data : []);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', function(d) {
                return 'list-item-photo-types list-item-' + d;
            });

        var labelEnter = liEnter
            .append('label')
            .each(function(d) {
                d3_select(this)
                    .call(uiTooltip()
                        .title(() => t.append('photo_overlays.photo_type.' + d + '.tooltip'))
                        .placement('top')
                    );
            });

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event, d) {
                context.photos().togglePhotoType(d, true);
            });

        labelEnter
            .append('span')
            .html(function(d) {
                return t.html('photo_overlays.photo_type.' + d + '.title');
            });


        // Update
        li
            .merge(liEnter)
            .classed('active', typeEnabled)
            .selectAll('input')
            .property('checked', typeEnabled);
    }

    /**
     * Draws the date slider filter in the right panel
     */
    function drawDateSlider(selection){

        var ul = selection
            .selectAll('.layer-list-date-slider')
            .data([0]);

        ul.exit()
            .remove();

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-date-slider')
            .merge(ul);

        var li = ul.selectAll('.list-item-date-slider')
            .data(context.photos().shouldFilterDateBySlider() ? ['date-slider'] : []);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', 'list-item-date-slider');

        var labelEnter = liEnter
        .append('label')
        .each(function() {
            d3_select(this)
                .call(uiTooltip()
                    .title(() => t.append('photo_overlays.age_slider_filter.tooltip'))
                    .placement('top')
                );
        });

        labelEnter
            .append('span')
            .attr('class', 'dateSliderSpan')
            .call(t.append('photo_overlays.age_slider_filter.title'));

        let sliderWrap = labelEnter
            .append('div')
            .attr('class','slider-wrap');

        sliderWrap
            .append('input')
            .attr('type', 'range')
            .attr('min', 0)
            .attr('max', 1)
            .attr('step', 0.001)
            .attr('list', 'photo-overlay-data-range')
            .attr('value', () => dateSliderValue('from'))
            .classed('list-option-date-slider', true)
            .classed('from-date', true)
            .style('direction', localizer.textDirection() === 'rtl' ? 'ltr' : 'rtl')
            .call(utilNoAuto)
            .on('change', function() {
                let value = d3_select(this).property('value');
                setYearFilter(value, true, 'from');
            });
        selection.select('input.from-date').each(function() { this.value = dateSliderValue('from'); });

        sliderWrap.append('div')
            .attr('class', 'date-slider-label');

        sliderWrap
            .append('input')
            .attr('type', 'range')
            .attr('min', 0)
            .attr('max', 1)
            .attr('step', 0.001)
            .attr('list', 'photo-overlay-data-range-inverted')
            .attr('value', () => 1 - dateSliderValue('to'))
            .classed('list-option-date-slider', true)
            .classed('to-date', true)
            .style('display', () => dateSliderValue('to') === 0 ? 'none' : null)
            .style('direction', localizer.textDirection())
            .call(utilNoAuto)
            .on('change', function() {
                let value = d3_select(this).property('value');
                setYearFilter(1-value, true, 'to');
            });
        selection.select('input.to-date').each(function() { this.value = 1 - dateSliderValue('to'); });

        selection.select('.date-slider-label')
            .call(dateSliderValue('from') === 1
                ? t.addOrUpdate('photo_overlays.age_slider_filter.label_all')
                : t.addOrUpdate('photo_overlays.age_slider_filter.label_date', {
                    date: new Date(now - Math.pow(dateSliderValue('from'), 1.45) * 10 * 365.25 * 86400 * 1000).toLocaleDateString(localizer.localeCode()) }));

        sliderWrap.append('datalist')
            .attr('class', 'date-slider-values')
            .attr('id', 'photo-overlay-data-range');
        sliderWrap.append('datalist')
            .attr('class', 'date-slider-values')
            .attr('id', 'photo-overlay-data-range-inverted');

        const dateTicks = new Set();
        for (const dates of Object.values(photoDates)) {
            dates.forEach(date => {
                dateTicks.add(Math.round(1000 * Math.pow((now - date) / (10 * 365.25 * 86400 * 1000), 1/1.45)) / 1000);
            });
        }
        const ticks = selection.select('datalist#photo-overlay-data-range').selectAll('option')
            .data([...dateTicks].concat([1, 0]));
        ticks.exit()
            .remove();
        ticks.enter()
            .append('option')
            .merge(ticks)
            .attr('value', d => d);
        const ticksInverted = selection.select('datalist#photo-overlay-data-range-inverted').selectAll('option')
            .data([...dateTicks].concat([1, 0]));
            ticksInverted.exit()
            .remove();
        ticksInverted.enter()
            .append('option')
            .merge(ticksInverted)
            .attr('value', d => 1 - d);


        li
            .merge(liEnter)
            .classed('active', filterEnabled);

        function filterEnabled() {
            return !!context.photos().fromDate();
        }
    }

    function dateSliderValue(which) {
        const val = which === 'from' ? context.photos().fromDate() : context.photos().toDate();
        if (val) {
            const date = +new Date(val);
            return Math.pow((now - date) / (10 * 365.25 * 86400 * 1000), 1/1.45);
        } else return which === 'from' ? 1 : 0;
    }

    /**
     * Util function to set the slider date filter
     * @param {Number} value The slider value
     * @param {Boolean} updateUrl whether the URL should update or not
     * @param {string} which to set either the 'from' or 'to' date
     */
    function setYearFilter(value, updateUrl, which){
        value = +value + (which === 'from' ? 0.001 : -0.001);

        if (value < 1 && value > 0) {
            const date = new Date(now - Math.pow(value, 1.45) * 10 * 365.25 * 86400 * 1000)
                .toISOString().substring(0,10);
            context.photos().setDateFilter(`${which}Date`, date, updateUrl);
        } else {
            context.photos().setDateFilter(`${which}Date`, null, updateUrl);
        }
    };

    /**
     * Draws the username filter in the right panel
     */
    function drawUsernameFilter(selection) {
        function filterEnabled() {
            return context.photos().usernames();
        }
        var ul = selection
            .selectAll('.layer-list-username-filter')
            .data([0]);

        ul.exit()
            .remove();

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-username-filter')
            .merge(ul);

        var li = ul.selectAll('.list-item-username-filter')
            .data(context.photos().shouldFilterByUsername() ? ['username-filter'] : []);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', 'list-item-username-filter');

        var labelEnter = liEnter
            .append('label')
            .each(function() {
                d3_select(this)
                    .call(uiTooltip()
                        .title(() => t.append('photo_overlays.username_filter.tooltip'))
                        .placement('top')
                    );
            });

        labelEnter
            .append('span')
            .call(t.append('photo_overlays.username_filter.title'));

        labelEnter
            .append('input')
            .attr('type', 'text')
            .attr('class', 'list-item-input')
            .call(utilNoAuto)
            .property('value', usernameValue)
            .on('change', function() {
                var value = d3_select(this).property('value');
                context.photos().setUsernameFilter(value, true);
                d3_select(this).property('value', usernameValue);
            });

        li
            .merge(liEnter)
            .classed('active', filterEnabled);

        function usernameValue() {
            var usernames = context.photos().usernames();
            if (usernames) return usernames.join('; ');
            return usernames;
        }
    }

    /**
     * Toggle on/off the selected layer
     * @param {*} which Id of the selected layer
     */
    function toggleLayer(which) {
        setLayer(which, !showsLayer(which));
    }

    /**
     * @param {*} which Id of the selected layer
     * @returns whether the layer is enabled
     */
    function showsLayer(which) {
        var layer = layers.layer(which);
        if (layer) {
            return layer.enabled();
        }
        return false;
    }

    /**
     * Set the selected layer
     * @param {string} which Id of the selected layer
     * @param {boolean} enabled
     */
    function setLayer(which, enabled) {
        var layer = layers.layer(which);
        if (layer) {
            layer.enabled(enabled);
        }
    }

    function drawLocalPhotos(selection) {
        var photoLayer = layers.layer('local-photos');
        var hasData = photoLayer && photoLayer.hasData();
        var showsData = hasData && photoLayer.enabled();

        var ul = selection
            .selectAll('.layer-list-local-photos')
            .data(photoLayer ? [0] : []);

        // Exit
        ul.exit()
            .remove();

        // Enter
        var ulEnter = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-local-photos');

        var localPhotosEnter = ulEnter
            .append('li')
            .attr('class', 'list-item-local-photos');

        var localPhotosLabelEnter = localPhotosEnter
            .append('label')
            .call(uiTooltip().title(() => t.append('local_photos.tooltip')));

        localPhotosLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() { toggleLayer('local-photos'); });

        localPhotosLabelEnter
            .call(t.append('local_photos.header'));

        localPhotosEnter
            .append('button')
            .attr('class', 'open-data-options')
            .call(uiTooltip()
                .title(() => t.append('local_photos.tooltip_edit'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                editLocalPhotos();
            })
            .call(svgIcon('#iD-icon-more'));

        localPhotosEnter
            .append('button')
            .attr('class', 'zoom-to-data')
            .call(uiTooltip()
                .title(() => t.append('local_photos.zoom'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                if (d3_select(this).classed('disabled')) return;

                d3_event.preventDefault();
                d3_event.stopPropagation();
                photoLayer.fitZoom();
            })
            .call(svgIcon('#iD-icon-framed-dot', 'monochrome'));

        // Update
        ul = ul
            .merge(ulEnter);

        ul.selectAll('.list-item-local-photos')
            .classed('active', showsData)
            .selectAll('label')
            .classed('deemphasize', !hasData)
            .selectAll('input')
            .property('disabled', !hasData)
            .property('checked', showsData);

        ul.selectAll('button.zoom-to-data')
            .classed('disabled', !hasData);
    }

    function editLocalPhotos() {
        context.container()
            .call(settingsLocalPhotos);
    }

    function localPhotosChanged(d) {
        var localPhotosLayer = layers.layer('local-photos');

        localPhotosLayer.fileList(d);
    }

    /**
     * Toggles StreetView on/off
     */
    function toggleStreetSide(){
        let layerContainer = d3_select('.photo-overlay-container');
        if (!_layersHidden){
            layers.all().forEach(d => {
                if (_streetLayerIDs.includes(d.id)) {
                    if (showsLayer(d.id)) _savedLayers.push(d.id);
                    setLayer(d.id, false);
                }
            });
            layerContainer.classed('disabled-panel', true);
        } else {
            _savedLayers.forEach(d => {
                setLayer(d, true);
            });
            _savedLayers = [];
            layerContainer.classed('disabled-panel', false);
        }
        _layersHidden = !_layersHidden;
    };

    context.layers().on('change.uiSectionPhotoOverlays', section.reRender);
    context.photos().on('change.uiSectionPhotoOverlays', section.reRender);
    context.layers().on('photoDatesChanged.uiSectionPhotoOverlays', function(service, dates) {
        photoDates[service] = dates.map(date => +new Date(date));
        section.reRender();
    });
    context.keybinding().on('⇧P', toggleStreetSide);

    context.map()
        .on('move.photo_overlays',
            _debounce(function() {
                // layers in-view may have changed due to map move
                window.requestIdleCallback(section.reRender);
            }, 1000)
        );

    return section;
}

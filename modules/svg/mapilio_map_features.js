import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { services } from '../services';
import { svgPointTransform } from './helpers';

const spriteImageUrl = 'https://end.mapilio.com/sprites/sprites@2x.png';
const spriteJsonUrl = 'https://end.mapilio.com/sprites/sprites@2x.json';

export function svgMapilioMapFeatures(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const minZoom = 16;
    let layer = d3_select(null);
    let _mapilio;
    let _spriteData = null;

    function init() {
        if (svgMapilioMapFeatures.initialized) return;
        svgMapilioMapFeatures.enabled = false;
        svgMapilioMapFeatures.initialized = true;

        loadSpriteData();
    }

    // Sprite verilerini yükleme
    function loadSpriteData() {
        fetch(spriteJsonUrl)
            .then(response => response.json())
            .then(data => {
                _spriteData = data;
            })
            .catch(err => {
                console.error('Sprite data loading error:', err);
            });
    }

    function getService() {
        if (services.mapilio && !_mapilio) {
            _mapilio = services.mapilio;
            _mapilio.event
                .on('loadedMapFeatures', throttledRedraw);
        } else if (!services.mapilio && _mapilio) {
            _mapilio = null;
        }

        return _mapilio;
    }

    function showLayer() {
        const service = getService();
        if (!service) return;

        editOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
    }

    function hideLayer() {
        throttledRedraw.cancel();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', editOff);
    }

    function editOn() {
        layer.style('display', 'block');
    }

    function editOff() {
        layer.selectAll('.map-feature').remove();
        layer.style('display', 'none');
    }

    function click(d3_event, feature) {
        // console.log('Map feature clicked:', feature);
    }

    function mouseover(d3_event, feature) {
        d3_select(this).classed('highlighted', true);
    }

    function mouseout() {
        layer.selectAll('.map-feature').classed('highlighted', false);
    }

    function transform(d) {
        return svgPointTransform(projection)(d);
    }

    function getSpriteIcon(featureType) {
        if (!_spriteData || !featureType) {
            return null;
        }

        // Feature type'a göre sprite'ı bul. detect-reg-stop-c1", "inst-traffic-light-upright"... gibi
        const spriteKey = featureType;

        if (_spriteData[spriteKey]) {
            return _spriteData[spriteKey];
        }

        // Eğer tam eşleşme yoksa, benzer bir ikon bul
        const keys = Object.keys(_spriteData);
        const matchingKey = keys.find(key => key.includes(featureType.toLowerCase()));

        return matchingKey ? _spriteData[matchingKey] : null;
    }

    async function update() {
        const zoom = ~~context.map().zoom();
        const service = getService();

        let mapFeatures = (service && zoom >= minZoom ? service.mapFeatures(projection) : []);

        const groups = layer
            .selectAll('.map-feature')
            .data(mapFeatures, function (d) { return d.id; });

        groups.exit().remove();

        const groupsEnter = groups.enter()
            .append('g')
            .attr('class', 'map-feature')
            .on('mouseenter', mouseover)
            .on('mouseleave', mouseout)
            .on('click', click);

        // Sprite icon için div ekle
        groupsEnter
            .append('foreignObject')
            .attr('width', 48)
            .attr('height', 48)
            .attr('x', -24) // Ortalamak için
            .attr('y', -24)
            .append('xhtml:div')
            .attr('class', 'map-feature-icon');

        const merged = groups.merge(groupsEnter);

        merged.attr('transform', transform);

        // Her map-feature için sprite icon'u ayarlama
        merged.select('.map-feature-icon')
            .style('width', '48px')
            .style('height', '48px')
            .style('background-image', `url(${spriteImageUrl})`)
            .style('background-repeat', 'no-repeat')
            .style('scale',0.5)
            .style('opacity',0.7)
            .each(function (d) {
                const iconType = d.properties && d.properties.class_code;
                const spriteInfo = getSpriteIcon(iconType);

                if (spriteInfo) {
                    d3_select(this)
                        .style('background-position', `-${spriteInfo.x}px -${spriteInfo.y}px`)
                        .style('width', `${spriteInfo.width}px`)
                        .style('height', `${spriteInfo.height}px`);
                } else {
                    d3_select(this)
                        .style('background-position', '0px 0px')
                        .style('width', '48px')
                        .style('height', '48px');
                }
            });
    }

    function drawMapFeatures(selection) {
        const enabled = svgMapilioMapFeatures.enabled;
        const service = getService();

        layer = selection.selectAll('.layer-mapilio-features')
            .data(service ? [0] : []);

        layer.exit().remove();

        const layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-mapilio-features')
            .style('display', enabled ? 'block' : 'none');

        layer = layerEnter.merge(layer);

        if (enabled) {
            let zoom = ~~context.map().zoom();
            if (service && zoom >= minZoom) {
                editOn();
                update();
                service.loadMapFeatures(projection);
            } else {
                editOff();
            }
        }
    }

    drawMapFeatures.enabled = function (_) {
        if (!arguments.length) return svgMapilioMapFeatures.enabled;
        svgMapilioMapFeatures.enabled = _;
        if (svgMapilioMapFeatures.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };

    drawMapFeatures.supported = function () {
        return !!getService();
    };

    drawMapFeatures.rendered = function (zoom) {
        return zoom >= minZoom;
    };

    init();
    return drawMapFeatures;
}
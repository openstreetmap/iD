import { throttle } from 'es-toolkit';
import { select as d3_select } from 'd3-selection';
import { services } from '../services';
import type { Projection } from '../geo/raw_mercator';
import type { Dispatch } from 'd3';
import { type CommonsPhoto } from '../services/commons';
import { svgPointTransform } from './helpers';


let _enabled = false;

const minZoom = 16;
const viewFieldZoomLevel = 18;

export function svgCommonsImages(
    projection: Projection,
    context: iD.Context,
    dispatch: Dispatch<object, {
        change: [];
        photoDatesChanged: [provider: string, dates: unknown[]];
    }>,
) {
    const pointTransform = svgPointTransform(projection);
    const throttledRedraw = throttle(() => dispatch.call('change'), 1000);
    let layer: d3.Selection<SVGGElement> = d3_select(null!);

    services.commons?.on('loadedImages', throttledRedraw);


    function transform(d: CommonsPhoto) {
        let t = pointTransform(d);
        if (d.heading !== undefined) {
            t += ` rotate(${Math.floor(d.heading)},0,0)`;
        }
        return t;
    }

    function filterImages(photos: CommonsPhoto[], skipDateFilter = false) {
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();
        const usernames = context.photos().usernames();

        if (fromDate && !skipDateFilter) {
            photos = photos.filter((photo) => +photo.date >= +new Date(fromDate));
        }
        if (toDate && !skipDateFilter) {
            photos = photos.filter((photo) => +photo.date <= +new Date(toDate));
        }
        if (usernames) {
            photos = photos.filter((photo) => photo.photo.imageinfo && usernames.includes(photo.photo.imageinfo[0].user));
        }

        return photos;
    }

    function showLayer() {
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
        layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }

    function click(d3_event: MouseEvent, image: CommonsPhoto) {
        services.commons.ensureViewerLoaded(context);
        services.commons
            .showViewer(context)
            .selectImage(context, image.photo.pageid);

        context.map().centerEase(image.loc);
    }

    function mouseover(d3_event: MouseEvent, image: CommonsPhoto) {
        services.commons.setStyles(context, image);
    }


    function mouseout() {
        services.commons.setStyles(context, undefined);
    }

    function update(this: any) {
        const zoom = ~~context.map().zoom();
        const showViewfields = (zoom >= viewFieldZoomLevel);

        let images = services.commons && zoom >= minZoom
            ? services.commons.getImages(projection)
            : [];

        dispatch.call('photoDatesChanged', this, 'commons', images.map(image => image.date));

        images = filterImages(images);

        const activeImage = services.commons.activeImage;
        const activeImageId = activeImage ? activeImage.photo.pageid : null;

        const groups = layer
            .selectAll<SVGGElement, CommonsPhoto>('.viewfield-group')
            .data(images, d => d.photo.pageid);

        // exit
        groups.exit().remove();

        // enter
        const groupsEnter = groups.enter()
            .append('g')
            .attr('class', 'viewfield-group')
            .on('mouseenter', mouseover)
            .on('mouseleave', mouseout)
            .on('click', click);

        groupsEnter
            .append('g')
            .attr('class', 'viewfield-scale');

        // update
        const markers = groups
            .merge(groupsEnter)
            .sort((a, b) => {
                // the selected photo is always the topmost
                if (a.photo.pageid === activeImageId) return 1;
                if (b.photo.pageid === activeImageId) return -1;
                // put the newest on top, in case there are many close together
                return +a.date - +b.date;
            })
            .attr('transform', transform)
            .select('.viewfield-scale');

        markers.selectAll('circle')
            .data([0])
            .enter()
            .append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('r', '6');

        const viewfields = markers.selectAll<SVGPathElement, CommonsPhoto>('.viewfield')
            .data(d => showViewfields ? [d] : []);

        viewfields.exit().remove();

        viewfields.enter()
            .insert('path', 'circle')
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .merge(viewfields)
            .attr('d', d => d.heading === undefined
                ? 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0'
                : 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z');

        services.commons.setStyles(context, undefined);
    }

    const drawImages = function (this: any, selection: d3.Selection<SVGGElement>) {
        layer = selection.selectAll<SVGGElement, 0>('.layer-commons')
            .data([0]);

        layer.exit().remove();

        const layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-commons')
            .style('display', _enabled ? 'block' : 'none');

        layer = layerEnter.merge(layer);

        if (_enabled) {
            let zoom = ~~context.map().zoom();
            if (zoom >= minZoom) {
                editOn();
                update();
                services.commons.loadTiles(projection);
            } else {
                editOff();
                dispatch.call('photoDatesChanged', this, 'commons', []);
                services.commons.hideViewer(context);
            }
        } else {
            dispatch.call('photoDatesChanged', this, 'commons', []);
        }
    };

    drawImages.enabled = function(_: boolean) {
        if (!arguments.length) return _enabled;
        _enabled = _;
        if (_enabled) {
            showLayer();
            context.photos().on('change.commons_images', update);
        } else {
            hideLayer();
            context.photos().on('change.commons_images', null);
        }
        dispatch.call('change');
        return this;
    };


    drawImages.supported = () => true;

    drawImages.rendered = function(zoom: number) {
      return zoom >= minZoom;
    };


    return drawImages;
}

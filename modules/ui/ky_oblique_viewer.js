import { fromUrl } from 'geotiff';
import { select as d3_select } from 'd3-selection';

export function uiKyObliqueViewer() {
    let _image;
    let _angle = 'nadir';
    let _canvas;
    let _tiff;
    let _loading = false;

    function render(selection) {
        let wrap = selection.selectAll('.ky-oblique-wrapper')
            .data([0]);

        let wrapEnter = wrap.enter()
            .append('div')
            .attr('class', 'photo-wrapper ky-oblique-wrapper hide');

        wrapEnter
            .append('div')
            .attr('class', 'photo-attribution fillD');

        let controlsEnter = wrapEnter
            .append('div')
            .attr('class', 'photo-controls-wrap')
            .append('div')
            .attr('class', 'photo-controls');

        ['nadir', 'forward', 'backward', 'left', 'right'].forEach(angle => {
            controlsEnter
                .append('button')
                .attr('class', 'angle-button')
                .classed('active', angle === _angle)
                .text(angle.charAt(0).toUpperCase() + angle.slice(1))
                .on('click', () => setAngle(angle));
        });

        wrapEnter
            .append('div')
            .attr('class', 'ky-oblique-image-wrap')
            .append('canvas')
            .attr('class', 'ky-oblique-canvas');

        wrap = wrapEnter.merge(wrap);
        _canvas = wrap.select('canvas').node();

        if (_image) {
            updateImage();
        }
    }

    async function setAngle(angle) {
        _angle = angle;
        d3_select('.ky-oblique-wrapper').selectAll('.angle-button')
            .classed('active', d => d === _angle);

        if (_image) {
            await updateImage();
        }
    }

    async function updateImage() {
        if (!_image || !_image.shots || !_image.shots[_angle]) return;
        if (_loading) return;

        _loading = true;
        const url = _image.shots[_angle];

        try {
            _tiff = await fromUrl(url);
            const image = await _tiff.getImage();
            const width = image.getWidth();
            const height = image.getHeight();

            _canvas.width = width;
            _canvas.height = height;

            const rgb = await image.readRGB();
            const ctx = _canvas.getContext('2d');
            const imageData = ctx.createImageData(width, height);

            for (let i = 0; i < rgb.length; i++) {
                imageData.data[i] = rgb[i];
            }

            // geotiff.js readRGB returns RGB, we need RGBA for imageData
            const data = imageData.data;
            let j = 0;
            for (let i = 0; i < rgb.length; i += 3) {
                data[j++] = rgb[i];
                data[j++] = rgb[i+1];
                data[j++] = rgb[i+2];
                data[j++] = 255; // Alpha
            }

            ctx.putImageData(imageData, 0, 0);

            const attribution = d3_select('.ky-oblique-wrapper .photo-attribution');
            attribution.text('KyFromAbove');

        } catch {
            // Failed to load COG
        } finally {
            /* eslint-disable-next-line require-atomic-updates */
            _loading = false;
        }
    }

    render.image = function(_) {
        if (!arguments.length) return _image;
        _image = _;
        return render;
    };

    render.show = function() {
        d3_select('.ky-oblique-wrapper').classed('hide', false);
        return render;
    };

    render.hide = function() {
        d3_select('.ky-oblique-wrapper').classed('hide', true);
        return render;
    };

    return render;
}

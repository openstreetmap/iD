import { zoomTransform as d3_zoomTransform } from 'd3-zoom';

import { t } from '../core/localizer';


const zoomControls = [{
    id: 'photo-zoom-in',
    label: '+',
    title: 'zoom.in',
    factor: 2
}, {
    id: 'photo-zoom-out',
    label: '−',
    title: 'zoom.out',
    factor: 0.5
}];


export function photoZoom(zoom, target) {
    return function(selection) {
        let buttons = selection.selectAll('button.photo-zoom')
            .data(zoomControls);

        buttons.exit()
            .remove();

        const buttonsEnter = buttons.enter()
            .append('button')
            .attr('type', 'button')
            .attr('class', d => `photo-zoom ${d.id}`)
            .attr('title', d => t(d.title))
            .attr('aria-label', d => t(d.title))
            .on('click.photo-zoom', function(d3_event, d) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                target.call(zoom.scaleBy, d.factor);
            })
            .text(d => d.label);

        buttons = buttonsEnter.merge(buttons);

        function updateButtons(transform) {
            const [minScale, maxScale] = zoom.scaleExtent();
            buttons.property('disabled', d => {
                return d.factor > 1 ? transform.k >= maxScale : transform.k <= minScale;
            });
        }

        zoom.on('zoom.photo-controls', d3_event => updateButtons(d3_event.transform));
        updateButtons(d3_zoomTransform(target.node()));
    };
}

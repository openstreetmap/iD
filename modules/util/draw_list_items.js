import { tooltip } from './tooltip';
import { t } from './locale';
import { uiTooltipHtml } from '../ui/tooltipHtml';
import { svgIcon } from '../svg';

export function utilDrawListItems(selection, context, data, type, name, change, active) {

    var layers = context.layers();

    var autoHideList = ['feature', 'keepRight'];

    function autoHiddenFeature(d) {
        if (d.type === 'kr_error') return context.errors().autoHidden(d);
        return context.features().autoHidden(d);
    }

    function showsLayer(which) {
        var layer = layers.layer(which);
        if (layer) {
            return layer.enabled();
        }
        return false;
    }


    var items = selection.selectAll('li')
        .data(data);

    // Exit
    items.exit()
        .remove();

    // Enter
    var enter = items.enter()
        .append('li')
        .attr('class', 'layer')
        .call(tooltip()
            .html(true)
            .title(function(d) {
                var tip = t(name + '.' + d + '.tooltip'),
                    key = (d === 'wireframe' ? t('area_fill.wireframe.key') : null);


                if (autoHideList.includes(name) && autoHiddenFeature(d)) {
                    var msg = showsLayer('osm') ? t('map_data.autohidden') : t('map_data.osmhidden');
                    tip += '<div>' + msg + '</div>';
                }
                return uiTooltipHtml(tip, key);
            })
            .placement('top')
        );

    var label = enter
        .append('label');

    label
        .append('input')
        .attr('type', type)
        .attr('name', name)
        .on('change', change);

    label
        .append('span')
        .text(function(d) { return t(name + '.' + d + '.description'); });


    // Update
    items = items
        .merge(enter);

    items
        .classed('active', active)
        .selectAll('input')
        .property('checked', active)
        .property('indeterminate', function(d) {
            return (autoHideList.includes(name) && autoHiddenFeature(d));
        });
}
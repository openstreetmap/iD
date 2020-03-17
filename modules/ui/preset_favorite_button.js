import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg/icon';

export function uiPresetFavoriteButton(preset, geom, context, klass) {

    var presetFavorite = {};

    var _button = d3_select(null);


    presetFavorite.button = function(selection) {

        var canFavorite = geom !== 'relation' && preset.searchable !== false;

        _button = selection.selectAll('.preset-favorite-button')
            .data(canFavorite ? [0] : []);

        _button.exit().remove();

        _button = _button.enter()
            .insert('button', '.tag-reference-button')
            .attr('class', 'preset-favorite-button ' + klass)
            .attr('title', t('icons.favorite'))
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-favorite'))
            .merge(_button);

        _button
            .on('click', function () {
                d3_event.stopPropagation();
                d3_event.preventDefault();

                context.presets().toggleFavorite(preset);

                update();
            });

        update();
    };

    function update() {
        _button
            .classed('active', context.presets().favoriteMatching(preset));
    }

    context.presets().on('favoritePreset.button-' + preset.safeid, update);

    return presetFavorite;
}

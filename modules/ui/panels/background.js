import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';


export function uiPanelBackground(context) {
    var background = context.background();
    var currSource = null;
    var currZoom = '';
    var currVintage = '';


    function redraw(selection) {
        if (currSource !== background.baseLayerSource().name()) {
            currSource = background.baseLayerSource().name();
            currZoom = '';
            currVintage = '';
        }

        selection.html('');

        var list = selection
            .append('ul')
            .attr('class', 'background-info');

        list
            .append('li')
            .text(currSource);

        list
            .append('li')
            .text(t('info_panels.background.zoom') + ': ')
            .append('span')
            .attr('class', 'zoom')
            .text(currZoom);

        list
            .append('li')
            .text(t('info_panels.background.vintage') + ': ')
            .append('span')
            .attr('class', 'vintage')
            .text(currVintage);

        if (!currVintage) {
            debouncedGetVintage(selection);
        }

        var toggle = context.getDebug('tile') ? 'hide_tiles' : 'show_tiles';

        selection
            .append('a')
            .text(t('info_panels.background.' + toggle))
            .attr('href', '#')
            .attr('class', 'button button-toggle-tiles')
            .on('click', function() {
                d3.event.preventDefault();
                context.setDebug('tile', !context.getDebug('tile'));
                selection.call(redraw);
            });
    }


    var debouncedGetVintage = _.debounce(getVintage, 250);
    function getVintage(selection) {
        var tile = d3.select('.layer-background img.tile-center');   // tile near viewport center
        if (tile.empty()) return;

        var d = tile.datum(),
            zoom = (d && d.length >= 3 && d[2]) || Math.floor(context.map().zoom()),
            center = context.map().center();

        currZoom = String(zoom);
        selection.selectAll('.zoom')
            .text(currZoom);

        if (!d || !d.length >= 3) return;
        background.baseLayerSource().getVintage(center, d, function(err, result) {
            currVintage = (result && result.range) || t('info_panels.background.unknown');
            selection.selectAll('.vintage')
                .text(currVintage);
        });
    }


    var panel = function(selection) {
        selection.call(redraw);

        context.map()
            .on('drawn.info-background', function() {
                selection.call(redraw);
            })
            .on('move.info-background', function() {
                selection.call(debouncedGetVintage);
            });

    };

    panel.off = function() {
        context.map()
            .on('drawn.info-background', null)
            .on('move.info-background', null);
    };

    panel.id = 'background';
    panel.title = t('info_panels.background.title');
    panel.key = t('info_panels.background.key');


    return panel;
}

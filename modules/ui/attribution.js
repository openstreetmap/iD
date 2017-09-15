import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../util/locale';


export function uiAttribution(context) {
    var selection;


    function attribution(data, klass) {
        var div = selection.selectAll('.' + klass)
            .data([0]);

        div = div.enter()
            .append('div')
            .attr('class', klass)
            .merge(div);


        var background = div.selectAll('.attribution')
            .data(data, function(d) { return d.name(); });

        background.exit()
            .remove();

        background = background.enter()
            .append('span')
            .attr('class', 'attribution')
            .each(function(d) {
                if (d.terms_html) {
                    d3.select(this)
                        .html(d.terms_html);
                    return;
                }

                var selection;
                if (d.terms_url) {
                    selection = d3.select(this)
                        .append('a')
                        .attr('href', d.terms_url)
                        .attr('target', '_blank');
                } else {
                    selection = d3.select(this);
                }


                var id_safe = d.id.replace('.', '<TX_DOT>');
                var terms_text = t('imagery.' + id_safe + '.attribution.text',
                    { default: d.terms_text || d.id || d.name() }
                );

                if (d.icon && !d.overlay) {
                    selection
                        .append('img')
                        .attr('class', 'source-image')
                        .attr('src', d.icon);
                }

                selection
                    .append('span')
                    .attr('class', 'attribution-text')
                    .text(terms_text);
            })
            .merge(background);


        var copyright = background.selectAll('.copyright-notice')
            .data(function(d) {
                var notice = d.copyrightNotices(context.map().zoom(), context.map().extent());
                return notice ? [notice] : [];
            });

        copyright.exit()
            .remove();

        copyright = copyright.enter()
            .append('span')
            .attr('class', 'copyright-notice')
            .merge(copyright);

        copyright
            .text(String);
    }


    function update() {
        attribution([context.background().baseLayerSource()], 'base-layer-attribution');
        attribution(context.background().overlayLayerSources().filter(function (s) {
            return s.validZoom(context.map().zoom());
        }), 'overlay-layer-attribution');
    }


    return function(select) {
        selection = select;

        context.background()
            .on('change.attribution', update);

        context.map()
            .on('move.attribution', _.throttle(update, 400, {leading: false}));

        update();
    };
}

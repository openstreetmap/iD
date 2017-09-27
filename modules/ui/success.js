import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { svgIcon } from '../svg';
import { utilRebind } from '../util/rebind';


export function uiSuccess(context) {
    var dispatch = d3_dispatch('cancel'),
        changeset;


    function success(selection) {
        var header = selection
            .append('div')
            .attr('class', 'header fillL');

        header
            .append('button')
            .attr('class', 'fr')
            .on('click', function() { dispatch.call('cancel'); })
            .call(svgIcon('#icon-close'));

        header
            .append('h3')
            .text(t('success.just_edited'));

        var body = selection
            .append('div')
            .attr('class', 'body save-success fillL');

        body
            .append('p')
            .html(t('success.help_html'));

        body
            .append('a')
            .attr('class', 'details')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .call(svgIcon('#icon-out-link', 'inline'))
            .attr('href', t('success.help_link_url'))
            .append('span')
            .text(t('success.help_link_text'));

        var osm = context.connection();
        if (!osm) return;

        var changesetURL = osm.changesetURL(changeset.id);

        var viewOnOsm = body
            .append('a')
            .attr('class', 'button col12 osm')
            .attr('target', '_blank')
            .attr('href', changesetURL);

        viewOnOsm
            .append('svg')
            .attr('class', 'logo logo-osm')
            .append('use')
            .attr('xlink:href', '#logo-osm');

        viewOnOsm
            .append('div')
            .text(t('success.view_on_osm'));

        var message = (changeset.tags.comment || t('success.edited_osm')).substring(0, 130) +
            ' ' + changesetURL;

        var sharing = [
            { key: 'facebook', value: 'https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(changesetURL) },
            { key: 'twitter', value: 'https://twitter.com/intent/tweet?source=webclient&text=' + encodeURIComponent(message) },
            { key: 'google', value: 'https://plus.google.com/share?url=' + encodeURIComponent(changesetURL) }
        ];

        body.selectAll('.button.social')
            .data(sharing)
            .enter()
            .append('a')
            .attr('class', 'button social col4')
            .attr('target', '_blank')
            .attr('href', function(d) { return d.value; })
            .call(tooltip()
                .title(function(d) { return t('success.' + d.key); })
                .placement('bottom'))
            .each(function(d) { d3_select(this).call(svgIcon('#logo-' + d.key, 'social')); });
    }


    success.changeset = function(_) {
        if (!arguments.length) return changeset;
        changeset = _;
        return success;
    };


    return utilRebind(success, dispatch, 'on');
}

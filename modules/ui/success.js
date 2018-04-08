import _filter from 'lodash-es/filter';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { data } from '../../data';
import { tooltip } from '../util/tooltip';
import { svgIcon } from '../svg';
import { utilRebind } from '../util/rebind';


export function uiSuccess(context) {
    var dispatch = d3_dispatch('cancel');
    var _changeset;
    var _location;


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

        var summary = body
            .append('div')
            .attr('class', 'save-summary');

        summary
            .append('h3')
            .html(t('success.thank_you' + (_location ? '_location' : ''), { where: _location }));

        summary
            .append('p')
            .html(t('success.help_html'))
            .append('a')
            .attr('class', 'details')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', t('success.help_link_url'))
            .call(svgIcon('#icon-out-link', 'inline'))
            .append('span')
            .text(t('success.help_link_text'));

        var osm = context.connection();
        if (!osm) return;

        var changesetURL = osm.changesetURL(_changeset.id);

        var table = summary
            .append('table')
            .attr('class', 'summary-table');

        var row = table
            .append('tr')
            .attr('class', 'summary-row');

        row
            .append('td')
            .attr('class', 'cell-icon summary-icon')
            .append('a')
            .attr('target', '_blank')
            .attr('href', changesetURL)
            .append('svg')
            .attr('class', 'logo-small')
            .append('use')
            .attr('xlink:href', '#logo-osm');

        var summaryDetail = row
            .append('td')
            .attr('class', 'cell-detail summary-detail');

        summaryDetail
            .append('a')
            .attr('class', 'cell-detail summary-detail-view')
            .attr('target', '_blank')
            .attr('href', changesetURL)
            .text(t('success.view_on_osm'));

        summaryDetail
            .append('div')
            .text(t('success.changeset_id', { changeset_id: _changeset.id }));


        // Gather community polygon IDs intersecting the map..
        var matchFeatures = data.community.query(context.map().center(), true);
        var matchIDs = matchFeatures.map(function(feature) { return feature.id; });

        // Gather community resources that are either global or match a polygon.
        var matchResources = _filter(data.community.resources, function(v) {
            return v.featureId === null || matchIDs.indexOf(v.featureId) !== -1;
        });

        if (matchResources.length) {
            body
                .call(showCommunityLinks, matchResources);
        } else {
            body
                .call(showShareLinks, changesetURL);
        }
    }


    function showShareLinks(selection, changesetURL) {
        var shareLinks = selection
            .append('div')
            .attr('class', 'save-shareLinks');

        var message = (_changeset.tags.comment || t('success.edited_osm')).substring(0, 130) +
            ' ' + changesetURL;

        var sharing = [
            { key: 'facebook', value: 'https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(changesetURL) },
            { key: 'twitter', value: 'https://twitter.com/intent/tweet?source=webclient&text=' + encodeURIComponent(message) },
            { key: 'google', value: 'https://plus.google.com/share?url=' + encodeURIComponent(changesetURL) }
        ];

        shareLinks.selectAll('.button.social')
            .data(sharing)
            .enter()
            .append('a')
            .attr('class', 'button social col4')
            .attr('target', '_blank')
            .attr('href', function(d) { return d.value; })
            .call(tooltip()
                .title(function(d) { return t('success.' + d.key); })
                .placement('bottom')
            )
            .each(function(d) { d3_select(this).call(svgIcon('#logo-' + d.key, 'social')); });
    }


    function showCommunityLinks(selection, matchResources) {
        var communityLinks = selection
            .append('div')
            .attr('class', 'save-communityLinks');

        communityLinks
            .append('h3')
            .html(t('success.like_osm'));

        var table = communityLinks
            .append('table')
            .attr('class', 'community-table');

        var row = table.selectAll('.community-row')
            .data(matchResources);

        var rowEnter = row.enter()
            .append('tr')
            .attr('class', 'community-row');

        rowEnter
            .append('td')
            .attr('class', 'cell-icon community-icon')
            .append('a')
            .attr('target', '_blank')
            .attr('href', function(d) { return d.url; })
            .append('svg')
            .attr('class', 'logo-small')
            .append('use')
            .attr('xlink:href', function(d) { return '#community-' + d.type; });

        var communityDetail = rowEnter
            .append('td')
            .attr('class', 'cell-detail community-detail');

        communityDetail.each(function(d) {
            var selection = d3_select(this);
            var replacements = {
                url: d.url,
                signupUrl: d.signupUrl || d.url
            };

            selection
                .append('div')
                .attr('class', 'community-detail-name')
                .append('a')
                .attr('target', '_blank')
                .attr('href', d.url)
                .text(t('community.' + d.id + '.name'));

            selection
                .append('div')
                .attr('class', 'community-detail-description')
                .text(t('community.' + d.id + '.description', replacements));

            if (d.extendedDescription) {
                selection
                    .append('div')
                    .attr('class', 'community-detail-extendedDescription')
                    .text(t('community.' + d.id + '.extendedDescription', replacements));
            }
        });
    }


    success.changeset = function(_) {
        if (!arguments.length) return _changeset;
        _changeset = _;
        return success;
    };


    success.location = function(_) {
        if (!arguments.length) return _location;
        _location = _;
        return success;
    };


    return utilRebind(success, dispatch, 'on');
}

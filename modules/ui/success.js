import _filter from 'lodash-es/filter';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { data } from '../../data';
import { svgIcon } from '../svg';
import { uiDisclosure } from '../ui';
import { utilDetect } from '../util/detect';
import { utilRebind } from '../util/rebind';


export function uiSuccess(context) {
    var MAXEVENTS = 2;

    // All else being equal, rank more "social" communities higher
    // (anything not in this list receives no adjustment)
    var COMMUNITYRANK = {
        'meetup': +5,
        'slack': +4,
        'facebook': +3,
        'reddit': +2,
        'forum': -2,
        'mailinglist': -3,
        'irc': -4
    };

    var detected = utilDetect();
    var dispatch = d3_dispatch('cancel');
    var _changeset;
    var _location;


    // string-to-date parsing in JavaScript is weird
    function parseEventDate(when) {
        if (!when) return;

        var raw = when.trim();
        if (!raw) return;

        if (!/Z$/.test(raw)) {    // if no trailing 'Z', add one
            raw += 'Z';           // this forces date to be parsed as a UTC date
        }

        var parsed = new Date(raw);
        return new Date(parsed.toUTCString().substr(0, 25));  // convert to local timezone
    }


    function success(selection) {
        var header = selection
            .append('div')
            .attr('class', 'header fillL');

        header
            .append('button')
            .attr('class', 'fr')
            .on('click', function() { dispatch.call('cancel'); })
            .call(svgIcon('#iD-icon-close'));

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
            .text(t('success.thank_you' + (_location ? '_location' : ''), { where: _location }));

        summary
            .append('p')
            .text(t('success.help_html'))
            .append('a')
            .attr('class', 'link-out')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', t('success.help_link_url'))
            .call(svgIcon('#iD-icon-out-link', 'inline'))
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
            .attr('xlink:href', '#iD-logo-osm');

        var summaryDetail = row
            .append('td')
            .attr('class', 'cell-detail summary-detail');

        summaryDetail
            .append('a')
            .attr('class', 'cell-detail summary-view-on-osm')
            .attr('target', '_blank')
            .attr('href', changesetURL)
            .text(t('success.view_on_osm'));

        summaryDetail
            .append('div')
            .text(t('success.changeset_id', { changeset_id: _changeset.id }));


        // Gather community polygon IDs intersecting the map..
        var matchFeatures = data.community.query(context.map().center(), true) || [];
        var matchIDs = matchFeatures.map(function(feature) { return feature.id; });

        // Gather community resources that are either global or match a polygon.
        var matchResources = _filter(data.community.resources, function(v) {
            return !v.featureId || matchIDs.indexOf(v.featureId) !== -1;
        });

        if (matchResources.length) {
            // sort by size ascending, then by community rank
            matchResources.sort(function(a, b) {
                var aSize = Infinity;
                var bSize = Infinity;
                var aRank = COMMUNITYRANK[a.type] || 0;
                var bRank = COMMUNITYRANK[b.type] || 0;

                if (a.featureId) {
                    aSize = data.community.features[a.featureId].properties.area;
                }
                if (b.featureId) {
                    bSize = data.community.features[b.featureId].properties.area;
                }

                return aSize < bSize ? -1 : aSize > bSize ? 1 : bRank - aRank;
            });

            body
                .call(showCommunityLinks, matchResources);
        }
    }


    function showCommunityLinks(selection, matchResources) {
        var communityLinks = selection
            .append('div')
            .attr('class', 'save-communityLinks');

        communityLinks
            .append('h3')
            .text(t('success.like_osm'));

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

        communityDetail
            .each(showCommunityDetails);

        communityLinks
            .append('div')
            .attr('class', 'community-missing')
            .text(t('success.missing'))
            .append('a')
            .attr('class', 'link-out')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-out-link', 'inline'))
            .attr('href', 'https://github.com/osmlab/osm-community-index/issues')
            .append('span')
            .text(t('success.tell_us'));
    }


    function showCommunityDetails(d) {
        var selection = d3_select(this);
        var communityID = d.id;
        var replacements = {
            url: linkify(d.url),
            signupUrl: linkify(d.signupUrl || d.url)
        };

        selection
            .append('div')
            .attr('class', 'community-name')
            .append('a')
            .attr('target', '_blank')
            .attr('href', d.url)
            .text(t('community.' + d.id + '.name'));

        var descriptionHTML = t('community.' + d.id + '.description', replacements);

        if (d.type === 'reddit') {   // linkify subreddits  #4997
            descriptionHTML = descriptionHTML
                .replace(/(\/r\/\w*\/*)/i, function(match) { return linkify(d.url, match); });
        }

        selection
            .append('div')
            .attr('class', 'community-description')
            .html(descriptionHTML);

        if (d.extendedDescription || (d.languageCodes && d.languageCodes.length)) {
            selection
                .append('div')
                .call(uiDisclosure(context, 'community-more-' + d.id, false)
                    .expanded(false)
                    .updatePreference(false)
                    .title(t('success.more'))
                    .content(showMore)
                );
        }

        var nextEvents = (d.events || [])
            .map(function(event) {
                event.date = parseEventDate(event.when);
                return event;
            })
            .filter(function(event) {               // date is valid and future (or today)
                var t = event.date.getTime();
                var now = (new Date()).setHours(0,0,0,0);
                return !isNaN(t) && t >= now;
            })
            .sort(function(a, b) {                  // sort by date ascending
                return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
            })
            .slice(0, MAXEVENTS);                   // limit number of events shown

        if (nextEvents.length) {
            selection
                .append('div')
                .call(uiDisclosure(context, 'community-events-' + d.id, false)
                    .expanded(false)
                    .updatePreference(false)
                    .title(t('success.events'))
                    .content(showNextEvents)
                )
                .select('.hide-toggle')
                .append('span')
                .attr('class', 'badge-text')
                .text(nextEvents.length);
        }


        function showMore(selection) {
            var more = selection
                .append('div')
                .attr('class', 'community-more');

            if (d.extendedDescription) {
                more
                    .append('div')
                    .attr('class', 'community-extended-description')
                    .html(t('community.' + d.id + '.extendedDescription', replacements));
            }

            if (d.languageCodes && d.languageCodes.length) {
                more
                    .append('div')
                    .attr('class', 'community-languages')
                    .text(t('success.languages', { languages: d.languageCodes.join(', ') }));
            }
        }


        function showNextEvents(selection) {
            var events = selection
                .append('div')
                .attr('class', 'community-events');

            var item = events.selectAll('.community-event')
                .data(nextEvents);

            var itemEnter = item.enter()
                .append('div')
                .attr('class', 'community-event');

            itemEnter
                .append('div')
                .attr('class', 'community-event-name')
                .append('a')
                .attr('target', '_blank')
                .attr('href', function(d) { return d.url; })
                .text(function(d) {
                    var name = d.name;
                    if (d.i18n && d.id) {
                        name = t('community.' + communityID + '.events.' + d.id + '.name', { default: name });
                    }
                    return name;
                });

            itemEnter
                .append('div')
                .attr('class', 'community-event-when')
                .text(function(d) {
                    var options = {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                    };
                    if (d.date.getHours() || d.date.getMinutes()) {   // include time if it has one
                        options.hour = 'numeric';
                        options.minute = 'numeric';
                    }
                    return d.date.toLocaleString(detected.locale, options);
                });

            itemEnter
                .append('div')
                .attr('class', 'community-event-where')
                .text(function(d) {
                    var where = d.where;
                    if (d.i18n && d.id) {
                        where = t('community.' + communityID + '.events.' + d.id + '.where', { default: where });
                    }
                    return where;
                });

            itemEnter
                .append('div')
                .attr('class', 'community-event-description')
                .text(function(d) {
                    var description = d.description;
                    if (d.i18n && d.id) {
                        description = t('community.' + communityID + '.events.' + d.id + '.description', { default: description });
                    }
                    return description;
                });
        }


        function linkify(url, text) {
            text = text || url;
            return '<a target="_blank" href="' + url + '">' + text + '</a>';
        }
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

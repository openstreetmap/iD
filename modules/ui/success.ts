import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { resolveStrings, type OciDefaults, type OciResource } from 'osm-community-index';

import { showDonationMessage } from '../../config/id.js';

import { fileFetcher } from '../core/file_fetcher.js';
import { locationManager } from '../core/location_manager.js';
import { t, localizer } from '../core/localizer.js';

import { svgIcon } from '../svg/icon.js';
import { uiDisclosure } from './disclosure.js';
import { utilRebind } from '../util/rebind.js';
import { utilSanitizeHTML } from '../util/sanitize.js';
import { getOsmCalEvents } from '../services/osmcal.js';
import { localeTimestamp } from '../util/date.js';
import type { coreContext } from '../core/context.js';
import type { Vec2 } from '../geo/vector.js';
import type { osmChangeset } from '../osm/changeset.js';


type Resource = {
    id: string,
    url?: string,
    icon: string,
    name: <T extends HTMLElement> (selection: d3.Selection<T>) => void,
    description: <T extends HTMLElement> (selection: d3.Selection<T>) => void,
    extendedDescription?: <T extends HTMLElement> (selection: d3.Selection<T>) => void,
    languageCodes?: string[],
};


let _oci: {
    resources: OciResource[],
    defaults: OciDefaults
} | null = null;

export function uiSuccess(context: coreContext) {
    const MAX_EVENTS = 4;
    const dispatch = d3_dispatch('cancel');
    let _changeset: osmChangeset;
    let _location: string;
    const loc: Vec2 = context.map().center();
    // start fetching the data
    ensureOSMCommunityIndex();
    getOsmCalEvents(loc);


    function ensureOSMCommunityIndex() {
        const data = fileFetcher;
        return Promise.all([
            data.get('oci_features'),
            data.get('oci_resources'),
            data.get('oci_defaults')
        ]).then(vals => {
           if (_oci) return _oci;

            // Merge Custom Features
            if (vals[0] && Array.isArray(vals[0].features)) {
                locationManager.addFeatures(vals[0]);
            }

            let ociResources = Object.values(vals[1].resources);
            if (ociResources.length) {
                // Resolve all locationSet features.
                locationManager.registerLocationSets(ociResources);
                _oci = {
                    resources: ociResources,
                    defaults: vals[2].defaults
                };
                return _oci;
            } else {
                _oci = {
                    resources: [],  // no resources?
                    defaults: vals[2].defaults
                };
                return _oci;
            }
        });
    }


    function success(selection: d3.Selection<HTMLElement>) {
        const header = selection
            .append('div')
            .classed('header fillL', true);

        header
            .append('h2')
            .call(t.append('success.just_edited'));

        header
            .append('button')
            .classed('close', true)
            .attr('title', t('icons.close'))
            .on('click', () => dispatch.call('cancel'))
            .call(svgIcon('#iD-icon-close'));

        const body = selection
            .append('div')
            .classed('body save-success fillL', true);

        const summary = body
            .append('div')
            .classed('save-summary', true);

        summary
            .append('h3')
            .call(t.append('success.thank_you' + (_location ? '_location' : ''), { where: _location }));

        summary
            .append('p')
            .call(t.append('success.help_html'))
            .append('a')
            .classed('link-out', true)
            .attr('target', '_blank')
            .attr('href', t('success.help_link_url'))
            .call(svgIcon('#iD-icon-out-link', 'inline'))
            .append('span')
            .call(t.append('success.help_link_text'));

        const osm = context.connection();
        if (!osm) return;

        const changesetURL = osm.changesetURL(_changeset.id);

        const table = summary
            .append('table')
            .classed('summary-table', true);

        const row = table
            .append('tr')
            .classed('summary-row', true);

        row
            .append('td')
            .classed('cell-icon summary-icon', true)
            .append('a')
            .attr('target', '_blank')
            .attr('href', changesetURL)
            .append('svg')
            .classed('logo-small', true)
            .append('use')
            .attr('xlink:href', '#iD-logo-osm');

        const summaryDetail = row
            .append('td')
            .classed('cell-detail summary-detail', true);

        summaryDetail
            .append('a')
            .classed('cell-detail summary-view-on-osm', true)
            .attr('target', '_blank')
            .attr('href', changesetURL)
            .call(t.append('success.view_on_osm'));

        summaryDetail
            .append('div')
            .call(t.addOrUpdate('success.changeset_id', {
                changeset_id: selection => selection
                    .append('a')
                    .attr('target', '_blank')
                    .attr('href', changesetURL)
                    .text(_changeset.id)
            }));

        if (showDonationMessage !== false) {
            // support ask
            const donationUrl = 'https://supporting.openstreetmap.org/';
            const supporting = body
                .append('div')
                .classed('save-supporting', true);

            supporting
                .append('h3')
                .call(t.append('success.supporting.title'));

            supporting
                .append('p')
                .call(t.append('success.supporting.details'));

            const table = supporting
                .append('table')
                .classed('supporting-table', true);

            const row = table
                .append('tr')
                .classed('supporting-row', true);

            row
                .append('td')
                .classed('cell-icon supporting-icon', true)
                .append('a')
                .attr('target', '_blank')
                .attr('href', donationUrl)
                .append('svg')
                .classed('logo-small', true)
                .append('use')
                .attr('xlink:href', '#iD-donation');

            const supportingDetail = row
                .append('td')
                .classed('cell-detail supporting-detail', true);

            supportingDetail
                .append('a')
                .classed('cell-detail support-the-map', true)
                .attr('target', '_blank')
                .attr('href', donationUrl)
                .call(t.append('success.supporting.donation.title'));

            supportingDetail
                .append('div')
                .call(t.append('success.supporting.donation.details'));
        }

        // Get OSM community index features intersecting the map..
        const fetchCommunitiesData = ensureOSMCommunityIndex().then(oci => {
            const loc = context.map().center();
            const validHere = locationManager.locationSetsAt(loc);

            // Gather the communities
            const communities = oci.resources.map(resource => {
                // @ts-expect-error - TODO: fix
                let area = validHere.get(resource.locationSetID);
                if (!area) return false;

                // Resolve strings
                const _localizer = (stringID: string) => localizer.t_html(`community.${stringID}`);

                return {
                    area: area,
                    order: resource.order || 0,
                    resource: resource,
                    resolvedStrings: resource.resolved = resolveStrings(resource, oci.defaults, _localizer)
                };
            }).filter(Boolean);

            // sort communities by feature area ascending, community order descending
            communities.sort((a, b) => a.area - b.area || b.order - a.order);
            const result: Resource[] = communities.map(c => ({
                id: c.resource.id,
                url: c.resolvedStrings.url,
                icon: `#community-${c.resource.type}`,
                name: (selection) => selection.html(utilSanitizeHTML(c.resolvedStrings.name || '')),
                description: (selection) => selection.html(utilSanitizeHTML(c.resolvedStrings.descriptionHTML || '')),
                extendedDescription: c.resolvedStrings.extendedDescriptionHTML
                    ? (selection) =>
                        selection.html(utilSanitizeHTML(c.resolvedStrings.extendedDescriptionHTML!))
                    : undefined,
                languageCodes: c.resource.languageCodes,
            }));
            return result;
        });
        // Get events from OSM Calendar
        const fetchEventsData: Promise<Resource[]> = getOsmCalEvents(loc).then(nearbyEvents => {
            nearbyEvents.sort((a, b) => {
                // sort by date ascending
                return a.date.start < b.date.start ? -1 : a.date.start > b.date.start ? 1 : 0;
            });

            return nearbyEvents
                .slice(0, MAX_EVENTS) // limit number of events shown
                .map((event, idx) => ({
                    id: `osmcal-${idx}`,
                    url: event.url,
                    icon: '#pinhead-calendar',
                    name: (selection) => selection.text(event.name),
                    description: (selection) => {
                        selection
                            .append('span')
                            .attr('lang', localizer.localeCode())
                            .text(localeTimestamp(new Date(event.date.start), {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }));
                        if (event.location) {
                            selection.append('br');
                            selection
                                .append('a')
                                .attr('href', `https://www.openstreetmap.org/?mlat=${event.location.coords[1]}&mlon=${event.location.coords[0]}&zoom=15`)
                                .attr('target', '_blank')
                                .classed('link-out', true)
                                .text(event.location.venue);
                        }
                    }
                }));
        });

        Promise.all([fetchCommunitiesData, fetchEventsData])
            .then(([communities, events]) => {
                body.call(showEngagementLinks, [
                    ...events,
                    ...communities
                ]);
            });
    }

    function showEngagementLinks(selection: d3.Selection<HTMLDivElement>, resources: Resource[]) {
        const resourceLinks = selection
            .append('div')
            .classed('save-communityLinks', true);

        resourceLinks
            .append('h3')
            .call(t.append('success.like_osm'));

        const table = resourceLinks
            .append('table')
            .classed('community-table', true);

        const row = table.selectAll('.community-row')
            .data(resources);

        const rowEnter = row.enter()
            .append('tr')
            .classed('community-row', true);

        rowEnter
            .append('td')
            .classed('cell-icon community-icon', true)
            .append('a')
            .each(function(d) {
                if (d.url && Math.random() < 0.5) {
                    d3_select(this)
                        .attr('target', '_blank')
                        .attr('href', d.url);
                } else {
                    d3_select(this)
                        .style('pointer-events', 'none');
                }
            })
            .append('svg')
            .classed('logo-small', true)
            .append('use')
            .attr('xlink:href', d => d.icon);

    const resourceDetail = rowEnter
      .append('td')
      .classed('cell-detail community-detail', true);

    resourceDetail
      .each(showResourceDetails);

    resourceLinks
      .append('div')
      .classed('community-missing', true)
      .call(t.append('success.missing'))
      .append('a')
      .classed('link-out', true)
      .attr('target', '_blank')
      .call(svgIcon('#iD-icon-out-link', 'inline'))
      .attr('href', 'https://github.com/osmlab/osm-community-index/issues')
      .append('span')
      .call(t.append('success.tell_us'));
  }


  function showResourceDetails(this: HTMLElement, d: Resource) {
        const selection = d3_select<HTMLElement, Resource>(this);
        const communityID = d.id;

        selection
            .append('div')
            .classed('community-name', true)
            .each(function(d) {
                let selection = d3_select<HTMLElement, Resource>(this);
                if (d.url) {
                    selection = selection
                        .append<HTMLElement>('a')
                        .attr('target', '_blank')
                        .attr('href', d.url);
                }
                selection.call(d.name);
            });

        selection
            .append('div')
            .classed('community-description', true)
            .each(function(d) {
                d3_select(this).call(d.description);
            });

        // Create an expanding section if any of these are present..
        if (d.extendedDescription || (d.languageCodes && d.languageCodes.length)) {
            selection
                .append('div')
                .call(uiDisclosure(context, `community-more-${communityID}`, false)
                    .expanded(false)
                    .updatePreference(false)
                    .label(() => t.append('success.more'))
                    .content(showMore)
                );
        }

        function showMore(selection: d3.Selection<HTMLElement>) {
            const more = selection.selectAll('.community-more')
                .data([0]);

            const moreEnter = more.enter()
                .append('div')
                .classed('community-more', true);

            if (d.extendedDescription !== undefined) {
                const extendedDescription = d.extendedDescription;
                moreEnter
                    .append('div')
                    .classed('community-extended-description', true)
                    .each(function() {
                        d3_select(this).call(extendedDescription);
                    });
            }

            if (d.languageCodes && d.languageCodes.length) {
                const languageList = d.languageCodes
                    .map(code => localizer.languageName(code))
                    .join(', ');

                moreEnter
                    .append('div')
                    .classed('community-languages', true)
                    .call(t.append('success.languages', { languages: languageList }));
            }
        }
    }


    success.changeset = function(val: osmChangeset) {
        if (!arguments.length) return _changeset;
        _changeset = val;
        return success;
    };


    success.location = function(val: string) {
        if (!arguments.length) return _location;
        _location = val;
        return success;
    };


    return utilRebind(success, dispatch, 'on');
}

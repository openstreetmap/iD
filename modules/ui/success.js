import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { resolveStrings } from 'osm-community-index';

import { showDonationMessage } from '../../config/id.js';

import { fileFetcher } from '../core/file_fetcher';
import { locationManager } from '../core/location_manager.js';
import { t, localizer } from '../core/localizer';

import { svgIcon } from '../svg/icon';
import { uiDisclosure } from '../ui/disclosure';
import { utilRebind } from '../util/rebind';
import { geoSphericalDistance } from '../geo/geo.js';
import { escape } from 'es-toolkit';


let _oci = null;
/** @type OsmCalEvent[] */
let _osmCalEvents = null;

export function uiSuccess(context) {
  const MAXEVENTS = 4;
  const dispatch = d3_dispatch('cancel');
  let _changeset;
  let _location;
  ensureOSMCommunityIndex();   // start fetching the data
  ensureOSMCal();


  function ensureOSMCommunityIndex() {
    const data = fileFetcher;
    return Promise.all([
        data.get('oci_features'),
        data.get('oci_resources'),
        data.get('oci_defaults')
      ])
      .then(vals => {
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

  function ensureOSMCal() {
    return fileFetcher
        .get('osmcal_events')
        .then(events => {
            if (!_osmCalEvents) _osmCalEvents = events;

            return _osmCalEvents;
        });
  }


  function success(selection) {
    let header = selection
      .append('div')
      .attr('class', 'header fillL');

    header
      .append('h2')
      .call(t.append('success.just_edited'));

    header
      .append('button')
      .attr('class', 'close')
      .attr('title', t('icons.close'))
      .on('click', () => dispatch.call('cancel'))
      .call(svgIcon('#iD-icon-close'));

    let body = selection
      .append('div')
      .attr('class', 'body save-success fillL');

    let summary = body
      .append('div')
      .attr('class', 'save-summary');

    summary
      .append('h3')
      .call(t.append('success.thank_you' + (_location ? '_location' : ''), { where: _location }));

    summary
      .append('p')
      .call(t.append('success.help_html'))
      .append('a')
      .attr('class', 'link-out')
      .attr('target', '_blank')
      .attr('href', t('success.help_link_url'))
      .call(svgIcon('#iD-icon-out-link', 'inline'))
      .append('span')
      .call(t.append('success.help_link_text'));

    let osm = context.connection();
    if (!osm) return;

    let changesetURL = osm.changesetURL(_changeset.id);

    let table = summary
      .append('table')
      .attr('class', 'summary-table');

    let row = table
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

    let summaryDetail = row
      .append('td')
      .attr('class', 'cell-detail summary-detail');

    summaryDetail
      .append('a')
      .attr('class', 'cell-detail summary-view-on-osm')
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
      let supporting = body
        .append('div')
        .attr('class', 'save-supporting');

      supporting
        .append('h3')
        .call(t.append('success.supporting.title'));

      supporting
        .append('p')
        .call(t.append('success.supporting.details'));

      table = supporting
        .append('table')
        .attr('class', 'supporting-table');

      row = table
        .append('tr')
        .attr('class', 'supporting-row');

      row
        .append('td')
        .attr('class', 'cell-icon supporting-icon')
        .append('a')
        .attr('target', '_blank')
        .attr('href', donationUrl)
        .append('svg')
        .attr('class', 'logo-small')
        .append('use')
        .attr('xlink:href', '#iD-donation');

      let supportingDetail = row
        .append('td')
        .attr('class', 'cell-detail supporting-detail');

      supportingDetail
        .append('a')
        .attr('class', 'cell-detail support-the-map')
        .attr('target', '_blank')
        .attr('href', donationUrl)
        .call(t.append('success.supporting.donation.title'));

      supportingDetail
        .append('div')
        .call(t.append('success.supporting.donation.details'));
    }

    // Get OSM community index features intersecting the map..
    const fetchCommunitiesData = ensureOSMCommunityIndex()
      .then(oci => {
        const loc = context.map().center();
        const validHere = locationManager.locationSetsAt(loc);

        // Gather the communities
        let communities = [];
        oci.resources.forEach(resource => {
          let area = validHere.get(resource.locationSetID);
          if (!area) return;

          // Resolve strings
          const _localizer = (stringID) => localizer.t_html(`community.${stringID}`);
          resource.resolved = resolveStrings(resource, oci.defaults, _localizer);

          communities.push({
            area: area,
            order: resource.order || 0,
            resource: resource
          });
        });

        // sort communities by feature area ascending, community order descending
        communities.sort((a, b) => a.area - b.area || b.order - a.order);
        return communities
          .map(c => c.resource)
          .map(resource => ({
            id: resource.id,
            url: resource.resolved.url,
            icon: `#community-${resource.type}`,
            name: resource.resolved.name,
            description: resource.resolved.description,
            extendedDescription: resource.resolved.extendedDescription,
            languageCodes: resource.languageCodes,
          }));
      });
    const fetchEventsData = ensureOSMCal()
      .then(osmCalData => {
        const nearbyEvents = [];
        for (const event of osmCalData) {
          if (event.cancelled) {
            // cancelled event
            continue;
          }
          const eventLoc = event.location?.coords;
          if (!eventLoc) {
            // global event
            continue;
          }
          const loc = context.map().center();
          const distance = geoSphericalDistance(eventLoc, loc);
          if (distance > 100_000) {
            // more than 100km away
            continue;
          }
          const date = new Date(event.date.start);
          const now = new Date();
          if (date - now > 1000 * 60 * 60 * 24 * 30) {
            // more than 30 days in the future
            continue;
          }
          nearbyEvents.push(event);
        }

        nearbyEvents.sort((a, b) => {
          // sort by date ascending
          return a.date.start < b.date.start ? -1 : a.date.start > b.date.start ? 1 : 0;
        });

        return nearbyEvents
          .slice(0, MAXEVENTS) // limit number of events shown
          .map((event, idx) => ({
            id: `osmcal-${idx}`,
            url: event.url,
            icon: '#pinhead-calendar',
            name: selection => selection.text(event.name),
            description: selection => selection.text(`${escape(event.date.human_short)}, ${escape(event.location.short)}`),
            extendedDescription: selection => selection.text(`${escape(event.date.human)}, ${escape(event.location.venue)}`),
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


  function showEngagementLinks(selection, resources) {
    let communityLinks = selection
      .append('div')
      .attr('class', 'save-communityLinks');

    communityLinks
      .append('h3')
      .call(t.append('success.like_osm'));

    let table = communityLinks
      .append('table')
      .attr('class', 'community-table');

    let row = table.selectAll('.community-row')
      .data(resources);

    let rowEnter = row.enter()
      .append('tr')
      .attr('class', 'community-row');

    rowEnter
      .append('td')
      .attr('class', 'cell-icon community-icon')
      .append('a')
      .attr('target', '_blank')
      .attr('href', d => d.url)
      .append('svg')
      .attr('class', 'logo-small')
      .append('use')
      .attr('xlink:href', d => d.icon);

    let communityDetail = rowEnter
      .append('td')
      .attr('class', 'cell-detail community-detail');

    communityDetail
      .each(showCommunityDetails);

    communityLinks
      .append('div')
      .attr('class', 'community-missing')
      .call(t.append('success.missing'))
      .append('a')
      .attr('class', 'link-out')
      .attr('target', '_blank')
      .call(svgIcon('#iD-icon-out-link', 'inline'))
      .attr('href', 'https://github.com/osmlab/osm-community-index/issues')
      .append('span')
      .call(t.append('success.tell_us'));
  }


  function showCommunityDetails(d) {
    let selection = d3_select(this);
    let communityID = d.id;

    selection
      .append('div')
      .classed('community-name', true)
      .append('a')
      .attr('target', '_blank')
      .attr('href', d => d.url)
      .each(function(d) {
        if (typeof d.name === 'string') {
          d3_select(this).html(d.name);
        } else {
          d3_select(this).call(d.name);
        }
      });

    selection
      .append('div')
      .attr('class', 'community-description')
      .each(function(d) {
        if (typeof d.description === 'string') {
          d3_select(this).html(d.description);
        } else {
          d3_select(this).call(d.description);
        }
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


    function showMore(selection) {
      let more = selection.selectAll('.community-more')
        .data([0]);

      let moreEnter = more.enter()
        .append('div')
        .attr('class', 'community-more');

      if (d.extendedDescription) {
        moreEnter
          .append('div')
          .attr('class', 'community-extended-description')
          .each(function(d) {
            if (typeof d.extendedDescription === 'string') {
              d3_select(this).html(d.extendedDescription);
            } else {
              d3_select(this).call(d.extendedDescription);
            }
          });
      }

      if (d.languageCodes && d.languageCodes.length) {
        const languageList = d.languageCodes
          .map(code => localizer.languageName(code))
          .join(', ');

        moreEnter
          .append('div')
          .attr('class', 'community-languages')
          .call(t.append('success.languages', { languages: languageList }));
      }
    }
  }


  success.changeset = function(val) {
    if (!arguments.length) return _changeset;
    _changeset = val;
    return success;
  };


  success.location = function(val) {
    if (!arguments.length) return _location;
    _location = val;
    return success;
  };


  return utilRebind(success, dispatch, 'on');
}

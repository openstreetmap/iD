import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import LocationConflation from '@ideditor/location-conflation';
import whichPolygon from 'which-polygon';

import { fileFetcher } from '../core/file_fetcher';
import { t, localizer } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiDisclosure } from '../ui/disclosure';
import { utilRebind } from '../util/rebind';


let _oci = null;

export function uiSuccess(context) {
  const MAXEVENTS = 2;
  const dispatch = d3_dispatch('cancel');
  let _changeset;
  let _location;
  ensureOSMCommunityIndex();   // start fetching the data


  function ensureOSMCommunityIndex() {
    const data = fileFetcher;
    return Promise.all([ data.get('oci_resources'), data.get('oci_features') ])
      .then(vals => {
        if (_oci) return _oci;

        const ociResources = vals[0].resources;
        const loco = new LocationConflation(vals[1]);
        let ociFeatures = {};

        Object.values(ociResources).forEach(resource => {
          const feature = loco.resolveLocationSet(resource.locationSet);
          let ociFeature = ociFeatures[feature.id];
          if (!ociFeature) {
            ociFeature = JSON.parse(JSON.stringify(feature));  // deep clone
            ociFeature.properties.resourceIDs = new Set();
            ociFeatures[feature.id] = ociFeature;
          }
          ociFeature.properties.resourceIDs.add(resource.id);
        });

        return _oci = {
          features: ociFeatures,
          resources: ociResources,
          query: whichPolygon({ type: 'FeatureCollection', features: Object.values(ociFeatures) })
        };
      });
  }


  // string-to-date parsing in JavaScript is weird
  function parseEventDate(when) {
    if (!when) return;

    let raw = when.trim();
    if (!raw) return;

    if (!/Z$/.test(raw)) {   // if no trailing 'Z', add one
      raw += 'Z';            // this forces date to be parsed as a UTC date
    }

    const parsed = new Date(raw);
    return new Date(parsed.toUTCString().substr(0, 25));  // convert to local timezone
  }


  function success(selection) {
    let header = selection
      .append('div')
      .attr('class', 'header fillL');

    header
      .append('h3')
      .text(t('success.just_edited'));

    header
      .append('button')
      .attr('class', 'close')
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
      .text(t('success.view_on_osm'));

    summaryDetail
      .append('div')
      .html(t('success.changeset_id', {
        changeset_id: `<a href="${changesetURL}" target="_blank">${_changeset.id}</a>`
      }));


    // Get OSM community index features intersecting the map..
    ensureOSMCommunityIndex()
      .then(oci => {
        let communities = [];
        const properties = oci.query(context.map().center(), true) || [];

        // Gather the communities from the result
        properties.forEach(props => {
          const resourceIDs = Array.from(props.resourceIDs);
          resourceIDs.forEach(resourceID => {
            const resource = oci.resources[resourceID];
            communities.push({
              area: props.area || Infinity,
              order: resource.order || 0,
              resource: resource
            });
          });
        });

        // sort communities by feature area ascending, community order descending
        communities.sort((a, b) => a.area - b.area || b.order - a.order);

        body
          .call(showCommunityLinks, communities.map(c => c.resource));
      });
  }


  function showCommunityLinks(selection, resources) {
    let communityLinks = selection
      .append('div')
      .attr('class', 'save-communityLinks');

    communityLinks
      .append('h3')
      .text(t('success.like_osm'));

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
      .attr('xlink:href', d => `#community-${d.type}`);

    let communityDetail = rowEnter
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
    let selection = d3_select(this);
    let communityID = d.id;
    let replacements = {
      url: linkify(d.url),
      signupUrl: linkify(d.signupUrl || d.url)
    };

    selection
      .append('div')
      .attr('class', 'community-name')
      .append('a')
      .attr('target', '_blank')
      .attr('href', d.url)
      .text(t(`community.${d.id}.name`));

    let descriptionHTML = t(`community.${d.id}.description`, replacements);

    if (d.type === 'reddit') {   // linkify subreddits  #4997
      descriptionHTML = descriptionHTML
        .replace(/(\/r\/\w*\/*)/i, match => linkify(d.url, match));
    }

    selection
      .append('div')
      .attr('class', 'community-description')
      .html(descriptionHTML);

    if (d.extendedDescription || (d.languageCodes && d.languageCodes.length)) {
      selection
        .append('div')
        .call(uiDisclosure(context, `community-more-${d.id}`, false)
          .expanded(false)
          .updatePreference(false)
          .title(t('success.more'))
          .content(showMore)
        );
    }

    let nextEvents = (d.events || [])
      .map(event => {
        event.date = parseEventDate(event.when);
        return event;
      })
      .filter(event => {      // date is valid and future (or today)
        const t = event.date.getTime();
        const now = (new Date()).setHours(0,0,0,0);
        return !isNaN(t) && t >= now;
      })
      .sort((a, b) => {       // sort by date ascending
        return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      })
      .slice(0, MAXEVENTS);   // limit number of events shown

    if (nextEvents.length) {
      selection
        .append('div')
        .call(uiDisclosure(context, `community-events-${d.id}`, false)
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
      let more = selection.selectAll('.community-more')
        .data([0]);

      let moreEnter = more.enter()
        .append('div')
        .attr('class', 'community-more');

      if (d.extendedDescription) {
        moreEnter
          .append('div')
          .attr('class', 'community-extended-description')
          .html(t(`community.${d.id}.extendedDescription`, replacements));
      }

      if (d.languageCodes && d.languageCodes.length) {
        const languageList = d.languageCodes
          .map(code => localizer.languageName(code))
          .join(', ');

        moreEnter
          .append('div')
          .attr('class', 'community-languages')
          .text(t('success.languages', { languages: languageList }));
      }
    }


    function showNextEvents(selection) {
      let events = selection
        .append('div')
        .attr('class', 'community-events');

      let item = events.selectAll('.community-event')
        .data(nextEvents);

      let itemEnter = item.enter()
        .append('div')
        .attr('class', 'community-event');

      itemEnter
        .append('div')
        .attr('class', 'community-event-name')
        .append('a')
        .attr('target', '_blank')
        .attr('href', d => d.url)
        .text(d => {
          let name = d.name;
          if (d.i18n && d.id) {
            name = t(`community.${communityID}.events.${d.id}.name`, { default: name });
          }
          return name;
        });

      itemEnter
        .append('div')
        .attr('class', 'community-event-when')
        .text(d => {
          let options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
          if (d.date.getHours() || d.date.getMinutes()) {   // include time if it has one
            options.hour = 'numeric';
            options.minute = 'numeric';
          }
          return d.date.toLocaleString(localizer.localeCode(), options);
        });

      itemEnter
        .append('div')
        .attr('class', 'community-event-where')
        .text(d => {
          let where = d.where;
          if (d.i18n && d.id) {
            where = t(`community.${communityID}.events.${d.id}.where`, { default: where });
          }
          return where;
        });

      itemEnter
        .append('div')
        .attr('class', 'community-event-description')
        .text(d => {
          let description = d.description;
          if (d.i18n && d.id) {
            description = t(`community.${communityID}.events.${d.id}.description`, { default: description });
          }
          return description;
        });
    }


    function linkify(url, text) {
      text = text || url;
      return `<a target="_blank" href="${url}">${text}</a>`;
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

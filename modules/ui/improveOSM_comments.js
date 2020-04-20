import { select as d3_select } from 'd3-selection';

import { t, localizer } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { services } from '../services';

export function uiImproveOsmComments() {
  let _qaItem;

  function issueComments(selection) {
    // make the div immediately so it appears above the buttons
    let comments = selection.selectAll('.comments-container')
      .data([0]);

    comments = comments.enter()
      .append('div')
        .attr('class', 'comments-container')
      .merge(comments);

    // must retrieve comments from API before they can be displayed
    services.improveOSM.getComments(_qaItem)
      .then(d => {
        if (!d.comments) return; // nothing to do here

        const commentEnter = comments.selectAll('.comment')
          .data(d.comments)
          .enter()
          .append('div')
            .attr('class', 'comment');

        commentEnter
          .append('div')
            .attr('class', 'comment-avatar')
            .call(svgIcon('#iD-icon-avatar', 'comment-avatar-icon'));

        const mainEnter = commentEnter
          .append('div')
          .attr('class', 'comment-main');

        const metadataEnter = mainEnter
          .append('div')
            .attr('class', 'comment-metadata');

        metadataEnter
          .append('div')
            .attr('class', 'comment-author')
            .each(function(d) {
              const osm = services.osm;
              let selection = d3_select(this);
              if (osm && d.username) {
                selection = selection
                  .append('a')
                  .attr('class', 'comment-author-link')
                  .attr('href', osm.userURL(d.username))
                  .attr('tabindex', -1)
                  .attr('target', '_blank');
              }
              selection
                .text(d => d.username);
            });

        metadataEnter
          .append('div')
            .attr('class', 'comment-date')
            .text(d => t('note.status.commented', { when: localeDateString(d.timestamp) }));

        mainEnter
          .append('div')
            .attr('class', 'comment-text')
          .append('p')
            .text(d => d.text);
    })
    .catch(err => {
      console.log(err); // eslint-disable-line no-console
    });
  }

  function localeDateString(s) {
    if (!s) return null;
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const d = new Date(s * 1000); // timestamp is served in seconds, date takes ms
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(localizer.localeCode(), options);
  }

  issueComments.issue = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return issueComments;
  };

  return issueComments;
}

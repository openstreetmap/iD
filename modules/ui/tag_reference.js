import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../core/localizer';
import { services } from '../services';
import { svgIcon } from '../svg/icon';


// Pass `what` object of the form:
// {
//   key: 'string',     // required
//   value: 'string'    // optional
// }
//   -or-
// {
//   qid: 'string'      // brand wikidata  (e.g. 'Q37158')
// }
//
export function uiTagReference(what) {
    var wikibase = what.qid ? services.wikidata : services.osmWikibase;
    var tagReference = {};

    var _button = d3_select(null);
    var _body = d3_select(null);
    var _loaded;
    var _showing;


    function load() {
        if (!wikibase) return;

        _button
            .classed('tag-reference-loading', true);

        wikibase.getDocs(what, gotDocs);
    }


    function gotDocs(err, docs) {
        _body.html('');

        if (!docs || !docs.title) {
            _body
                .append('p')
                .attr('class', 'tag-reference-description')
                .text(t('inspector.no_documentation_key'));
            done();
            return;
        }

        if (docs.imageURL) {
            _body
                .append('img')
                .attr('class', 'tag-reference-wiki-image')
                .attr('src', docs.imageURL)
                .on('load', function() { done(); })
                .on('error', function() { d3_select(this).remove(); done(); });
        } else {
            done();
        }

        _body
            .append('p')
            .attr('class', 'tag-reference-description')
            .text(docs.description || t('inspector.no_documentation_key'))
            .append('a')
            .attr('class', 'tag-reference-edit')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('title', t('inspector.edit_reference'))
            .attr('href', docs.editURL)
            .call(svgIcon('#iD-icon-edit', 'inline'));

        if (docs.wiki) {
            _body
              .append('a')
              .attr('class', 'tag-reference-link')
              .attr('target', '_blank')
              .attr('tabindex', -1)
              .attr('href', docs.wiki.url)
              .call(svgIcon('#iD-icon-out-link', 'inline'))
              .append('span')
              .text(t(docs.wiki.text));
        }

        // Add link to info about "good changeset comments" - #2923
        if (what.key === 'comment') {
            _body
                .append('a')
                .attr('class', 'tag-reference-comment-link')
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .call(svgIcon('#iD-icon-out-link', 'inline'))
                .attr('href', t('commit.about_changeset_comments_link'))
                .append('span')
                .text(t('commit.about_changeset_comments'));
        }
    }


    function done() {
        _loaded = true;

        _button
            .classed('tag-reference-loading', false);

        _body
            .classed('expanded', true)
            .transition()
            .duration(200)
            .style('max-height', '200px')
            .style('opacity', '1');

        _showing = true;

        _button.selectAll('svg.icon use').each(function() {
            var iconUse = d3_select(this);
            if (iconUse.attr('href') === '#iD-icon-info') {
                iconUse.attr('href', '#iD-icon-info-filled');
            }
        });
    }


    function hide() {
        _body
            .transition()
            .duration(200)
            .style('max-height', '0px')
            .style('opacity', '0')
            .on('end', function () {
                _body.classed('expanded', false);
            });

        _showing = false;

        _button.selectAll('svg.icon use').each(function() {
            var iconUse = d3_select(this);
            if (iconUse.attr('href') === '#iD-icon-info-filled') {
                iconUse.attr('href', '#iD-icon-info');
            }
        });

    }


    tagReference.button = function(selection, klass, iconName) {
        _button = selection.selectAll('.tag-reference-button')
            .data([0]);

        _button = _button.enter()
            .append('button')
            .attr('class', 'tag-reference-button ' + klass)
            .attr('title', t('icons.information'))
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-' + (iconName || 'inspect')))
            .merge(_button);

        _button
            .on('click', function () {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                this.blur();    // avoid keeping focus on the button - #4641
                if (_showing) {
                    hide();
                } else if (_loaded) {
                    done();
                } else {
                    load();
                }
            });
    };


    tagReference.body = function(selection) {
        var itemID = what.qid || (what.key + '-' + (what.value || ''));
        _body = selection.selectAll('.tag-reference-body')
            .data([itemID], function(d) { return d; });

        _body.exit()
            .remove();

        _body = _body.enter()
            .append('div')
            .attr('class', 'tag-reference-body')
            .style('max-height', '0')
            .style('opacity', '0')
            .merge(_body);

        if (_showing === false) {
            hide();
        }
    };


    tagReference.showing = function(val) {
        if (!arguments.length) return _showing;
        _showing = val;
        return tagReference;
    };


    return tagReference;
}

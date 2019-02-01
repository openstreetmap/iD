import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { utilDetect } from '../util/detect';
import { services } from '../services';
import { svgIcon } from '../svg';
import { utilQsString } from '../util';


export function uiTagReference(tag) {
    var wikibase = services.osmWikibase;
    var tagReference = {};

    var _button = d3_select(null);
    var _body = d3_select(null);
    var _loaded;
    var _showing;

    /**
     * @returns {{itemTitle: String, description: String, image: String|null}|null}
     **/
    function findLocal(data) {
        var entity = data.tag || data.key;
        if (!entity) return null;

        var result = {
            title: entity.title,
            description: entity.description,
        };

        if (entity.claims) {
            var langCode = utilDetect().locale.toLowerCase();
            var url;
            var image = wikibase.claimToValue(entity, 'P4', langCode);
            if (image) {
                url = 'https://commons.wikimedia.org/w/index.php';
            } else {
                image = wikibase.claimToValue(entity, 'P28', langCode);
                if (image) {
                    url = 'https://wiki.openstreetmap.org/w/index.php';
                }
            }
            if (image) {
                result.image = {
                    url: url,
                    title: 'Special:Redirect/file/' + image
                };
            }
        }

        // Helper method to get wiki info if a given language exists
        function getWikiInfo(wiki, langCode, msg) {
            if (wiki && wiki[langCode]) {
                return {title: wiki[langCode], text: t(msg)};
            }
        }

        // Try to get a wiki page from tag data item first, followed by the corresponding key data item.
        // If neither tag nor key data item contain a wiki page in the needed language nor English,
        // get the first found wiki page from either the tag or the key item.
        var tagWiki = wikibase.monolingualClaimToValueObj(data.tag, 'P31');
        var keyWiki = wikibase.monolingualClaimToValueObj(data.key, 'P31');

        // If exact language code does not exist, try to find the first part before the '-'
        // BUG: in some cases, a more elaborate fallback logic might be needed
        var langPrefix = langCode.split('-', 2)[0];

        result.wiki =
          getWikiInfo(tagWiki, langCode, 'inspector.wiki_reference') ||
          getWikiInfo(tagWiki, langPrefix, 'inspector.wiki_reference') ||
          getWikiInfo(tagWiki, 'en', 'inspector.wiki_en_reference') ||
          getWikiInfo(keyWiki, langCode, 'inspector.wiki_reference') ||
          getWikiInfo(keyWiki, langPrefix, 'inspector.wiki_reference') ||
          getWikiInfo(keyWiki, 'en', 'inspector.wiki_en_reference');

        return result;
    }


    function load(param) {
        if (!wikibase) return;

        _button
            .classed('tag-reference-loading', true);

        wikibase.getEntity(param, function show(err, data) {
            var docs;
            if (!err && data) {
                docs = findLocal(data);
            }

            _body.html('');

            if (!docs || !docs.title) {
                _body
                    .append('p')
                    .attr('class', 'tag-reference-description')
                    .text(t('inspector.no_documentation_key'));
                done();
                return;
            }

            if (docs.image) {
                var imageUrl = docs.image.url + '?' + utilQsString({
                    title: docs.image.title,
                    width: 100,
                    height: 100,
                });

                _body
                    .append('img')
                    .attr('class', 'tag-reference-wiki-image')
                    .attr('src', imageUrl)
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
                .attr('href', 'https://wiki.openstreetmap.org/wiki/' + docs.title)
                .call(svgIcon('#iD-icon-edit', 'inline'));

            if (docs.wiki) {
                _body
                  .append('a')
                  .attr('class', 'tag-reference-link')
                  .attr('target', '_blank')
                  .attr('tabindex', -1)
                  .attr('href', 'https://wiki.openstreetmap.org/wiki/' + docs.wiki.title)
                  .call(svgIcon('#iD-icon-out-link', 'inline'))
                  .append('span')
                  .text(docs.wiki.text);
            }

            // Add link to info about "good changeset comments" - #2923
            if (param.key === 'comment') {
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
        });
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
    }


    tagReference.button = function(selection) {
        _button = selection.selectAll('.tag-reference-button')
            .data([0]);

        _button = _button.enter()
            .append('button')
            .attr('class', 'tag-reference-button')
            .attr('title', t('icons.information'))
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-inspect'))
            .merge(_button);

        _button
            .on('click', function () {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                if (_showing) {
                    hide();
                } else if (_loaded) {
                    done();
                } else {
                    tag.langCode = utilDetect().locale.toLowerCase();
                    load(tag);
                }
            });
    };


    tagReference.body = function(selection) {
        var tagid = tag.rtype || (tag.key + '-' + tag.value);
        _body = selection.selectAll('.tag-reference-body')
            .data([tagid], function(d) { return d; });

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


    tagReference.showing = function(_) {
        if (!arguments.length) return _showing;
        _showing = _;
        return tagReference;
    };


    return tagReference;
}

import _find from 'lodash-es/find';
import _omit from 'lodash-es/omit';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { utilDetect } from '../util/detect';
import { services } from '../services';
import { svgIcon } from '../svg';


export function uiTagReference(tag) {
    var taginfo = services.taginfo;
    var tagReference = {};

    var _button = d3_select(null);
    var _body = d3_select(null);
    var _loaded;
    var _showing;


    function findLocal(data) {
        var locale = utilDetect().locale.toLowerCase();
        var localized;

        if (locale !== 'pt-br') {  // see #3776, prefer 'pt' over 'pt-br'
            localized = _find(data, function(d) {
                return d.lang.toLowerCase() === locale;
            });
            if (localized) return localized;
        }

        // try the non-regional version of a language, like
        // 'en' if the language is 'en-US'
        if (locale.indexOf('-') !== -1) {
            var first = locale.split('-')[0];
            localized = _find(data, function(d) {
                return d.lang.toLowerCase() === first;
            });
            if (localized) return localized;
        }

        // finally fall back to english
        return _find(data, function(d) {
            return d.lang.toLowerCase() === 'en';
        });
    }


    function load(param) {
        if (!taginfo) return;

        _button
            .classed('tag-reference-loading', true);

        taginfo.docs(param, function show(err, data) {
            var docs;
            if (!err && data) {
                docs = findLocal(data);
            }

            _body.html('');

            if (!docs || !docs.title) {
                if (param.hasOwnProperty('value')) {
                    load(_omit(param, 'value'));   // retry with key only
                } else {
                    _body
                        .append('p')
                        .attr('class', 'tag-reference-description')
                        .text(t('inspector.no_documentation_key'));
                    done();
                }
                return;
            }

            if (docs.image && docs.image.thumb_url_prefix) {
                _body
                    .append('img')
                    .attr('class', 'tag-reference-wiki-image')
                    .attr('src', docs.image.thumb_url_prefix + '100' + docs.image.thumb_url_suffix)
                    .on('load', function() { done(); })
                    .on('error', function() { d3_select(this).remove(); done(); });
            } else {
                done();
            }

            _body
                .append('p')
                .attr('class', 'tag-reference-description')
                .text(docs.description || t('inspector.documentation_redirect'));

            _body
                .append('a')
                .attr('class', 'tag-reference-link')
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .attr('href', 'https://wiki.openstreetmap.org/wiki/' + docs.title)
                .call(svgIcon('#icon-out-link', 'inline'))
                .append('span')
                .text(t('inspector.reference'));

            // Add link to info about "good changeset comments" - #2923
            if (param.key === 'comment') {
                _body
                    .append('a')
                    .attr('class', 'tag-reference-comment-link')
                    .attr('target', '_blank')
                    .attr('tabindex', -1)
                    .call(svgIcon('#icon-out-link', 'inline'))
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
            .attr('tabindex', -1)
            .call(svgIcon('#icon-inspect'))
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
            .attr('class', 'tag-reference-body cf')
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

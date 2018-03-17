import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import marked from 'marked';
import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { icon } from 'intro/helper';


// This currently only works with the 'restrictions' field
// It borrows some code from uiHelp

export function uiFieldHelp(context, fieldName) {
    var fieldHelp = {};
    var _inspector = d3_select(null);
    var _wrap = d3_select(null);
    var _body = d3_select(null);

    var fieldHelpKeys = {
        restrictions: [
            ['about',[
                'about',
                'from_via_to',
                'maxdist',
                'maxvia'
            ]],
            ['inspecting',[
                'about',
                'from_shadow',
                'allow_shadow',
                'restrict_shadow',
                'only_shadow',
                'restricted',
                'only'
            ]],
            ['modifying',[
                'about',
                'indicators',
                'allow_turn',
                'restrict_turn',
                'only_turn'
            ]],
            ['tips',[
                'simple',
                'simple_example',
                'indirect',
                'indirect_example',
                'indirect_noedit'
            ]]
        ]
    };

    var fieldHelpHeadings = {};

    var replacements = {
        distField: t('restriction.controls.distance'),
        viaField: t('restriction.controls.via'),
        fromShadow: icon('#turn-shadow', 'pre-text shadow from'),
        allowShadow: icon('#turn-shadow', 'pre-text shadow allow'),
        restrictShadow: icon('#turn-shadow', 'pre-text shadow restrict'),
        onlyShadow: icon('#turn-shadow', 'pre-text shadow only'),
        allowTurn: icon('#turn-yes', 'pre-text turn'),
        restrictTurn: icon('#turn-no', 'pre-text turn'),
        onlyTurn: icon('#turn-only', 'pre-text turn')
    };


    // For each section, squash all the texts into a single markdown document
    var docs = fieldHelpKeys[fieldName].map(function(key) {
        var helpkey = 'help.field.' + fieldName + '.' + key[0];
        var text = key[1].reduce(function(all, part) {
            var subkey = helpkey + '.' + part;
            var depth = fieldHelpHeadings[subkey];                     // is this subkey a heading?
            var hhh = depth ? Array(depth + 1).join('#') + ' ' : '';   // if so, prepend with some ##'s
            return all + hhh + t(subkey, replacements) + '\n\n';
        }, '');

        return {
            key: helpkey,
            title: t(helpkey + '.title'),
            html: marked(text.trim())
        };
    });


    function show() {
        updatePosition();

        _body
            .classed('hide', false)
            .style('opacity', '0')
            .transition()
            .duration(200)
            .style('opacity', '1');
    }


    function hide() {
        _body
            .classed('hide', true)
            .transition()
            .duration(200)
            .style('opacity', '0')
            .on('end', function () {
                _body.classed('hide', true);
            });
    }


    function clickHelp(index) {
        var d = docs[index];
        var tkeys = fieldHelpKeys[fieldName][index][1];

        _body.selectAll('.field-help-nav-item')
            .classed('active', function(d, i) { return i === index; });

        var content = _body.selectAll('.field-help-content')
            .html(d.html);

        // class the paragraphs so we can find and style them
        content.selectAll('p')
            .attr('class', function(d, i) { return tkeys[i]; });

        // insert special content for certain help sections
        if (d.key === 'help.field.restrictions.inspecting') {
            content
                .insert('img', 'p.from_shadow')
                .attr('class', 'field-help-image cf')
                .attr('src', context.imagePath('tr_inspect.gif'));

        } else if (d.key === 'help.field.restrictions.modifying') {
            content
                .insert('img', 'p.allow_turn')
                .attr('class', 'field-help-image cf')
                .attr('src', context.imagePath('tr_modify.gif'));
        }
    }


    fieldHelp.button = function(selection) {
        if (_body.empty()) return;

        var button = selection.selectAll('.field-help-button')
            .data([0]);

        // enter/update
        button.enter()
            .append('button')
            .attr('class', 'field-help-button')
            .attr('tabindex', -1)
            .call(svgIcon('#icon-help'))
            .merge(button)
            .on('click', function () {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                if (_body.classed('hide')) {
                    show();
                } else {
                    hide();
                }
            });
    };


    function updatePosition() {
        var wrap = _wrap.node();
        var inspector = _inspector.node();
        var wRect = wrap.getBoundingClientRect();
        var iRect = inspector.getBoundingClientRect();

        _body
            .style('top', wRect.top + inspector.scrollTop - iRect.top + 'px');
    }


    fieldHelp.body = function(selection) {
        // This control expects the field to have a preset-input-wrap div
        _wrap = selection.selectAll('.preset-input-wrap');
        if (_wrap.empty()) return;

        // absolute position relative to the inspector, so it "floats" above the fields
        _inspector = d3_select('#sidebar .entity-editor-pane .inspector-body');
        if (_inspector.empty()) return;

        _body = _inspector.selectAll('.field-help-body')
            .data([0]);

        var enter = _body.enter()
            .append('div')
            .attr('class', 'field-help-body hide');   // initially hidden

        var titleEnter = enter
            .append('div')
            .attr('class', 'field-help-title cf');

        titleEnter
            .append('h2')
            .attr('class', 'fl')
            .text(t('help.field.' + fieldName + '.title'));

        titleEnter
            .append('button')
            .attr('class', 'fr close')
            .on('click', function() {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                hide();
            })
            .call(svgIcon('#icon-close'));

        var navEnter = enter
            .append('div')
            .attr('class', 'field-help-nav cf');

        var titles = docs.map(function(d) { return d.title; });
        navEnter.selectAll('.field-help-nav-item')
            .data(titles)
            .enter()
            .append('div')
            .attr('class', 'field-help-nav-item')
            .text(function(d) { return d; })
            .on('click', function(d, i) {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                clickHelp(i);
            });

        enter
            .append('div')
            .attr('class', 'field-help-content');

        _body = _body
            .merge(enter);

        clickHelp(0);
    };


    return fieldHelp;
}

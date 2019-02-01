import _map from 'lodash-es/map';
import _each from 'lodash-es/each';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { json as d3_json } from 'd3-request';
import { services } from '../services';
import { svgIcon } from '../svg';
import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { modeSelect } from '../modes';
import { uiBackground } from './background';
import { uiDisclosure } from './disclosure';
import { uiHelp } from './help';
import { uiMapData } from './map_data';
import { uiSettingsCustomRule } from './settings/custom_rule';
import { uiTooltipHtml } from './tooltipHtml';
import { mapcss } from '../../data/mapcss_rules';

export function uiIssues(context) {
    var key = t('issues.key');
    var _featureApplicabilityList = d3_select(null);
    var _issuesList = d3_select(null);
    var settingsCustomRule = uiSettingsCustomRule(context)
        .on('change', customChanged);
    var _shown = false;
    var _validationContainer = d3_select(null);
    var _customRulesContainer = d3_select(null);
    var customRuleName = context.storage('settings-custom-rule-name') ? context.storage('settings-custom-rule-name') : t('issues.rules.custom.title');


    context.issueManager().on('reload', update);

    function renderIssuesOptions(selection) {
        var container = selection.selectAll('.issues-options-container')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'issues-options-container')
            .merge(container);

        _featureApplicabilityList = container.selectAll('.feature-applicability-list')
            .data([0]);

        _featureApplicabilityList = _featureApplicabilityList.enter()
            .append('ul')
            .attr('class', 'layer-list feature-applicability-list')
            .merge(_featureApplicabilityList);
    }

    function renderIssuesList(selection) {
        _issuesList = selection.selectAll('.issues-list')
            .data([0]);

        _issuesList = _issuesList.enter()
            .append('ul')
            .attr('class', 'layer-list issues-list')
            .merge(_issuesList);
    }

    function drawListItems(selection, data, type, name, change, active) {
        var items = selection.selectAll('li')
            .data(data);

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', 'layer')
            .call(tooltip()
                .html(true)
                .title(function(d) {
                    var tip = t('issues.' + name + '.' + d + '.tooltip');
                    return uiTooltipHtml(tip);
                })
                .placement('bottom')
            );

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .text(function(d) { return t('issues.' + name + '.' + d + '.description'); });

        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active);
    }

    function drawIssuesList(selection) {
        var issues = context.issueManager().getIssues();

        /*validations = _reduce(issues, function(validations, val) {
            var severity = val.severity;
            if (validations.hasOwnProperty(severity)) {
                validations[severity].push(val);
            } else {
                validations[severity] = [val];
            }
            return validations;
        }, {});*/

        var items = selection.selectAll('li')
            .data(issues, function(d) { return d.id(); });

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function (d) {
                return 'layer issue severity-' + d.severity;
            })
            .call(tooltip()
                .html(true)
                .title(function(d) {
                    var tip = d.tooltip ? d.tooltip : '';
                    return uiTooltipHtml(tip);
                })
                .placement('bottom')
            )
            .on('click', function(d) {
                if (d.entities) {
                    context.enter(modeSelect(
                        context,
                        _map(d.entities, function(e) { return e.id; })
                    ));
                }
            });

        var label = enter
            .append('label');

        label.each(function(d) {
            var iconSuffix = d.severity === 'warning' ? 'alert' : 'error';
            d3_select(this)
                .append('div')
                .attr('title', t('issues.severity.'+d.severity))
                .style('display', 'inline')
                .call(svgIcon('#iD-icon-' + iconSuffix, 'pre-text'));
        });

        /*label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);
*/
        label
            .append('span')
            .text(function(d) { return d.message; });

        // Update
        items = items
            .merge(enter);
    }

    function showsFeatureApplicability(d) {
        return context.issueManager().getFeatureApplicability() === d;
    }

    function setFeatureApplicability(d) {
        context.issueManager().setFeatureApplicability(d);
        update();
    }

    function update() {
        _featureApplicabilityList
            .call(
                drawListItems,
                context.issueManager().featureApplicabilityOptions,
                'radio',
                'feature_applicability',
                setFeatureApplicability,
                showsFeatureApplicability
            );

        _issuesList
            .call(drawIssuesList);

        _validationContainer
            .call(drawValidationRules);

        _customRulesContainer
            .call(drawCustomRulesItems);

    }

    function issues(selection) {

        function hidePane() {
            setVisible(false);
        }

        function togglePane() {
            if (d3_event) d3_event.preventDefault();
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== _shown) {
                button.classed('active', show);
                _shown = show;

                if (show) {
                    uiBackground.hidePane();
                    uiHelp.hidePane();
                    uiMapData.hidePane();
                    update();

                    pane
                        .style('display', 'block')
                        .style('right', '-300px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');

                } else {
                    pane
                        .style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-300px')
                        .on('end', function() {
                            d3_select(this).style('display', 'none');
                        });
                }
            }
        }

        var pane = selection
            .append('div')
            .attr('class', 'fillL map-pane hide');

        var paneTooltip = tooltip()
            .placement((textDirection === 'rtl') ? 'right' : 'left')
            .html(true)
            .title(uiTooltipHtml(t('issues.description'), key));

        var button = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', togglePane)
            .call(svgIcon('#iD-icon-alert', 'light'))
            .call(paneTooltip);

        var heading = pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('issues.title'));

        heading
            .append('button')
            .on('click', function() { uiIssues.hidePane(); })
            .call(svgIcon('#iD-icon-close'));

        var content = pane
            .append('div')
            .attr('class', 'pane-content');

        // issues
        content
            .append('div')
            .attr('class', 'issues-issues')
            .call(uiDisclosure(context, 'issues_issues', true)
                .title(t('issues.title'))
                .content(renderIssuesList)
            );

        // options
        content
            .append('div')
            .attr('class', 'issues-options')
            .call(uiDisclosure(context, 'issues_options', true)
                .title(t('issues.options.title'))
                .content(renderIssuesOptions)

            );

        content
            .append('div')
            .attr('class', 'issues-validation-rules')
            .call(uiDisclosure(context, 'validation_rules', true)
                .title(t('issues.rules.validation.header'))
                .content(renderValidationRules)
            );


        content
            .append('div')
            .attr('class', 'issues-custom-rules')
            .call(uiDisclosure(context, 'custom_rules', true)
                .title(t('issues.rules.custom.header'))
                .content(renderCustomRules)
            );

        update();

        context.keybinding()
            .on(key, togglePane);

        uiIssues.hidePane = hidePane;
        uiIssues.togglePane = togglePane;
        uiIssues.setVisible = setVisible;
    }

    function renderValidationRules(selection) {
        var container = selection.selectAll('.validation-container')
            .data([0]);

        _validationContainer = container.enter()
            .append('div')
            .attr('class', 'validation-container')
            .merge(container);
    }

    function drawValidationRules(selection) {
        var validationRules = Object.keys(mapcss.rules);

        var ul = selection
            .selectAll('.rule-list')
            .data([0]);

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list rule-list')
            .merge(ul);

        var li = ul.selectAll('.list-item')
            .data(validationRules);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', function(d) {
                return 'list-item list-item-' + d;
            });

        var labelEnter = liEnter
            .append('label')
            .each(function(d) {
                d3_select(this)
                    .call(tooltip()
                        .title(t('issues.rules.validation.validators.' + d + '.tooltip'))
                        .placement('bottom')
                    );
            });

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d) {
                if (d3_select(this).property('checked')){
                    context.validator().removeSourceIgnore(d);
                } else {
                    context.validator().ignoreSource(d);
                }
            });

        labelEnter
            .append('span')
            .text(function(d) {
                return t('issues.rules.validation.validators.' + d + '.title');
            });

        li
            .merge(liEnter)
            .classed('active', function(d) {
                return !context.validator().ignoreIncludes(d);
            })
            .selectAll('input')
            .property('checked', function(d) {
                return !context.validator().ignoreIncludes(d);
            });
    }

    function renderCustomRules(selection) {
        var container = selection.selectAll('div.custom-rules-container')
            .data([0]);
        _customRulesContainer = container.enter()
            .append('div')
            .attr('class', 'custom-rules-container')
            .merge(container);
    }

    function drawCustomRulesItems(selection) {
        var ul = selection
            .selectAll('.layer-list-data')
            .data(_issuesList ? [0] : []);

        ul.exit()
            .remove();

        var ulEnter = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-data');

        var liEnter = ulEnter
            .append('li')
            .attr('class', 'list-item-data');

        liEnter
            .append('button')
            .call(tooltip()
                .title(t('settings.custom_rule.tooltip'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', editCustom)
            .call(svgIcon('#iD-icon-more'));


        var labelEnter = liEnter
            .append('label')
            .call(tooltip()
                .title(t('issues.rules.custom.tooltip'))
                .placement('top')
            );


        labelEnter.append('input')
            .attr('type', 'checkbox')
            .property('checked', context.validationRules)
            .on('change', function() {
                if (d3_select(this).property('checked')){
                    context.validator().removeSourceIgnore(d3_select('.custom-rule-name').text());
                } else {
                    context.validator().ignoreSource(d3_select('.custom-rule-name').text());
                }
            });

        labelEnter
            .append('span')
            .attr('class', 'custom-rule-name')
            .text(customRuleName);

        ul = ul
            .merge(ulEnter);


        ul.selectAll('.list-item-rule')
            .classed('active', context.validationRules)
            .selectAll('label')
            .classed('deemphasize', !context.validationRules)
            .selectAll('input')
            .property('disabled', !context.validationRules)
            .property('checked', context.validationRules);

    }

    function editCustom() {
        d3_event.preventDefault();
        context.container()
            .call(settingsCustomRule);
    }

    function customChanged(c) {
        if (c){
            if (c.name){
                context.validator().setCustomName(c.name);
                d3_select('.custom-rule-name').text(c.name);
            }
            if (c.url) {
                context.validator().setCustomUrl(c.url);
                d3_json(c.url, function (err, rules) {
                    if (err) return;
                    services.maprules.init(context.presets().areaKeys());
                    addJsonRules(rules);
                });
            } else if (c.fileList) {
                var f = c.fileList[0];
                var extension = getExtension(f.name);
                var reader = new FileReader();
                reader.onload = (function() {
                    return function(e) {
                        if (extension === '.json') {
                            addJsonRules(JSON.parse(e.target.result));
                       }
                    };
                })(f);

                reader.readAsText(f);

            }
        }
    }

    function addJsonRules(rules) {
        _each(rules, function(mapcssSelector) {
            return services.maprules.addRule(mapcssSelector, context.validator().getCustomName());
        });
        context.validationRules = true;
    }

    function getExtension(fileName) {
        if (!fileName) return;

        var re = /\.(mapcss|json)$/i;
        var match = fileName.toLowerCase().match(re);
        return match && match.length && match[0];
    }


    return issues;
}

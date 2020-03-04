import { t } from '../util/locale';
import { matcher, brands } from 'name-suggestion-index';
import * as countryCoder from '@ideditor/country-coder';

import { actionChangePreset } from '../actions/change_preset';
import { actionChangeTags } from '../actions/change_tags';
import { actionUpgradeTags } from '../actions/upgrade_tags';
import { osmIsOldMultipolygonOuterMember, osmOldMultipolygonOuterMemberOfRelation } from '../osm/multipolygon';
import { utilDisplayLabel, utilTagDiff } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationOutdatedTags(context) {
    var type = 'outdated_tags';

    // initialize name-suggestion-index matcher
    var nsiMatcher = matcher();
    nsiMatcher.buildMatchIndex(brands.brands);
    var nsiKeys = ['amenity', 'shop', 'tourism', 'leisure', 'office'];

    var allWD = {};
    var allWP = {};
    Object.keys(brands.brands).forEach(function(kvnd) {
        var brand = brands.brands[kvnd];
        var wd = brand.tags['brand:wikidata'];
        var wp = brand.tags['brand:wikipedia'];
        if (wd) { allWD[wd] = kvnd; }
        if (wp) { allWP[wp] = kvnd; }
    });


    function oldTagIssues(entity, graph) {
        var oldTags = Object.assign({}, entity.tags);  // shallow copy
        var preset = context.presets().match(entity, graph);
        var subtype = 'deprecated_tags';

        // upgrade preset..
        if (preset.replacement) {
            var newPreset = context.presets().item(preset.replacement);
            graph = actionChangePreset(entity.id, preset, newPreset)(graph);
            entity = graph.entity(entity.id);
            preset = newPreset;
        }

        // upgrade tags..
        var deprecatedTags = entity.deprecatedTags();
        if (deprecatedTags.length) {
            deprecatedTags.forEach(function(tag) {
                graph = actionUpgradeTags(entity.id, tag.old, tag.replace)(graph);
            });
            entity = graph.entity(entity.id);
        }

        // add missing addTags..
        var newTags = Object.assign({}, entity.tags);  // shallow copy
        if (preset.tags !== preset.addTags) {
            Object.keys(preset.addTags).forEach(function(k) {
                if (!newTags[k]) {
                    if (preset.addTags[k] === '*') {
                        newTags[k] = 'yes';
                    } else {
                        newTags[k] = preset.addTags[k];
                    }
                }
            });
        }

        // Do `wikidata` or `wikipedia` identify this entity as a brand?  #6416
        // If so, these tags can be swapped to `brand:wikidata`/`brand:wikipedia`
        var isBrand;
        if (newTags.wikidata) {                 // try matching `wikidata`
            isBrand = allWD[newTags.wikidata];
        }
        if (!isBrand && newTags.wikipedia) {    // fallback to `wikipedia`
            isBrand = allWP[newTags.wikipedia];
        }
        if (isBrand && !newTags.office) {       // but avoid doing this for corporate offices
            if (newTags.wikidata) {
                newTags['brand:wikidata'] = newTags.wikidata;
                delete newTags.wikidata;
            }
            if (newTags.wikipedia) {
                newTags['brand:wikipedia'] = newTags.wikipedia;
                delete newTags.wikipedia;
            }
            // I considered setting `name` and other tags here, but they aren't unique per wikidata
            // (Q2759586 -> in USA "Papa John's", in Russia "Папа Джонс")
            // So users will really need to use a preset or assign `name` themselves.
        }

        // try key/value|name match against name-suggestion-index
        if (newTags.name) {
            for (var i = 0; i < nsiKeys.length; i++) {
                var k = nsiKeys[i];
                if (!newTags[k]) continue;

                var center = entity.extent(graph).center();
                var countryCode = countryCoder.iso1A2Code(center);
                var match = nsiMatcher.matchKVN(k, newTags[k], newTags.name, countryCode && countryCode.toLowerCase());
                if (!match) continue;

                // for now skip ambiguous matches (like Target~(USA) vs Target~(Australia))
                if (match.d) continue;

                var brand = brands.brands[match.kvnd];
                if (brand && brand.tags['brand:wikidata'] &&
                    brand.tags['brand:wikidata'] !== entity.tags['not:brand:wikidata']) {
                    subtype = 'noncanonical_brand';

                    var keepTags = ['takeaway'].reduce(function(acc, k) {
                        if (newTags[k]) {
                            acc[k] = newTags[k];
                        }
                        return acc;
                    }, {});

                    nsiKeys.forEach(function(k) { delete newTags[k]; });
                    Object.assign(newTags, brand.tags, keepTags);
                    break;
                }
            }
        }

        // determine diff
        var tagDiff = utilTagDiff(oldTags, newTags);
        if (!tagDiff.length) return [];

        var isOnlyAddingTags = tagDiff.every(function(d) {
            return d.type === '+';
        });

        var prefix = '';
        if (subtype === 'noncanonical_brand') {
            prefix = 'noncanonical_brand.';
        } else if (subtype === 'deprecated_tags' && isOnlyAddingTags) {
            subtype = 'incomplete_tags';
            prefix = 'incomplete.';
        }

        // don't allow autofixing brand tags
        var autoArgs = subtype !== 'noncanonical_brand' ? [doUpgrade, t('issues.fix.upgrade_tags.annotation')] : null;

        return [new validationIssue({
            type: type,
            subtype: subtype,
            severity: 'warning',
            message: showMessage,
            reference: showReference,
            entityIds: [entity.id],
            hash: JSON.stringify(tagDiff),
            dynamicFixes: function() {
                return [
                    new validationIssueFix({
                        autoArgs: autoArgs,
                        title: t('issues.fix.upgrade_tags.title'),
                        onClick: function(context) {
                            context.perform(doUpgrade, t('issues.fix.upgrade_tags.annotation'));
                        }
                    })
                ];
            }
        })];


        function doUpgrade(graph) {
            var currEntity = graph.hasEntity(entity.id);
            if (!currEntity) return graph;

            var newTags = Object.assign({}, currEntity.tags);  // shallow copy
            tagDiff.forEach(function(diff) {
                if (diff.type === '-') {
                    delete newTags[diff.key];
                } else if (diff.type === '+') {
                    newTags[diff.key] = diff.newVal;
                }
            });

            return actionChangeTags(currEntity.id, newTags)(graph);
        }


        function showMessage(context) {
            var currEntity = context.hasEntity(entity.id);
            if (!currEntity) return '';

            var messageID = 'issues.outdated_tags.' + prefix + 'message';

            if (subtype === 'noncanonical_brand' && isOnlyAddingTags) {
                messageID += '_incomplete';
            }

            return t(messageID,
                { feature: utilDisplayLabel(currEntity, context) }
            );
        }


        function showReference(selection) {
            var enter = selection.selectAll('.issue-reference')
                .data([0])
                .enter();

            enter
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.outdated_tags.' + prefix + 'reference'));

            enter
                .append('strong')
                .text(t('issues.suggested'));

            enter
                .append('table')
                .attr('class', 'tagDiff-table')
                .selectAll('.tagDiff-row')
                .data(tagDiff)
                .enter()
                .append('tr')
                .attr('class', 'tagDiff-row')
                .append('td')
                .attr('class', function(d) {
                    var klass = d.type === '+' ? 'add' : 'remove';
                    return 'tagDiff-cell tagDiff-cell-' + klass;
                })
                .text(function(d) { return d.display; });
        }
    }


    function oldMultipolygonIssues(entity, graph) {

        var multipolygon, outerWay;
        if (entity.type === 'relation') {
            outerWay = osmOldMultipolygonOuterMemberOfRelation(entity, graph);
            multipolygon = entity;
        } else if (entity.type === 'way') {
            multipolygon = osmIsOldMultipolygonOuterMember(entity, graph);
            outerWay = entity;
        } else {
            return [];
        }

        if (!multipolygon || !outerWay) return [];

        return [new validationIssue({
            type: type,
            subtype: 'old_multipolygon',
            severity: 'warning',
            message: showMessage,
            reference: showReference,
            entityIds: [outerWay.id, multipolygon.id],
            dynamicFixes: function() {
                return [
                    new validationIssueFix({
                        autoArgs: [doUpgrade, t('issues.fix.move_tags.annotation')],
                        title: t('issues.fix.move_tags.title'),
                        onClick: function(context) {
                            context.perform(doUpgrade, t('issues.fix.move_tags.annotation'));
                        }
                    })
                ];
            }
        })];


        function doUpgrade(graph) {
            var currMultipolygon = graph.hasEntity(multipolygon.id);
            var currOuterWay = graph.hasEntity(outerWay.id);
            if (!currMultipolygon || !currOuterWay) return graph;

            currMultipolygon = currMultipolygon.mergeTags(currOuterWay.tags);
            graph = graph.replace(currMultipolygon);
            return actionChangeTags(currOuterWay.id, {})(graph);
        }


        function showMessage(context) {
            var currMultipolygon = context.hasEntity(multipolygon.id);
            if (!currMultipolygon) return '';

            return t('issues.old_multipolygon.message',
                { multipolygon: utilDisplayLabel(currMultipolygon, context) }
            );
        }


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.old_multipolygon.reference'));
        }
    }


    var validation = function checkOutdatedTags(entity, graph) {
        var issues = oldMultipolygonIssues(entity, graph);
        if (!issues.length) issues = oldTagIssues(entity, graph);
        return issues;
    };


    validation.type = type;

    return validation;
}

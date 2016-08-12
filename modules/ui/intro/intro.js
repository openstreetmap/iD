import * as d3 from 'd3';
import { t } from '../../util/locale';
import { Entity, Graph } from '../../core/index';
import { Browse } from '../../modes/index';
import { area } from './area';
import { line } from './line';
import { navigation } from './navigation';
import { point } from './point';
import { startEditing } from './start_editing';
import { d3curtain } from '../../util/curtain';
import { default as introGraphRaw } from '../../../data/intro_graph.json';

var sampleIntros = {
    area: area,
    line: line,
    navigation: navigation,
    point: point,
    startEditing: startEditing
};


export function intro(context) {
    var step;

    function localizedName(id) {
        var features = {
            n2140018997: 'city_hall',
            n367813436: 'fire_department',
            w203988286: 'memory_isle_park',
            w203972937: 'riverwalk_trail',
            w203972938: 'riverwalk_trail',
            w203972940: 'riverwalk_trail',
            w41785752: 'w_michigan_ave',
            w134150789: 'w_michigan_ave',
            w134150795: 'w_michigan_ave',
            w134150800: 'w_michigan_ave',
            w134150811: 'w_michigan_ave',
            w134150802: 'e_michigan_ave',
            w134150836: 'e_michigan_ave',
            w41074896: 'e_michigan_ave',
            w17965834: 'spring_st',
            w203986457: 'scidmore_park',
            w203049587: 'petting_zoo',
            w17967397: 'n_andrews_st',
            w17967315: 's_andrews_st',
            w17967326: 'n_constantine_st',
            w17966400: 's_constantine_st',
            w170848823: 'rocky_river',
            w170848824: 'rocky_river',
            w170848331: 'rocky_river',
            w17967752: 'railroad_dr',
            w17965998: 'conrail_rr',
            w134150845: 'conrail_rr',
            w170989131: 'st_joseph_river',
            w143497377: 'n_main_st',
            w134150801: 's_main_st',
            w134150830: 's_main_st',
            w17966462: 's_main_st',
            w17967734: 'water_st',
            w17964996: 'foster_st',
            w170848330: 'portage_river',
            w17965351: 'flower_st',
            w17965502: 'elm_st',
            w17965402: 'walnut_st',
            w17964793: 'morris_ave',
            w17967444: 'east_st',
            w17966984: 'portage_ave'
        };
        return features[id] && t('intro.graph.' + features[id]);
    }

    var introGraph = {};

    for (var key in introGraphRaw) {
        introGraph[key] = Entity(introGraphRaw[key]);
        var name = localizedName(key);
        if (name) {
            introGraph[key].tags.name = name;
        }
    }

    function intro(selection) {


        context.enter(Browse(context));

        // Save current map state
        var history = context.history().toJSON(),
            hash = window.location.hash,
            center = context.map().center(),
            zoom = context.map().zoom(),
            background = context.background().baseLayerSource(),
            opacity = d3.selectAll('#map .layer-background').style('opacity'),
            loadedTiles = context.connection().loadedTiles(),
            baseEntities = context.history().graph().base().entities;

        // Block saving
        context.inIntro(true);

        // Load semi-real data used in intro
        context.connection().toggle(false).flush();
        context.history().reset();

        context.history().merge(d3.values(Graph().load(introGraph).entities));
        context.background().bing();

        d3.selectAll('#map .layer-background').style('opacity', 1);

        var curtain = d3curtain();
        selection.call(curtain);

        function reveal(box, text, options) {
            options = options || {};
            if (text) curtain.reveal(box, text, options.tooltipClass, options.duration);
            else curtain.reveal(box, '', '', options.duration);
        }

        var steps = ['navigation', 'point', 'area', 'line', 'startEditing'].map(function(step, i) {
            var s = sampleIntros[step](context, reveal)
                .on('done', function() {
                    entered.filter(function(d) {
                        return d.title === s.title;
                    }).classed('finished', true);
                    enter(steps[i + 1]);
                });
            return s;
        });

        steps[steps.length - 1].on('startEditing', function() {
            curtain.remove();
            navwrap.remove();
            d3.selectAll('#map .layer-background').style('opacity', opacity);
            context.connection().toggle(true).flush().loadedTiles(loadedTiles);
            context.history().reset().merge(d3.values(baseEntities));
            context.background().baseLayerSource(background);
            if (history) context.history().fromJSON(history, false);
            context.map().centerZoom(center, zoom);
            window.location.replace(hash);
            context.inIntro(false);
        });

        var navwrap = selection.append('div').attr('class', 'intro-nav-wrap fillD');

        var buttonwrap = navwrap.append('div')
            .attr('class', 'joined')
            .selectAll('button.step');

        var entered = buttonwrap
            .data(steps)
            .enter()
            .append('button')
            .attr('class', 'step')
            .on('click', enter);

        entered
            .append('label')
            .text(function(d) { return t(d.title); });

        entered
            .append('span')
            .attr('class', 'status')
            .text(' - ' + t('intro.done'));

        enter(steps[0]);

        function enter(newStep) {
            if (step) { step.exit(); }

            context.enter(Browse(context));

            step = newStep;
            step.enter();

            entered.classed('active', function(d) {
                return d.title === step.title;
            });
        }

    }
    return intro;
}

import * as d3 from 'd3';
//import _ from 'lodash';
//import { t } from '../util/locale';



import { modeSelect } from '../modes/index';
import { osmEntity } from '../osm/index';
//import { osmWay } from '../osm/index';
//import { services } from '../services/index';
import { svgIcon } from '../svg/index';
import { tooltip } from '../util/tooltip';
import { uiTooltipHtml } from './tooltipHtml';
import { uiDisclosure } from './disclosure';
import { utilDisplayName } from '../util/index';
import { utilEntityOrMemberSelector, utilEntitySelector } from '../util/index';

export function uiRawParentWayEditor(context) {
    var id;

    function selectWay(d) {
        d3.event.preventDefault();
        context.enter(modeSelect(context, [d.way.id]));
    }


    

    function jumpVertex(way, index) { 
        if (index >= 0 && index < way.nodes.length) {
            d3.event.preventDefault();
            context.enter(modeSelect(context, [way.nodes[index]]).relatedParent({id:way.id,index:index}).follow(true));
        }
    }
    
    function jumpThisVertex(d) { jumpVertex(d.way, d.index); }
    function jumpFirstVertex(d) { jumpVertex(d.way, 0); }
    function jumpPreviousVertex(d) { if (d.index>0) jumpVertex(d.way, d.index - 1); }
    function jumpNextVertex(d) { if (d.index + 1 < d.len) jumpVertex(d.way, d.index + 1); }
    function jumpLastVertex(d) { if (d.len>0) jumpVertex(d.way, d.len-1); }

    function mouseout() {
        d3.event.preventDefault();
        var surface = context.surface();
        surface.selectAll('.hover')
        .classed('hover', false);
    }    
        
    function mouseover(d) {
        d3.event.preventDefault();
        var surface = context.surface();
        surface.selectAll(utilEntitySelector([d.way.id]))
        .classed('hover', true);      
    }
    
    function mouseoverVertex(way, index) { 
        if (index >= 0 && index < way.nodes.length) {
            d3.event.preventDefault();
        var surface = context.surface();
        surface.selectAll(utilEntitySelector([way.nodes[index]]))
        .classed('hover', true);      
        }
    }
    
    function mouseoverFirstVertex(d) { mouseoverVertex(d.way, 0); }
    function mouseoverPreviousVertex(d) { if (d.index>0) mouseoverVertex(d.way, d.index - 1); }
    function mouseoverNextVertex(d) { if (d.index + 1 < d.len) mouseoverVertex(d.way, d.index + 1); }
    function mouseoverLastVertex(d) { if (d.len>0) mouseoverVertex(d.way, d.len-1); }


    function rawParentWayEditor(selection) {
        var entity = context.entity(id);
        var parentWays = [];
        var lineCount = 0;
        var areaCount = 0;

        var mode = context.mode();
        var relatedParent = null;
        if (mode.id==='select'){
            relatedParent = mode.relatedParent();
        }
        
        var xx = context.graph().parentWays(entity);
        xx.forEach(function(way) {
            var closed = way.isClosed(),
                area   = way.isArea(),
                repeated = false,
                related = false;
            
            if ( relatedParent && ( way.id === relatedParent.id )) {
                related=true; 
            }

            if ( !repeated ) {
                if (area ) {
                    areaCount += 1;       				
                    } else {
                    lineCount += 1;
                    }
            }
            way.nodes.forEach(function(node, index) {
                if (node === entity.id) {
                    parentWays.push({ way: way, node: node, index: index, len: way.nodes.length, 
                        repeated: repeated, closed: closed, area: area, related: related&&index===relatedParent.index });
                    repeated = true;
                    }
                });
            });

        
        selection.call(uiDisclosure()
            .title('Connected Lines (' + lineCount + ') and Areas (' + areaCount + ')')
            .expanded(true)
            .on('toggled', toggled)
            .content(content)
        );


        function toggled(expanded) {
            if (expanded) {
                selection.node().parentNode.scrollTop += 200;
            }
        }


        function content(wrap) {
            var list = wrap.selectAll('.parent-way-list')
                .data([0]);

            list = list.enter()
                .append('ul')
                .attr('class', 'parent-way-list')
                .merge(list);


            var items = list.selectAll('li.parent-way-row')
                .data(parentWays, function(d) {
                    return osmEntity.key(d.way) + ',' + d.index;
                });

            items.exit()
                .each(unbind)
                .remove();

            var enter = items.enter()
                .append('li')
                .attr('class', function(d) { 
                    return  ( d.repeated ? 'parent-way-repeated ' : '') + 'parent-way-row form-field'; } );

            var label = enter
                .append('label')
                .attr('class', 'form-label')
                .append('a')
                .attr('href', '#')
                .on('click', selectWay)
                .on('mouseover', mouseover)
                .on('mouseout', mouseout);

            label
                .append('span')
                .attr('class', function(d) { return ('entity-geom-icon' + ( d.area ? '-hidden' : '')); } )
                .call(svgIcon( '#icon-line', 'pre-text'));
            
           label
                .append('span')
                .attr('class', function(d) { return ('entity-geom-icon' + ( d.area ? '' : '-hidden')); } )
                .call(svgIcon( '#icon-area', 'pre-text'));

            
            label
                .append('span')
                .attr('class', 'parent-way-entity-type')
                .text(function(d) {
                    return context.presets().match(d.way, context.graph()).name();
                });

            label
                .append('span')
                .attr('class', 'parent-way-entity-name')
                .text(function(d) { return utilDisplayName(d.way); });

            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'button-parent-way-vertex parent-way-first-vertex minor')
                .text(function(d) {return (d.index>0)? '1' : '';})
            
                .on('click', jumpFirstVertex)
                .on('mouseover', mouseoverFirstVertex)
                .on('mouseout', mouseout)
                .call(tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(function() {
                        return uiTooltipHtml('Jump to first vertex', 'Home');
                    })
                );    

            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'button-parent-way-vertex parent-way-previous-vertex minor')
                .text(function(d) {return (d.index>0)? '◄' : '';})
        
                .on('click', jumpPreviousVertex)
                .on('mouseover', mouseoverPreviousVertex)
                .on('mouseout', mouseout)
                .call(tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(function() {
                        return uiTooltipHtml('Jump to previous vertex', 'PgUp');
                    })
                );    
            
            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', function(d) { return ('button-parent-way-vertex parent-way-vertex-index minor' 
                      + ' rp-'+d.way.id+'-'+d.index+( d.related ? ' rp-active' : '')); } )
                .text(function(d) { return (d.index+1);})              
                .on('click', jumpThisVertex)
                .on('mouseover', mouseover) // hover style the potential next related way
                .on('mouseout', mouseout)
                .call(tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(function() {
                        return uiTooltipHtml('Make this the way to stay on', 'End');
                    })
                );    
            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'button-parent-way-vertex parent-way-next-vertex minor')
                .text(function(d) {return (d.index + 1 < d.len)? '►' : '';})
                .on('click', jumpNextVertex)
                .on('mouseover', mouseoverNextVertex)
                .on('mouseout', mouseout)
                .call(tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(function() {
                        return uiTooltipHtml('Jump to next vertex', 'PgDn');
                        })
                    );
            
            enter
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'button-parent-way-vertex parent-way-last-vertex minor')
                .text(function(d) {return (d.index + 1 < d.len)? d.len : '';})
                .on('click', jumpLastVertex)
                .on('mouseover', mouseoverLastVertex)
                .on('mouseout', mouseout)
                .call(tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(function() {
                        return uiTooltipHtml('Jump to last vertex', 'End');
                    })
                );
  

            
            function unbind() {
            }
        }
    }


    rawParentWayEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return rawParentWayEditor;
    };


    return rawParentWayEditor;
}

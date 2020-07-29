import React from 'react';
import { render } from 'react-dom';
import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';
import { uiTooltip } from './tooltip';
import { bindMany } from 'util/react';


export function uiFeatureInfo(context) {
    function update(selection) {
        var features = context.features();

        var stats = features.stats();
        var count = 0;
        var hiddenList = features.hidden().map(function(k) {
            if (stats[k]) {
                count += stats[k];
                return String(stats[k]) + ' ' + t('feature.' + k + '.description');
            }
        }).filter(Boolean);

        render(
            <FeatureInfo
                count={count}
                hiddenList={hiddenList}
                onClick={onFeatureInfoClick}
            />,
            selection.node());

        selection
            .classed('hide', !hiddenList.length);
    }

    function onFeatureInfoClick() {
        // open the Map Data pane
        context.ui().togglePanes(context.container().select('.map-panes .map-data-pane'));
    }

    return function(selection) {
        update(selection);

        context.features().on('change.feature_info', function() {
            update(selection);
        });
    };
}

/**
 * Props:
 *   - count: number
 *   - hiddenList: string[]
 *   - onClick: () => void
 */
class FeatureInfo extends React.Component {

    constructor(props) {
        super(props);
        bindMany(this, 'refMain', 'onClick')

        this.tooltipBehavior = uiTooltip()
            .placement('top')
            .title(() => this.props.hiddenList.join('<br/>'));
    }

    refMain(elem) {
        if (elem) {
            d3_select(elem)
                .call(this.tooltipBehavior)
        }
    }

    /**
     * @param {React.MouseEvent} event 
     */
    onClick(event) {
        event.preventDefault();
        this.tooltipBehavior.hide();
        this.props.onClick();
    }

    render() {
        const { props } = this;

        if (!props.hiddenList.length) {
            return null;
        }

        return (
            <a
                ref={this.refMain}
                className='chip'
                href='#'
                tabIndex='-1'
                onClick={this.onClick}
            >
                {t('feature_info.hidden_warning', { count: props.count })}
            </a>
        );
    }

}

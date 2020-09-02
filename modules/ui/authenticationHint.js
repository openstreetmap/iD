import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';


export function uiAuthenticationHint(onShowLogin) {
    var authenticationHint = d3_select(document.createElement('div'))
        .attr('class', 'authentication-hint');

    var box = authenticationHint
        .append('div')
        .attr('class', 'box fillD');

    box
        .append('div')
        .text(t('authentication_hint.authentication_needed'));

    box
        .append('button')
        .attr('class', 'action button show-login-button')
        .text(t('authentication_hint.show_login'))
        .on('click', onShowLogin);

    d3_select(document.getElementById('id-container'))
        .select('.main-content')
        .node()
        .appendChild(authenticationHint.node());

    return authenticationHint;
}

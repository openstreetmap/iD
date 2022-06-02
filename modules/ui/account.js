import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';


export function uiAccount(context) {
  const osm = context.connection();


  function updateUserDetails(selection) {
    if (!osm) return;

    if (!osm.authenticated()) {  // logged out
      render(selection, null);
    } else {
      osm.userDetails((err, user) => render(selection, user));
    }
  }


  function render(selection, user) {
    let userInfo = selection.select('.userInfo');
    let loginLogout = selection.select('.loginLogout');

    if (user) {
      userInfo
        .html('')
        .classed('hide', false);

      let userLink = userInfo
        .append('a')
        .attr('href', osm.userURL(user.display_name))
        .attr('target', '_blank');

      // Add user's image or placeholder
      if (user.image_url) {
        userLink.append('img')
          .attr('class', 'icon pre-text user-icon')
          .attr('src', user.image_url);
      } else {
        userLink
          .call(svgIcon('#iD-icon-avatar', 'pre-text light'));
      }

      // Add user name
      userLink.append('span')
        .attr('class', 'label')
        .html(user.display_name);

      // show "Log Out"
      loginLogout
        .classed('hide', false)
        .select('a')
        .text(t('logout'))
        .on('click', e => {
          e.preventDefault();
          osm.logout();
          tryLogout();
        });

    } else {    // no user
      userInfo
        .html('')
        .classed('hide', true);

      // show "Log In"
      loginLogout
        .classed('hide', false)
        .select('a')
        .text(t('login'))
        .on('click', e => {
          e.preventDefault();
          osm.authenticate();
        });
    }
  }


  // OAuth2's idea of "logout" is just to get rid of the bearer token.
  // If we try to "login" again, it will just grab the token again.
  // What a user probably _really_ expects is to logout of OSM so that they can switch users.
  function tryLogout()  {
    if (!osm) return;

    const url = osm.getUrlRoot() + '/logout?referer=%2Flogin';
    // Create a 600x550 popup window in the center of the screen
    const w = 600;
    const h = 550;
    const settings = [
      ['width', w],
      ['height', h],
      ['left', window.screen.width / 2 - w / 2],
      ['top', window.screen.height / 2 - h / 2],
    ]
    .map(x => x.join('='))
    .join(',');

    window.open(url, '_blank', settings);
  }


  return function(selection) {
    if (!osm) return;

    selection.append('li')
      .attr('class', 'userInfo')
      .classed('hide', true);

    selection.append('li')
      .attr('class', 'loginLogout')
      .classed('hide', true)
      .append('a')
      .attr('href', '#');

    osm.on('change.account', () => updateUserDetails(selection));
    updateUserDetails(selection);
  };

}

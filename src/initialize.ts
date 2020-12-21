/**
 * Created by Holger Stitz on 13.03.2018.
 */

import 'vega_clue/dist/templates/404.html';
import 'vega_clue/dist/robots.txt';
import {AppWrapper} from './AppWrapper';
import {APP_NAME} from './language';
import App from './internal/App';
// import styles as last
import 'vega_clue/dist/scss/main.scss';

const app = new AppWrapper<App>({
  prefix: 'vega',
  name: APP_NAME,
  showCookieDisclaimer: true
});
app.init();

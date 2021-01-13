/**
 * Created by Holger Stitz on 13.03.2018.
 */
import {AppWrapper} from './AppWrapper';
import {APP_NAME} from './language';
import App from './internal/App';

const app = new AppWrapper<App>({
  prefix: 'vega',
  name: APP_NAME,
  showCookieDisclaimer: true
});
app.init();

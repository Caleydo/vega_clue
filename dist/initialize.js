/**
 * Created by Holger Stitz on 13.03.2018.
 */
import 'vega_clue/dist/templates/404.html';
import 'vega_clue/dist/robots.txt';
import { AppWrapper } from './AppWrapper';
import { APP_NAME } from './language';
const app = new AppWrapper({
    prefix: 'vega',
    name: APP_NAME,
    showCookieDisclaimer: true
});
app.init();
//# sourceMappingURL=initialize.js.map
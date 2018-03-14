/**
 * Created by Holger Stitz on 13.03.2018.
 */

// Determine the order of css files manually

import 'file-loader?name=index.html!extract-loader!html-loader?interpolate!./index.html';
import 'file-loader?name=404.html!./404.html';
import 'file-loader?name=robots.txt!./robots.txt';
import './style.scss';

import {AppWrapper} from './AppWrapper';
import {APP_NAME} from './language';
import App from './internal/App';

new AppWrapper<App>({
  prefix: 'vega',
  name: APP_NAME
});

import {APP_NAME} from './language';
import {create as createHeader, AppHeaderLink, AppHeader} from 'phovea_ui/src/header';
import {mixin} from 'phovea_core/src';
import {IProvenanceGraph, IProvenanceTracker, IActionFunctionRegistry} from 'provenance-core/src/api';
import {ProvenanceGraph} from 'provenance-core/src/ProvenanceGraph';
import {ProvenanceTracker} from 'provenance-core/src/ProvenanceTracker';
import {ActionFunctionRegistry} from 'provenance-core/src/ActionFunctionRegistry';


export interface IView<T> {
  init(): Promise<T>;
  remove();
}

export interface IAppWrapperOptions {
  /**
   * name of this application
   */
  name: string;
  /**
   * prefix used for provenance graphs and used to identify matching provenance graphs
   */
  prefix: string;
  /**
   * Show/hide the EU cookie disclaimer bar from `cookie-bar.eu`
   */
  showCookieDisclaimer: boolean;
}


/**
 * The main class for the App app
 */
export class AppWrapper<T extends IView<T>> {

  protected readonly options: IAppWrapperOptions = {
    name: 'App',
    prefix: 'app',
    showCookieDisclaimer: false,
  };

  protected header: AppHeader;

  constructor(options: Partial<IAppWrapperOptions> = {}) {
    mixin(this.options, options);
  }

  public init() {
    //create the common header
    const headerOptions = {
      showCookieDisclaimer: this.options.showCookieDisclaimer,
      showOptionsLink: false,
      appLink: new AppHeaderLink(APP_NAME, (event) => {
        event.preventDefault();
        return false;
      })
    };
    this.header = createHeader(document.body, headerOptions);
    const main = <HTMLElement>document.body.querySelector('main');

    // remove loading
    main.querySelector('.loading').remove();

    const registry: IActionFunctionRegistry = new ActionFunctionRegistry();
    const graph: IProvenanceGraph = new ProvenanceGraph({name: APP_NAME, version: '1.0.0'});
    const provTracker: IProvenanceTracker = new ProvenanceTracker(registry, graph);
    this.createApp(provTracker, main);
  }

  /**
   * build the actual main application given the arguments
   * @param {ProvenanceGraph} graph the resolved current provenance graph
   * @param {HTMLElement} main root dom element
   * @returns {PromiseLike<T> | T}
   */
  protected createApp(provTracker: IProvenanceTracker, main: HTMLElement): PromiseLike<T> | T {
    // lazy loading for better module bundling
    return Promise.all([System.import('./internal/App')]).then((modules) => {
      const app: T = new modules[0].default(provTracker, main);
      return app.init();
    });
  }
}

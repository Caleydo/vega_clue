
import {APP_NAME} from './language';
import {IVisStateApp} from 'phovea_clue/src/provenance_retrieval/IVisState';
import ACLUEWrapper from 'phovea_clue/src/ACLUEWrapper';
import {create as createHeader, AppHeaderLink, AppHeader} from 'phovea_ui/src/header';
import CLUEGraphManager from 'phovea_clue/src/CLUEGraphManager';
import MixedStorageProvenanceGraphManager from 'phovea_core/src/provenance/MixedStorageProvenanceGraphManager';
import lazyBootstrap from 'phovea_ui/src/_lazyBootstrap';
import LoginMenu from 'phovea_clue/src/menu/LoginMenu';
import ProvenanceGraphMenu from 'phovea_clue/src/menu/ProvenanceGraphMenu';
import {isLoggedIn} from 'phovea_core/src/security';
import ProvenanceGraph from 'phovea_core/src/provenance/ProvenanceGraph';
import {loadProvenanceGraphVis, loadStoryVis} from 'phovea_clue/src/vis_loader';
import * as cmode from 'phovea_clue/src/mode';
import {showProveanceGraphNotFoundDialog} from './dialogs';
import {create as createProvRetrievalPanel} from 'phovea_clue/src/provenance_retrieval/ProvRetrievalPanel';
import {mixin} from 'phovea_core/src';
import {initI18n} from 'phovea_core/src/i18n';


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
export class AppWrapper<T extends IView<T> & IVisStateApp> extends ACLUEWrapper {

  protected readonly options: IAppWrapperOptions = {
    name: 'App',
    prefix: 'app',
    showCookieDisclaimer: false,
  };

  protected app: Promise<T> = null;
  protected header: AppHeader;

  constructor(options: Partial<IAppWrapperOptions> = {}) {
    super();
    mixin(this.options, options);
  }

  public async init() {
    await initI18n(); // Initialize i18n and then load application
    await this.build(document.body, {replaceBody: true});
  }

  protected buildImpl(body: HTMLElement) {
    //create the common header
    const headerOptions = {
      showCookieDisclaimer: this.options.showCookieDisclaimer,
      showOptionsLink: false,
      appLink: new AppHeaderLink(APP_NAME, (event) => {
        event.preventDefault();
        return false;
      })
    };
    this.header = createHeader(<HTMLElement>body.querySelector('div.box'), headerOptions);

    this.on('jumped_to,loaded_graph', () => this.header.ready());
    //load all available provenance graphs
    const manager = new MixedStorageProvenanceGraphManager({
      prefix: this.options.prefix,
      storage: localStorage,
      application: this.options.prefix
    });
    const clueManager = new CLUEGraphManager(manager);

    this.header.wait();

    // trigger bootstrap loading
    lazyBootstrap();

    const loginMenu = new LoginMenu(this.header, {
      insertIntoHeader: true,
    });

    const provenanceMenu = new ProvenanceGraphMenu(clueManager, body, false);
    this.header.insertCustomRightMenu(provenanceMenu.node);

    const modeSelector = body.querySelector('header');
    modeSelector.classList.add('collapsed');
    modeSelector.classList.add('clue-modeselector');

    const main = <HTMLElement>document.body.querySelector('main');

    //wrapper around to better control when the graph will be resolved
    let graphResolver: (graph: PromiseLike<ProvenanceGraph>) => void;
    const graph = new Promise<ProvenanceGraph>((resolve, reject) => graphResolver = resolve);

    graph.catch((error: {graph: string}) => {
      showProveanceGraphNotFoundDialog(clueManager, error.graph);
    });

    graph.then((graph) => {
      clueManager.list().then((graphs) => {
        provenanceMenu.build(graphs);
        provenanceMenu.setGraph(graph);
      });

      cmode.createButton(modeSelector, {
        size: 'sm'
      });
    });

    const provVis = loadProvenanceGraphVis(graph, body.querySelector('div.asides'), {
      thumbnails: false,
      provVisCollapsed: true,
      hideCLUEButtonsOnCollapse: true
    });
    const storyVis = loadStoryVis(graph, <HTMLElement>body.querySelector('div.asides'), main, {
      thumbnails: false
    });

    this.app = graph.then((graph) => this.createApp(graph, clueManager, main));

    Promise.all([graph, this.app]).then((args) => {
      const graph = args[0];
      const app = args[1];

      createProvRetrievalPanel(graph, body.querySelector('div.asides'), {
        app,
        captureNonPersistedStates: false,
        startCollapsed: true
      });

      if (!graph.isEmpty) {
        //just if no other option applies jump to the stored state
        this.jumpToStoredOrLastState();
      } else {
        // TODO custom session init if needed
      }
    });

    graphResolver(clueManager.chooseLazy(true));

    return {graph, manager: clueManager, storyVis, provVis};
  }

  /**
   * build the actual main application given the arguments
   * @param {ProvenanceGraph} graph the resolved current provenance graph
   * @param {CLUEGraphManager} manager its manager
   * @param {HTMLElement} main root dom element
   * @returns {PromiseLike<T> | T}
   */
  protected createApp(graph: ProvenanceGraph, manager: CLUEGraphManager, main: HTMLElement): PromiseLike<T> | T {
    // lazy loading for better module bundling
    return Promise.all([System.import('./internal/App')]).then((modules) => {
      const app: T = new modules[0].default(graph, manager, main);
      return app.init();
    });
  }
}

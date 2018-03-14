/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import {IVisStateApp} from 'phovea_clue/src/provenance_retrieval/IVisState';
import {cat, IObjectRef} from 'phovea_core/src/provenance';
import {EventHandler} from 'phovea_core/src/event';
import ProvenanceGraph from 'phovea_core/src/provenance/ProvenanceGraph';
import CLUEGraphManager from 'phovea_clue/src/CLUEGraphManager';
import {IProperty, IPropertyValue} from 'phovea_core/src/provenance/retrieval/VisStateProperty';
import {IView} from '../AppWrapper';
import datasets from '../../data';
import {VegaView} from './VegaView';

export default class App extends EventHandler implements IView<App>, IVisStateApp {
  /**
   * IObjectRef to this App instance
   * @type {IObjectRef<App>}
   */
  readonly ref: IObjectRef<App>;

  private readonly $node: d3.Selection<App>;

  constructor(public readonly graph: ProvenanceGraph, public readonly graphManager: CLUEGraphManager, parent: HTMLElement) {
    super();

    // add OrdinoApp app as (first) object to provenance graph
    // need old name for compatibility
    this.ref = this.graph.findOrAddObject(this, 'App', cat.visual);

    this.$node = d3.select(parent).append('div').classed('app', true).datum(this);
  }

  /**
   * Initialize the app
   * @returns {Promise<App>}
   */
  init(): Promise<App> {
    this.$node.html(`
      <div class="view-wrapper"></div>
    `);

    // load from external URL
    /*return vega.loader()
      .load('https://vega.github.io/vega/examples/bar-chart.vg.json')
      .then((data) => this.renderVega(JSON.parse(data)))
      .then(() => this);*/

    // render bundled dataset
    const view = new VegaView(<HTMLElement>this.$node.select('.view-wrapper').node(), this.graph, datasets[2]);

    return view.init()
      .then(() => this);
  }

  getVisStateProps(): Promise<IProperty[]> {
    return Promise.resolve([]);
  }

  getCurrVisState(): Promise<IPropertyValue[]> {
    return Promise.resolve([]);
  }

  remove() {
    // do nothing
  }
}

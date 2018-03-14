/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import * as vega from 'vega-lib';
import {IVisStateApp} from 'phovea_clue/src/provenance_retrieval/IVisState';
import {cat, IObjectRef} from 'phovea_core/src/provenance';
import {EventHandler} from 'phovea_core/src/event';
import ProvenanceGraph from 'phovea_core/src/provenance/ProvenanceGraph';
import CLUEGraphManager from 'phovea_clue/src/CLUEGraphManager';
import {HELLO_WORLD} from '../language';
import {IProperty, IPropertyValue} from 'phovea_core/src/provenance/retrieval/VisStateProperty';
import {IApp} from '../AppWrapper';
import datasets from '../../data';

export default class App extends EventHandler implements IApp<App>, IVisStateApp {
  /**
   * IObjectRef to this App instance
   * @type {IObjectRef<App>}
   */
  readonly ref: IObjectRef<App>;

  private readonly $node: d3.Selection<App>;

  private vegaView;

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
  init():Promise<App> {
    this.$node.html(`<div id="view">${HELLO_WORLD}</div>`);

    // load from external URL
    /*return vega.loader()
      .load('https://vega.github.io/vega/examples/bar-chart.vg.json')
      .then((data) => this.renderVega(JSON.parse(data)))
      .then(() => this);*/

    // render bundled dataset
    this.renderVega(datasets[3]);
    return Promise.resolve(this);
  }

  private renderVega(spec) {
    this.vegaView = new vega.View(vega.parse(spec))
      .renderer('svg')  // set renderer (canvas or svg)
      .initialize('#view') // initialize view within parent DOM container
      .hover() // enable hover encode set processing
      .run();
  }

  getVisStateProps():Promise<IProperty[]> {
    return Promise.resolve([]);
  }

  getCurrVisState(): Promise<IPropertyValue[]> {
    return Promise.resolve([]);
  }
}

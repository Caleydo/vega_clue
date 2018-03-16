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
import vegaSpecs from '../../data';
import {VegaView} from './VegaView';
import {Spec} from 'vega-lib';

export default class App extends EventHandler implements IView<App>, IVisStateApp {
  /**
   * IObjectRef to this App instance
   * @type {IObjectRef<App>}
   */
  readonly ref: IObjectRef<App>;

  private readonly $node: d3.Selection<App>;

  private vegaView:VegaView;

  constructor(public readonly graph: ProvenanceGraph, public readonly graphManager: CLUEGraphManager, parent: HTMLElement) {
    super();

    // add OrdinoApp app as (first) object to provenance graph
    // need old name for compatibility
    this.ref = this.graph.findOrAddObject(this, 'App', cat.visual);

    this.$node = d3.select(parent)
      .append('div')
      .classed('app', true)
      .datum(this);
  }

  /**
   * Initialize the app
   * @returns {Promise<App>}
   */
  init(): Promise<App> {
    this.$node.html(`
      <form class="dataset-selector form-inline">
        <div class="form-group">
          <label for="example-selector">Select an example:</label>
          <select id="example-selector" class="form-control"><!-- select a vega specification --></select>
        </div>
      </form>
      <div class="view-wrapper"></div> 
    `);

    const $select = this.$node.select('.dataset-selector select')
      .on('change', () => {
        const vegaSpecs = $select.selectAll('option')
            .filter((d, i) => i === $select.property('selectedIndex'))
            .data();
        if(vegaSpecs.length > 0) {
          this.openVegaView(vegaSpecs[0])
        }
      });

    const options = $select
      .selectAll('option')
      .data(vegaSpecs);
    options.enter().append('option').text((d) => d.title);
    options.exit().remove();

    // load from external URL
    /*return vega.loader()
      .load('https://vega.github.io/vega/examples/bar-chart.vg.json')
      .then((data) => this.renderVega(JSON.parse(data)))
      .then(() => this);*/

    if(vegaSpecs.length > 0) {
      return this.openVegaView(vegaSpecs[0])
        .then(() => this);
    }

    this.$node.html('No available Vega Specs loaded');
    return Promise.resolve(this);
  }

  private openVegaView(spec: Spec): Promise<VegaView> {
    const headerWaitingOverlay = document.getElementById('headerWaitingOverlay');
    headerWaitingOverlay.classList.remove('hidden');

    // remove old view first
    if(this.vegaView) {
      this.vegaView.remove();
    }

    // init new view with selected spec
    this.vegaView = new VegaView(<HTMLElement>this.$node.select('.view-wrapper').node(), this.graph, spec);

    return this.vegaView.init()
      .then(() => {
        headerWaitingOverlay.classList.add('hidden');
        return this.vegaView;
      });
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

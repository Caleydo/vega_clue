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
import vegaSpecs, {IVegaSpecDataset} from '../../data';
import {VegaView} from './VegaView';
import {Spec} from 'vega-lib';
import * as vega from 'vega-lib';
import {showLoadErrorDialog} from '../dialogs';

export default class App extends EventHandler implements IView<App>, IVisStateApp {
  /**
   * IObjectRef to this App instance
   * @type {IObjectRef<App>}
   */
  readonly ref: IObjectRef<App>;

  private readonly $node: d3.Selection<App>;

  private vegaView:VegaView;

  private readonly vegaExampleUrl = 'https://vega.github.io/vega/examples/interactive-legend.vg.json';
  private readonly vegaDatasetUrl = 'https://vega.github.io/vega-datasets/';

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
      <form class="dataset-selector form-inline" action="#">
        <div class="form-group">
          <label for="example-selector">Select an example:</label>
          <select id="example-selector" class="form-control"><!-- select a vega specification --></select>
        </div>
        <div class="form-group">
          <p class="form-control-static">or paste an</p>
        </div>
        <div class="form-group">
          <label for="url">URL to a Vega specification</label>
          <input type="text" id="url" class="form-control" placeholder="${this.vegaExampleUrl}" />
        </div>
        <button type="submit" class="btn btn-default">Load</button>
      </form>
      <div class="view-wrapper"></div> 
    `);

    this.$node.select('form.dataset-selector')
      .on('submit', () => {
        (<Event>d3.event).preventDefault();
        const url = this.$node.select('#url').property('value') || this.vegaExampleUrl;

        console.log('load url', url);

        // load from external URL
        vega.loader()
          .load(url)
          .then((data) => JSON.parse(data))
          .then((json) => this.validateVegaData(json))
          .then((spec: Spec) => {
            // for now just check for official Vega examples and transform relative data url
            const dataUrl = (url.indexOf('vega.github.io') > -1) ? this.vegaDatasetUrl : '';
            return this.transformToAbsoluteUrls(spec, dataUrl);
          })
          .then((spec: Spec) => this.openVegaView(spec))
          .catch(showLoadErrorDialog);

        return false;
      });

    const $select = this.$node.select('.dataset-selector select')
      .on('change', () => {
        const datasets: IVegaSpecDataset[] = $select.selectAll('option')
            .filter((d, i) => i === $select.property('selectedIndex'))
            .data();
        if(datasets.length > 0) {
          this.openVegaView(datasets[0].spec)
        }
      });

    const datasets: IVegaSpecDataset[] = vegaSpecs.map((dataset: IVegaSpecDataset) => {
      if(dataset.spec.data) {
        dataset.spec = this.transformToAbsoluteUrls(dataset.spec, this.vegaDatasetUrl);
      }
      return dataset;
    });

    const options = $select
      .selectAll('option')
      .data(datasets);
    options.enter().append('option').text((d) => d.title);
    options.exit().remove();

    if(datasets.length > 0) {
      return this.openVegaView(datasets[0].spec)
        .then(() => this);
    }

    this.$node.html('No available Vega Specs loaded');
    return Promise.resolve(this);
  }

  private validateVegaData(spec: Spec) {
    // TODO to be implemented; could use https://github.com/vega/editor/blob/e98f9ee9678aae37bca651b8f25e487ba0b3ed13/src/utils/validate.ts
    return spec;
  }

  private transformToAbsoluteUrls(spec: Spec, dataUrl: string) {
    if(spec.data) {
      spec.data = spec.data.map((d: any) => {
        if(d.url) {
          d.url = dataUrl + d.url;
        }
        return d;
      });
    }
    return spec;
  }

  private openVegaView(spec: Spec): Promise<VegaView> {
    // remove old view first
    if(this.vegaView) {
      this.vegaView.remove();
    }

    // init new view with selected spec
    this.vegaView = new VegaView(<HTMLElement>this.$node.select('.view-wrapper').node(), this.graph, spec);

    return this.vegaView.init();
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

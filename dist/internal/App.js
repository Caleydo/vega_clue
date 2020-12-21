/**
 * Created by Caleydo Team on 31.08.2016.
 */
import * as d3 from 'd3';
import * as $ from 'jquery';
import { ObjectRefUtils } from 'phovea_core';
import { EventHandler } from 'phovea_core';
import { loadDatasets } from '../data';
import { VegaView } from './VegaView';
import * as vega from 'vega-lib';
import { showLoadErrorDialog } from '../dialogs';
export default class App extends EventHandler {
    constructor(graph, graphManager, parent) {
        super();
        this.graph = graph;
        this.graphManager = graphManager;
        this.vegaExampleUrl = 'https://vega.github.io/vega/examples/interactive-legend.vg.json';
        this.vegaDatasetUrl = 'https://vega.github.io/vega-datasets/';
        this.initCompletePromise = new Promise((resolve, reject) => {
            this.initCompleteResolve = resolve;
        });
        // add OrdinoApp app as (first) object to provenance graph
        // need old name for compatibility
        this.ref = this.graph.findOrAddObject(this, 'App', ObjectRefUtils.category.visual);
        this.$node = d3.select(parent)
            .append('div')
            .classed('app', true)
            .datum(this);
    }
    /**
     * Initialize the app
     * @returns {Promise<App>}
     */
    init() {
        return loadDatasets()
            .then((vegaSpecs) => {
            if (vegaSpecs.length === 1) {
                return this.initSingleSpec(vegaSpecs);
            }
            return this.initMultiSpecs(vegaSpecs);
        })
            .then((vegaView) => this.initCompleteResolve(vegaView))
            .then(() => this);
    }
    initSingleSpec(vegaSpecs) {
        const datasets = vegaSpecs.map((dataset) => {
            if (dataset.spec.data) {
                dataset.spec = this.transformToAbsoluteUrls(dataset.spec, this.vegaDatasetUrl);
            }
            return dataset;
        });
        this.$node.html(`<div class="view-wrapper"></div>`);
        return this.openVegaView(datasets[0].spec);
    }
    initMultiSpecs(vegaSpecs) {
        const datasets = vegaSpecs.map((dataset) => {
            if (dataset.spec.data) {
                dataset.spec = this.transformToAbsoluteUrls(dataset.spec, this.vegaDatasetUrl);
            }
            return dataset;
        });
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
            d3.event.preventDefault();
            const url = this.$node.select('#url').property('value') || this.vegaExampleUrl;
            console.log('load url', url);
            // load from external URL
            vega.loader()
                .load(url)
                .then((data) => JSON.parse(data))
                .then((json) => this.validateVegaData(json))
                .then((spec) => {
                // for now just check for official Vega examples and transform relative data url
                const dataUrl = (url.indexOf('vega.github.io') > -1) ? this.vegaDatasetUrl : '';
                return this.transformToAbsoluteUrls(spec, dataUrl);
            })
                .then((spec) => this.openVegaView(spec))
                .catch(showLoadErrorDialog);
            return false;
        });
        const $select = this.$node.select('.dataset-selector select');
        const nestedData = d3.nest()
            .key((d) => d.category)
            .entries(datasets);
        const $optgroups = $select
            .selectAll('optgroup')
            .data(nestedData);
        const $optgroupEnter = $optgroups.enter().append('optgroup')
            .attr('label', (d) => d.key);
        const $options = $optgroupEnter.selectAll('option').data((d) => d.values);
        $options.enter().append('option').text((d) => d.title);
        $options.exit().remove();
        $optgroups.exit().remove();
        $($select.node())
            .select2({
            theme: 'bootstrap'
        })
            .on('select2:select', () => {
            const datasets = $select.selectAll('option')
                .filter((d, i) => i === $select.property('selectedIndex'))
                .data();
            if (datasets.length > 0) {
                this.openVegaView(datasets[0].spec);
            }
        });
        if (datasets.length > 0) {
            return this.openVegaView(datasets[0].spec);
        }
    }
    validateVegaData(spec) {
        // TODO to be implemented; could use https://github.com/vega/editor/blob/e98f9ee9678aae37bca651b8f25e487ba0b3ed13/src/utils/validate.ts
        return spec;
    }
    transformToAbsoluteUrls(spec, dataUrl) {
        if (spec.data) {
            spec.data = spec.data.map((d) => {
                if (d.url) {
                    d.url = dataUrl + d.url;
                }
                return d;
            });
        }
        return spec;
    }
    openVegaView(spec) {
        // remove old view first
        if (this.vegaView) {
            this.vegaView.remove();
        }
        // init new view with selected spec
        this.vegaView = new VegaView(this.$node.select('.view-wrapper').node(), this.graph, spec);
        return this.vegaView.init();
    }
    getVisStateProps() {
        return this.initCompletePromise.then(() => this.vegaView.getVisStateProps());
    }
    getCurrVisState() {
        return this.vegaView.getCurrVisState();
    }
    remove() {
        // do nothing
    }
}
//# sourceMappingURL=App.js.map
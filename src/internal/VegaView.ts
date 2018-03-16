import ProvenanceGraph from 'phovea_core/src/provenance/ProvenanceGraph';
import {IView} from '../AppWrapper';
import * as d3 from 'd3';
import * as vega from 'vega-lib';
import {Spec} from 'vega-lib';


export class VegaView implements IView<VegaView> {

  private readonly $node: d3.Selection<vega.View>;

  private signalHandler = (name, value) => {
    console.log(name, value, (<any>this.$node.datum()).getState()); // cast to <any>, because `getState()` is not available in 'vega-typings'
  };

  constructor(parent: HTMLElement, graph: ProvenanceGraph, private spec: Spec) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('vega-view', true)
      .html(`
        <form class="signal-selector"><p><strong>List of tracked signals</strong></p></form>
        <div class="vega-wrapper"></div>
      `);
  }

  init(): Promise<VegaView> {
    this.initSignalSelector();

    const vegaView: vega.View = new vega.View(vega.parse(this.spec))
      .renderer('svg')  // set renderer (canvas or svg)
      .initialize(<Element>this.$node.select('.vega-wrapper').node()) // initialize view within parent DOM container
      .hover() // enable hover encode set processing
      .run();

    this.addSignalListener(vegaView);

    this.$node.datum(vegaView);

    return Promise.resolve(this);
  }

  private initSignalSelector() {
    const $signals = this.$node.select('.signal-selector')
      .selectAll('.checkbox').data(this.spec.signals);

    $signals.enter()
      .append('div')
      .classed('checkbox', true)
      .html(`<label><input type="checkbox" checked><span></span></label>`);

    $signals.select('span').text((d) => d.name);

    $signals.exit().remove();
  }

  remove() {
    const vegaView = this.$node.datum();
    this.removeSignalListener(vegaView);
    this.$node.remove();
  }

  private addSignalListener(vegaView) {
    if(this.spec.signals) {
      this.spec.signals.forEach((signal) => {
        vegaView.addSignalListener(signal.name, this.signalHandler);
      });
    }
  }

  private removeSignalListener(vegaView) {
    if(this.spec.signals) {
      this.spec.signals.forEach((signal) => {
        vegaView.removeSignalListener(signal.name, this.signalHandler);
      });
    }
  }
}

import ProvenanceGraph from 'phovea_core/src/provenance/ProvenanceGraph';
import {IView} from '../AppWrapper';
import * as d3 from 'd3';
import * as vega from 'vega-lib';
import {Spec, Signal, View} from 'vega-lib';

interface IVegaViewOptions {
  /**
   * Set the renderer for Vega (svg or canvas)
   */
  vegaRenderer: 'canvas' | 'svg' | 'none';
}

export class VegaView implements IView<VegaView> {

  private readonly options: IVegaViewOptions = {
    vegaRenderer: 'svg',
  };

  /**
   * RegExp to activate the signal when the string contains `mouseup`, `touchend`, or `click`.
   * @type {RegExp}
   */
  private readonly activateSignal: RegExp = /(mouseup|touchend|click)/g;

  /**
   * List of signals that are used by this CLUE connector
   * @type {Signal[]}
   */
  private readonly clueSignals: Signal[] = [
    {
      "name": "CLUE_captureState",
      "value": null,
      "on": [
        {"events": "mousedown, touchstart", "update": "null", "force": true}
      ]
    }
  ];

  private readonly $node: d3.Selection<View>;

  private readonly activeSignals: Map<string, boolean> = new Map<string, boolean>();

  private readonly history: History = new History();

  private signalHandler = (name, value) => {
    // ignore signals that are not listed or disabled
    if(!this.activeSignals.has(name) || !this.activeSignals.get(name)) {
      return;
    }

    // cast to <any>, because `getState()` is missing in 'vega-typings'
    const vegaView = (<any>this.$node.datum());
    console.log(name, value, vegaView.getState());

    // capture vega state and add to history
    if(name === this.clueSignals[0].name) {
      this.history.pushState(vegaView.getState());
      console.log('history', this.history);
    }
  };

  constructor(parent: HTMLElement, graph: ProvenanceGraph, private spec: Spec) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('vega-view', true)
      .html(`
        <div class="side-panel">
          <button class="btn btn-default btn-undo"><i class="fa fa-undo"></i> Undo</button>
          <button class="btn btn-default btn-redo"><i class="fa fa-repeat"></i> Redo</button>
          <hr>
          <form class="signal-selector"><p><strong>List of signals</strong></p></form>
        </div>
        <div class="vega-wrapper"></div>
      `);
  }

  init(): Promise<VegaView> {
    this.spec.signals = this.initClueSignals(this.spec.signals);

    // set default values for signals -- default: true
    //this.spec.signals.forEach((d) => this.activeSignals.set(d.name, this.shouldSignalBeActive(d)));

    this.initSelector('.signal-selector', this.spec.signals, this.activeSignals);

    const vegaView: View = new View(vega.parse(this.spec))
      //.logLevel(vega.Warn) // set view logging level
      .renderer(this.options.vegaRenderer)  // set renderer (canvas or svg)
      .initialize(<Element>this.$node.select('.vega-wrapper').node()) // initialize view within parent DOM container
      .hover(); // enable hover encode set processing

    const vegaViewReady = (<any>vegaView).runAsync() // type cast to any because `runAsync` is missing in 'vega-typings'
      .then(() => {
        this.history.pushState((<any>vegaView).getState());
        console.log('history', this.history);
        this.addSignalListener(vegaView);
      });

    vegaView.run(); // run after defining the promise
    this.$node.datum(vegaView);

    this.$node.select('.btn-undo')
      .on('click', () => {
        (<any>vegaView).setState(this.history.prevState());
        console.log('history', this.history);
      });

    this.$node.select('.btn-redo')
      .on('click', () => {
        (<any>vegaView).setState(this.history.nextState());
        console.log('history', this.history);
      });

    return vegaViewReady.then(() => this);
  }

  private initClueSignals(signals: Signal[]): Signal[] {
    if(!signals) {
      signals = [];
    }
    // activate all CLUE signals by default
    this.clueSignals.forEach((d) => this.activeSignals.set(d.name, true));
    return [...this.clueSignals, ...signals];
  }

  private initSelector(selector: string, data: any[], isActiveMap: Map<string, boolean>) {
    const $signals = this.$node.select(selector)
      .selectAll('.checkbox').data(data);

    $signals.enter()
      .append('div')
      .classed('checkbox', true)
      .html(`<label><input type="checkbox"><span></span></label>`);

    $signals.select('span').text((d) => d.name);
    $signals.select('input')
      .attr('checked', (d) => (isActiveMap.get(d.name)) ? 'checked' : null)
      .on('change', (d) => {
        isActiveMap.set(d.name, !isActiveMap.get(d.name));
      });

    $signals.exit().remove();
  }

  remove() {
    const vegaView = this.$node.datum();
    this.removeSignalListener(vegaView);
    vegaView.finalize();
    this.$node.remove();
  }

  private addSignalListener(vegaView: View) {
    if(this.spec.signals) {
      this.spec.signals.forEach((signal) => {
        vegaView.addSignalListener(signal.name, this.signalHandler);
      });
    }
  }

  private removeSignalListener(vegaView: View) {
    if(this.spec.signals) {
      this.spec.signals.forEach((signal) => {
        vegaView.removeSignalListener(signal.name, this.signalHandler);
      });
    }
  }

  /**
   * Check all events of the signal.
   * If the event contains a `mouseup`, `touchend`, or `click` then activate the signal.
   * Otherwise deactivate the signal.
   * @param {Signal} signal
   */
  private shouldSignalBeActive(signal: Signal): boolean {
    if(!signal.on) {
      return false;
    }
    return signal.on.some((d) => this.activateSignal.test(d.events.toString()));
  }
}

class History {

  states: any[] = [];
  cursor: number = 0;

  constructor() {

  }

  pushState(state: any): number {
    this.states.push(state);
    this.cursor = this.states.length - 1;
    return this.cursor;
  }

  prevState(): any {
    if(this.cursor - 1 < 0) {
      console.log('Beginning of history... returning the first state');
      return this.states[this.cursor];
    }
    this.cursor--;
    return this.states[this.cursor];
  }

  nextState(): any {
    if(this.cursor + 1 >= this.states.length) {
      console.log('End of history... returning the last state');
      return this.states[this.cursor];
    }
    this.cursor++;
    return this.states[this.cursor];
  }

  currState(): any {
    return this.states[this.cursor];
  }
}

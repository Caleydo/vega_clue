import ProvenanceGraph from 'phovea_core/src/provenance/ProvenanceGraph';
import {IView} from '../AppWrapper';
import {cat, IObjectRef, ref} from 'phovea_core/src/provenance';
import * as d3 from 'd3';
import * as vega from 'vega-lib';
import {Spec, Signal, View} from 'vega-lib';
import {setState} from './cmds';

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
      'name': 'CLUE_captureState',
      'value': null,
      'on': [
        {'events': 'mousedown, touchstart', 'update': 'null', 'force': true}
      ]
    }
  ];

  private readonly $node: d3.Selection<View>;

  private readonly activeSignals: Map<string, boolean> = new Map<string, boolean>();

  readonly ref: IObjectRef<VegaView>;
  private currentState: any = null;

  private signalHandler = (name, value) => {
    // ignore signals that are not listed or disabled
    if (!this.activeSignals.has(name) || !this.activeSignals.get(name)) {
      return;
    }

    // cast to <any>, because `getState()` is missing in 'vega-typings'
    const vegaView = (<any>this.$node.datum());
    console.log(name, value, vegaView.getState());

    // capture vega state and add to history
    if (name === this.clueSignals[0].name) {
      const bak = this.currentState;
      this.currentState = vegaView.getState();
      this.graph.pushWithResult(setState(this.ref, vegaView.getState()), {
        inverse: setState(this.ref, bak)
      });
    }
  }

  constructor(parent: HTMLElement, private readonly graph: ProvenanceGraph, private spec: Spec) {
    this.ref = this.graph.findOrAddObject(ref(this, spec.title ? String(spec.title) : 'View', cat.visual));

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
        this.currentState = (<any>vegaView).getState();
        this.addSignalListener(vegaView);
      });

    vegaView.run(); // run after defining the promise
    this.$node.datum(vegaView);

    this.$node.select('.btn-undo')
      .on('click', () => {
        this.graph.undo();
      });

    this.$node.select('.btn-redo')
      .on('click', () => {
        // NOT possible
        const next = this.graph.act.nextState;
        if (next) {
          this.graph.jumpTo(next);
        }
      });

    return vegaViewReady.then(() => this);
  }

  private initClueSignals(signals: Signal[]): Signal[] {
    if (!signals) {
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

  setStateImpl(state: any) {
    const vegaView = <any>this.$node.datum();
    const bak = this.currentState;
    this.currentState = state;
    vegaView.setState(state);
    return bak;
  }

  remove() {
    const vegaView = this.$node.datum();
    this.removeSignalListener(vegaView);
    vegaView.finalize();
    this.$node.remove();
  }

  private addSignalListener(vegaView: View) {
    if (this.spec.signals) {
      this.spec.signals.forEach((signal) => {
        vegaView.addSignalListener(signal.name, this.signalHandler);
      });
    }
  }

  private removeSignalListener(vegaView: View) {
    if (this.spec.signals) {
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
    if (!signal.on) {
      return false;
    }
    return signal.on.some((d) => this.activateSignal.test(d.events.toString()));
  }
}

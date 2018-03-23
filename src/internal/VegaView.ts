import ProvenanceGraph from 'phovea_core/src/provenance/ProvenanceGraph';
import {IView} from '../AppWrapper';
import {cat, IObjectRef, ref} from 'phovea_core/src/provenance';
import * as d3 from 'd3';
import * as vega from 'vega-lib';
import {Spec, View, NewSignal, BindCheckbox, BindRadioSelect, BindRange} from 'vega-lib';
import {setState} from './cmds';

/**
 * Extend the Vega Signal specification about tracking
 */
interface ClueSignal extends NewSignal {
  track: boolean;
}

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

  private readonly $node: d3.Selection<View>;

  readonly ref: IObjectRef<VegaView>;
  private currentState: any = null;

  private signalHandler = (name, value) => {
    // cast to <any>, because `getState()` is missing in 'vega-typings'
    const vegaView = (<any>this.$node.datum());
    const signalSpec: ClueSignal = <ClueSignal>this.spec.signals.find((d) => d.name === name)!;
    console.log(name, value, vegaView.getState(), signalSpec);

    let actionName = ``;

    if(signalSpec.bind) {
      switch ((<BindCheckbox | BindRadioSelect | BindRange>signalSpec.bind).input) {
        case 'select':
        case 'radio':
          actionName = `${name} = ${value}`;
          break;
        case 'range':
          console.log('changed range binding');
          break;
      }
    }

    // capture vega state and add to history
    const bak = this.currentState;
    this.currentState = vegaView.getState();
    this.graph.pushWithResult(setState(this.ref, `${name} = ${value}`, vegaView.getState()), {
      inverse: setState(this.ref, `${name} = ${value}`, bak)
    });
  }

  constructor(parent: HTMLElement, private readonly graph: ProvenanceGraph, private spec: Spec) {
    this.ref = this.graph.findOrAddObject(ref(this, spec.title ? String(spec.title) : 'View', cat.visual));

    this.$node = d3.select(parent)
      .append('div')
      .classed('vega-view', true)
      .html(`
        <div class="vega-wrapper"></div>
      `);
  }

  init(): Promise<VegaView> {
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

    return vegaViewReady.then(() => this);
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
      this.spec.signals
        .filter((signal: ClueSignal) => signal.track)
        .forEach((signal) => {
          vegaView.addSignalListener(signal.name, this.signalHandler);
        });
    }
  }

  private removeSignalListener(vegaView: View) {
    if (this.spec.signals) {
      this.spec.signals
        .filter((signal: ClueSignal) => signal.track)
        .forEach((signal) => {
          vegaView.removeSignalListener(signal.name, this.signalHandler);
        });
    }
  }
}

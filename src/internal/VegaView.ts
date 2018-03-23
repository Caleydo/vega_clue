import ProvenanceGraph from 'phovea_core/src/provenance/ProvenanceGraph';
import {IView} from '../AppWrapper';
import {cat, IObjectRef, ref} from 'phovea_core/src/provenance';
// best solution to import Handlebars (@see https://github.com/wycats/handlebars.js/issues/1174)
import * as handlebars from 'handlebars/dist/handlebars';
import * as d3 from 'd3';
import * as vega from 'vega-lib';
import {Spec, View, BindRange} from 'vega-lib';
import {setState} from './cmds';
import {ClueSignal, IAsyncData, IAsyncSignal} from './spec';


interface IVegaViewOptions {
  /**
   * Set the renderer for Vega (svg or canvas)
   */
  vegaRenderer: 'canvas' | 'svg' | 'none';
}

interface IRangeDOMListener {
  dragging: boolean;
  elem: d3.Selection<any>;
  listener: Map<string, () => void>;
}

export class VegaView implements IView<VegaView> {

  private readonly options: IVegaViewOptions = {
    vegaRenderer: 'svg',
  };

  private readonly $node: d3.Selection<View>;

  readonly ref: IObjectRef<VegaView>;
  private currentState: any = null;

  private rangeDOMListener: IRangeDOMListener[] = [];

  private blockSignalHandler: boolean = false;

  private signalHandler = (name, value) => {
    if(this.blockSignalHandler) {
      return;
    }

    // cast to <any>, because `getState()` is missing in 'vega-typings'
    const vegaView = (<any>this.$node.datum());
    const signalSpec: ClueSignal = <ClueSignal>this.spec.signals.find((d) => d.name === name)!;
    const context = {name, value};

    if(signalSpec.track.async) {
      vegaView.runAsync().then((view) => {
        const async = signalSpec.track.async;

        async.filter((d: IAsyncSignal) => d.signal)
          .forEach((d: IAsyncSignal) => {
            const key = (d.as) ? d.as : d.signal;
            context[key] = view.signal(d.signal);
          });

        async.filter((d: IAsyncData) => d.data)
          .forEach((d: IAsyncData) => {
            const key = (d.as) ? d.as : d.data;
            context[key] = view.data(d.data);
          });

        const template = handlebars.compile(signalSpec.track.title);
        const title = template(context);
        this.pushNewGraphNode(title, vegaView.getState());
      });

    } else {
      const rawTitle = (signalSpec.track.title) ? signalSpec.track.title : `{{name}} = {{value}}`;
      const template = handlebars.compile(rawTitle);
      const title = template(context);
      this.pushNewGraphNode(title, vegaView.getState());
    }
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

    // prevent adding the provenance graph node twice
    this.blockSignalHandler = true;
    vegaView.setState(state);
    this.blockSignalHandler = false;

    return bak;
  }

  private pushNewGraphNode(title: string, state: any) {
    // capture vega state and add to history
    const bak = this.currentState;
    this.currentState = state;
    this.graph.pushWithResult(setState(this.ref, title, state), {
      inverse: setState(this.ref, title, bak)
    });
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
        .forEach((signal: ClueSignal) => {
          // check for range input
          if(signal.bind && (<BindRange>signal.bind).input === 'range') {
            this.addRangeDOMListener(signal.name, (<BindRange>signal.bind).input);
          } else {
            vegaView.addSignalListener(signal.name, this.signalHandler);
          }
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
    // remove all DOM listener at once
    this.removeRangeDOMListener();
  }

  private addRangeDOMListener(signalName, inputType) {
    const domListener: IRangeDOMListener = {
      dragging: false,
      elem: this.$node.select(`input[type="${inputType}"][name="${signalName}"]`),
      listener: new Map()
    };

    const startListener = () => { domListener.dragging = true; };
    const endListener = () => {
      if(!domListener.dragging) {
        return;
      }
      this.signalHandler(signalName, domListener.elem.property('value'));
      domListener.dragging = false;
    };

    const listener: [string, () => void][] = [
      ['mousedown', startListener],
      ['mouseup', endListener],
      ['touchstart', startListener],
      ['touchend', endListener]
    ];

    listener.forEach((d) => {
      domListener.listener.set(d[0], d[1]);
      domListener.elem.on(d[0], d[1]);
    });

    this.rangeDOMListener = [...this.rangeDOMListener, domListener];
  }

  private removeRangeDOMListener() {
    this.rangeDOMListener.forEach((d) => {
      const listener = Array.from(d.listener.entries());
      listener.forEach((e) => {
        d.elem.on(e[0], null);
      });
    });

  }
}

import ProvenanceGraph from 'phovea_core/src/provenance/ProvenanceGraph';
import {IView} from '../AppWrapper';
import {cat, IObjectRef, ref} from 'phovea_core/src/provenance';
// best solution to import Handlebars (@see https://github.com/wycats/handlebars.js/issues/1174)
import * as handlebars from 'handlebars/dist/handlebars';
import * as d3 from 'd3';
import * as vega from 'vega-lib';
import {Spec, View, BindRange} from 'vega-lib';
import {ISetStateMetadata, setState} from './cmds';
import {ClueData, ClueSignal, IAsyncData, IAsyncSignal} from './spec';
import {IVisStateApp} from 'phovea_clue/src/provenance_retrieval/IVisState';
import {
  createPropertyValue, IProperty,
  IPropertyValue, Property, PropertyType
} from 'phovea_core/src/provenance/retrieval/VisStateProperty';


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

export class VegaView implements IView<VegaView>, IVisStateApp {

  private readonly options: IVegaViewOptions = {
    vegaRenderer: 'svg',
  };

  private readonly $node: d3.Selection<View>;

  readonly ref: IObjectRef<VegaView>;
  private currentState: any = null;

  private rangeDOMListener: IRangeDOMListener[] = [];

  private blockSignalHandler: boolean = false;

  /**
   * Run the signal handler for the given signal name.
   *
   * The function retrieves synchronous or asynchronous variables
   * to replace the values in the configured title and further
   * metadata, such as operation and category. The metadata and the
   * Vega state are push into the provenance graph as new graph node.
   *
   * @param name
   * @param value
   */
  private signalHandler = (name, value) => {
    if(this.blockSignalHandler) {
      return;
    }

    // cast to <any>, because `getState()` is missing in 'vega-typings'
    const vegaView = (<any>this.$node.datum());
    const signalSpec: ClueSignal = <ClueSignal>this.spec.signals.find((d) => d.name === name)!;
    const context = {name, value};

    let promise = Promise.resolve(true);

    // if async flag set wait for Vega dataflow is complete
    if(signalSpec.track.async) {
      promise = vegaView.runAsync()
        .then((view) => {
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
        });
    }

    promise
      .then((): ISetStateMetadata => {
        const rawTitle = (signalSpec.track.title) ? signalSpec.track.title : `{{name}} = {{value}}`;
        const template = handlebars.compile(rawTitle);
        return {
          name: template(context),
          category: signalSpec.track.category || 'data',
          operation: signalSpec.track.operation || 'update'
        };
      })
      .then((metadata) => {
        this.pushNewGraphNode(metadata, vegaView.getState());
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

  /**
   * Initialize the Vega view and attach the signal listener.
   *
   * @returns {Promise<VegaView>}
   */
  init(): Promise<VegaView> {
    const vegaView: View = new View(vega.parse(this.spec))
      //.logLevel(vega.Warn) // set view logging level
      .renderer(this.options.vegaRenderer)  // set renderer (canvas or svg)
      .initialize(<Element>this.$node.select('.vega-wrapper').node()) // initialize view within parent DOM container
      .hover(); // enable hover encode set processing

    const vegaViewReady = (<any>vegaView).runAsync() // type cast to any because `runAsync` is missing in 'vega-typings'
      .then(() => {
        this.currentState = (<any>vegaView).getState();
        this.addSignalListener(vegaView, this.spec);
      });

    vegaView.run(); // run after defining the promise
    this.$node.datum(vegaView);

    this.registerHandlebarsHelper();

    return vegaViewReady.then(() => this);
  }

  /**
   * Register handlebars helper that can be used in the title properties
   * from the Vega specification.
   */
  private registerHandlebarsHelper() {
    handlebars.registerHelper('round', (x, n) => d3.round(x, n));
  }

  /**
   * Remove event listener and the view itself
   */
  remove() {
    const vegaView = this.$node.datum();
    this.removeSignalListener(vegaView, this.spec);
    vegaView.finalize();
    this.$node.remove();
  }

  /**
   * Apply a given state to the current Vega view.
   *
   * @param state New state that will be applied to the Vega view
   * @returns {any} Backup of the previous state
   */
  setStateImpl(state: any): any {
    const vegaView = <any>this.$node.datum();
    const bak = this.currentState;
    this.currentState = state;

    // prevent adding the provenance graph node twice
    this.blockSignalHandler = true;
    vegaView.setState(state);
    this.blockSignalHandler = false;

    return bak;
  }

  /**
   * Push a new state with metadata to the provenance graph.
   *
   * @param {ISetStateMetadata} metadata
   * @param state
   */
  private pushNewGraphNode(metadata: ISetStateMetadata, state: any) {
    // capture vega state and add to history
    const bak = this.currentState;
    this.currentState = state;
    console.log(metadata, state);
    this.graph.pushWithResult(setState(this.ref, metadata, state), {
      inverse: setState(this.ref, metadata, bak)
    });
  }

  /**
   * Get all properties (i.e., groups) with the corresponding values
   * that should be available for retrieval.
   *
   * The available properties are generated based on:
   * 1. Existing property values stored in the provenance graph
   * 2. Predefined properties that
   *
   * @returns {Promise<IProperty[]>}
   */
  getVisStateProps(): Promise<IProperty[]> {
    if(!this.currentState) {
      console.warn('No current Vega state available; returning an empty property list.');
      return Promise.resolve([]);
    }

    const propertyValues = this.getPropertyValuesFromGraph(this.graph);
    const groups: {group: string, type: string}[] = this.getGroupsFromVegaSpec(this.spec, this.currentState);

    // create properties from groups
    const properties = groups.map((g) => {
      const propVals =  propertyValues
        .filter((d) => d && d.group === g.group)
        .filter((d, i, arr) => arr.findIndex((e) => e.id === d.id) === arr.lastIndexOf(d)) // make values unique
        .map((prop) => prop.clone())
        .map((prop) => {
          // special handling for numerical properties
          if(prop.type === PropertyType.NUMERICAL) {
            prop.text = `${prop.id} = <i>&lt;number&gt;</i>`;
            prop.needsInput = true;
          }
          return prop;
        });

      switch (g.type) {
        case 'number':
          return new Property(PropertyType.NUMERICAL, g.group, propVals);
        case 'category':
          return new Property(PropertyType.CATEGORICAL, g.group, propVals);
        case 'set':
          return new Property(PropertyType.SET, g.group, propVals);
      }
      return undefined;
    })
    .filter((s) => s); // filter undefined values

    return Promise.resolve(properties);
  }

  /**
   * Get existing property values that are stored in the provenance graph as list.
   * Duplicates are possible.
   *
   * @param {ProvenanceGraph} graph
   * @returns {IPropertyValue[]}
   */
  private getPropertyValuesFromGraph(graph: ProvenanceGraph): IPropertyValue[] {
    return graph.states
      .map((s) => s.visState)
      .filter((vs) => vs.isPersisted())
      .map((vs) => vs.propValues)
      .reduce((prev, curr) => prev.concat(curr), []); // flatten the array
  }

  /**
   * Extract the group and type from the `data` and `signals` section
   * of the Vega specification.
   *
   * Signal references in the group definition will be resolved
   * with the values from the current state.
   *
   * @param {Spec} spec
   * @param currentState
   * @returns {{group: string; type: string}[]}
   */
  private getGroupsFromVegaSpec(spec: Spec, currentState: any): {group: string, type: string}[]  {
    return [...spec.signals, ...spec.data]
      .map((s: ClueSignal) => {
        if(s.search && s.search.group) {
          return {
            group: this.resolveSignalReference(s.search.group, this.currentState),
            type: s.search.type
          };
        }
        return undefined;
      })
      .filter((s) => s); // filter undefined values
  }

  /**
   * Get property values that describe the current visualization state
   * and should be available later for retrieval.
   *
   * @returns {Promise<IPropertyValue[]>}
   */
  getCurrVisState(): Promise<IPropertyValue[]> {
    if(!this.currentState) {
      console.warn('No current Vega state available; returning an empty property list.');
      return Promise.resolve([]);
    }

    /**
     * Resolve signal references in the input data and set the values from the current state
     * @param {ClueSignal | ClueData} input
     * @param current
     */
    const prepareInput = (input: any, current: any) => {
      return input
        .filter((d: ClueSignal | ClueData) => d.search)
        .map((d) => Object.assign({}, d)) // shallow copy object
        .map((d: ClueSignal | ClueData) => {
          if(d.search && d.search.group) {
            d.search.group = this.resolveSignalReference(d.search.group, this.currentState);
          }
          d.value = current[d.name];
          return d;
        });
    }

    let propertyValues: IPropertyValue[];
    const signals = prepareInput(this.spec.signals, this.currentState.signals);
    propertyValues = signals.map((s) => this.signalToPropertyValue(s));

    prepareInput(this.spec.data, this.currentState.data)
      .forEach((d) => {
        // add each element individually
        propertyValues = [...propertyValues, ...this.dataToPropertyValue(d)];
      });

    return Promise.resolve(propertyValues);
  }

  /**
   * Create property values from a given signal property.
   *
   * At the moment this function only creates numerical and category.
   *
   * @param {ClueSignal} signal
   * @returns {IPropertyValue}
   */
  private signalToPropertyValue(signal: ClueSignal): IPropertyValue {
    const context = {name: signal.name, value: signal.value};
    let rawTitle, template;

    switch(signal.search.type) {
      case 'number':
        rawTitle = (signal.search.title) ? signal.search.title : `{{name}} = {{round value 2}}`;
        template = handlebars.compile(rawTitle);

        return createPropertyValue(PropertyType.NUMERICAL, {
          id: signal.name,
          text: template(context),
          group: signal.search.group,
          payload: {
            numVal: signal.value
          }
        });

      case 'category':
        rawTitle = (signal.search.title) ? signal.search.title : `{{value}}`;
        template = handlebars.compile(rawTitle);

        return createPropertyValue(PropertyType.CATEGORICAL, {
          id: signal.name,
          text: template(context),
          group: signal.search.group
        });
    }

    console.warn(`Undefined search type ${signal.search.type} for signal '${signal.name}'.`);
    return undefined;
  }

  /**
   * Create property values from a given data property.
   *
   * At the moment this function only works with arrays for `data.value`,
   * which will create one SET property value for each item in the array.
   *
   * @param {ClueData} data
   * @returns {IPropertyValue[]}
   */
  private dataToPropertyValue(data: ClueData): IPropertyValue[] {
    let propVals = [];

    if(Array.isArray(data.value) && data.search.type === 'set') {
      const rawTitle = (data.search.title) ? data.search.title : `{{name}}_{{index}}`;
      const template = handlebars.compile(rawTitle);

      propVals = data.value.map((d, i) => {
        const context = {name: data.name, datum: d, index: i};
        const title = template(context);
        return createPropertyValue(PropertyType.SET, {
          id: title, // Special case! Use title also id to make items distinguishable, because name is equal for all items
          text: title,
          group: data.search.group
        });
      });

    } else {
      console.warn(`Undefined search type ${data.search.type} for signal '${data.name}'.`);
    }

    return propVals;
  }

  /**
   * Resolve a signal reference in a spec property with the value from the given current state.
   * If a string instead of a signal reference is given, it will just return the string.
   *
   * @param {{signal: string} | string} specProperty
   * @param currentState
   * @returns {{signal: string} | string}
   */
  private resolveSignalReference(specProperty: {signal: string} | string, currentState: any): string {
    if(!specProperty) {
      return;
    }

    const signalRef: string = (<any>specProperty).signal;
    return (signalRef) ? currentState.signals[signalRef] : specProperty;
  }

  /**
   * Add signal listener to Vega view based on the given specification
   * @param {View} vegaView
   * @param {Spec} spec
   */
  private addSignalListener(vegaView: View, spec: Spec) {
    if (spec.signals) {
      spec.signals
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

  /**
   * Remove signal listener to Vega view based on the given specification
   * @param {View} vegaView
   * @param {Spec} spec
   */
  private removeSignalListener(vegaView: View, spec: Spec) {
    if (spec.signals) {
      spec.signals
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

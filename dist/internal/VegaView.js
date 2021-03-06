import { ObjectRefUtils } from 'phovea_core';
// best solution to import Handlebars (@see https://github.com/wycats/handlebars.js/issues/1174)
import * as handlebars from 'handlebars/dist/handlebars';
import * as d3 from 'd3';
import * as vega from 'vega-lib';
import { View } from 'vega-lib';
import { setState } from './cmds';
import { createPropertyValue, numericalProperty, Property, PropertyType, TAG_VALUE_SEPARATOR } from 'phovea_core';
import { setProperty } from 'phovea_core';
export class VegaView {
    constructor(parent, graph, spec) {
        this.graph = graph;
        this.spec = spec;
        this.options = {
            vegaRenderer: 'svg',
        };
        this.currentState = null;
        this.rangeDOMListener = [];
        this.blockSignalHandler = false;
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
        this.signalHandler = (name, value) => {
            if (this.blockSignalHandler) {
                return;
            }
            // cast to <any>, because `getState()` is missing in 'vega-typings'
            const vegaView = this.$node.datum();
            const signalSpec = this.spec.signals.find((d) => d.name === name);
            const context = { name, value };
            let promise = Promise.resolve(true);
            // if async flag set wait for Vega dataflow is complete
            if (signalSpec.track.async) {
                promise = vegaView.runAsync()
                    .then((view) => {
                    const async = signalSpec.track.async;
                    async.filter((d) => d.signal)
                        .forEach((d) => {
                        const key = (d.as) ? d.as : d.signal;
                        context[key] = view.signal(d.signal);
                    });
                    async.filter((d) => d.data)
                        .forEach((d) => {
                        const key = (d.as) ? d.as : d.data;
                        context[key] = view.data(d.data);
                    });
                });
            }
            promise
                .then(() => {
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
        };
        this.ref = this.graph.findOrAddObject(ObjectRefUtils.objectRef(this, spec.title ? String(spec.title) : 'View', ObjectRefUtils.category.visual));
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
    init() {
        const vegaView = new View(vega.parse(this.spec))
            //.logLevel(vega.Warn) // set view logging level
            .renderer(this.options.vegaRenderer) // set renderer (canvas or svg)
            .initialize(this.$node.select('.vega-wrapper').node()) // initialize view within parent DOM container
            .hover(); // enable hover encode set processing
        const vegaViewReady = vegaView.runAsync() // type cast to any because `runAsync` is missing in 'vega-typings'
            .then(() => {
            this.currentState = vegaView.getState();
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
    registerHandlebarsHelper() {
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
    setStateImpl(state) {
        const vegaView = this.$node.datum();
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
    pushNewGraphNode(metadata, state) {
        // capture vega state and add to history
        const bak = this.currentState;
        this.currentState = state;
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
    getVisStateProps() {
        if (!this.currentState) {
            console.warn('No current Vega state available; returning an empty property list.');
            return Promise.resolve([]);
        }
        const vegaView = this.$node.datum();
        const propertyValues = this.getPropertyValuesFromGraph(this.graph);
        const groups = this.getGroupsFromVegaSpec(this.spec, vegaView);
        // create properties from groups
        const properties = groups.map((g) => {
            const propVals = propertyValues
                .filter((d) => d && d.group === g.group)
                .filter((d, i, arr) => arr.findIndex((e) => e.id === d.id) === arr.lastIndexOf(d)) // make values unique
                .map((prop) => prop.clone())
                .map((prop) => {
                // special handling for numerical properties
                if (prop.type === PropertyType.NUMERICAL) {
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
        const fill = [...this.spec.signals, ...this.spec.data]
            .filter((s) => s.search && s.search.fill);
        const fillSource = this.createFillPropertiesFromDataSource(fill, vegaView);
        const fillRange = this.createFillPropertiesFromRanges(fill, vegaView);
        return Promise.resolve([
            ...properties,
            // add fill properties as last items
            ...fillSource,
            ...fillRange
        ]);
    }
    /**
     * Get existing property values that are stored in the provenance graph as list.
     * Duplicates are possible.
     *
     * @param {ProvenanceGraph} graph
     * @returns {IPropertyValue[]}
     */
    getPropertyValuesFromGraph(graph) {
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
     * @param vegaView
     * @returns {{group: string; type: string}[]}
     */
    getGroupsFromVegaSpec(spec, vegaView) {
        return [...spec.signals, ...spec.data]
            .filter((s) => s.search && s.search.group)
            .map((s) => {
            return {
                group: this.resolveSignalReference(s.search.group, vegaView),
                type: s.search.type
            };
        });
    }
    /**
     * Creates a property with multiple property values of a data source from the Vega view.
     * This function works only for `search.type = 'set'` and needs a valid data reference.
     *
     * @param {IClueSignal} fill
     * @param {View} vegaView
     * @returns {IProperty[]}
     */
    createFillPropertiesFromDataSource(fill, vegaView) {
        return fill
            .filter((s) => s.search.type === 'set' && s.search.fill.source)
            .map((s) => {
            const group = this.resolveSignalReference(s.search.group, vegaView);
            const rawTitle = (s.search.title) ? s.search.title : `{{name}}_{{index}}`;
            const template = handlebars.compile(rawTitle);
            const values = vegaView.data(s.search.fill.source)
                .map((d, i) => {
                const context = { name: s.name, datum: d, index: i };
                const title = template(context);
                return {
                    // Special case! Use title also id to make items distinguishable, because name is equal for all items
                    id: `${s.name} ${TAG_VALUE_SEPARATOR} ${title}`,
                    text: title,
                    group
                };
            });
            return setProperty(group, values); // property of type SET
        });
    }
    /**
     * Creates a property with multiple property values from a range between min/max and a certain step width.
     * This function works only for `search.type = 'number'` and needs defined a valid range.
     *
     * @param {IClueSignal} fill
     * @param vegaView
     * @returns {IProperty[]}
     */
    createFillPropertiesFromRanges(fill, vegaView) {
        return fill
            .filter((s) => s.search.type === 'number' && s.search.fill.range)
            .map((s) => {
            const range = s.search.fill.range;
            const group = this.resolveSignalReference(s.search.group, vegaView);
            const rawTitle = (s.search.title) ? s.search.title : `{{value}}`;
            const template = handlebars.compile(rawTitle);
            const values = d3.range(range.min, range.max, range.step)
                .map((d, i) => {
                const context = { name: s.name, value: d, index: i };
                const title = template(context);
                return {
                    // Special case! Use title also id to make items distinguishable, because name is equal for all items
                    id: `${s.name} ${TAG_VALUE_SEPARATOR} ${title}`,
                    text: title,
                    group,
                    payload: {
                        numVal: title,
                        propText: group
                    }
                };
            });
            return numericalProperty(group, values); // property of type NUMERICAL
        });
    }
    /**
     * Get property values that describe the current visualization state
     * and should be available later for retrieval.
     *
     * @returns {Promise<IPropertyValue[]>}
     */
    getCurrVisState() {
        if (!this.currentState) {
            console.warn('No current Vega state available; returning an empty property list.');
            return Promise.resolve([]);
        }
        const vegaView = this.$node.datum();
        /**
         * Resolve signal references in the input data and set the values from the current Vega view
         * @param {IClueSignal | ClueData} input
         * @param {View} vegaView
         * @param {'signal'|'data'} source
         */
        const prepareInput = (input, vegaView, source) => {
            return input
                .filter((d) => d.search)
                .map((d) => Object.assign({}, d)) // shallow copy object
                .map((d) => {
                if (d.search && d.search.group) {
                    d.search.group = this.resolveSignalReference(d.search.group, vegaView);
                }
                d.value = (source === 'signal') ? vegaView.signal(d.name) : vegaView.data(d.name);
                return d;
            });
        };
        let propertyValues;
        const signals = prepareInput(this.spec.signals, vegaView, 'signal');
        propertyValues = signals.map((s) => this.signalToPropertyValue(s));
        prepareInput(this.spec.data, vegaView, 'data')
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
     * @param {IClueSignal} signal
     * @returns {IPropertyValue}
     */
    signalToPropertyValue(signal) {
        const context = { name: signal.name, value: signal.value };
        let rawTitle, template;
        switch (signal.search.type) {
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
                    id: template(context),
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
    dataToPropertyValue(data) {
        let propVals = [];
        if (Array.isArray(data.value) && data.search.type === 'set') {
            const rawTitle = (data.search.title) ? data.search.title : `{{name}}_{{index}}`;
            const template = handlebars.compile(rawTitle);
            propVals = data.value.map((d, i) => {
                const context = { name: data.name, datum: d, index: i };
                const title = template(context);
                return createPropertyValue(PropertyType.SET, {
                    // Special case! Use title also id to make items distinguishable, because name is equal for all items
                    id: `${data.name} ${TAG_VALUE_SEPARATOR} ${title}`,
                    text: title,
                    group: data.search.group
                });
            });
        }
        else {
            console.warn(`Undefined search type ${data.search.type} for signal '${data.name}'.`);
        }
        return propVals;
    }
    /**
     * Resolve a signal reference in a spec property with the value from the given current state.
     * If a string instead of a signal reference is given, it will just return the string.
     *
     * @param {{signal: string} | string} specProperty
     * @param vegaView
     * @returns {{signal: string} | string}
     */
    resolveSignalReference(specProperty, vegaView) {
        if (!specProperty) {
            return;
        }
        const signalRef = specProperty.signal;
        return (signalRef) ? vegaView.signal(signalRef) : specProperty;
    }
    /**
     * Add signal listener to Vega view based on the given specification
     * @param {View} vegaView
     * @param {Spec} spec
     */
    addSignalListener(vegaView, spec) {
        if (spec.signals) {
            spec.signals
                .filter((signal) => signal.track)
                .forEach((signal) => {
                // check for range input
                if (signal.bind && signal.bind.input === 'range') {
                    this.addRangeDOMListener(signal.name, signal.bind.input);
                }
                else {
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
    removeSignalListener(vegaView, spec) {
        if (spec.signals) {
            spec.signals
                .filter((signal) => signal.track)
                .forEach((signal) => {
                vegaView.removeSignalListener(signal.name, this.signalHandler);
            });
        }
        // remove all DOM listener at once
        this.removeRangeDOMListener();
    }
    addRangeDOMListener(signalName, inputType) {
        const domListener = {
            dragging: false,
            elem: this.$node.select(`input[type="${inputType}"][name="${signalName}"]`),
            listener: new Map()
        };
        const startListener = () => { domListener.dragging = true; };
        const endListener = () => {
            if (!domListener.dragging) {
                return;
            }
            this.signalHandler(signalName, domListener.elem.property('value'));
            domListener.dragging = false;
        };
        const listener = [
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
    removeRangeDOMListener() {
        this.rangeDOMListener.forEach((d) => {
            const listener = Array.from(d.listener.entries());
            listener.forEach((e) => {
                d.elem.on(e[0], null);
            });
        });
    }
}
//# sourceMappingURL=VegaView.js.map
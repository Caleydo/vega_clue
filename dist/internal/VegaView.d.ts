import { ProvenanceGraph } from 'phovea_core';
import { IView } from '../AppWrapper';
import { IObjectRef } from 'phovea_core';
import { Spec } from 'vega-lib';
import { IVisStateApp } from 'phovea_clue';
import { IProperty, IPropertyValue } from 'phovea_core';
export declare class VegaView implements IView<VegaView>, IVisStateApp {
    private readonly graph;
    private spec;
    private readonly options;
    private readonly $node;
    readonly ref: IObjectRef<VegaView>;
    private currentState;
    private rangeDOMListener;
    private blockSignalHandler;
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
    private signalHandler;
    constructor(parent: HTMLElement, graph: ProvenanceGraph, spec: Spec);
    /**
     * Initialize the Vega view and attach the signal listener.
     *
     * @returns {Promise<VegaView>}
     */
    init(): Promise<VegaView>;
    /**
     * Register handlebars helper that can be used in the title properties
     * from the Vega specification.
     */
    private registerHandlebarsHelper;
    /**
     * Remove event listener and the view itself
     */
    remove(): void;
    /**
     * Apply a given state to the current Vega view.
     *
     * @param state New state that will be applied to the Vega view
     * @returns {any} Backup of the previous state
     */
    setStateImpl(state: any): any;
    /**
     * Push a new state with metadata to the provenance graph.
     *
     * @param {ISetStateMetadata} metadata
     * @param state
     */
    private pushNewGraphNode;
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
    getVisStateProps(): Promise<IProperty[]>;
    /**
     * Get existing property values that are stored in the provenance graph as list.
     * Duplicates are possible.
     *
     * @param {ProvenanceGraph} graph
     * @returns {IPropertyValue[]}
     */
    private getPropertyValuesFromGraph;
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
    private getGroupsFromVegaSpec;
    /**
     * Creates a property with multiple property values of a data source from the Vega view.
     * This function works only for `search.type = 'set'` and needs a valid data reference.
     *
     * @param {IClueSignal} fill
     * @param {View} vegaView
     * @returns {IProperty[]}
     */
    private createFillPropertiesFromDataSource;
    /**
     * Creates a property with multiple property values from a range between min/max and a certain step width.
     * This function works only for `search.type = 'number'` and needs defined a valid range.
     *
     * @param {IClueSignal} fill
     * @param vegaView
     * @returns {IProperty[]}
     */
    private createFillPropertiesFromRanges;
    /**
     * Get property values that describe the current visualization state
     * and should be available later for retrieval.
     *
     * @returns {Promise<IPropertyValue[]>}
     */
    getCurrVisState(): Promise<IPropertyValue[]>;
    /**
     * Create property values from a given signal property.
     *
     * At the moment this function only creates numerical and category.
     *
     * @param {IClueSignal} signal
     * @returns {IPropertyValue}
     */
    private signalToPropertyValue;
    /**
     * Create property values from a given data property.
     *
     * At the moment this function only works with arrays for `data.value`,
     * which will create one SET property value for each item in the array.
     *
     * @param {ClueData} data
     * @returns {IPropertyValue[]}
     */
    private dataToPropertyValue;
    /**
     * Resolve a signal reference in a spec property with the value from the given current state.
     * If a string instead of a signal reference is given, it will just return the string.
     *
     * @param {{signal: string} | string} specProperty
     * @param vegaView
     * @returns {{signal: string} | string}
     */
    private resolveSignalReference;
    /**
     * Add signal listener to Vega view based on the given specification
     * @param {View} vegaView
     * @param {Spec} spec
     */
    private addSignalListener;
    /**
     * Remove signal listener to Vega view based on the given specification
     * @param {View} vegaView
     * @param {Spec} spec
     */
    private removeSignalListener;
    private addRangeDOMListener;
    private removeRangeDOMListener;
}

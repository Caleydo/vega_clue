/**
 * Created by Caleydo Team on 31.08.2016.
 */
import { IVisStateApp } from 'phovea_clue';
import { IObjectRef } from 'phovea_core';
import { EventHandler } from 'phovea_core';
import { ProvenanceGraph } from 'phovea_core';
import { CLUEGraphManager } from 'phovea_clue';
import { IProperty, IPropertyValue } from 'phovea_core';
import { IView } from '../AppWrapper';
export default class App extends EventHandler implements IView<App>, IVisStateApp {
    readonly graph: ProvenanceGraph;
    readonly graphManager: CLUEGraphManager;
    /**
     * IObjectRef to this App instance
     * @type {IObjectRef<App>}
     */
    readonly ref: IObjectRef<App>;
    private readonly $node;
    private vegaView;
    private readonly vegaExampleUrl;
    private readonly vegaDatasetUrl;
    /**
     * Promise to wait for Vega view initialization, before calling `getVisStateProps()`
     */
    private initCompleteResolve;
    private initCompletePromise;
    constructor(graph: ProvenanceGraph, graphManager: CLUEGraphManager, parent: HTMLElement);
    /**
     * Initialize the app
     * @returns {Promise<App>}
     */
    init(): Promise<App>;
    private initSingleSpec;
    private initMultiSpecs;
    private validateVegaData;
    private transformToAbsoluteUrls;
    private openVegaView;
    getVisStateProps(): Promise<IProperty[]>;
    getCurrVisState(): Promise<IPropertyValue[]>;
    remove(): void;
}

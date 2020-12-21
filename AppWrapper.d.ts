import { ACLUEWrapper, CLUEGraphManager, IVisStateApp } from 'phovea_clue';
import { AppHeader } from 'phovea_ui';
import { ProvenanceGraph } from 'phovea_core';
import App from './internal/App';
export interface IView<T> {
    init(): Promise<T>;
    remove(): any;
}
export interface IAppWrapperOptions {
    /**
     * name of this application
     */
    name: string;
    /**
     * prefix used for provenance graphs and used to identify matching provenance graphs
     */
    prefix: string;
    /**
     * Show/hide the EU cookie disclaimer bar from `cookie-bar.eu`
     */
    showCookieDisclaimer: boolean;
}
/**
 * The main class for the App app
 */
export declare class AppWrapper<T extends IView<T> & IVisStateApp> extends ACLUEWrapper {
    protected readonly options: IAppWrapperOptions;
    protected app: Promise<App>;
    protected header: AppHeader;
    constructor(options?: Partial<IAppWrapperOptions>);
    init(): Promise<void>;
    protected buildImpl(body: HTMLElement): {
        graph: Promise<ProvenanceGraph>;
        manager: CLUEGraphManager;
        storyVis: () => Promise<import("phovea_clue").VerticalStoryVis>;
        provVis: () => Promise<import("phovea_clue").LayoutedProvVis>;
    };
    /**
     * build the actual main application given the arguments
     * @param {ProvenanceGraph} graph the resolved current provenance graph
     * @param {CLUEGraphManager} manager its manager
     * @param {HTMLElement} main root dom element
     * @returns {PromiseLike<T> | T}
     */
    protected createApp(graph: ProvenanceGraph, manager: CLUEGraphManager, main: HTMLElement): PromiseLike<App> | App;
}

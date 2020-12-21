import { IObjectRef, ActionNode } from 'phovea_core';
import { VegaView } from './VegaView';
export interface ISetStateMetadata {
    /**
     * Title of the graph node
     */
    name: string;
    /**
     * Category of this signal
     * @see 'phovea_core/src/provenance/ObjectNode.ts'
     */
    category: 'data' | 'selection' | 'visual' | 'layout' | 'logic' | 'custom' | 'annotation';
    /**
     * Operations of this signal
     * @see 'phovea_core/src/provenance/ObjectNode.ts'
     */
    operation: 'create' | 'update' | 'remove';
}
export declare const CMD_SET_STATE = "vegaSetState";
export declare function setStateImpl(inputs: IObjectRef<any>[], parameter: any): Promise<{
    inverse: import("phovea_core").IAction;
}>;
export declare function setState(view: IObjectRef<VegaView>, metadata: ISetStateMetadata, state: any): import("phovea_core").IAction;
export declare function stateCompressor(path: ActionNode[]): ActionNode[];

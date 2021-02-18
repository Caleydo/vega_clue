import { Spec } from 'vega-lib';
export interface IVegaSpecDataset {
    title: string;
    spec: Spec;
    category: ECategories;
}
declare enum ECategories {
    INTERACTION_TECHNIQUES = "Interaction Techniques"
}
export declare function loadDatasets(): Promise<IVegaSpecDataset[]>;
export {};

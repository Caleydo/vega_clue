import {NewSignal, Data} from 'vega-lib';

/**
 * Extend the Vega Signal specification about tracking
 */
export interface ClueSignal extends NewSignal {
  track?: ITrackProv;
  search?: ISearchProv;
}

/**
 * Extend the Vega Signal specification about tracking
 */
export interface ITrackProv {

  /**
   * Title of the graph node
   * It can contain Handlebar.js syntax to replace variables.
   * @see http://handlebarsjs.com/
   *
   * Available default variables:
   * * `{{name}}`: signal name
   * * `{{value}}`: signal value
   *
   * Further variables can be added by using the `async` option.
   */
  title: string;

  /**
   * If set wait for completing dataflow evaluation
   */
  async?: TrackProvAsync[];

  /**
   * Category of this signal
   *
   * Default value: `data`
   */
  category?: 'data' | 'selection' | 'visual' | 'layout' | 'logic' | 'custom' | 'annotation';

  /**
   * Operations of this signal
   *
   * Default value: `update`
   */
  operation?: 'create' | 'update' | 'remove';

}

interface IBaseAsync {
  /**
   * If set use this alias name for replacement in the title
   */
  as?: string;
}

export interface IAsyncData extends IBaseAsync {
  /**
   * A valid dataset name
   */
  data: string;
}

export interface IAsyncSignal extends IBaseAsync {
  /**
   * A valid signal name
   */
  signal: string;
}

type TrackProvAsync = IAsyncData | IAsyncSignal;


interface ISearchProv {

  /**
   * Title of the graph node
   * It can contain Handlebar.js syntax to replace variables.
   * @see http://handlebarsjs.com/
   *
   * Available default variables in signal definitions:
   * - `{{name}}`: signal or dataset name
   * - `{{value}}`: signal value
   *
   * Available default variables in data definitions:
   * - `{{name}}`: signal or dataset name
   * - `{{datum}}`: single datum from the dataset array
   * - `{{index}}`: index of the current datum in the array
   *
   * Default values:
   * - numerical: `{{name}} = {{round value 2}}`
   * - categorical: `{{value}}`
   * - set: `{{name}}_{{index}}`
   *
   */
  title: string;

  /**
   * Property type
   * - `number`
   *   Only available for signal definitions.
   *   On retrieval the user will be prompted to input a number.
   *   The closer the input value to the stored value, the higher the similarity.
   *
   *
   * - `category`
   *   Only available for signal definitions.
   *   On retrieval the user has to select the correct categorical value to get an exact match.
   *
   * - `set`
   *   Only available for data definitions.
   *   List of elements which are searchable.
   *   On retrieval a set comparison using the Jaccard index is performed.
   */
  type: 'number' | 'category' | 'set';

  /**
   * Group name or signal reference
   */
  group: ISearchProvGroup | string;

  /**
   * Fill the search suggestions with more (disabled) options as preview
   */
  fill: ISearchProvFill;

}

export interface ISearchProvGroup {
  /**
   * A valid signal name
   */
  signal: string;
}

export interface ISearchProvFill {
  /**
   * Reference to another valid dataset to create search suggestions from an array.
   * Note: Works only for type `set`
   */
  source?: string;

  /**
   * Create create search suggestions from a range.
   * Note: Works only for type `numbe`
   */
  range?: ISearchProvFillRange;
}

export interface ISearchProvFillRange {
  /**
   * Minimum value
   */
  min: number;

  /**
   * Maximum value
   */
  max: number;

  /**
   * Step size
   */
  step: number;
}

/**
 * Extend the Vega Data specification about search
 */
export type ClueData = Data & {
  /**
   * Define
   */
  search?: ISearchProv;

  /**
   * Helper property to make it equal to the signal typings
   */
  value: any;
}

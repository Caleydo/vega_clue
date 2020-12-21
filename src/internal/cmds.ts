import {Compression} from 'phovea_clue';
import {IObjectRef, ActionNode, ActionMetaData, ActionUtils} from 'phovea_core';
import {VegaView} from './VegaView';


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

export const CMD_SET_STATE = 'vegaSetState';

export async function setStateImpl(inputs: IObjectRef<any>[], parameter: any) {
  const view = await inputs[0].v;
  const old = view.setStateImpl(parameter.state);
  return {
    inverse: setState(inputs[0], parameter.name, old)
  };
}

export function setState(view: IObjectRef<VegaView>, metadata: ISetStateMetadata, state: any) {
  return ActionUtils.action(ActionMetaData.actionMeta(metadata.name, metadata.category, metadata.operation), CMD_SET_STATE, setStateImpl, [view], {
    name,
    state
  });
}


export function stateCompressor(path: ActionNode[]) {
  return Compression.lastOnly(path, CMD_SET_STATE, (n) => n.requires[0].hash);
}

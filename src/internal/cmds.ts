import {cat, IObjectRef, meta, action, op, ActionNode} from 'phovea_core/src/provenance';
import {VegaView} from './VegaView';
import {lastOnly} from 'phovea_clue/src/compress';
import App from './App';
import {Spec} from 'vega-lib';

export const CMD_SET_STATE = 'vegaSetState';
export const CMD_SET_SPEC = 'vegaSetSpec';

export async function setStateImpl(inputs: IObjectRef<any>[], parameter: any) {
  const view = await inputs[0].v;
  const old = view.setStateImpl(parameter.state);
  return {
    inverse: setState(inputs[0], old)
  };
}

export function setState(view: IObjectRef<VegaView>, state: any) {
  return action(meta('Change State', cat.visual, op.update), CMD_SET_STATE, setStateImpl, [view], {
    state
  });
}


export function stateCompressor(path: ActionNode[]) {
  return lastOnly(path, CMD_SET_STATE, (n) => n.requires[0].hash);
}

export async function setSpecImpl(inputs: IObjectRef<any>[], parameter: any) {
  const view = await inputs[0].v;
  const old = view.setSpecImpl(parameter.spec);
  return {
    inverse: setSpec(inputs[0], old)
  };
}

export function setSpec(view: IObjectRef<App>, spec: Spec, title: string = 'Vega Example') {
  return action(meta(`Open '${title}' Example`, cat.data, op.update), CMD_SET_SPEC, setSpecImpl, [view], {
    spec
  });
}

export function specCompressor(path: ActionNode[]) {
  return lastOnly(path, CMD_SET_SPEC, (n) => n.requires[0].hash);
}

import { Compression } from 'phovea_clue';
import { ActionMetaData, ActionUtils } from 'phovea_core';
export const CMD_SET_STATE = 'vegaSetState';
export async function setStateImpl(inputs, parameter) {
    const view = await inputs[0].v;
    const old = view.setStateImpl(parameter.state);
    return {
        inverse: setState(inputs[0], parameter.name, old)
    };
}
export function setState(view, metadata, state) {
    return ActionUtils.action(ActionMetaData.actionMeta(metadata.name, metadata.category, metadata.operation), CMD_SET_STATE, setStateImpl, [view], {
        name,
        state
    });
}
export function stateCompressor(path) {
    return Compression.lastOnly(path, CMD_SET_STATE, (n) => n.requires[0].hash);
}
//# sourceMappingURL=cmds.js.map
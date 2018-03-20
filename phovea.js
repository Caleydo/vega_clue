/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function (registry) {
  /// #if include('extension-type', 'extension-id')
  //registry.push('extension-type', 'extension-id', function() { return import('./src/extension_impl'); }, {});
  /// #endif
  // generator-phovea:begin
  registry.push('actionFunction', 'vegaSetState', function () {
    return import ('./src/internal/cmds')
  }, {
    factory: 'setStateImpl'
  });

  registry.push('actionCompressor', 'vegaSetState', function () {
    return import ('./src/internal/cmds')
  }, {
    factory: 'stateCompressor'
  });

  registry.push('actionFunction', 'vegaSetSpec', function () {
    return import ('./src/internal/cmds')
  }, {
    factory: 'setSpecImpl'
  });

  registry.push('actionCompressor', 'vegaSetSpec', function () {
    return import ('./src/internal/cmds')
  }, {
    factory: 'specCompressor'
  });

  // generator-phovea:end
};

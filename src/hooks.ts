import {
  installTagNumberSearchCondition,
  registerTagNumberColumn,
} from "./modules/tagNumber";
import { createZToolkit } from "./utils/ztoolkit";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  addon.data.restoreSearchConditions = installTagNumberSearchCondition();
  addon.data.tagNumberColumnDataKey = registerTagNumberColumn();

  // Mark initialized as true to confirm plugin loading status
  // outside of the plugin (e.g. scaffold testing process)
  addon.data.initialized = true;
}

async function onMainWindowLoad(_win: _ZoteroTypes.MainWindow): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();
}

async function onMainWindowUnload(_win: Window): Promise<void> {
  ztoolkit.unregisterAll();
}

function onShutdown(): void {
  if (addon.data.tagNumberColumnDataKey) {
    Zotero.ItemTreeManager.unregisterColumn(addon.data.tagNumberColumnDataKey);
    Zotero.ItemTreeManager.refreshColumns();
    addon.data.tagNumberColumnDataKey = false;
  }

  addon.data.restoreSearchConditions?.();
  addon.data.restoreSearchConditions = undefined;

  ztoolkit.unregisterAll();
  // Remove addon object
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
};

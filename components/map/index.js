import exploreTree from "./explore-tree.json";
import inspectTree from "./inspect-tree.json";

// Token and layer resolution lives in resolver.js so the style bundle build
// (scripts/build-style-bundle.mjs) uses the same code as the app.
export {
  globals,
  getLayerTokens,
  getInspectTokens,
  defaultLayerSpecs,
  inspectLayerSpecs,
} from "./resolver";

// ---------------------------------------------------------------------------
// Groups for LayerTree
// ---------------------------------------------------------------------------

export const themes = exploreTree.themes;
export const groups = exploreTree.groups;
export const inspectThemes = inspectTree.themes;
export const inspectGroups = inspectTree.groups;

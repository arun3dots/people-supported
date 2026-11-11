const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Support monorepo package resolution without crawling other apps
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.resolver.blockList = [
  /.*[/\\]apps[/\\](web|superadmin|backend|docs)[/\\].*/,
];

module.exports = wrapWithReanimatedMetroConfig(
  withNativeWind(config, {
    input: path.resolve(projectRoot, "global.css"),
    configPath: path.resolve(projectRoot, "tailwind.config.js"),
    inlineRem: 16,
  })
);


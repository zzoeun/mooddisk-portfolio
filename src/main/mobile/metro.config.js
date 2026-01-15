const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// 모노레포 지원을 위한 watchFolders 설정
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../../../");

config.watchFolders = [monorepoRoot];

// 로그 레벨을 줄이기
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // 불필요한 로그 필터링
      if (req.url.includes("/symbolicate") || req.url.includes("/sourcemap")) {
        return next();
      }
      return middleware(req, res, next);
    };
  },
};

// resolver 설정 (절대경로 + 로그 필터링)
config.resolver = {
  ...config.resolver,
  alias: {
    "@": path.resolve(__dirname, "./"),
  },
  // 개발 환경에서만 로그 출력
  platforms: ["ios", "android", "native", "web"],
  // 모노레포에서 node_modules 해결
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(monorepoRoot, "node_modules"),
  ],
};

module.exports = config;

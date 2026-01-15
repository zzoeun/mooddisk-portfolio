module.exports = function (api) {
  api.cache(true);

  // 프로덕션 빌드인지 확인
  const isProduction = process.env.NODE_ENV === "production";

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin",
      // 프로덕션 빌드에서만 console.log 제거 (error, warn은 유지)
      ...(isProduction
        ? [
            [
              "transform-remove-console",
              {
                exclude: ["error", "warn"],
              },
            ],
          ]
        : []),
    ],
  };
};

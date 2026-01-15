module.exports = function override(config, env) {
  // 프로덕션 빌드에서만 console.log 제거
  if (env === 'production') {
    // 모든 babel-loader 찾기
    const processBabelLoader = (rule) => {
      if (rule.use && Array.isArray(rule.use)) {
        rule.use.forEach(use => {
          if (use.loader && use.loader.includes('babel-loader') && use.options) {
            if (!use.options.plugins) {
              use.options.plugins = [];
            }
            // transform-remove-console 플러그인 추가 (error, warn 제외)
            use.options.plugins.push([
              require.resolve('babel-plugin-transform-remove-console'),
              { exclude: ['error', 'warn'] }
            ]);
          }
        });
      } else if (rule.loader && rule.loader.includes('babel-loader') && rule.options) {
        if (!rule.options.plugins) {
          rule.options.plugins = [];
        }
        rule.options.plugins.push([
          require.resolve('babel-plugin-transform-remove-console'),
          { exclude: ['error', 'warn'] }
        ]);
      }
    };

    // oneOf 규칙 처리
    const oneOfRule = config.module.rules.find(rule => rule.oneOf);
    if (oneOfRule && oneOfRule.oneOf) {
      oneOfRule.oneOf.forEach(processBabelLoader);
    }

    // 일반 규칙 처리
    config.module.rules.forEach(processBabelLoader);
  }

  return config;
};


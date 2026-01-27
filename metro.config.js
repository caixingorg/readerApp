const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 生产环境禁用 source maps 以减少包体积
if (process.env.NODE_ENV === 'production') {
    config.transformer = {
        ...config.transformer,
        minifierConfig: {
            ...config.transformer?.minifierConfig,
            sourceMap: false,
        },
    };
}

module.exports = config;

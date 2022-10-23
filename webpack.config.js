import TerserPlugin from 'terser-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';

export default {
    entry: {
        'svg-text-to-path-fontkit':    './entries/build-fontkit.js',
        'svg-text-to-path-opentypejs': './entries/build-opentypejs.js',
    },
    stats: {
        modules: false,
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ],
    },
    plugins: [
        new ESLintPlugin({
            files: ['./src'],
            useEslintrc: false,
            overrideConfig: {
                parser: 'babel-eslint',
                env: {
                    browser: true,
                    commonjs: true,
                    es6: true,
                    node: true, 
                },
                extends: 'eslint:recommended',
            }
        }), 
    ],
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            '@babel/plugin-transform-runtime',
                            '@babel/plugin-transform-async-to-generator',
                        ],
                    }
                }
            },
        ],
    },
}
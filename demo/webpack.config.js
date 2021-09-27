const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: 'development',
    devtool: 'sourcemap',
    entry: path.resolve('./index.ts'),
    output: {
        path: path.resolve('dist/'),
        filename: 'index.js',
    },
    target: 'web',
    module: {
        rules: [{
                test: /\.tsx?$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        happyPackMode: true,
                    }
                },
            },
            {
                test: /\.txt$/,
                use: ['raw-loader'],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.wasm$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[name].[hash:6].[ext]'
                    }
                },
                type: 'javascript/auto'
            },
            {
                test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                      name: '[name].[ext]',
                      outputPath: 'fonts/'
                    }
                  }
                ]
            },
            {
                test: /\.(png|jpg|gif|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                      name: '[name].[ext]',
                      outputPath: 'images/'
                    }
                  }
                ]
            }
        ],
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
        // DO NOT DO THIS!!!
        // here it is neccessary because `./demo` consumes `codemirror-textmate` as symbolic link not as "dependency"
        alias: {
            'codemirror': path.resolve('node_modules/codemirror'),
            'onigasm': path.resolve('node_modules/onigasm'),
        }
    },
    plugins: [
        new HTMLWebpackPlugin({
            template: path.resolve('./index.html')
        })
    ]
}
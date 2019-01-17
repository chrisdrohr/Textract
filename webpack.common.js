const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PostCssPresetEnv = require('postcss-preset-env');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
  entry: {
    app: [
      './index.html',
      './src/index.js',
      './src/styles/inline.css',
      './src/styles/animations.css'
    ],
    vendor: ['web-animations-js']
  },

  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      template: './index.html',
      // favicon: './src/logo.png'
    }),
    new ScriptExtHtmlWebpackPlugin({
      sync: '[name].bundle.js',
      defaultAttribute: 'async'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    }),
    new WebpackPwaManifest({
      name: 'Textract',
      short_name: 'Textract',
      icons: [
        {
          src: path.resolve('./src/logo.png'),
          sizes: [96, 128, 192, 256, 384, 512],
          type: 'image/png'
        }
      ],
      start_url: '/?utm_source=installed',
      display: 'standalone',
      background_color: '#FAFAFA',
      theme_color: '#0D47A1'
    }),
    new FaviconsWebpackPlugin({
      logo: './src/logo.png',
      inject: true
    }),
    new WorkboxPlugin.GenerateSW({
      swDest: './service-worker.js',
      clientsClaim: true,
      skipWaiting: true
    })
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader']
      },

      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [PostCssPresetEnv()]
            }
          }
        ]
      },

      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: true,
              removeComments: false,
              collapseWhitespace: false
            }
          }
        ]
      }
    ]
  }
};

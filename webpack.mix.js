const mix = require('laravel-mix')
const WebpackShellPluginNext = require('webpack-shell-plugin-next')

require('laravel-mix-webp')
require('laravel-mix-replace-in-file')

const isProduction = mix.inProduction()
const state = process.env.npm_config_state
const chore = process.env.npm_config_chore

/*
 |--------------------------------------------------------------------------
 | Theme config
 |--------------------------------------------------------------------------
 |
 | Url (for browserSync)
 | Theme name
 | Theme math
 | Assets path
 | Assets destination path
 |
 */
const url = 'http://local.drupal-test.com'
const themeName = 'drupal_custom_test'
const themePath = `./web/themes/${themeName}`
const assetsPath = `${themePath}/assets`
const distPath = `${themePath}/build`

/*
 |--------------------------------------------------------------------------
 | Assets Config
 |--------------------------------------------------------------------------
 | JS = [
 |    {
 |     - File name
 |     - File input
 |     - File output
 |    }
 |  ]
 |
 | SCSS = [
 |    {
 |     - File name
 |     - File input
 |     - File output
 |    }
 |  ]
 |
 | PHP = [
 |    - File path
 |  ]
 |
 */
const assetsFiles = [
  state === 'build' || state === undefined
    ? {
        scripts: [
          {
            name: 'script',
            input: `${assetsPath}/js`,
            output: `${distPath}/js`
          }
        ],
        styles: [
          {
            name: 'style',
            input: `${assetsPath}/scss`,
            output: `${distPath}/css`
          }
        ]
      }
    : null
]

/*
 |--------------------------------------------------------------------------
 | Watcher config
 |--------------------------------------------------------------------------
 | Files to watch
 |
 | - compiled CSS
 | - compiled JS
 |
 */
const filesToWatch = [
  `${assetsPath}/css/**/*.css`
  // `${assetsPath}/js/dist/**/*.js`,
]

/*
 |--------------------------------------------------------------------------
 | Copy config
 |--------------------------------------------------------------------------
 |
 | Files to copy from smwh to smwh else
 |
 | {
 |   - File input
 |   - File output
 | }
 |
 |
 */
const filesToCopy = []

/*
|--------------------------------------------------------------------------
| Versionning config
|--------------------------------------------------------------------------
|
| Files to apply versionning through regex
|
*/
const filesToVersion = []

/*
 |--------------------------------------------------------------------------
 | Cleanning config
 |--------------------------------------------------------------------------
 |
 | Files to apply cleanning through regex
 |
 */
const fileToClean = []

/*
 |--------------------------------------------------------------------------
 |--------------------------------------------------------------------------
 |--------------------------------------------------------------------------
 | That's all, stop editing, happy development
 |--------------------------------------------------------------------------
 |--------------------------------------------------------------------------
 |--------------------------------------------------------------------------
 */

const commandArray = {
  js_lint: [],
  js_prettier: [],
  scss_lint: [],
  scss_prettier: [],
  php_lint: []
}

if (assetsFiles.length) {
  assetsFiles.forEach((group) => {
    if (group) {
      /*
      |--------------------------------------------------------------------------
      | Javascript Compilation
      |--------------------------------------------------------------------------
      |
      | Loop through the javascript array to compile them
      | Non minified file in dev
      | Minified file in production
      |
      | Add lint command
      | Add prettier command
      |
      */
      if (group.scripts?.length) {
        group.scripts.forEach((file) => {
          // Javascript linter file path
          if (chore === 'all' || chore === 'lint:js') {
            const javascriptLinter = `npx eslint --config .eslintrc.js --ignore-path .eslintignore --fix "${file.input}/**/*.js"`
            if (!commandArray.js_lint.includes(javascriptLinter)) {
              commandArray.js_lint.push(javascriptLinter)
            }
          }

          // Javascript prettier cmd
          if (chore === 'all' || chore === 'prettier:js') {
            const javascriptPrettier = `npx prettier --config .prettierrc.js --ignore-path .prettierignore --write "${file.input}/**/*.js"`
            if (!commandArray.js_prettier.includes(javascriptPrettier)) {
              commandArray.js_prettier.push(javascriptPrettier)
            }
          }

          // Javascript compilation with mix
          if (chore === 'all' || chore === undefined || chore === 'dev:js' || chore === 'prod:js') {
            mix.js(
              `${file.input}/${file.name}.js`,
              isProduction ? `${file.output}/${file.name}.umd.ba.js` : `${file.output}/${file.name}.umd.js`
            )
          }
        })
      }

      /*
      |--------------------------------------------------------------------------
      | SCSS Compilation
      |--------------------------------------------------------------------------
      |
      | Loop through the scss array to compile them
      | Non minified file in dev
      | Minified file in production
      |
      | Add lint command
      | Add prettier command
      |
      */
      if (group.styles?.length) {
        group.styles.forEach((file) => {
          // SCSS lint cmd
          if (chore === 'all' || chore === 'lint:scss') {
            const styleLintCommand = `npx stylelint --config .stylelintrc.json --ignore-path .stylelintignore --fix "${file.input}/**/*.scss"`
            if (!commandArray.scss_lint.includes(styleLintCommand)) {
              commandArray.scss_lint.push(styleLintCommand)
            }
          }

          // SCSS prettier cmd
          if (chore === 'all' || chore === 'prettier:scss') {
            const stylePrettier = `npx prettier --config .prettierrc.js --ignore-path .prettierignore --write "${file.input}/**/*.scss"`
            if (!commandArray.scss_prettier.includes(stylePrettier)) {
              commandArray.scss_prettier.push(stylePrettier)
            }
          }

          // SCSS compilation with mix
          if (chore === 'all' || chore === undefined || chore === 'dev:scss' || chore === 'prod:scss') {
            mix.sass(
              `${file.input}/${file.name}.scss`,
              isProduction ? `${file.output}/${file.name}.min.css` : `${file.output}/${file.name}.css`
            )
          }
        })
      }

      /*
      |--------------------------------------------------------------------------
      | PHP Template Linter
      |--------------------------------------------------------------------------
      |
      | Loop through the php array to lint them
      |
      | Add lint command
      |
      */
      if (group.php?.length) {
        group.php.forEach((file) => {
          // PHP lint cmd
          if (chore === 'all' || chore === 'lint:php') {
            // eslint-disable-next-line node/no-path-concat
            const phpLintCommand = `php vendor/bin/php-cs-fixer fix -v --show-progress=dots --using-cache=no "${file}" --config=.php-cs-fixer.php`
            if (!commandArray.php_lint.includes(phpLintCommand)) {
              commandArray.php_lint.push(phpLintCommand)
            }
          }
        })
      }
    }
  })
}

/*
 |--------------------------------------------------------------------------
 | Global Webpack config
 |--------------------------------------------------------------------------
 |
 | Enable source maps
 | Plugins :
 |  - Shell :
 |    - execute scss lint command
 |    - execute scss prettier command
 |    - execute js lint command
 |    - execute js prettier command
 |    - execute php lint command
 |
 */
mix.webpackConfig({
  devtool: isProduction ? false : 'source-map',
  mode: state === 'build' ? 'production' : false,
  // stats: {
  //   children: true,
  // },
  ignoreWarnings: [
    {
      message: /process.env.NODE_ENV/
    }
  ],
  optimization: {
    minimize: isProduction
  },
  plugins: [
    chore
      ? new WebpackShellPluginNext({
          onBuildStart: {
            scripts: [
              chore === 'prettier:scss' || chore === 'all'
                ? [
                    'echo ----------',
                    'echo SCSS Prettier start',
                    commandArray.scss_prettier,
                    'echo SCSS Prettier end',
                    'echo ----------'
                  ].flat()
                : false,
              chore === 'lint:scss' || chore === 'all'
                ? ['echo ----------', 'echo SCSS Lint start', commandArray.scss_lint, 'echo SCSS Lint end', 'echo ----------'].flat()
                : false,
              chore === 'prettier:js' || chore === 'all'
                ? ['echo ----------', 'echo JS Prettier start', commandArray.js_prettier, 'echo JS Prettier end', 'echo ----------'].flat()
                : false,
              chore === 'lint:js' || chore === 'all'
                ? ['echo ----------', 'echo JS Lint start', commandArray.js_lint, 'echo JS Lint end', 'echo ----------'].flat()
                : false,
              chore === 'lint:php' || chore === 'all'
                ? ['echo ----------', 'echo PHP Linter start', commandArray.php_lint, 'echo PHP Linter end', 'echo ----------'].flat()
                : false
            ]
              .flat()
              .filter(Boolean),
            blocking: true,
            parallel: false
          }
        })
      : false,
    {
      apply(compiler) {
        // Watching
        compiler.hooks.watchRun.tap('WatchRunAlert', (params) => {
          console.log('')
          console.log('Watching files')
          console.log('(⌐■_■)')
          console.log('')
        })

        // Done alert
        compiler.hooks.done.tap('DoneAlert', (params) => {
          console.log('')
          if (isProduction) {
            state === 'build' ? console.log('Build prod complete') : console.log('Compilation prod complete')
            console.log('─=≡Σ((( つ•̀ω•́)つ ─=≡Σ((( つ•̀ω•́)つ ─=≡Σ((( つ•̀ω•́)つ ─=≡Σ((( つ•̀ω•́)つ')
          } else {
            state === 'build' ? console.log('Build dev complete') : console.log('Compilation dev complete')
            console.log('ヾ(•ω•`)o')
          }
          console.log('')
        })

        // Fail alert
        compiler.hooks.failed.tap('FailAlert', (params) => {
          console.log('')
          console.log('Build failed')
          console.log('(╯°□°）╯︵ ┻━┻')
          console.log('')
        })
      }
    }
  ].filter(Boolean)
})

/*
 |--------------------------------------------------------------------------
 | Mix options
 |--------------------------------------------------------------------------
 |
 | No manifest file
 | Make css url Work (why is that even an option ????)
 | Autoprefixer config
 | Uglify/Terser config
 |
 */
mix.options({
  postCss: [
    // require('node-css-mqpacker')() // Group media queries
  ],
  manifest: false,
  processCssUrls: false,
  autoprefixer: {
    overrideBrowserslist: ['last 2 version', '> 1%', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4']
  },
  uglify: isProduction
    ? {
        extractComments: false,
        uglifyOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: [
              'console.log'
              // 'console.error',
              // 'console.warn',
              // ...
            ]
          },
          // Make sure symbols under `pure_funcs`,
          // are also under `mangle.reserved` to avoid mangling.
          mangle: {
            reserved: [
              'console.log',
              '__'
              // 'console.error',
              // 'console.warn',
              // ...
            ]
          }
        }
      }
    : false,
  terser: isProduction
    ? {
        extractComments: false,
        terserOptions: {
          compress: {
            pure_funcs: [
              'console.log'
              // 'console.error',
              // 'console.warn',
              // ...
            ]
          },
          // Make sure symbols under `pure_funcs`,
          // are also under `mangle.reserved` to avoid mangling.
          mangle: {
            reserved: [
              'console.log',
              '__'
              // 'console.error',
              // 'console.warn',
              // ...
            ]
          }
        }
      }
    : false
})

/*
 |--------------------------------------------------------------------------
 | Source maps
 |--------------------------------------------------------------------------
 |
 | Enable source maps for dev files
 |
 */
mix.sourceMaps(!isProduction)

/*
 |--------------------------------------------------------------------------
 | BrowserSync config
 |--------------------------------------------------------------------------
 |
 | Reload page on selected file change
 |
 */
mix.browserSync({
  watch: true,
  watchOptions: {
    ignoreInitial: true,
    ignored: '*.map.css'
  },
  proxy: url,
  port: 3000,
  injectChanges: true,
  files: filesToWatch,
  notify: {
    styles: {
      top: '0',
      right: '0',
      left: 'auto',
      bottom: 'auto',
      opacity: '0.5'
    }
  }
})

/*
 |--------------------------------------------------------------------------
 | Assets versionning (useless in CMS)
 |--------------------------------------------------------------------------
 |
 | Change the version of assets called in a specific array of files
 |
 */
if (chore === 'version' || chore === 'all') {
  if (filesToVersion.length) {
    mix
      .replaceInFile({
        files: filesToVersion,
        from: /\bstyle\.css\?v=(\d+)/g,
        to: `style.css?v=${new Date().getTime()}`
      })
      .replaceInFile({
        files: filesToVersion,
        from: /\bstyle\.min\.css\?v=(\d+)/g,
        to: `style.min.css?v=${new Date().getTime()}`
      })
      .replaceInFile({
        files: filesToVersion,
        from: /\bscript\.umd\.js\?v=(\d+)/g,
        to: `script.umd.js?v=${new Date().getTime()}`
      })
      .replaceInFile({
        files: filesToVersion,
        from: /\bscript\.umd\.ba\.js\?v=(\d+)/g,
        to: `script.umd.ba.js?v=${new Date().getTime()}`
      })
  }
}

/*
 |--------------------------------------------------------------------------
 | Clean files
 |--------------------------------------------------------------------------
 |
 | Remove var_dumps();
 | Remove @dump()
 | Remove @dd()
 |
 */
if (chore === 'clean' || chore === 'all') {
  if (fileToClean.length) {
    mix
      .replaceInFile({
        files: fileToClean,
        from: /@dd\(([^)]+)\)/g,
        to: ''
      })
      .replaceInFile({
        files: fileToClean,
        from: /@dump\(([^)]+)\)/g,
        to: ''
      })
      .replaceInFile({
        files: fileToClean,
        from: /\bvar_dump\(([^)]+)\);/g,
        to: ''
      })
  }
}

/*
 |--------------------------------------------------------------------------
 | Optimize pictures
 |--------------------------------------------------------------------------
 |
 | Optimize pictures into webp
 |
 */
if (chore === 'optimize:picture' || chore === 'all') {
  // mix.ImageWebp({
  //   disable: false,
  //   from: `${assetsPath}/img`,
  //   to: `${assetsPath}/img/minified`,
  //   imageminWebpOptions: {
  //     quality: 50
  //   }
  // })
}

/*
 |--------------------------------------------------------------------------
 | Copy assets
 |--------------------------------------------------------------------------
 |
 | Copy assets to specific location
 |
 */
if (chore === 'copy' || chore === 'all') {
  if (filesToCopy.length) {
    filesToCopy.forEach((file) => {
      mix.copy(file.input, file.output)
    })
  }
}

/*
 |--------------------------------------------------------------------------
 | Notification
 |--------------------------------------------------------------------------
 |
 | Snore toast compilation alert
 | Disable all notifications
 | Disable only success notifications
 |
 */
mix.disableNotifications()
// mix.disableSuccessNotifications()

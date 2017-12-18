/* eslint-disable import/no-extraneous-dependencies, no-param-reassign, no-console */
require('babel-register')({
    plugins: [
        'babel-plugin-transform-es2015-modules-commonjs',
        'babel-plugin-transform-object-rest-spread',
        'babel-plugin-transform-react-jsx',
    ],
    extensions: ['.jsx'],
    cache     : true,
});


const React = require('react');
const ReactDOMServer  = require('../node_modules/react-dom/server.js');
const RenderHTML = require('react-render-html');

const renderComponent = (context, path) => {
    const Component = require(path).default; // eslint-disable-line
    global.it = context;
    const result = ReactDOMServer.renderToStaticMarkup(
        React.createElement(
            Component
        )
    );
    return result
        .replace(/GTM_START_PLACEHOLDER/g, '<!-- Google Tag Manager -->')
        .replace(/GTM_END_PLACEHOLDER/g, '<!-- End Google Tag Manager --><!-- FlushHead -->');
};

const fs = require('fs');
const Path = require('path');
const Url = require('url');
const Gettext = require('./gettext');
const Crypto = require('crypto');
const common = require('./common');
const generate_static_data = require('./generate-static-data');
const program = require('commander');


const CONTENT_PLACEHOLDER = 'CONTENT_PLACEHOLDER'; // used in layout.jsx

program
    .version('0.2.0')
    .description('Build .jsx templates into /dist folder')
    .option('-d, --dev', 'Build for your gh-pages')
    .option('-b, --branch [branchname]', 'Build your changes to a sub-folder named: br_branchname')
    .option('-p, --path [save_as]', 'Compile only the template/s that match the regex save_as')
    .option('-t, --add-translations', 'Update messages.pot with new translations')
    .parse(process.argv);

// TODO: to be removed
if(!program.path) {
    program.outputHelp(str => {
        console.error('  ERROR: --path is missing'.red);
        console.error(str.red);
        process.exit(0);
    });
}

/** *********************************************
 * Common functions
 */

function getConfig() {
    const config = {
        languages       : common.languages,
        sections        : ['app', 'static'],
        root_path       : common.root_path,
        add_translations: false,
    };
    if (program.branch === 'translations') {
        config.languages = ['ACH'];
    }
    config.dist_path = Path.join(config.root_path, (program.branch || ''), 'dist');
    config.root_url  = `/${program.dev ? 'binary-static/' : ''}${program.branch ? `${program.branch}/` : ''}`;
    return config;
}

function createDirectories() {
    const config = getConfig();
    const mkdir = path => fs.existsSync(path) || fs.mkdirSync(path);

    console.log(`Target: ${config.dist_path}`.yellow);

    mkdir(Path.join(config.dist_path));
    config.languages.forEach(lang => {
        lang = lang.toLowerCase();
        mkdir(Path.join(config.dist_path, lang));
        mkdir(Path.join(config.dist_path, `${lang}/pjax`));
    });
}

function shouldCompile(excludes, lang) {
    if (excludes && !/^ACH$/i.test(lang)) {

        excludes = excludes.toUpperCase();
        lang = lang.toUpperCase();

        if(/^NOT-/.test(excludes)) {
            return excludes.indexOf(lang) !== -1;
        }
        return excludes.indexOf(lang) === -1;
    }
    return true;
}

function fileHash(path) {
    return new Promise((res) => {
        const fd = fs.createReadStream(path);
        const hash = Crypto.createHash('sha1');
        hash.setEncoding('hex');

        fd.on('end', () => {
            hash.end();
            res(hash.read());
        });

        fd.pipe(hash);
    });
};


/** **************************************
 * Factory functions
 */

const createTranslator = lang => {
    const gettext = Gettext.getInstance();
    lang = lang.toLowerCase(lang);
    gettext.setLang(lang);
    return (text, ...args) => gettext.gettext(text, ...args);
};

const createUrlFinder  = default_lang => {
    default_lang = default_lang.toLowerCase();
    const config = getConfig();
    return (url, lang = default_lang) => {
        if(url === '' || url === '/') {
            url = '/home';
        }

        if(/^\/?(images|js|css|scripts|download)/.test(url)) {
            return Path.join(config.root_url, url);
        }

        const p = Url.parse(url, true);
        const pathname = p.pathname.replace(/^\//, '');
        if(common.pages.filter(page => page.save_as === pathname).length) {
            p.pathname = Path.join(config.root_url, `${lang}/${pathname}.html`);
            return Url.format(p);
        }

        throw new TypeError(`Invalid url ${url}`);
    };
};

const createContextBuilder = async () => {
    const config = getConfig();

    let static_hash = Math.random().toString(36).substring(2, 10);
    if (program.path) {
        try {
            static_hash = await common.readFile(Path.join(config.dist_path, 'version'));
        } catch(e) { } // eslint-disable-line
    }
    const vendor_hash = await fileHash(Path.join(config.dist_path, 'js/vendor.min.js'));
    await common.writeFile(Path.join(config.dist_path, 'version'), static_hash, 'utf8');

    const extra = {
        js_files: [
            `${config.root_url}js/texts/{PLACEHOLDER_FOR_LANG}.js?${static_hash}`,
            `${config.root_url}js/manifest.js?${static_hash}`,
            `${config.root_url}js/vendor.min.js?${vendor_hash}`,
            program.dev ?
                `${config.root_url}js/binary.js?${static_hash}` :
                `${config.root_url}js/binary.min.js?${static_hash}`,
        ],
        css_files: [
            `${config.root_url}css/common.min.css?${static_hash}`,
            ...config.sections.map(section => `${config.root_url}css/${section}.min.css?${static_hash}`),
        ],
        menu: [
            {
                id       : 'topMenuTrading',
                url      : '/trading',
                text     : 'Trade',
                className: 'ja-hide gr-hide-m gr-hide-p ico-only-hide',
            },
            {
                id       : 'topMenuJPTrading',
                url      : '/multi_barriers_trading',
                text     : 'Trade',
                className: 'invisible ja-show gr-hide-m gr-hide-p',
            },
            {
                id       : 'topMenuPortfolio',
                url      : '/user/portfoliows',
                text     : 'Portfolio',
                className: 'client_logged_in invisible ico-only-hide',
            },
            {
                id       : 'topMenuProfitTable',
                url      : '/user/profit_tablews',
                text     : 'Profit Table',
                className: 'client_logged_in invisible ico-only-hide',
            },
            {
                id       : 'topMenuStatement',
                url      : '/user/statementws',
                text     : 'Statement',
                className: 'client_logged_in invisible',
            },
            { // cashier
                id  : 'topMenuCashier',
                url : '/cashier',
                text: 'Cashier',
            },
            { // resources
                id       : 'topMenuResources', url      : '/resources', text     : 'Resources',
                className: 'client_logged_out client_logged_in invisible ico-only-hide',
                sub_items: [
                    {
                        id       : 'topMenuAssetIndex',
                        url      : '/resources/asset_indexws',
                        text     : 'Asset Index',
                        className: 'ja-hide',
                    },
                    {
                        id  : 'topMenuTradingTimes',
                        url : '/resources/market_timesws',
                        text: 'Trading Times',
                    },
                ],
            },
            {
                id          : 'topMenuShop',
                text        : 'Shop',
                absolute_url: 'https://shop.binary.com',
                className   : 'ja-hide ico-only-hide',
                target      : '_blank',
            },
            {
                id       : 'topMenuPaymentAgent',
                url      : '/paymentagent/transferws',
                text     : 'Payment Agent',
                className: 'invisible',
            },
            { // Link to ico-subscribe, ICO Bids.
                id       : 'topMenuIcoBids',
                url      : '/user/ico-subscribe',
                text     : 'ICO Bids',
                className: 'invisible ico-only-show',
            },
        ],
        languages  : config.languages,
        broker_name: 'Binary.com',
        static_hash,
    };

    return {
        buildFor: (model) => {
            const translator = createTranslator(model.language);
            return Object.assign({}, extra, model, {
                L: (text, ...args) => {
                    const translated = translator(text, ...args);
                    return RenderHTML(translated);
                },
                url_for: createUrlFinder(model.language),
            });
        },
    };
};

/** **********************************************
 * Compile
 */

async function compile(page) {
    console.log(`Compiling ${page.save_as}`.green);
    const config = getConfig();
    const languages = config.languages.filter(lang => shouldCompile(page.excludes, lang));
    const contextBuilder = await createContextBuilder();

    console.time(page.save_as);
    const tasks = languages.map(async lang => { // eslint-disable-line

        const model = {
            website_name   : 'Binary.com',
            title          : page.title,
            layout         : page.layout,
            language       : lang.toUpperCase(),
            root_url       : config.root_url,
            only_ja        : page.only_ja,
            current_path   : page.save_as,
            current_route  : page.current_route,
            affiliate_email: 'affiliates@binary.com',
            japan_docs_url : 'https://japan-docs.binary.com',
            is_pjax_request: true,
        };

        const context = contextBuilder.buildFor(model);
        const page_html = renderComponent(context, `../src/templates/${page.tpl_path}.jsx`);

        if(page.layout) {
            const layout_path = `../src/templates/${page.tpl_path.split('/')[0]}/_layout/layout.jsx`;

            const layout_pjax = renderComponent(context, layout_path);

            context.is_pjax_request = false;
            const layout_normal = `<DOCTYPE! HTML>\n${renderComponent(context, layout_path)}`;

            await common.writeFile( // pjax layout
                Path.join(config.dist_path, `${lang}/pjax/${page.save_as}.html`),
                layout_pjax.replace(CONTENT_PLACEHOLDER, page_html),
                'utf8'
            );

            await common.writeFile( // normal layout
                Path.join(config.dist_path, `${lang}/${page.save_as}.html`),
                layout_normal.replace(CONTENT_PLACEHOLDER, page_html),
                'utf8'
            );
        } else {
            await common.writeFile( // landing pages
                Path.join(config.dist_path, `${lang}/${page.save_as}.html`),
                page_html,
                'utf8'
            );
        }

    });
    await Promise.all(tasks);
    console.timeEnd(page.save_as);
}

createDirectories();
(async () => {
    try {
        const regx = new RegExp(program.path, 'i');
        await Promise.all(
            common.pages
                .filter(p => regx.test(p.save_as))
                .map(compile)
        );

        if (program.addTranslations) {
            const gettext = Gettext.getInstance();
            generate_static_data.build();
            gettext.update_translations();
        }
    } catch (e) {
        console.error(e);
    }
})();
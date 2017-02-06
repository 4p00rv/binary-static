const Cookies        = require('../../lib/js-cookie');
const getLanguage    = require('../base/language').getLanguage;
const URLForLanguage = require('../base/language').URLForLanguage;

function checkClientsCountry() {
    const clients_country = localStorage.getItem('clients_country');
    if (clients_country) {
        if (clients_country === 'jp') {
            limitLanguage('JA');
        } else if (clients_country === 'id') {
            limitLanguage('ID');
        } else {
            $('.languages').show();
        }
    } else {
        BinarySocket.init();
        BinarySocket.send({ website_status: '1' });
    }
}

function limitLanguage(lang) {
    if (getLanguage() !== lang) {
        window.location.href = URLForLanguage(lang);
    }
    if (document.getElementById('select_language')) {
        $('.languages').remove();
        $('#gmt-clock')
            .removeClass('gr-5 gr-6-m')
            .addClass('gr-6 gr-12-m');
        $('#contact-us')
            .removeClass('gr-2')
            .addClass('gr-6');
    }
}

function japanese_client() {
    // handle for test case
    if (typeof window === 'undefined') return false;
    return (getLanguage() === 'JA' || japanese_residence() || localStorage.getItem('clients_country') === 'jp');
}

function japanese_residence() {
    return (Cookies.get('residence') === 'jp');
}

function checkLanguage() {
    if (getLanguage() === 'ID') {
        const regex = new RegExp('id'),
            $blogLink = $('.blog a'),
            $blogHREF = $blogLink.attr('href');
        if (!regex.test($blogHREF)) {
            $blogLink.attr('href', $blogHREF + '/id/');
        }
    }
    if (japanese_client()) {
        const visible = 'visibility: visible;';
        $('.ja-hide').addClass('invisible');
        $('.ja-show').attr('style', 'display: inline !important;' + visible);
        $('.ja-show-block').attr('style', 'display: block !important;' + visible);
        $('.ja-show-inline-block').attr('style', 'display: inline-block !important;' + visible);
        $('.ja-no-padding').attr('style', 'padding-top: 0; padding-bottom: 0;');
        $('#regulatory-text').removeClass('gr-9 gr-7-p')
                             .addClass('gr-12 gr-12-p');
        if (!japanese_residence()) {
            $('#topMenuCashier').hide();
        }
    }
}

module.exports = {
    checkClientsCountry: checkClientsCountry,
    japanese_client    : japanese_client,
    japanese_residence : japanese_residence,
    checkLanguage      : checkLanguage,
};

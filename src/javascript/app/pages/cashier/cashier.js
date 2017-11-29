const BinaryPjax       = require('../../base/binary_pjax');
const Client           = require('../../base/client');
const Header           = require('../../base/header');
const BinarySocket     = require('../../base/socket');
const jpClient         = require('../../common/country_base').jpClient;
const jpResidence      = require('../../common/country_base').jpResidence;
const isCryptocurrency = require('../../common/currency').isCryptocurrency;
const urlFor           = require('../../../_common/url').urlFor;

const Cashier = (() => {
    let href = '';

    const showContent = () => {
        Client.activateByClientType();
        Header.upgradeMessageVisibility(); // To handle the upgrade buttons visibility
    };

    const displayTopUpButton = () => {
        BinarySocket.wait('balance').then((response) => {
            const currency  = response.balance.currency;
            const balance   = +response.balance.balance;
            const can_topup = (currency !== 'JPY' && balance <= 1000) || (currency === 'JPY' && balance <= 100000);
            const top_up_id = '#VRT_topup_link';
            const $a        = $(top_up_id);
            const classes   = ['toggle', 'button-disabled'];
            const new_el    = { class: $a.attr('class').replace(classes[+can_topup], classes[1 - +can_topup]), html: $a.html(), id: $a.attr('id') };
            if (can_topup) {
                href        = href || urlFor('/cashier/top_up_virtualws');
                new_el.href = href;
            }
            $a.replaceWith($('<a/>', new_el));
            $(top_up_id).parent().setVisibility(1);
        });
    };

    const onLoad = () => {
        if (jpClient() && !jpResidence()) {
            BinaryPjax.loadPreviousUrl();
        }
        if (Client.isLoggedIn()) {
            BinarySocket.wait('authorize').then(() => {
                const is_virtual = Client.get('is_virtual');
                const is_crypto  = isCryptocurrency(Client.get('currency'));
                if (is_virtual) {
                    displayTopUpButton();
                }
                if (is_virtual || (/CR/.test(Client.get('loginid')) && !is_crypto)) {
                    $('#payment-agent-section').setVisibility(1);
                }
                $(is_crypto ? '.crypto_currency' : '.normal_currency').setVisibility(1);
                if (/^BCH/.test(Client.get('currency'))) {
                    document.getElementById('message_bitcoin_cash').setVisibility(1);
                }
            });
        }
        showContent();
    };

    return {
        onLoad,
        PaymentMethods: { onLoad: () => { showContent(); } },
    };
})();

module.exports = Cashier;

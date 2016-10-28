/*
 * Handles currency display
 *
 * It process 'socket.send({payout_currencies:1})` response
 * and display them
 */
function displayCurrencies(selected, showClass) {
    'use strict';

    var target = document.getElementById('currency'),
        fragment =  document.createDocumentFragment(),
        currencies = page.client.get_storage_value('currencies').split(',');

    if (!target) {
        return;
    }

    while (target && target.firstChild) {
        target.removeChild(target.firstChild);
    }

    if (currencies.length > 1) {
        currencies.forEach(function (currency) {
            var option = document.createElement('option'),
                content = document.createTextNode(currency);

            option.setAttribute('value', currency);
            if (selected && selected == key) {
                option.setAttribute('selected', 'selected');
            }

            option.appendChild(content);
            fragment.appendChild(option);
        });

        target.appendChild(fragment);
        Defaults.set('currency', target.value);
    } else {
        $('#currency').replaceWith('<span id="' + target.getAttribute('id') +
                                    '" class="' + (showClass ? target.getAttribute('class') : '') +
                                    '"value="' + currencies[0] + '">' +
                                    (MBTradePage.is_trading_page() ? '✕' : format_currency(currencies[0])) + '</span>');
        Defaults.set('currency', currencies[0]);
    }
}

module.exports = {
    displayCurrencies: displayCurrencies,
};

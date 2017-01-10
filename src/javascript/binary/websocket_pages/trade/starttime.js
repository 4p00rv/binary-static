const Contract  = require('./contract').Contract;
const Defaults  = require('./defaults').Defaults;
const Durations = require('./duration').Durations;
const getStartDateNode = require('./common_independent').getStartDateNode;
const moment = require('moment');
const Content = require('../../common_functions/content').Content;
const State = require('../../base/storage').State;

/*
 * Handles start time display
 *
 * It process `Contract.startDates` in case of forward
 * starting contracts and populate the start time select
 * box
 */

const StartDates = (function() {
    'use strict';

    let hasNow = 0;
    State.remove('is_start_dates_displayed');

    const compareStartDate = function(a, b) {
        if (a.date < b.date)            {
            return -1;
        }
        if (a.date > b.date)            {
            return 1;
        }
        return 0;
    };

    const displayStartDates = function() {
        const startDates = Contract.startDates();

        if (startDates && startDates.list && startDates.list.length) {
            const target = getStartDateNode(),
                fragment =  document.createDocumentFragment(),
                row = document.getElementById('date_start_row');
            let option,
                content;

            row.style.display = 'flex';

            while (target && target.firstChild) {
                target.removeChild(target.firstChild);
            }

            if (startDates.has_spot) {
                option = document.createElement('option');
                content = document.createTextNode(Content.localize().textNow);
                option.setAttribute('value', 'now');
                $('#date_start').removeClass('light-yellow-background');
                option.appendChild(content);
                fragment.appendChild(option);
                hasNow = 1;
            } else {
                hasNow = 0;
            }

            startDates.list.sort(compareStartDate);

            let first;
            startDates.list.forEach(function (start_date) {
                let a = moment.unix(start_date.open).utc();
                const b = moment.unix(start_date.close).utc();

                const ROUNDING = 5 * 60 * 1000;
                const start = moment.utc();

                if (moment(start).isAfter(moment(a))) {
                    a = start;
                }

                a = moment(Math.ceil((+a) / ROUNDING) * ROUNDING).utc();

                while (a.isBefore(b)) {
                    if (a.unix() - start.unix() > 5 * 60) {
                        option = document.createElement('option');
                        option.setAttribute('value', a.utc().unix());
                        if (typeof first === 'undefined' && !hasNow) {
                            first = a.utc().unix();
                        }
                        content = document.createTextNode(a.format('HH:mm ddd').replace(' ', ' GMT, '));
                        if (option.value === Defaults.get('date_start')) {
                            option.setAttribute('selected', 'selected');
                        }
                        option.appendChild(content);
                        fragment.appendChild(option);
                    }
                    a.add(5, 'minutes');
                }
            });
            target.appendChild(fragment);
            Defaults.set('date_start', target.value);
            State.set('is_start_dates_displayed', true);
            if (first) {
                Durations.onStartDateChange(first);
            }
        } else {
            State.remove('is_start_dates_displayed');
            document.getElementById('date_start_row').style.display = 'none';
            Defaults.remove('date_start');
        }
    };

    return {
        display: displayStartDates,
        disable: function() { getStartDateNode().setAttribute('disabled', 'disabled'); },
        enable : function() { getStartDateNode().removeAttribute('disabled'); },
    };
})();

module.exports = {
    StartDates: StartDates,
};

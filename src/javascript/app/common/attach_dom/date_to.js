const moment           = require('moment');
const DatePicker       = require('../../components/date_picker');
const dateValueChanged = require('../../../_common/common_functions').dateValueChanged;
const localize         = require('../../../_common/localize').localize;
const toISOFormat      = require('../../../_common/string_util').toISOFormat;

const getDatePickerValue = (selector) => {
    const val = $(selector).attr('data-value');
    return val ? moment.utc(val).unix() + (24 * (60 * 60)) : 0;
};

const getDateToFrom = () => {
    const date_to_val = $('#date_to').attr('data-value');
    let date_to,
        date_from;
    if (date_to_val) {
        date_to   = getDatePickerValue('#date_to');
        date_from = 0;
    }
    return {
        date_to,
        date_from,
    };
};

const attachDateToPicker = (fncOnChange) => {
    const id_date_to = '#date_to';
    const $date_to   = $(id_date_to);
    $date_to
        .attr('data-value', toISOFormat(moment.utc()))
        .change(function () {
            if (!dateValueChanged(this, 'date')) {
                return false;
            }
            $('.table-container').remove();
            if (typeof fncOnChange === 'function') {
                fncOnChange();
            }
            return true;
        });
    DatePicker.init({
        selector: id_date_to,
        maxDate : 0,
    });
    if ($date_to.attr('data-picker') !== 'native') $date_to.val(localize('Today'));
};

const attachDateRangePicker = (date_from_id, date_to_id, fncOnChange) => {
    const $date_from = $(date_from_id);
    const $date_to   = $(date_to_id);

    const onChange = (e, additionalFnc) => {
        if (!dateValueChanged(e, 'date')) {
            return false;
        }
        if (typeof fncOnChange === 'function') {
            fncOnChange();
        }
        if (typeof additionalFnc === 'function') {
            additionalFnc();
        }
        return true;
    };

    const initDatePicker = (id, opts) => {
        const $datepicker = $(id);
        DatePicker.init({
            selector: id,
            maxDate : 0,
            ...opts,
        });
        $datepicker.val('').removeAttr('data-value');
        if ($datepicker.attr('data-picker') !== 'native') $datepicker.attr('placeholder', localize('Select date'));
    };

    const getMinDate = (e) => {
        const date = new Date(e.getAttribute('data-value'));
        return new Date(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate() + 1}`);
    };

    $date_from.change(function() { onChange(this, initDatePicker(date_to_id, { minDate: getMinDate(this) })); });
    $date_to.change(function() { onChange(this); });

    initDatePicker(date_from_id);
    initDatePicker(date_to_id);
};

module.exports = {
    attachDateToPicker,
    attachDateRangePicker,
    getDatePickerValue,
    getDateToFrom,
};

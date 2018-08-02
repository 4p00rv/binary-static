import {
    action,
    computed,
    observable }                      from 'mobx';
import moment                         from 'moment';
import { formatStatementTransaction } from './Helpers/format_response';
import BaseStore                      from '../../base_store';
import { WS }                         from '../../../Services';
import Client                         from '../../../../_common/base/client_base';

const batch_size = 100; // request response limit

export default class StatementStore extends BaseStore {
    @observable data           = [];
    @observable is_loading     = false;
    @observable has_loaded_all = false;
    @observable date_from      = '';
    @observable date_to        = '';
    @observable error          = '';

    @action.bound
    clearTable() {
        this.data            = [];
        this.has_loaded_all  = false;
        this.is_loading      = false;
    }

    @action.bound
    clearDateFilter() {
        this.date_from = '';
        this.date_to   = '';
    }

    @action.bound
    fetchNextBatch() {
        if (this.has_loaded_all || this.is_loading) return;

        this.is_loading = true;

        const currency = Client.get('currency');

        WS.statement(
            batch_size,
            this.data.length,
            {
                ...this.date_from && {date_from: moment(this.date_from).unix()},
                ...this.date_to   && {date_to: moment(this.date_to).add(1, 'd').subtract(1, 's').unix()},
            }
        ).then((response) => {
            if ('error' in response) {
                this.error = response.error.message;
                return;
            }
            const formatted_transactions = response.statement.transactions
                .map(transaction => formatStatementTransaction(transaction, currency));

            this.data           = [...this.data, ...formatted_transactions];
            this.has_loaded_all = formatted_transactions.length < batch_size;
            this.is_loading     = false;
        });
    }

    @action.bound
    handleDateChange(e) {
        if (e.target.value !== this[e.target.name]) {
            this[e.target.name] = e.target.value;
            this.clearTable();
            this.fetchNextBatch();
        }
    }

    @action.bound
    handleScroll(event) {
        const {scrollTop, scrollHeight, clientHeight} = event.target;
        const left_to_scroll = scrollHeight - (scrollTop + clientHeight);

        if (left_to_scroll < 2000) {
            this.fetchNextBatch();
        }
    };

    @action.bound
    onMount() {
        this.fetchNextBatch();
    }

    @action.bound
    onUnmount() {
        this.clearTable();
        this.clearDateFilter();
    }


    @computed
    get is_empty() {
        return !this.is_loading && this.data.length === 0;
    }

    @computed
    get has_selected_date() {
        return !!(this.date_from || this.date_to);
    }
}

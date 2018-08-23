import {
    action,
    computed,
    observable }                   from 'mobx';
import { formatPortfolioPosition } from './Helpers/format_response';
import BaseStore                   from '../../base_store';
import { WS }                      from '../../../Services';

export default class PortfolioStore extends BaseStore {
    @observable data       = [];
    @observable is_loading = false;
    @observable error      = '';

    @action.bound
    initializePortfolio = () => {
        this.is_loading = true;

        WS.portfolio().then(this.portfolioHandler);
        WS.subscribeProposalOpenContract(null, this.proposalOpenContractHandler, false);
        WS.subscribeTransaction(this.transactionHandler, false);
    };

    @action.bound
    clearTable() {
        this.data       = [];
        this.is_loading = false;
        this.error      = '';
    }

    @action.bound
    portfolioHandler(response) {
        this.is_loading = false;
        if ('error' in response) {
            this.error = response.error.message;
            return;
        }
        this.error = '';
        if (response.portfolio.contracts) {
            this.data = response.portfolio.contracts
                .map(pos => formatPortfolioPosition(pos))
                .sort((pos1, pos2) => pos2.reference - pos1.reference); // new contracts first
        }
    };

    @action.bound
    transactionHandler(response) {
        if ('error' in response) {
            this.error = response.error.message;
        }
        const { contract_id, action } = response.transaction;
        if (!contract_id) return;

        if (action === 'buy') {
            console.log('%c buy', 'color: green; font-weight: bold;');
            WS.portfolio().then((res) => {
                const new_pos = res.portfolio.contracts.find(pos => +pos.contract_id === +contract_id);
                if (!new_pos) return;
                this.pushNewPosition(new_pos);
            });
            // subscribe to new contract:
            WS.subscribeProposalOpenContract(contract_id, this.proposalOpenContractHandler, false);
        } else if (action === 'sell') {
            console.log('%c sell', 'color: red; font-weight: bold;');
            this.removeByContractId(contract_id);
        }
    };

    @action.bound
    proposalOpenContractHandler(response) {
        console.log('%c proposalOpenContractHandler', 'color: orange; font-weight: bold;', response);
        if ('error' in response) return;

        const proposal = response.proposal_open_contract;
        const portfolio_position = this.data.find(
            (position) => +position.id === +proposal.contract_id
        );

        if (!portfolio_position) return;

        const prev_indicative = portfolio_position.indicative;
        const new_indicative  = +proposal.bid_price;

        portfolio_position.indicative = new_indicative;
        portfolio_position.underlying = proposal.display_name;

        if (!proposal.is_valid_to_sell) {
            portfolio_position.status = 'no-resale';
        }
        else if (new_indicative > prev_indicative) {
            portfolio_position.status = 'price-moved-up';
        }
        else if (new_indicative < prev_indicative) {
            portfolio_position.status = 'price-moved-down';
        }
        else {
            portfolio_position.status = 'price-stable';
        }
    }

    @action.bound
    pushNewPosition(new_pos) {
        this.data.unshift(formatPortfolioPosition(new_pos));
    }

    @action.bound
    removeByContractId(contract_id) {
        const i = this.data.findIndex(pos => +pos.id === +contract_id);
        this.data.splice(i, 1);
    }

    @action.bound
    onMount() {
        if (this.data.length === 0) {
            this.initializePortfolio();
        }
    }

    @action.bound
    onUnmount() {
        // keep data and connections for portfolio drawer on desktop
        if (this.root_store.ui.is_mobile) {
            this.clearTable();
            WS.forgetAll('proposal_open_contract', 'transaction');
        }
    }

    @computed
    get totals() {
        let indicative = 0;
        let payout     = 0;
        let purchase   = 0;

        this.data.forEach((portfolio_pos) => {
            indicative += (+portfolio_pos.indicative);
            payout     += (+portfolio_pos.payout);
            purchase   += (+portfolio_pos.purchase);
        });
        return {
            indicative,
            payout,
            purchase,
        };
    }

    @computed
    get is_empty() {
        return !this.is_loading && this.data.length === 0;
    }
}

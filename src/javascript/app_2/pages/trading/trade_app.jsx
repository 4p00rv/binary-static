import React from 'react';
import Amount from './components/amount.jsx';
import Barrier from './components/barrier.jsx';
import ContractType from './components/contract_type.jsx';
import Duration from './components/duration.jsx';
import LastDigit from './components/last_digit.jsx';
import StartDate from './components/start_date.jsx';
import Symbol from './components/symbol.jsx';
import Test from './components/test.jsx';
import { connect } from './store/connect';

class TradeApp extends React.Component {
    componentDidMount() {
        this.props.onMounted();
    }

    isVisible(component_name) {
        return this.props.form_components.indexOf(component_name) >= 0;
    }

    render() {
        return (
            <React.Fragment>
                <div className='chart-container notice-msg'>
                    <Test />
                </div>
                <div className='sidebar-container'>
                    <Symbol />
                    <ContractType />
                    {this.isVisible('start_date') && <StartDate />}
                    <Duration />
                    {this.isVisible('barrier') && <Barrier />}
                    {this.isVisible('last_digit') && <LastDigit />}
                    <Amount />
                </div>
            </React.Fragment>
        );
    }
}

export default connect(
    ({trade}) => ({
        form_components: trade.form_components,
        onMounted      : trade.init,
    })
)(TradeApp);
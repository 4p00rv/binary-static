import { PropTypes as MobxPropTypes }      from 'mobx-react';
import PropTypes                           from 'prop-types';
import React                               from 'react';
import { withRouter }                      from 'react-router-dom';
import { localize }                        from '_common/localize';
import DataTable                           from 'App/Components/Elements/DataTable';
import { getContractPath }                 from 'App/Components/Routes/helpers';
import { connect }                         from 'Stores/connect';
import EmptyOpenPositionsMessage           from '../Components/empty-open-positions-message.jsx';
import { ReportsMeta }                     from '../Components/reports-meta.jsx';
import { getOpenPositionsColumnsTemplate } from '../Constants/data-table-constants';
import Loading                             from '../../../../../templates/_common/components/loading.jsx';

class OpenPositions extends React.Component {
    componentDidMount()    {
        this.props.onMount();
    }

    componentWillUnmount() { this.props.onUnmount(); }

    render() {
        const {
            active_positions,
            is_loading,
            error,
            is_empty,
            currency,
        } = this.props;

        if (error) {
            return <p>{error}</p>;
        }

        if (is_loading || !active_positions) {
            return <Loading />;
        }

        if (is_empty) {
            return <EmptyOpenPositionsMessage />;
        }

        return (
            <React.Fragment>
                <ReportsMeta
                    i18n_heading={localize('Open Positions')}
                    i18n_message={localize('Vestibulum rutrum quam fringilla tincidunt. Suspendisse nec tortor.')}
                />
                <div className='open-positions open-positions__content'>
                    { currency && active_positions.length > 0 && <DataTable
                        className='open-positions'
                        columns={getOpenPositionsColumnsTemplate(currency)}
                        data_source={active_positions}
                        getRowLink={(row_obj) => getContractPath(row_obj.id)}
                    />}
                </div>
            </React.Fragment>

        );
    }
}

OpenPositions.propTypes = {
    active_positions: MobxPropTypes.arrayOrObservableArray,
    currency        : PropTypes.string,
    error           : PropTypes.string,
    history         : PropTypes.object,
    is_empty        : PropTypes.bool,
    is_loading      : PropTypes.bool,
    is_mobile       : PropTypes.bool,
    is_tablet       : PropTypes.bool,
    onMount         : PropTypes.func,
    onUnmount       : PropTypes.func,
};

export default connect(
    ({ modules, client }) => ({
        currency        : client.currency,
        active_positions: modules.portfolio.active_positions,
        error           : modules.portfolio.error,
        is_empty        : modules.portfolio.is_empty,
        is_loading      : modules.portfolio.is_loading,
        onMount         : modules.portfolio.onMount,
        onUnmount       : modules.portfolio.onUnmount,
    })
)(withRouter(OpenPositions));

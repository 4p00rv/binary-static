import { PropTypes as MobxPropTypes }          from 'mobx-react';
import PropTypes                               from 'prop-types';
import React                                   from 'react';
import { withRouter }                          from 'react-router-dom';
import { localize }                            from '_common/localize';
import DataTable                               from 'App/Components/Elements/DataTable';
import { getContractPath }                     from 'App/Components/Routes/helpers';
import { connect }                             from 'Stores/connect';
import EmptyStatementMessage                   from '../Components/empty-statement-message.jsx';
import { getStatementTableColumnsTemplate }    from '../Constants/data-table-constants';
import PlaceholderComponent                    from '../Components/placeholder-component.jsx';
import { ReportsMeta }                         from '../Components/reports-meta.jsx';

class Statement extends React.Component {
    componentDidMount()    { this.props.onMount(); }
    componentWillUnmount() { this.props.onUnmount(); }

    render() {
        const {
            data,
            is_empty,
            is_loading,
            error,
            handleScroll,
            has_selected_date,
        } = this.props;

        if (error) return <p>{error}</p>;

        const columns = getStatementTableColumnsTemplate();

        return (
            <React.Fragment>
                {/* TODO Add proper messages before the PR */}
                <ReportsMeta
                    i18n_heading={localize('Statement')}
                    i18n_message={localize('Vestibulum rutrum quam fringilla tincidunt. Suspendisse nec tortor.')}
                />
                <div className='statement__content'>
                    <DataTable
                        className='statement'
                        data_source={data}
                        columns={columns}
                        onScroll={handleScroll}
                        getRowLink={(row_obj) => row_obj.id ? getContractPath(row_obj.id) : undefined}
                        is_empty={is_empty}
                    >
                        <PlaceholderComponent
                            is_loading={is_loading}
                            has_selected_date={has_selected_date}
                            is_empty={is_empty}
                            empty_message_component={EmptyStatementMessage}
                        />
                    </DataTable>
                </div>
            </React.Fragment>
        );
    }
}

Statement.propTypes = {
    data             : MobxPropTypes.arrayOrObservableArray,
    error            : PropTypes.string,
    handleScroll     : PropTypes.func,
    has_selected_date: PropTypes.bool,
    history          : PropTypes.object,
    is_empty         : PropTypes.bool,
    is_loading       : PropTypes.bool,
    onMount          : PropTypes.func,
    onUnmount        : PropTypes.func,
};

export default connect(
    ({ modules }) => ({
        data             : modules.statement.data,
        error            : modules.statement.error,
        handleScroll     : modules.statement.handleScroll,
        has_selected_date: modules.statement.has_selected_date,
        is_empty         : modules.statement.is_empty,
        is_loading       : modules.statement.is_loading,
        onMount          : modules.statement.onMount,
        onUnmount        : modules.statement.onUnmount,
    })
)(withRouter(Statement));

import DAO from '../../data/dao';
import { cloneObject } from '../../../../../_common/utility';
import { localize } from '../../../../../_common/localize';
// import { get as getLanguage } from '../../../../../_common/language';


const ContractType = (() => {
    /**
     * components can be undef or an array containing any of: 'start_date', 'barrier', 'last_digit'
     *     ['duration', 'amount'] are omitted, as they're available in all contract types
     */
    const contract_types = {
        rise_fall  : { title: localize('Rise/Fall'),                  types: ['CALL', 'PUT'],               components: ['start_date'], barrier_count: 0 },
        high_low   : { title: localize('Higher/Lower'),               types: ['CALL', 'PUT'],               components: ['barrier'],    barrier_count: 1 },
        touch      : { title: localize('Touch/No Touch'),             types: ['ONETOUCH', 'NOTOUCH'],       components: ['barrier'] },
        end        : { title: localize('Ends Between/Ends Outside'),  types: ['EXPIRYMISS', 'EXPIRYRANGE'], components: ['barrier'] },
        stay       : { title: localize('Stays Between/Goes Outside'), types: ['RANGE', 'UPORDOWN'],         components: ['barrier'] },
        asian      : { title: localize('Asians'),                     types: ['ASIANU', 'ASIAND'],          components: [] },
        match_diff : { title: localize('Matches/Differs'),            types: ['DIGITMATCH', 'DIGITDIFF'],   components: ['last_digit'] },
        even_odd   : { title: localize('Even/Odd'),                   types: ['DIGITODD', 'DIGITEVEN'],     components: [] },
        over_under : { title: localize('Over/Under'),                 types: ['DIGITOVER', 'DIGITUNDER'],   components: ['last_digit'] },
        lb_call    : { title: localize('High-Close'),                 types: ['LBFLOATCALL'],               components: [] },
        lb_put     : { title: localize('Close-Low'),                  types: ['LBFLOATPUT'],                components: [] },
        lb_high_low: { title: localize('High-Low'),                   types: ['LBHIGHLOW'],                 components: [] },
    };

    const contract_categories = {
        [localize('Up/Down')]       : ['rise_fall', 'high_low'],
        [localize('Touch/No Touch')]: ['touch'],
        [localize('In/Out')]        : ['end', 'stay'],
        [localize('Asians')]        : ['asian'],
        [localize('Digits')]        : ['match_diff', 'even_odd', 'over_under'],
        [localize('Lookback')]      : ['lb_call', 'lb_put', 'lb_high_low'],
    };

    let types = {};

    const getContractsList = (symbol) => DAO.getContractsFor(symbol).then(r => {
        types = {};
        const categories = cloneObject(contract_categories); // To preserve the order (will clean the extra items later in this function)
        r.contracts_for.available.forEach((contract) => {
            const type = Object.keys(contract_types).find(key => (
                contract_types[key].types.indexOf(contract.contract_type) !== -1 &&
                (typeof contract_types[key].barrier_count === 'undefined' || +contract_types[key].barrier_count === contract.barriers) // To distinguish betweeen Rise/Fall & Higher/Lower
            ));

            // getLanguage() === 'ID' ? ['match_diff'] : ['match_diff', 'even_odd', 'over_under'],
            if (!types[type]) {
                //
                const arr = categories[Object.keys(categories).find(key => categories[key].indexOf(type) !== -1)];
                arr[arr.indexOf(type)] = { name: type, title: contract_types[type].title };

                //
                types[type] = cloneObject(contract_types[type]);
            }

            // TODO: add contract_info
        });

        // cleanup categories
        Object.keys(categories).forEach((key) => {
            categories[key] = categories[key].filter(item => typeof item === 'object');
            if (categories[key].length === 0) {
                delete categories[key];
            }
        });

        return categories;
    });

    const getContractType = (list, contract_type) => {
        const list_arr = Object.keys(list || {})
            .reduce((k, l) => ([...k, ...list[l].map(ct => ct.name)]), []);
        return list_arr.indexOf(contract_type) === -1 || !contract_type ? list_arr[0] : contract_type;
    };

    const getComponents = (c_type) => contract_types[c_type].components;

    const onContractChange = (c_type) => {
        const form_components = getComponents(c_type);
        return {
            form_components,
        };
    };

        // contracts_info: { CALL: {}, PUT: {} }
    return {
        getContractsList,
        getContractType,
        getComponents,
        onContractChange,
    };
})();

export default ContractType;
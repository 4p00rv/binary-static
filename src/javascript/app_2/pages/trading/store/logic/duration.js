// import DAO from '../../data/dao';
import { localize } from '../../../../../_common/localize';

const units_map = {
    t: 'ticks',
    s: 'seconds',
    m: 'minutes',
    h: 'hours',
    d: 'days',
};

const getDurationUnits = () => Object.keys(units_map).reduce((o, c) => ({...o, [c]: localize(units_map[c])}), {});

export default getDurationUnits;
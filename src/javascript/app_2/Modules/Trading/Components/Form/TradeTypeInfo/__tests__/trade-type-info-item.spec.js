import React                  from 'react';
import { expect }             from 'chai';
import { configure, shallow } from 'enzyme';
import Adapter                from 'enzyme-adapter-react-16';
import TradeTypeInfoItem      from '../trade-type-info-item.jsx';

configure({ adapter: new Adapter() });

describe('TradeTypeInfoItem', () => {
    const item = { text: 'Higher/Lower' , value: 'high_low' };
    const navigationList = ['high_low', 'rise_fall'];

    it('should render one <TradeTypeInfoItem /> component', () => {
        const wrapper = shallow(<TradeTypeInfoItem item={item} navigationList={navigationList} />);
        expect(wrapper).to.have.length(1);
    });
    it('should have 2 .circle-button (equal to navigationList\'s length)', () => {
        const wrapper = shallow(<TradeTypeInfoItem item={item} navigationList={navigationList} />);
        expect(wrapper.find('.trade-type-info-navigation__circle-button')).to.have.length(2);
    });
});

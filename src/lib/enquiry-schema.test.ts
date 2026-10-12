import {describe,it,expect} from 'vitest';
import {enquirySchema} from './enquiry-schema';
import {MARKET_CATEGORIES,legacyCategory,legacyCondition} from './shop';
const offer={kind:'sell',name:'Test',contact:'LINE test',service:'Digital cameras',description:'Broken shutter',deviceCondition:'broken',brand:'Camera brand',model:'Camera model'};
describe('Device assessment and market rules',()=>{
 it('accepts a broken digital camera offer without an expected price',()=>{const result=enquirySchema.parse(offer);expect(result.deviceCondition).toBe('broken');expect(result.price).toBeNull();});
 it('accepts a working smartphone offer',()=>{expect(enquirySchema.parse({...offer,service:'Smartphones and mobile phones',deviceCondition:'working'}).deviceCondition).toBe('working');});
 it('includes electronics, clothing and footwear in one catalog',()=>{expect(MARKET_CATEGORIES).toEqual(['technology','clothing','footwear']);});
 it('preserves old footwear data mapping',()=>{expect(legacyCategory('footwear')).toBe('womens_shoes');});
 it('keeps repaired tested, untested and for-parts compatible with legacy condition',()=>{expect(legacyCondition('repaired_tested')).toBe('refurbished');expect(legacyCondition('untested')).toBe('pre_owned');expect(legacyCondition('for_parts')).toBe('pre_owned');});
});

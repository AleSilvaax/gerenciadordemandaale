import { describe, it, expect } from 'vitest';
import { parseJsonValue, toJsonValue } from '../jsonFields';
describe('service evidence JSON',()=>{
 it('keeps the saved client signature in an object rather than a string',()=>{expect(toJsonValue({client:'data:image/png;base64,signature'})).toEqual({client:'data:image/png;base64,signature'});});
 it('reads signatures previously saved as JSON strings',()=>{expect(parseJsonValue<{client?:string}>('{"client":"data:image/png;base64,legacy"}',{}).client).toBe('data:image/png;base64,legacy');});
});

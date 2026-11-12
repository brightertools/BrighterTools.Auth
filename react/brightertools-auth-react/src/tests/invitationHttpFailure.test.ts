import { describe, it, expect } from 'vitest';
import { invitationHttpFailure } from '../invitationHttpFailure.js';
describe('invitation HTTP failure boundary', () => {
  it('preserves validation messages and conflict explanations', () => {
    expect(invitationHttpFailure({response:{status:409,data:{messages:['Invitation was accepted. Refresh the list.']}}},'Failed').messages).toEqual(['Invitation was accepted. Refresh the list.']);
    expect(invitationHttpFailure({response:{status:400,data:{errors:{id:['Invalid invitation.']}}}},'Failed').messages).toEqual(['Invalid invitation.']);
  });
  it('does not disclose unexpected response bodies or exception messages', () => {
    expect(invitationHttpFailure({response:{status:500,data:{messages:['SECRET'],traceId:'00-safe-id'}}},'Failed').messages).toEqual(['Failed Reference: 00-safe-id']);
    expect(invitationHttpFailure(new Error('SECRET'),'Failed').messages).toEqual(['Failed']);
    expect(invitationHttpFailure({response:{status:500,data:{traceId:'<script>SECRET</script>'}}},'Failed').messages).toEqual(['Failed']);
  });
  it('explains expired sessions and lost permissions', () => {
    expect(invitationHttpFailure({response:{status:401}},'Failed').messages?.[0]).toContain('Sign in');
    expect(invitationHttpFailure({response:{status:403}},'Failed').messages?.[0]).toContain('permission');
  });
});

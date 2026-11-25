import { renderTemplate, segmentWhere } from './marketing.service';

describe('marketing helpers', () => {
  it('renders template variables', () => {
    expect(renderTemplate('مرحبا {{ name }} من {{store}} {{missing}}', { name: 'نورة', store: 'ليان' })).toBe('مرحبا نورة من ليان ');
  });
  it('always requires marketing consent for sends', () => {
    const w = segmentWhere('t1', { minOrders: 2 }, true) as { AND: object[] };
    expect(w.AND).toContainEqual({ acceptsMarketing: true });
    expect(w.AND).toContainEqual({ tenantId: 't1' });
  });
});

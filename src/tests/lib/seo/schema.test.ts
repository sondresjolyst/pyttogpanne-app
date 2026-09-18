import { describe, it, expect } from 'vitest';
import { organizationNode, webSiteNode } from '@/lib/seo/schema/organization';
import { breadcrumbNode, itemListNode } from '@/lib/seo/schema/navigation';
import { SCHEMA_IDS, serializeGraph } from '@/lib/seo/schema/graph';
import type { CompanyInfo } from '@/lib/companyInfo';

const company: CompanyInfo = {
    name: 'Pyttogpanne',
    legalName: 'Pyttogpanne',
    orgNumber: '',
    vatRegistered: false,
    address: 'Turvegen 3, 4330 Algård',
    streetAddress: 'Turvegen 3',
    postalCode: '4330',
    addressLocality: 'Algård',
    addressRegion: 'Rogaland',
    email: 'post@example.com',
    phone: '+47 400 00 000',
};

const PAGE = 'https://admin.pyttogpanne.prod.tumogroup.com/no/terms';

describe('organization node', () => {
    it('omits the legal name when it only repeats the trading name', () => {
        expect(organizationNode(company)).not.toHaveProperty('legalName');
        expect(organizationNode({ ...company, legalName: 'Pyttogpanne AS' })).toHaveProperty('legalName', 'Pyttogpanne AS');
    });

    it('omits VAT and org identifiers until the business is registered', () => {
        const node = organizationNode(company);
        expect(node).not.toHaveProperty('vatID');
        expect(node).not.toHaveProperty('taxID');
    });

    it('emits a VAT id only once registered', () => {
        const node = organizationNode({ ...company, orgNumber: '123 456 789', vatRegistered: true });
        expect(node.vatID).toBe('NO123456789MVA');
    });

    it('emits the address as separate fields, which is what a listing is matched on', () => {
        expect(organizationNode(company).address).toEqual({
            '@type': 'PostalAddress',
            streetAddress: 'Turvegen 3',
            postalCode: '4330',
            addressLocality: 'Algård',
            addressRegion: 'Rogaland',
            addressCountry: 'NO',
        });
    });

    it('omits address parts an admin has not filled in, rather than guessing them', () => {
        const partial = { ...company, postalCode: '', addressLocality: '', addressRegion: '' };
        expect(organizationNode(partial).address).toEqual({
            '@type': 'PostalAddress',
            streetAddress: 'Turvegen 3',
            addressCountry: 'NO',
        });
    });

    it('falls back to the one-line address when the API has no parts to give', () => {
        // An API that sends the one-line address only.
        const oneLine = { ...company, streetAddress: '', postalCode: '', addressLocality: '', addressRegion: '' };
        expect(organizationNode(oneLine).address).toEqual({
            '@type': 'PostalAddress',
            streetAddress: 'Turvegen 3, 4330 Algård',
            addressCountry: 'NO',
        });
    });

    it('is referenced by the site node rather than repeated inside it', () => {
        expect(webSiteNode('no').publisher).toEqual({ '@id': SCHEMA_IDS.organization });
    });
});

describe('navigation nodes', () => {
    it('leaves the current page without a link', () => {
        const crumbs = breadcrumbNode(
            [{ name: 'Hjem', path: '/no' }, { name: 'Vilkår' }],
            PAGE,
        ).itemListElement as Array<Record<string, unknown>>;
        expect(crumbs[0]).toHaveProperty('item', 'https://admin.pyttogpanne.prod.tumogroup.com/no');
        expect(crumbs[1]).not.toHaveProperty('item');
        expect(crumbs[1].position).toBe(2);
    });

    it('counts the items it lists', () => {
        const node = itemListNode(['/no/terms', '/no/privacy'], PAGE);
        expect(node.numberOfItems).toBe(2);
    });
});

describe('graph serialisation', () => {
    it('escapes angle brackets so the payload cannot close the script tag', () => {
        const json = serializeGraph([{ '@type': 'Thing', name: '</script><script>alert(1)</script>' }]);
        expect(json).not.toContain('</script>');
        expect(JSON.parse(json)['@graph'][0].name).toBe('</script><script>alert(1)</script>');
    });
});

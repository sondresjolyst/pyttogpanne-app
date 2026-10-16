import { describe, it, expect } from 'vitest';
import { contactSchema } from '@/lib/validation';

const valid = {
    name: 'Ola Nordmann',
    email: 'ola@kunde.no',
    phone: '',
    useCase: 'gaming',
    budgetNok: '25000+',
    buildSlug: '',
    message: 'Hei!',
};

describe('contactSchema', () => {
    it('accepts a filled-in enquiry', () => {
        expect(contactSchema.safeParse(valid).success).toBe(true);
    });

    it('accepts an enquiry without the optional fields', () => {
        const result = contactSchema.safeParse({ name: 'Ola', email: 'ola@kunde.no', message: 'Hei' });
        expect(result.success).toBe(true);
    });

    it('rejects an invalid email', () => {
        const result = contactSchema.safeParse({ ...valid, email: 'ikke-en-epost' });
        expect(result.success).toBe(false);
    });

    it('rejects an empty message', () => {
        const result = contactSchema.safeParse({ ...valid, message: '' });
        expect(result.success).toBe(false);
    });

    it('rejects an invalid budget range', () => {
        const result = contactSchema.safeParse({ ...valid, budgetNok: '1-2' });
        expect(result.success).toBe(false);
    });
});


export const COMPANY = {
    name: "Pyttogpanne",
    legalName: "",
    orgNumber: "",
    vatRegistered: false,
    address: "",
    email: "",
    phone: "",
    url: "https://admin.pyttogpanne.prod.tumogroup.com",
} as const;

export const companyLegalName = (legalName?: string | null): string =>
    legalName && legalName.trim() !== '' ? legalName : COMPANY.name;

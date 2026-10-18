import { formatOrgNumber, mergeCompanyInfo, type CompanyInfo } from '@sjolystinnovation/app-kit/company';
import { publicGetOptional } from '@/lib/publicApi';
import { COMPANY } from '@/lib/company';

export { formatOrgNumber, type CompanyInfo };

export async function getCompanyInfo(): Promise<CompanyInfo> {
    return mergeCompanyInfo(await publicGetOptional<CompanyInfo>('/company'), COMPANY);
}

import { Work, ProviderSearchFilters, ProviderSearchResponse } from '../types';

export interface ProviderAdapter {
  readonly providerName: 'OpenAlex' | 'Crossref';
  
  search(query: string, filters: ProviderSearchFilters): Promise<ProviderSearchResponse>;
  
  resolveByIdentifier(identifier: string): Promise<Work | null>;
  
  getReferences?(openAlexIdOrDoi: string): Promise<string[]>;
  
  getCitedBy?(openAlexIdOrDoi: string): Promise<string[]>;
}

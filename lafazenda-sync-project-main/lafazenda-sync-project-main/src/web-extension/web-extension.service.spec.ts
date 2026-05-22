import { Test, TestingModule } from '@nestjs/testing';
import { WebExtensionService } from './web-extension.service';
import { LoggerService } from '../utils/logger.service';

jest.mock( '../utils/config/integrations.config', () => ({
  INTEGRATIONS: {
    hubspot: {
      apiV3: {
        get: jest.fn(),
        post: jest.fn()
      }
    }
  }
}) );

import { INTEGRATIONS } from '../utils/config/integrations.config';
const mockGet = INTEGRATIONS.hubspot.apiV3.get as jest.Mock;
const mockPost = INTEGRATIONS.hubspot.apiV3.post as jest.Mock;

describe( 'WebExtensionService', () => {
  let service: WebExtensionService;

  beforeEach( async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebExtensionService,
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<WebExtensionService>( WebExtensionService );
  });

  describe( 'getCompanies', () => {
    const mockCompanies = [
      { id: '1', properties: { name: 'ACME Corp', cod_cliente: 'C001' } },
      { id: '2', properties: { name: 'Beta Inc', cod_cliente: null } }
    ];

    it( 'should fetch companies with default limit=100 and no after', async () => {
      mockGet.mockResolvedValue({
        data: { results: mockCompanies }
      });

      const result = await service.getCompanies();

      expect( mockGet ).toHaveBeenCalledTimes( 1 );
      expect( mockGet ).toHaveBeenCalledWith(
        '/objects/companies?properties=name%2Ccod_cliente&limit=100'
      );
      expect( result.results ).toHaveLength( 2 );
      expect( result.results[0] ).toEqual({
        id: '1',
        name: 'ACME Corp',
        cod_cliente: 'C001'
      });
      expect( result.results[1].cod_cliente ).toBeNull();
    });

    it( 'should pass custom limit and after cursor', async () => {
      mockGet.mockResolvedValue({
        data: { results: [] }
      });

      await service.getCompanies( 50, 'abc123' );

      expect( mockGet ).toHaveBeenCalledWith(
        '/objects/companies?properties=name%2Ccod_cliente&limit=50&after=abc123'
      );
    });

    it( 'should handle empty results', async () => {
      mockGet.mockResolvedValue({
        data: { results: [] }
      });

      const result = await service.getCompanies();

      expect( result.results ).toHaveLength( 0 );
    });

    it( 'should handle missing properties gracefully', async () => {
      mockGet.mockResolvedValue({
        data: {
          results: [ { id: '3', properties: {} } ]
        }
      });

      const result = await service.getCompanies();

      expect( result.results[0] ).toEqual({
        id: '3',
        name: '',
        cod_cliente: null
      });
    });

    it( 'should include paging info when present', async () => {
      mockGet.mockResolvedValue({
        data: {
          results: [],
          paging: { next: { after: '50' } }
        }
      });

      const result = await service.getCompanies();

      expect( result.paging ).toEqual({ next: { after: '50' } });
    });
  });

  describe( 'getAllCompanies', () => {
    it( 'should paginate through all pages and return all companies', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: {
            results: [
              { id: '1', properties: { name: 'A', cod_cliente: 'CA' } },
              { id: '2', properties: { name: 'B', cod_cliente: 'CB' } }
            ],
            paging: { next: { after: 'page2' } }
          }
        })
        .mockResolvedValueOnce({
          data: {
            results: [ { id: '3', properties: { name: 'C', cod_cliente: 'CC' } } ]
          }
        });

      const result = await service.getAllCompanies();

      expect( mockGet ).toHaveBeenCalledTimes( 2 );
      expect( mockGet ).toHaveBeenNthCalledWith(
        1,
        '/objects/companies?properties=name%2Ccod_cliente&limit=100'
      );
      expect( mockGet ).toHaveBeenNthCalledWith(
        2,
        '/objects/companies?properties=name%2Ccod_cliente&limit=100&after=page2'
      );
      expect( result.companies ).toHaveLength( 3 );
      expect( result.total ).toBe( 3 );
      expect( result.syncedAt ).toBeDefined();
      expect( new Date( result.syncedAt ).toISOString() ).toBe( result.syncedAt );
    });

    it( 'should handle single page (no paging)', async () => {
      mockGet.mockResolvedValue({
        data: {
          results: [ { id: '1', properties: { name: 'Only', cod_cliente: 'X' } } ]
        }
      });

      const result = await service.getAllCompanies();

      expect( mockGet ).toHaveBeenCalledTimes( 1 );
      expect( result.companies ).toHaveLength( 1 );
      expect( result.total ).toBe( 1 );
    });

    it( 'should handle zero companies', async () => {
      mockGet.mockResolvedValue({
        data: { results: [] }
      });

      const result = await service.getAllCompanies();

      expect( result.companies ).toHaveLength( 0 );
      expect( result.total ).toBe( 0 );
    });
  });

  describe( 'searchCompanies', () => {
    it( 'should search with OR logic across name and cod_cliente', async () => {
      mockPost.mockResolvedValue({
        data: {
          results: [ { id: '5', properties: { name: 'Search Result', cod_cliente: 'S001' } } ]
        }
      });

      const result = await service.searchCompanies( 'Search' );

      expect( mockPost ).toHaveBeenCalledTimes( 1 );
      expect( mockPost ).toHaveBeenCalledWith( '/objects/companies/search', {
        filterGroups: [
          {
            filters: [ { propertyName: 'name', operator: 'CONTAINS_TOKEN', value: 'Search' } ]
          },
          {
            filters: [ { propertyName: 'cod_cliente', operator: 'CONTAINS_TOKEN', value: 'Search' } ]
          }
        ],
        properties: [
          'name',
          'cod_cliente'
        ],
        limit: 50
      });
      expect( result.results ).toHaveLength( 1 );
      expect( result.results[0].name ).toBe( 'Search Result' );
    });

    it( 'should return empty results when no matches', async () => {
      mockPost.mockResolvedValue({
        data: { results: [] }
      });

      const result = await service.searchCompanies( 'NoMatch' );

      expect( result.results ).toHaveLength( 0 );
    });

    it( 'should handle search by cod_cliente (numeric/prefix)', async () => {
      mockPost.mockResolvedValue({
        data: {
          results: [ { id: '10', properties: { name: 'Client X', cod_cliente: 'ABC-123' } } ]
        }
      });

      const result = await service.searchCompanies( 'ABC-123' );

      expect( mockPost ).toHaveBeenCalledWith( '/objects/companies/search', {
        filterGroups: [
          { filters: [ { propertyName: 'name', operator: 'CONTAINS_TOKEN', value: 'ABC-123' } ] },
          { filters: [ { propertyName: 'cod_cliente', operator: 'CONTAINS_TOKEN', value: 'ABC-123' } ] }
        ],
        properties: [
          'name',
          'cod_cliente'
        ],
        limit: 50
      });
      expect( result.results[0].cod_cliente ).toBe( 'ABC-123' );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebExtensionController } from './web-extension.controller';
import { WebExtensionService } from './web-extension.service';

describe( 'WebExtensionController', () => {
  let controller: WebExtensionController;
  let mockService: Record<string, jest.Mock>;

  beforeEach( async () => {
    mockService = {
      getCompanies: jest.fn(),
      getAllCompanies: jest.fn(),
      searchCompanies: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ WebExtensionController ],
      providers: [
        {
          provide: WebExtensionService,
          useValue: mockService
        }
      ]
    }).compile();

    controller = module.get<WebExtensionController>( WebExtensionController );
  });

  afterEach( () => {
    jest.clearAllMocks();
  });

  describe( 'GET /companies', () => {
    it( 'should return paginated companies with default params', async () => {
      const mockResponse = {
        results: [ { id: '1', name: 'Test', cod_cliente: 'T01' } ]
      };
      mockService.getCompanies.mockResolvedValue( mockResponse );

      const result = await controller.getCompanies();

      expect( mockService.getCompanies ).toHaveBeenCalledWith( 100, undefined );
      expect( result ).toEqual( mockResponse );
    });

    it( 'should pass custom limit', async () => {
      mockService.getCompanies.mockResolvedValue({ results: [] });

      await controller.getCompanies( '50' );

      expect( mockService.getCompanies ).toHaveBeenCalledWith( 50, undefined );
    });

    it( 'should pass after cursor', async () => {
      mockService.getCompanies.mockResolvedValue({ results: [] });

      await controller.getCompanies( '25', 'cursor123' );

      expect( mockService.getCompanies ).toHaveBeenCalledWith( 25, 'cursor123' );
    });

    it( 'should handle invalid limit (NaN)', async () => {
      mockService.getCompanies.mockResolvedValue({ results: [] });

      await controller.getCompanies( 'abc' );

      expect( mockService.getCompanies ).toHaveBeenCalledWith( 100, undefined );
    });

    it( 'should handle undefined limit and after', async () => {
      mockService.getCompanies.mockResolvedValue({ results: [] });

      await controller.getCompanies( undefined, undefined );

      expect( mockService.getCompanies ).toHaveBeenCalledWith( 100, undefined );
    });
  });

  describe( 'GET /companies/all', () => {
    it( 'should return all companies with sync timestamp', async () => {
      const mockResponse = {
        companies: [ { id: '1', name: 'A', cod_cliente: 'CA' } ],
        total: 1,
        syncedAt: new Date().toISOString()
      };
      mockService.getAllCompanies.mockResolvedValue( mockResponse );

      const result = await controller.getAllCompanies();

      expect( mockService.getAllCompanies ).toHaveBeenCalledTimes( 1 );
      expect( result ).toEqual( mockResponse );
    });

    it( 'should return empty list when no companies exist', async () => {
      mockService.getAllCompanies.mockResolvedValue({
        companies: [],
        total: 0,
        syncedAt: new Date().toISOString()
      });

      const result = await controller.getAllCompanies();

      expect( result.companies ).toHaveLength( 0 );
      expect( result.total ).toBe( 0 );
    });
  });

  describe( 'GET /companies/search', () => {
    it( 'should search companies by term', async () => {
      const mockResults = {
        results: [ { id: '10', name: 'ACME S.A.', cod_cliente: 'C001' } ]
      };
      mockService.searchCompanies.mockResolvedValue( mockResults );

      const result = await controller.searchCompanies( 'ACME' );

      expect( mockService.searchCompanies ).toHaveBeenCalledWith( 'ACME' );
      expect( result ).toEqual( mockResults );
      expect( result.results[0].cod_cliente ).toBe( 'C001' );
    });

    it( 'should trim whitespace from query', async () => {
      mockService.searchCompanies.mockResolvedValue({ results: [] });

      await controller.searchCompanies( '  ACME  ' );

      expect( mockService.searchCompanies ).toHaveBeenCalledWith( 'ACME' );
    });

    it( 'should throw BadRequestException when q is empty string', async () => {
      await expect( controller.searchCompanies( '' ) ).rejects.toThrow( BadRequestException );
      await expect( controller.searchCompanies( '' ) ).rejects.toThrow( 'Query parameter "q" is required' );
      expect( mockService.searchCompanies ).not.toHaveBeenCalled();
    });

    it( 'should throw BadRequestException when q is only whitespace', async () => {
      await expect( controller.searchCompanies( '   ' ) ).rejects.toThrow( BadRequestException );
      expect( mockService.searchCompanies ).not.toHaveBeenCalled();
    });

    it( 'should throw BadRequestException when q is undefined', async () => {
      await expect( controller.searchCompanies( undefined as any ) ).rejects.toThrow( BadRequestException );
      expect( mockService.searchCompanies ).not.toHaveBeenCalled();
    });

    it( 'should search by cod_cliente', async () => {
      mockService.searchCompanies.mockResolvedValue({
        results: [ { id: '20', name: 'Beta', cod_cliente: 'ME-002' } ]
      });

      const result = await controller.searchCompanies( 'ME-002' );

      expect( mockService.searchCompanies ).toHaveBeenCalledWith( 'ME-002' );
      expect( result.results[0].id ).toBe( '20' );
    });
  });
});

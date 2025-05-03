const request = require('supertest');
const app = require('../../src/app');
const axios = require('axios');
jest.mock('axios');

jest.mock('../../src/utils/swapiClient', () => ({
  get: jest.fn()
    .mockResolvedValueOnce({ data: { results: [{ title: 'A New Hope' }] } })
    .mockResolvedValueOnce({ data: { result: { title: 'A New Hope' } } })
    .mockRejectedValueOnce(new Error('Film not found'))
}));

const swapiClient = require('../../src/utils/swapiClient');

beforeEach(() => {
  swapiClient.get.mockClear();
});

describe('Film Routes Integration Tests', () => {
  describe('GET /films', () => {
    it('should return all films', async () => {
      const response = await request(app).get('/api/films');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String)
          })
        ])
      );
    });
  });

  describe('GET /films/:id', () => {
    it('should return a film by id', async () => {
      const response = await request(app).get('/api/films/123');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          title: expect.any(String)
        })
      );
    });
    
    it('should return 404 if film not found', async () => {
      const response = await request(app).get('/api/films/999');
      
      expect(response.statusCode).toBe(404);
    });
  });
});

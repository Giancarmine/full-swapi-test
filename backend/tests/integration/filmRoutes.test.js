const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/utils/swapiClient', () => ({
  swapiClient: {
    get: jest.fn()
  },
  extractIdFromUrl: jest.fn().mockImplementation(url => url.split('/').filter(Boolean).pop())
}));

const { swapiClient } = require('../../src/utils/swapiClient');

beforeEach(() => {
  swapiClient.get.mockClear();
});

describe('Film Routes Integration Tests', () => {
  describe('GET /films', () => {
    it('should return all films', async () => {
      swapiClient.get.mockResolvedValue({
        data: {
          result: [{
            properties: {
              title: 'A New Hope',
              director: 'George Lucas',
              release_date: '1977-05-25',
              opening_crawl: 'It is a period of civil war...',
              characters: ['https://swapi.tech/api/people/1/'],
              episode_id: 4,
              url: 'https://swapi.tech/api/films/1/'
            }
          }]
        }
      });

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
      swapiClient.get.mockResolvedValue({
        data: {
          result: {
            properties: {
              title: 'A New Hope',
              director: 'George Lucas',
              release_date: '1977-05-25',
              opening_crawl: 'It is a period of civil war...',
              characters: ['https://swapi.tech/api/people/1/'],
              episode_id: 4,
              url: 'https://swapi.tech/api/films/1/'
            }
          }
        }
      });

      const response = await request(app).get('/api/films/123');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          title: expect.any(String)
        })
      );
    });
    
    it('should return 404 if film not found', async () => {
      const error = new Error('Film not found');
      error.response = { status: 404 };
      swapiClient.get.mockRejectedValue(error);

      const response = await request(app).get('/api/films/999');
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({
        error: "Film not found"
      });
    });
  });
});

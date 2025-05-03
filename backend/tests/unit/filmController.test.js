jest.mock('../../src/utils/swapiClient', () => ({
  get: jest.fn().mockResolvedValue({ 
    data: { 
      results: [{ title: 'A New Hope' }],
      result: { title: 'A New Hope' }
    }
  })
}));

const swapiClient = require('../../src/utils/swapiClient');

const { getAllFilms, getFilmById } = require('../../src/controllers/filmController');
const axios = require('axios');

jest.mock('axios');

describe('Film Controller Unit Tests', () => {
  beforeEach(() => {
    swapiClient.get.mockClear();
  });

  describe('getAllFilms', () => {
    it('should return all films', async () => {
      const mockFilms = {
        data: {
          result: [
            { properties: { title: 'A New Hope', episode_id: 4 } }
          ]
        }
      };
      axios.get.mockResolvedValue(mockFilms);
      
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      await getAllFilms(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String)
          })
        ])
      );
    });
  });

  describe('getFilmById', () => {
    it('should return a film by id', async () => {
      const mockFilm = {
        data: {
          result: {
            properties: { title: 'A New Hope', episode_id: 4 }
          }
        }
      };
      axios.get.mockResolvedValue(mockFilm);
      
      const req = { params: { id: '123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      await getFilmById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String)
        })
      );
    });
    
    it('should return 404 if film not found', async () => {
      axios.get.mockRejectedValue({ response: { status: 404 } });
      
      const req = { params: { id: '999' } };
      const res = {
        sendStatus: jest.fn()
      };
      
      await getFilmById(req, res);
      
      expect(res.sendStatus).toHaveBeenCalledWith(404);
    });
  });
});

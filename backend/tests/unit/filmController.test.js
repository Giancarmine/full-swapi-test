jest.mock('../../src/utils/swapiClient', () => ({
  get: jest.fn().mockResolvedValue({ 
    data: { 
      results: [{ title: 'A New Hope' }],
      result: { title: 'A New Hope' }
    }
  })
}));

jest.mock('axios');
jest.mock('../../src/services/filmService');

const swapiClient = require('../../src/utils/swapiClient');
const filmService = require('../../src/services/filmService');

const { getAllFilms, getFilmById } = require('../../src/controllers/filmController');

describe('Film Controller Unit Tests', () => {
  beforeEach(() => {
    filmService.getFilms.mockClear();
    filmService.getFilmById.mockClear();
  });

  describe('getAllFilms', () => {
    it('should return all films', async () => {
      const mockFilms = [{ title: 'A New Hope', episode_id: 4 }];
      filmService.getFilms.mockResolvedValue(mockFilms);
      
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await getAllFilms(req, res, next);
      
      expect(filmService.getFilms).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFilms);
    });
  });

  describe('getFilmById', () => {
    it('should return a film by id', async () => {
      const mockFilm = { title: 'A New Hope', episode_id: 4 };
      filmService.getFilmById.mockResolvedValue(mockFilm);
      
      const req = { params: { id: '123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await getFilmById(req, res, next);
      
      expect(filmService.getFilmById).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFilm);
    });
    
    it('should return 404 if film not found', async () => {
      const error = new Error('Film not found');
      error.status = 404;
      filmService.getFilmById.mockRejectedValue(error);
      
      const req = { params: { id: '999' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await getFilmById(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Film not found' });
    });
  });
});

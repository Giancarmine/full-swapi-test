const request = require('supertest');
const app = require('../../src/app');
const favoriteService = require('../../src/services/favoriteService');

jest.mock('../../src/services/favoriteService', () => ({
  getFavoriteFilms: jest.fn().mockReturnValue([]),
  getFavoriteCharacters: jest.fn().mockReturnValue([]),
  addFilm: jest.fn(),
  addCharacter: jest.fn(),
  removeFilm: jest.fn(),
  removeCharacter: jest.fn()
}));

describe('Favorite Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /favorites', () => {
    it('should return favorites', async () => {
      const mockFilms = [{ id: '1', title: 'A New Hope' }];
      const mockCharacters = [{ id: '1', name: 'Luke Skywalker' }];
      
      favoriteService.getFavoriteFilms.mockReturnValue(mockFilms);
      favoriteService.getFavoriteCharacters.mockReturnValue(mockCharacters);
      
      const response = await request(app).get('/api/favorites');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        films: mockFilms,
        characters: mockCharacters
      });
    });
  });

  describe('POST /favorites/films/:id', () => {
    it('should add a film favorite', async () => {
      favoriteService.addFilm.mockReturnValue(true);
      
      const response = await request(app)
        .post('/api/favorites/films/1')
        .send();
      
      expect(response.statusCode).toBe(201);
    });
  });

  describe('POST /favorites/characters/:id', () => {
    it('should add a character favorite', async () => {
      favoriteService.addCharacter.mockReturnValue(true);
      
      const response = await request(app)
        .post('/api/favorites/characters/1')
        .send();
      
      expect(response.statusCode).toBe(201);
    });
  });

  describe('DELETE /favorites/films/:id', () => {
    it('should remove a film favorite', async () => {
      favoriteService.removeFilm.mockReturnValue(true);
      
      const response = await request(app).delete('/api/favorites/films/1');
      
      expect(response.statusCode).toBe(204);
    });

    it('should return 404 if film favorite not found', async () => {
      favoriteService.removeFilm.mockReturnValue(false);
      
      const response = await request(app).delete('/api/favorites/films/999');
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: 'Film not found' });
    });
  });

  describe('DELETE /favorites/characters/:id', () => {
    it('should remove a character favorite', async () => {
      favoriteService.removeCharacter.mockReturnValue(true);
      
      const response = await request(app).delete('/api/favorites/characters/1');
      
      expect(response.statusCode).toBe(204);
    });

    it('should return 404 if character favorite not found', async () => {
      favoriteService.removeCharacter.mockReturnValue(false);
      
      const response = await request(app).delete('/api/favorites/characters/999');
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: 'Character not found' });
    });
  });
});

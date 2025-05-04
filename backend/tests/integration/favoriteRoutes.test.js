const request = require('supertest');
const app = require('../../src/app');
const favoriteService = require('../../src/services/favoriteService');

jest.mock('../../src/services/favoriteService', () => ({
  addFavoriteFilm: jest.fn(),
  addFavoriteCharacter: jest.fn(),
  removeFavoriteFilm: jest.fn(),
  removeFavoriteCharacter: jest.fn(),
  getFavoriteFilms: jest.fn().mockResolvedValue({}),
  getFavoriteCharacters: jest.fn().mockResolvedValue({}),
}));

describe('Favorite Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /favorites', () => {
    it('should return favorites', async () => {
      favoriteService.getFavoriteFilms.mockResolvedValue({});
      favoriteService.getFavoriteCharacters.mockResolvedValue({});
      
      const response = await request(app).get('/api/favorites');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        films: {},
        characters: {}
      });
    });
  });

  describe('POST /favorites/films/:id', () => {
    it('should add a film favorite', async () => {
      favoriteService.addFavoriteFilm.mockResolvedValue(true);
      
      const response = await request(app).post('/api/favorites/films/1');
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ success: true });
    });
  });

  describe('POST /favorites/characters/:id', () => {
    it('should add a character favorite', async () => {
      favoriteService.addFavoriteCharacter.mockResolvedValue(true);
      
      const response = await request(app).post('/api/favorites/characters/1');
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ success: true });
    });
  });

  describe('DELETE /favorites/films/:id', () => {
    it('should remove a film favorite', async () => {
      favoriteService.removeFavoriteFilm.mockResolvedValue();
      
      const response = await request(app).delete('/api/favorites/films/1');
      
      expect(response.statusCode).toBe(204);
    });

    it('should return 204 even if film favorite not found', async () => {
      favoriteService.removeFavoriteFilm.mockResolvedValue();
      
      const response = await request(app).delete('/api/favorites/films/999');
      
      expect(response.statusCode).toBe(204);
    });
  });

  describe('DELETE /favorites/characters/:id', () => {
    it('should remove a character favorite', async () => {
      favoriteService.removeFavoriteCharacter.mockResolvedValue();
      
      const response = await request(app).delete('/api/favorites/characters/1');
      
      expect(response.statusCode).toBe(204);
    });

    it('should return 204 even if character favorite not found', async () => {
      favoriteService.removeFavoriteCharacter.mockResolvedValue();
      
      const response = await request(app).delete('/api/favorites/characters/999');
      
      expect(response.statusCode).toBe(204);
    });
  });
});

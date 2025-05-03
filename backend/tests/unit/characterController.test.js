const { getAllCharacters, getCharacterById } = require('../../src/controllers/characterController');

jest.mock('../../src/services/characterService', () => ({
  getCharacters: jest.fn(() => Promise.resolve([])),
  getCharacterById: jest.fn(() => Promise.resolve({}))
}));

const characterService = require('../../src/services/characterService');

describe('Character Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCharacters', () => {
    it('should return all characters with status 200', async () => {
      const mockCharacters = [
        { id: 1, name: 'Luke Skywalker' },
        { id: 2, name: 'Darth Vader' }
      ];
      characterService.getCharacters.mockResolvedValue(mockCharacters);
      
      const req = {};
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();
      
      await getAllCharacters(req, res, next);
      
      expect(characterService.getCharacters).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCharacters);
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Service error');
      characterService.getCharacters.mockRejectedValue(error);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await getAllCharacters(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCharacterById', () => {
    it('should return a character with status 200', async () => {
      const mockCharacter = { id: 1, name: 'Luke Skywalker' };
      characterService.getCharacterById.mockResolvedValue(mockCharacter);
      
      const req = { params: { id: '1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await getCharacterById(req, res, next);
      
      expect(characterService.getCharacterById).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCharacter);
    });

    it('should return 404 if character not found', async () => {
      const error = new Error('Character not found');
      error.status = 404;
      characterService.getCharacterById.mockRejectedValue(error);
      
      const req = { params: { id: '999' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await getCharacterById(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Character not found' });
    });

    it('should handle rate limit errors with status 429', async () => {
      const error = new Error('API rate limit exceeded');
      error.status = 429;
      characterService.getCharacterById.mockRejectedValue(error);
      
      const req = { params: { id: '1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await getCharacterById(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({ error: 'API rate limit exceeded' });
    });
  });
});

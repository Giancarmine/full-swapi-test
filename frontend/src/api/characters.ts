import { API_BASE_URL } from '../config';
import apiClient from './apiClient';

export interface Character {
  id: number;
  name: string;
  height: string;
  mass: string;
  hair_color: string;
  skin_color: string;
  eye_color: string;
  birth_year: string;
  gender: string;
  homeworld: string;
  films: string[];
  species: string[];
  vehicles: string[];
  starships: string[];
  created: string;
  edited: string;
  url: string;
  image?: string;
}

export const fetchCharacters = async (): Promise<Character[]> => {
  const characters = await apiClient.get<Character[]>('/api/characters');
  return characters.map(character => ({
    ...character,
    image: getCharacterImage(character.id)
  }));
};

export const fetchCharacterById = async (id: number): Promise<Character> => {
  const character = await apiClient.get<Character>(`/api/characters/${id}`);
  return {
    ...character,
    image: getCharacterImage(id)
  };
};

const getCharacterImage = (id: number): string => {
  return `https://starwars-visualguide.com/assets/img/characters/${id}.jpg`;
};
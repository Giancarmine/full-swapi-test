import React, { useState } from 'react';
import styled from 'styled-components';
import { Character } from '../api/characters';
import CharacterModal from './CharacterModal';

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.darkGray};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  padding: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  &:hover {
    transform: scale(1.03);
    box-shadow: 0 0 15px ${({ theme }) => theme.colors.primary};
  }
`;

const CharacterImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.primary};
`;

const CharacterName = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 0.5rem 0;
  text-align: center;
`;

const CharacterDetails = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
  p {
    margin: 0.3rem 0;
  }
`;

interface CharacterCardProps {
  character: Character;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card onClick={() => setIsModalOpen(true)}>
        {character.image && (
          <CharacterImage 
            src={character.image} 
            alt={character.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://starwars-visualguide.com/assets/img/placeholder.jpg';
            }}
          />
        )}
        <CharacterName>{character.name}</CharacterName>
        <CharacterDetails>
          <p>Gender: {character.gender}</p>
          <p>Birth Year: {character.birth_year}</p>
          <p>Height: {character.height}</p>
        </CharacterDetails>
      </Card>
      {isModalOpen && (
        <CharacterModal
          character={character}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default CharacterCard;
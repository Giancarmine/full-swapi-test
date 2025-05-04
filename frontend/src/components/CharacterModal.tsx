import React from 'react';
import styled from 'styled-components';
import { Character } from '../api/characters';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.darkGray};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  padding: 2rem;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.5rem;
  cursor: pointer;
`;

const CharacterImage = styled.img`
  width: 100%;
  max-width: 300px;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const CharacterDetail = styled.div`
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
`;

const DetailLabel = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: bold;
  margin-right: 0.5rem;
  min-width: 120px;
`;

const DetailValue = styled.span`
  color: ${({ theme }) => theme.colors.text};
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.primary};
  padding-bottom: 0.5rem;
  margin-top: 1.5rem;
`;

const ListItem = styled.li`
  margin-bottom: 0.5rem;
`;

interface CharacterModalProps {
  character: Character;
  onClose: () => void;
}

const CharacterModal: React.FC<CharacterModalProps> = ({ character, onClose }) => {
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        <h2>{character.name}</h2>
        
        {character.image && (
          <CharacterImage 
            src={character.image} 
            alt={character.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://starwars-visualguide.com/assets/img/placeholder.jpg';
            }}
          />
        )}

        <CharacterDetail>
          <DetailLabel>Height:</DetailLabel>
          <DetailValue>{character.height}</DetailValue>
        </CharacterDetail>
        <CharacterDetail>
          <DetailLabel>Mass:</DetailLabel>
          <DetailValue>{character.mass}</DetailValue>
        </CharacterDetail>
        <CharacterDetail>
          <DetailLabel>Hair Color:</DetailLabel>
          <DetailValue>{character.hair_color}</DetailValue>
        </CharacterDetail>
        <CharacterDetail>
          <DetailLabel>Skin Color:</DetailLabel>
          <DetailValue>{character.skin_color}</DetailValue>
        </CharacterDetail>
        <CharacterDetail>
          <DetailLabel>Eye Color:</DetailLabel>
          <DetailValue>{character.eye_color}</DetailValue>
        </CharacterDetail>
        <CharacterDetail>
          <DetailLabel>Birth Year:</DetailLabel>
          <DetailValue>{character.birth_year}</DetailValue>
        </CharacterDetail>
        <CharacterDetail>
          <DetailLabel>Gender:</DetailLabel>
          <DetailValue>{character.gender}</DetailValue>
        </CharacterDetail>
        <CharacterDetail>
          <DetailLabel>Homeworld:</DetailLabel>
          <DetailValue>{character.homeworld}</DetailValue>
        </CharacterDetail>

        <SectionTitle>Films</SectionTitle>
        <ul>
          {character.films?.map((film, index) => (
            <ListItem key={index}>{film}</ListItem>
          ))}
        </ul>

        <SectionTitle>Starships</SectionTitle>
        <ul>
          {character.starships?.map((starship, index) => (
            <ListItem key={index}>{starship}</ListItem>
          ))}
        </ul>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CharacterModal;
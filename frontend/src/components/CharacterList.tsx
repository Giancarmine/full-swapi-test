import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import CharacterCard from './CharacterCard';
import { Character, fetchCharacters } from '../api/characters';

// Define theme interface for TypeScript
interface Theme {
  colors: {
    primary: string;
    darkGray: string;
    text: string;
  };
}

const ListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
`;

const StatusContainer = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: ${({ theme }: { theme: Theme }) => theme.colors.primary};
`;

const LoadingAnimation = styled.div`
  @keyframes crawl {
    0% { transform: translateY(0); }
    100% { transform: translateY(-100%); }
  }
  
  height: 100px;
  overflow: hidden;
  position: relative;
  margin: 2rem 0;
  
  &::after {
    content: "A long time ago in a galaxy far, far away...";
    position: absolute;
    width: 100%;
    text-align: center;
    top: 100%;
    animation: crawl 3s linear infinite;
  }
`;

const ControlsContainer = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 2rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  border: 1px solid ${({ theme }: { theme: Theme }) => theme.colors.primary};
  background-color: ${({ theme }: { theme: Theme }) => theme.colors.darkGray};
  color: ${({ theme }: { theme: Theme }) => theme.colors.text};
  min-width: 300px;
`;

const SortSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid ${({ theme }: { theme: Theme }) => theme.colors.primary};
  background-color: ${({ theme }: { theme: Theme }) => theme.colors.darkGray};
  color: ${({ theme }: { theme: Theme }) => theme.colors.text};
`;

const SortOption = styled.option`
  background-color: ${({ theme }: { theme: Theme }) => theme.colors.darkGray};
`;

const SortButton = styled.button`
  padding: 0.5rem;
  margin-left: 0.5rem;
  background-color: ${({ theme }: { theme: Theme }) => theme.colors.primary};
  color: ${({ theme }: { theme: Theme }) => theme.colors.darkGray};
  border: none;
  cursor: pointer;
  font-weight: bold;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

type SortField = 'name' | 'height' | 'mass' | 'birth_year';

const CharacterList = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const data = await fetchCharacters();
        setCharacters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load characters');
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, []);

  const filteredCharacters = useMemo(() => {
    return characters.filter((character: Character) =>
      character.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [characters, searchTerm]);

  const sortedCharacters = useMemo(() => {
    return [...filteredCharacters].sort((a: Character, b: Character) => {
      // Handle numeric fields differently
      if (sortField === 'height' || sortField === 'mass') {
        const numA = parseFloat(a[sortField]) || 0;
        const numB = parseFloat(b[sortField]) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      
      // Handle string fields
      const valueA = a[sortField].toString().toLowerCase();
      const valueB = b[sortField].toString().toLowerCase();
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCharacters, sortField, sortDirection]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortField(e.target.value as SortField);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (loading) {
    return (
      <StatusContainer>
        <LoadingAnimation />
        <p>Loading characters from a galaxy far, far away...</p>
      </StatusContainer>
    );
  }

  if (error) {
    return (
      <StatusContainer>
        <p>Error: {error}</p>
      </StatusContainer>
    );
  }

  return (
    <>
      <ControlsContainer>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search characters..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
        <div>
          <SortSelect value={sortField} onChange={handleSortChange}>
            <SortOption value="name">Name</SortOption>
            <SortOption value="height">Height</SortOption>
            <SortOption value="mass">Mass</SortOption>
            <SortOption value="birth_year">Birth Year</SortOption>
          </SortSelect>
          <SortButton onClick={toggleSortDirection}>
            {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
          </SortButton>
        </div>
      </ControlsContainer>
      
      <ListContainer>
        {sortedCharacters.length > 0 ? (
          sortedCharacters.map((character: Character) => (
            <CharacterCard key={character.id} character={character} />
          ))
        ) : (
          <StatusContainer>
            <p>No characters found matching your search.</p>
          </StatusContainer>
        )}
      </ListContainer>
    </>
  );
};

export default CharacterList;
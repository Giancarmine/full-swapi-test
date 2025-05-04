import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterList from './CharacterList';
import { ThemeProvider } from 'styled-components';
import { theme } from '../theme';

describe('CharacterList Component', () => {
  it('renders loading state initially', () => {
    render(
      <ThemeProvider theme={theme}>
        <CharacterList />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Loading characters...')).toBeInTheDocument();
  });
});
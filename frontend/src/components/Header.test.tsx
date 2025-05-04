import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './Header';
import { ThemeProvider } from 'styled-components';
import { theme } from '../theme';

describe('Header Component', () => {
  it('renders the Star Wars title', () => {
    render(
      <ThemeProvider theme={theme}>
        <Header />
      </ThemeProvider>
    );
    
    expect(screen.getByText('STAR WARS API')).toBeInTheDocument();
    expect(screen.getByText('A long time ago in a galaxy far, far away...')).toBeInTheDocument();
  });
});
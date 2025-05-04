import React from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './GlobalStyles';
import { theme } from './theme';
import Header from './components/Header';
import CharacterList from './components/CharacterList';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Header />
      <main>
        <CharacterList />
      </main>
    </ThemeProvider>
  );
}

export default App;
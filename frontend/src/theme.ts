import { DefaultTheme } from 'styled-components';

export const theme: DefaultTheme = {
  colors: {
    primary: '#FFE81F', // Star Wars yellow
    secondary: '#000000',
    background: '#000000',
    text: '#FFFFFF',
    accent: '#2B6CB0',
    darkGray: '#1A1A1A',
  },
  fonts: {
    main: '"Pathway Gothic One", sans-serif',
    secondary: '"Arial Narrow", sans-serif',
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1200px',
  },
};

// Extend the DefaultTheme interface
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      accent: string;
      darkGray: string;
    };
    fonts: {
      main: string;
      secondary: string;
    };
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
  }
}
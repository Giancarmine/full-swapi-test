import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: ${({ theme }) => theme.colors.darkGray};
  padding: 1rem;
  text-align: center;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 2.5rem;
  margin: 0;
  letter-spacing: 0.5rem;
`;

const CrawlText = styled.p`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.8rem;
  margin: 0.5rem 0 0 0;
`;

export const Header = () => {
  return (
    <HeaderContainer>
      <Title>STAR WARS API</Title>
      <CrawlText>A long time ago in a galaxy far, far away...</CrawlText>
    </HeaderContainer>
  );
};

export default Header;
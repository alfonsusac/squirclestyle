import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  :root {
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color-scheme: light dark;
    color: rgba(255, 255, 255, 0.87);
    background-color: #0f172a;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
  }

  #root {
    min-height: 100vh;
  }
`;

const Shell = styled.main`
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: radial-gradient(circle at top, #38bdf8, #0f172a 55%);
`;

const Card = styled.section`
  width: min(480px, 100%);
  padding: 2.5rem;
  border-radius: 2rem;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.45);
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
`;

const Accent = styled.span`
  display: inline-block;
  margin-top: 0.75rem;
  padding: 0.35rem 0.85rem;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.2);
  color: #7dd3fc;
`;

export default function App() {
  return (
    <>
      <GlobalStyle />
      <Shell>
        <Card>
          <Accent>styled with flair</Accent>
          <Title>Welcome to Squirclestyle</Title>
        </Card>
      </Shell>
    </>
  );
}


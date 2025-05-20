import { render, screen } from '@testing-library/react';
import App from './App';

test('renders main heading', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    text: () => Promise.resolve('[]'),
  });

  render(<App />);

  const heading = await screen.findByText(/Vitalis 2025 Seminarschema/i);
  expect(heading).toBeInTheDocument();

  global.fetch.mockRestore();
});

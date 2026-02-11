import { render, screen } from '@testing-library/react';
import { AuthProvider } from './AuthContext';

test('renders auth context children', () => {
  render(
    <AuthProvider>
      <div>test-child</div>
    </AuthProvider>
  );
  expect(screen.getByText('test-child')).toBeInTheDocument();
});

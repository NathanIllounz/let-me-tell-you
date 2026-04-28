import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SocialCenter from '../components/SocialCenter';
import api from '../api';
import { vi } from 'vitest';

// Mock the API client
vi.mock('../api', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('SocialCenter', () => {
  const mockSession = { access_token: 'fake-token' };
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', async () => {
    // Make API promises that never resolve to simulate loading
    api.get.mockImplementation(() => new Promise(() => {}));
    
    render(<SocialCenter session={mockSession} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Loading social graph.../i)).toBeInTheDocument();
  });

  it('fetches and displays social data', async () => {
    // Mock the API responses
    api.get.mockImplementation((url) => {
      if (url === '/friends/me') {
        return Promise.resolve({ data: { username: 'testuser', tag: '1234' } });
      }
      if (url === '/friends/all') {
        return Promise.resolve({ data: [{ id: 'friend1', username: 'alice', tag: '5678' }] });
      }
      if (url === '/friends/pending') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: null });
    });

    render(<SocialCenter session={mockSession} onClose={mockOnClose} />);

    // Wait for the UI to update after loading
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('#1234')).toBeInTheDocument();
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
  });

  it('calls onClose when the close button is clicked', async () => {
    api.get.mockResolvedValue({ data: [] });
    
    render(<SocialCenter session={mockSession} onClose={mockOnClose} />);
    
    // Wait for loading to finish so we don't leak state updates
    await waitFor(() => {
        expect(screen.queryByText(/Loading social graph.../i)).not.toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons[0]; // Assuming the first button is the X button in the header
    
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

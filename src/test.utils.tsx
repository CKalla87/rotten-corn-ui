import { store } from '@redux/store';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createBrowserHistory } from 'history';
import { BrowserRouter as Router } from 'react-router-dom';
import type { ReactElement } from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components
const Providers = ({ children }: ProvidersProps) => {
  return (
    <Provider store={store}>
      <Router>{children}</Router>
    </Provider>
  );
};

const customRender = (ui: ReactElement, options = {}) => render(ui, { wrapper: Providers, ...options });

const renderWithRouter = (ui: ReactElement) => {
  const history = createBrowserHistory();
  return {
    history,
    ...render(ui, { wrapper: Providers })
  };
};

// Re-export testing library utilities
export {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  fireEvent,
  act,
  cleanup,
  renderHook
} from '@testing-library/react';
export { customRender as render };
export { renderWithRouter };


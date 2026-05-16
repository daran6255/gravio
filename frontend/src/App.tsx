import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { store } from './store/store';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import AuthInitializer from './components/auth/AuthInitializer';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Router>
              <AuthProvider>
                <AuthInitializer>
                  <AppRouter />
                </AuthInitializer>
              </AuthProvider>
            </Router>
          </LocalizationProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

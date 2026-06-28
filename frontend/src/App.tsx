import CssBaseline from '@mui/material/CssBaseline';
import { ColorModeProvider } from './theme/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { CustomSuccessToast, CustomErrorToast, CustomWarningToast, CustomInfoToast } from './components/common/toast/CustomToast';
import { store } from './store/store';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import AuthInitializer from './components/auth/AuthInitializer';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function App() {
  return (
    <Provider store={store}>
      <ColorModeProvider>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          Components={{
            success: CustomSuccessToast,
            error: CustomErrorToast,
            warning: CustomWarningToast,
            info: CustomInfoToast,
            default: CustomInfoToast,
          }}
        >
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
      </ColorModeProvider>
    </Provider>
  );
}

export default App;

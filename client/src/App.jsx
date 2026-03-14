import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';
import './styles/index.css';

function App() {
  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
          },
        }}
      />
    </>
  );
}

export default App;

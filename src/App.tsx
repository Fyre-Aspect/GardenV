import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

function App() {
  const [signedIn, setSignedIn] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            signedIn ? (
              <Navigate to="/garden" replace />
            ) : (
              <Landing onStart={() => setSignedIn(true)} />
            )
          }
        />
        <Route
          path="/garden"
          element={
            signedIn ? (
              <Dashboard onSignOut={() => setSignedIn(false)} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

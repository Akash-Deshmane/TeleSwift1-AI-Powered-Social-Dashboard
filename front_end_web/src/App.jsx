import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Otp from './pages/Otp';
import Profile from './pages/Profile';
import Feed from './pages/Feed';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';

import Register from './pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/otp" element={<Otp />} />
        
        {/* Protected Routes with Sidebar */}
        <Route element={<Layout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/history" element={<History />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

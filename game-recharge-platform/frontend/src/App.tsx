import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { ToastHost } from './components/ToastHost';
import { Home } from './pages/Home';
import { GameDetail } from './pages/GameDetail';
import { Login } from './pages/Login';
import { Orders } from './pages/Orders';
import { Admin } from './pages/Admin';
import { Merchant } from './pages/Merchant';
import { MerchantApply } from './pages/MerchantApply';
import './i18n/config';

function App() {
  return (
    <Router>
      <div className="bg-gray-50 min-h-screen font-sans">
        <Header />
        <ToastHost />

        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/game/:id" element={<GameDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/merchant" element={<Merchant />} />
            <Route path="/merchant/apply" element={<MerchantApply />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;


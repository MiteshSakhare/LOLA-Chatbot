import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ChatContainer from './components/Chat/ChatContainer';
import Dashboard from './components/Admin/Dashboard';
import ResponseDetail from './components/Admin/ResponseDetail';

function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<ChatContainer />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/response/:sessionId" element={<ResponseDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportIssue from './pages/ReportIssue';
import Dashboard from './pages/Dashboard';
import IssueDetails from './pages/IssueDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report-issue" 
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <ReportIssue />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/issues/:id" 
            element={
              <ProtectedRoute>
                <IssueDetails />
              </ProtectedRoute>
            } 
          />
          {/* Catch-all route to redirect back to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


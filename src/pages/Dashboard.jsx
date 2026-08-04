import React from 'react';
import { useAuth } from '../context/AuthContext';
import CitizenDashboard from './CitizenDashboard';
import OfficerDashboard from './OfficerDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Render dashboard layout corresponding to user role privileges
  if (user.role === 'admin') {
    return <AdminDashboard />;
  }
  if (user.role === 'officer') {
    return <OfficerDashboard />;
  }
  return <CitizenDashboard />;
};

export default Dashboard;

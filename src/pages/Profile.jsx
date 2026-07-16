import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Building2, Mail, Shield, User as UserIcon } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="card max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
            <UserIcon size={28} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.name}</h2>
            <span className={`badge ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {user?.role === 'admin' ? 'Admin' : 'User'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-600">
            <Mail size={18} className="text-gray-400" />
            <span>{user?.email}</span>
          </div>
          {user?.business_name && (
            <div className="flex items-center gap-3 text-gray-600">
              <Building2 size={18} className="text-gray-400" />
              <span>{user.business_name}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-gray-600">
            <Shield size={18} className="text-gray-400" />
            <span className="capitalize">Status: {user?.status || 'active'}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-danger w-full mt-6">
          <LogOut size={18} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}

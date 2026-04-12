import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate authentication
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full card p-8 border-t-4 border-t-navy shadow-lg">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-navy text-white rounded-xl flex items-center justify-center mb-4 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">NBKRIST</h1>
          <p className="text-slate-500 mt-1">Transport Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="form-label">Username</label>
            <input 
              type="text" 
              required
              className="form-input" 
              placeholder="Enter institutional ID..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              required
              className="form-input" 
              placeholder="***..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full py-3 text-base shadow-sm">
            Sign In to Dashboard
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-400">
          Authorized personnel only. Contact  R&D Cell for credentials.
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import * as api from '../api';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6位');
      return;
    }

    setLoading(true);
    try {
      const data =
        mode === 'login'
          ? await api.login(username.trim(), password)
          : await api.register(username.trim(), password);

      api.setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen-safe bg-[#FBF7F0] flex items-center justify-center px-4 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <span className="text-4xl select-none block mb-3">📚</span>
          <h1
            className="text-2xl font-serif font-semibold text-[#1A1A1A] tracking-wide"
            style={{ fontFamily: "'LXGW WenKai', 'Playfair Display', Georgia, serif" }}
          >
            阅读花园
          </h1>
          <p className="text-sm text-[#9B9B9B] mt-1 font-light">
            {mode === 'login' ? '欢迎回来' : '创建你的阅读空间'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-card p-6 border border-[#E8E2D5]">
          {/* Mode tabs */}
          <div className="flex mb-6 bg-[#FBF7F0] rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm rounded-md transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-[#234A3D] shadow-sm font-medium'
                  : 'text-[#9B9B9B] hover:text-[#666]'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-sm rounded-md transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white text-[#234A3D] shadow-sm font-medium'
                  : 'text-[#9B9B9B] hover:text-[#666]'
              }`}
            >
              注册
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#666] mb-1.5 font-medium" htmlFor="username">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                autoComplete="username"
                className="w-full px-3 py-2.5 bg-[#FBF7F0] border border-[#E8E2D5] rounded-lg
                           text-[#1A1A1A] placeholder-[#C5C5C5] text-sm
                           focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30
                           transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#666] mb-1.5 font-medium" htmlFor="password">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '至少6位密码' : '输入密码'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className="w-full px-3 py-2.5 bg-[#FBF7F0] border border-[#E8E2D5] rounded-lg
                           text-[#1A1A1A] placeholder-[#C5C5C5] text-sm
                           focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30
                           transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-red-400 text-xs text-center bg-red-50 rounded-lg py-2 px-3">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#234A3D] text-white rounded-lg text-sm font-medium
                         hover:bg-[#1A3A2F] active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-sm"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-pulse">···</span>
                  {mode === 'login' ? '登录中...' : '注册中...'}
                </span>
              ) : mode === 'login' ? (
                '登录'
              ) : (
                '注册'
              )}
            </button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-[#C5C5C5] mt-6 font-light">
          你的书架，你的知识花园
        </p>
      </div>
    </div>
  );
}

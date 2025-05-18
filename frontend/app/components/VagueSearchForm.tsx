// components/VagueSearchForm.tsx
'use client';

import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface VagueSearchFormProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function VagueSearchForm({ onSearch, isLoading }: VagueSearchFormProps) {
  const [input, setInput] = useState('');
  const { theme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(input);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-4 rounded theme-transition"
      style={{ 
        background: 'var(--card-bg)',
        boxShadow: '0 2px 8px var(--shadow)'
      }}
    >
      <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        Find Similar Movies
      </h2>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--primary)' }}>
        Describe a movie you want to watch:
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-md theme-transition"
          style={{ 
            background: 'var(--input-bg)',
            borderColor: 'var(--input-border)',
            color: 'var(--text-primary)'
          }}
          placeholder="e.g., a space movie with emotional moments"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 rounded theme-transition"
          style={{ 
            background: 'var(--primary)',
            color: 'var(--button-text)'
          }}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}

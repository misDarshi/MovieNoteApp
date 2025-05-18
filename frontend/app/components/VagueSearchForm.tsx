// components/VagueSearchForm.tsx
'use client';

import { useState } from 'react';

interface VagueSearchFormProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function VagueSearchForm({ onSearch, isLoading }: VagueSearchFormProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(input);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-md">
      <label className="block text-sm font-medium mb-2 text-[#3b5742]">
        Describe a movie you want to watch:
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
          placeholder="e.g., a space movie with emotional moments"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#3b5742] text-white px-4 py-2 rounded hover:bg-[#2e4635]"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}

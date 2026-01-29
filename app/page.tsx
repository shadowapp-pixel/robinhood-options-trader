'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/trades?symbol=${symbol}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Robinhood Options Trader
          </h1>
          <p className="text-xl text-slate-300">
            Wall Street-grade trade suggestions for Robinhood option contracts
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Find Trade Suggestions</CardTitle>
            <CardDescription>Enter a stock symbol to get trade recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <Input
                placeholder="Enter stock symbol (e.g., AAPL, TSLA, SPY)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        {suggestions.length > 0 && (
          <div className="grid gap-6">
            <h2 className="text-2xl font-bold text-white">Trade Suggestions</h2>
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">{suggestion.title}</CardTitle>
                  <CardDescription>{suggestion.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-white">
                    <div>
                      <p className="text-sm text-slate-400">Entry Price</p>
                      <p className="text-lg font-semibold">${suggestion.entryPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Exit Price</p>
                      <p className="text-lg font-semibold">${suggestion.exitPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Timeframe</p>
                      <p className="text-lg font-semibold">{suggestion.timeframe}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Confidence</p>
                      <p className="text-lg font-semibold">{suggestion.confidence}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && suggestions.length === 0 && symbol && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-300 text-center">
                No suggestions found. Try another symbol.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

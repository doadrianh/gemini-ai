import { useState, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea'; // Use Textarea instead of Input
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialValue?: string;
  autoFocus?: boolean;
  large?: boolean;
}

export function SearchInput({
  onSearch,
  isLoading = false,
  initialValue = '',
  autoFocus = false,
  large = false,
}: SearchInputProps) {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = () => {
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line and trigger search
      handleSubmit();
    }
  };

  return (
    <div className="relative flex w-full items-center gap-2">
      <div className="relative flex-1">
        <Search
          className={cn(
            "absolute left-3 top-4 -translate-y-1/2 text-muted-foreground",
            large ? "h-5 w-5" : "h-4 w-4"
          )}
        />

        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Anything"
          className={cn(
            "pl-10 pr-4 py-2 transition-all duration-200 resize-none",
            large && "h-12 text-lg rounded-lg",
            "focus-visible:ring-2 focus-visible:ring-primary"
          )}
          disabled={isLoading}
          autoFocus={autoFocus}
          rows={3} // Start small and expand
          style={{ minHeight: '40px', maxHeight: '120px', overflowY: 'auto' }}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!query.trim() || isLoading}
        className={cn(
          "min-w-[80px] shadow-sm",
          large && "h-12 px-6 text-lg rounded-lg"
        )}
      >
        {isLoading ? (
          <Loader2 className={cn("animate-spin", large ? "h-5 w-5" : "h-4 w-4")} />
        ) : (
          'Search'
        )}
      </Button>
    </div>
  );
}

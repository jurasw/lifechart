import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Popover } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, CalendarIcon } from "lucide-react";
import { searchSymbols } from "@/services/symbolSearch";
import { fetchPrice } from "@/services/priceApi";
import { format } from "date-fns";
import type { Investment, AssetType, Currency } from "@/types/investment";
import type { SymbolSuggestion } from "@/services/symbolSearch";

interface AddInvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (investment: Omit<Investment, "id">) => void;
  editingInvestment: Investment | null;
}

export const AddInvestmentDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editingInvestment,
}: AddInvestmentDialogProps) => {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("stock");
  const [volume, setVolume] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseCurrency, setPurchaseCurrency] = useState<Currency>("USD");
  const [suggestions, setSuggestions] = useState<SymbolSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  const handleSymbolSearch = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    const results = await searchSymbols(query, type);
    setSuggestions(results);
    setShowSuggestions(true);
    setIsSearching(false);
  }, [type]);

  const handleSymbolChange = (value: string) => {
    setSymbol(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length >= 1) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSymbolSearch(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: SymbolSuggestion) => {
    setSymbol(suggestion.symbol);
    setName(suggestion.name);
    setType(suggestion.type);
    setShowSuggestions(false);
    setSuggestions([]);

    setIsFetchingPrice(true);
    try {
      const priceData = await fetchPrice(suggestion.symbol, suggestion.type);
      if (priceData) {
        setPurchasePrice(priceData.price.toFixed(2));
      }
    } catch (error) {
      console.error("Error fetching price:", error);
    } finally {
      setIsFetchingPrice(false);
    }
  };

  useEffect(() => {
    if (editingInvestment) {
      setSymbol(editingInvestment.symbol);
      setName(editingInvestment.name);
      setType(editingInvestment.type);
      setVolume(editingInvestment.volume.toString());
      setPurchaseDate(new Date(editingInvestment.purchaseDate));
      setPurchasePrice(editingInvestment.purchasePrice.toString());
      setPurchaseCurrency(editingInvestment.purchaseCurrency || "USD");
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      setSymbol("");
      setName("");
      setType("stock");
      setVolume("");
      setPurchaseDate(undefined);
      setPurchasePrice("");
      setPurchaseCurrency("USD");
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [editingInvestment, open]);

  useEffect(() => {
    if (symbol.length >= 1) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        handleSymbolSearch(symbol);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [type, symbol, handleSymbolSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !name || !volume || !purchaseDate || !purchasePrice) {
      return;
    }

    onSubmit({
      symbol: symbol.toUpperCase(),
      name,
      type,
      volume: parseFloat(volume),
      purchaseDate: purchaseDate.getTime(),
      purchasePrice: parseFloat(purchasePrice),
      purchaseCurrency: purchaseCurrency,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-full min-w-[600px]"
        onClose={() => onOpenChange(false)}
      >
        <div className="p-6">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-lg font-semibold text-left">
              {editingInvestment ? "Edit Investment" : "Add Investment"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm">
                Type
              </Label>
              <Select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
                className="w-full"
              >
                <option value="stock">Stock</option>
                <option value="crypto">Crypto</option>
              </Select>
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="symbol" className="text-sm">
                Symbol
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={symbolInputRef}
                  id="symbol"
                  value={symbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="AAPL, BTC, etc."
                  className="pl-9 w-full"
                  required
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-accent text-sm flex flex-col"
                    >
                      <span className="font-medium">{suggestion.symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {isSearching && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-4 text-sm text-muted-foreground text-center">
                  Searching...
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apple Inc., Bitcoin, etc."
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume" className="text-sm">
                Volume
              </Label>
              <Input
                id="volume"
                type="number"
                step="0.00000001"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="1.5"
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate" className="text-sm">
                Purchase Date
              </Label>
              <Popover
                open={isCalendarOpen}
                onOpenChange={setIsCalendarOpen}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {purchaseDate ? (
                      format(purchaseDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                }
              >
                <div className="w-auto overflow-hidden p-0">
                  <Calendar
                    mode="single"
                    selected={purchaseDate}
                    onSelect={(date) => {
                      setPurchaseDate(date);
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) => date > new Date()}
                    className="rounded-lg border shadow-sm"
                    initialFocus
                  />
                </div>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="purchasePrice" className="text-sm">
                  Purchase Price
                </Label>
                {isFetchingPrice && (
                  <span className="text-xs text-muted-foreground">
                    Fetching price...
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="150.00"
                  className="flex-1"
                  required
                  disabled={isFetchingPrice}
                />
                <Select
                  id="purchaseCurrency"
                  value={purchaseCurrency}
                  onChange={(e) => setPurchaseCurrency(e.target.value as Currency)}
                  className="w-20"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="PLN">PLN</option>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingInvestment ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

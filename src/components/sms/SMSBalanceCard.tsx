import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { RefreshCw, DollarSign, Calendar } from "lucide-react";

interface SMSBalanceCardProps {
  compact?: boolean;
}

export const SMSBalanceCard: React.FC<SMSBalanceCardProps> = ({ compact = false }) => {
  const [balance, setBalance] = useState<{
    account_id: string;
    balance: number;
    currency: string;
    last_updated: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadBalance = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSMSBalanceIntegration();
      if (response.success && response.data) {
        setBalance(response.data);
      }
    } catch (error) {
      console.error("Failed to load SMS balance:", error);
      toast({
        title: "Failed to load balance",
        description: "Could not fetch SMS balance.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (compact) {
    return (
      <Card className="glass border-0">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <div className="animate-pulse bg-gray-200 h-4 w-24 rounded mb-1"></div>
                    <div className="animate-pulse bg-gray-200 h-3 w-16 rounded"></div>
                  </>
                ) : balance ? (
                  <>
                    <p className="text-xs sm:text-sm text-text-subtle">SMS Balance</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">
                      {balance.currency} {balance.balance.toFixed(2)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs sm:text-sm text-text-subtle">No balance data</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">--</p>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadBalance}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-foreground text-sm">SMS Balance</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadBalance}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-gray-200 h-12 w-full rounded"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
          </div>
        ) : balance ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-subtle mb-1">Account Balance</p>
              <p className="text-3xl font-bold text-foreground">
                {balance.currency} {balance.balance.toFixed(2)}
              </p>
              <Badge variant="secondary" className="text-xs mt-2">
                {balance.account_id}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-subtle">
              <Calendar className="w-3 h-3" />
              <span>Last updated: {formatDate(balance.last_updated)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-text-subtle">No balance data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


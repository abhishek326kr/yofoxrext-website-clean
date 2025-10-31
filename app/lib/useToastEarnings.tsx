import { useToast } from "@/hooks/use-toast";

export function useEarningToast() {
  const { toast } = useToast();
  
  return {
    showEarning: (amount: number, reason: string) => {
      toast({
        title: `+${amount} coins earned!`,
        description: reason,
        duration: 3000,
      });
    }
  };
}

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface UseProtectedActionReturn {
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  pendingAction: (() => void) | null;
  executeProtectedAction: (action: () => void) => void;
  executePendingAction: () => void;
}

export const useProtectedAction = (): UseProtectedActionReturn => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const executeProtectedAction = useCallback((action: () => void) => {
    if (user) {
      // User is logged in, execute action immediately
      action();
    } else {
      // User is not logged in, store action and show auth modal
      setPendingAction(() => action);
      setShowAuthModal(true);
    }
  }, [user]);

  const executePendingAction = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowAuthModal(false);
  }, [pendingAction]);

  return {
    showAuthModal,
    setShowAuthModal,
    pendingAction,
    executeProtectedAction,
    executePendingAction,
  };
};

import { X, CheckCircle } from "lucide-react";
import { useState } from "react";

type CancelConfirmationModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ success: boolean; message: string }>;
  message: string;
  clientName: string;
};

export function CancelConfirmationModal({
  open,
  onClose,
  onConfirm,
  message,
  clientName,
}: CancelConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!open) return null;

  const isConfirmValid = confirmText === "CONFIRM";

  async function handleConfirm() {
    if (isConfirmValid && !isProcessing) {
      setIsProcessing(true);
      const response = await onConfirm();
      setIsProcessing(false);
      setResult(response);
    }
  }

  function handleClose() {
    setConfirmText(""); // reset when closing
    setResult(null);
    setIsProcessing(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleClose}
    >
      <div
        className="rounded-xl border border-border bg-background p-6 shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Cancel Event</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* content */}
        <div className="space-y-4">
          {result ? (
            /* Success/Error Message */
            <>
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                <div className="flex items-start gap-3">
                  {result.success && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                  <p className="text-sm text-foreground">{result.message}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary w-full"
                onClick={handleClose}
              >
                OK
              </button>
            </>
          ) : (
            /* Confirmation Form */
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Client</p>
                <p className="font-medium text-foreground">{clientName}</p>
              </div>

              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-foreground">{message}</p>
              </div>

              <div>
                <label htmlFor="confirm-input" className="block text-sm font-medium text-foreground mb-2">
                  Type <span className="font-bold text-destructive">CONFIRM</span> to proceed
                </label>
                <input
                  id="confirm-input"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type CONFIRM"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                  disabled={isProcessing}
                />
              </div>

              {/* buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="btn-outline w-full"
                  onClick={handleClose}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!isConfirmValid || isProcessing}
                  className="btn-destructive w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Confirm Cancellation"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

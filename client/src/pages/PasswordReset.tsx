import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Copy, CheckCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PasswordReset() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const requestResetMutation = trpc.passwordReset.requestReset.useMutation({
    onSuccess: (data) => {
      setResetToken(data.token);
      toast.success("Password reset token generated!");
    },
    onError: (error) => {
      toast.error("Failed to generate reset token: " + error.message);
    },
  });

  const handleCopy = async () => {
    if (resetToken) {
      await navigator.clipboard.writeText(resetToken);
      setCopied(true);
      toast.success("Token copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const verifyTokenMutation = trpc.passwordReset.verifyToken.useQuery(
    { token: resetToken || "" },
    { enabled: !!resetToken && resetToken.length > 0 }
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-3 md:p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setLocation("/chat")}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <CardTitle>Password Reset</CardTitle>
              <CardDescription>
                Generate a password reset token
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Your email: <span className="text-foreground font-medium">{user?.email || "Not set"}</span></p>
          </div>

          {!resetToken ? (
            <Button
              onClick={() => requestResetMutation.mutate({})}
              disabled={requestResetMutation.isPending}
              className="w-full"
            >
              {requestResetMutation.isPending ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Generate Reset Token
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Input
                  value={resetToken}
                  readOnly
                  className="flex-1 bg-transparent border-0 text-sm"
                />
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Token expires in 24 hours. Keep this token safe.
              </p>
              {verifyTokenMutation.data && (
                <div className={`text-xs ${verifyTokenMutation.data.valid ? 'text-green-500' : 'text-destructive'}`}>
                  Token status: {verifyTokenMutation.data.valid ? "Valid" : "Invalid/Expired"}
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setResetToken(null);
                  requestResetMutation.mutate({});
                }}
                className="w-full"
              >
                Generate New Token
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

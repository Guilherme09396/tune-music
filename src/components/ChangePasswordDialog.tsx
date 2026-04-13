import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onDone: () => void;
}

export default function ChangePasswordDialog({ open, onDone }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Clear must_change_password flag
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ must_change_password: false }).eq("user_id", user.id);
      }

      toast.success("Senha alterada com sucesso!");
      onDone();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-card border-border/50 rounded-2xl" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Lock className="h-5 w-5 text-primary" />
            Alterar senha
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Você precisa definir uma nova senha para continuar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nova senha</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-muted/50 border-border/50 rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Confirmar senha</label>
            <Input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-muted/50 border-border/50 rounded-xl"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl">
            {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            Salvar nova senha
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

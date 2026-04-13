import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Shield, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function AdminPanel() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pw = "";
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const password = tempPassword || generatePassword();

    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email, password, name },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setCreatedInfo({ email, password });
      toast.success("Conta criada com sucesso!");
      setEmail("");
      setName("");
      setTempPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!createdInfo) return;
    navigator.clipboard.writeText(`Email: ${createdInfo.email}\nSenha temporária: ${createdInfo.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Credenciais copiadas!");
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Painel Admin</h2>
          <p className="text-sm text-muted-foreground">Criar contas de usuário</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome do usuário"
            required
            className="bg-muted/50 border-border/50 rounded-xl"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            required
            className="bg-muted/50 border-border/50 rounded-xl"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Senha temporária <span className="text-muted-foreground font-normal">(deixe vazio para gerar)</span>
          </label>
          <Input
            value={tempPassword}
            onChange={e => setTempPassword(e.target.value)}
            placeholder="Gerada automaticamente"
            minLength={6}
            className="bg-muted/50 border-border/50 rounded-xl"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full rounded-xl gap-2">
          <UserPlus className="h-4 w-4" />
          {loading ? "Criando..." : "Criar conta"}
        </Button>
      </form>

      {createdInfo && (
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">✅ Conta criada!</h3>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">Email: <span className="text-foreground font-medium">{createdInfo.email}</span></p>
            <p className="text-muted-foreground">Senha: <span className="text-foreground font-mono font-medium">{createdInfo.password}</span></p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">O usuário será solicitado a trocar a senha no primeiro login.</p>
          <Button variant="outline" size="sm" onClick={copyCredentials} className="mt-3 rounded-xl gap-2">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copiado!" : "Copiar credenciais"}
          </Button>
        </div>
      )}
    </div>
  );
}

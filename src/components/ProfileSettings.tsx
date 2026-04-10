import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, Save, ExternalLink } from "lucide-react";

export default function ProfileSettings() {
  const { profile, loading, updateProfile } = useProfile();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      username: username.trim().toLowerCase() || undefined,
      display_name: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const profileUrl = username ? `${window.location.origin}/profile/${username}` : null;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Seu Perfil</h2>
          <p className="text-sm text-muted-foreground">Configure seu perfil público</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_-]/gi, "").toLowerCase())}
            placeholder="seu-username"
            className="bg-muted/50 border-border/50 rounded-xl"
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground mt-1">Letras minúsculas, números, - e _ apenas</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Nome de exibição</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Seu nome"
            className="bg-muted/50 border-border/50 rounded-xl"
            maxLength={50}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Uma breve descrição sobre você..."
            className="bg-muted/50 border-border/50 rounded-xl resize-none"
            maxLength={200}
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>

        {profileUrl && (
          <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Seu perfil público:</p>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {profileUrl} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

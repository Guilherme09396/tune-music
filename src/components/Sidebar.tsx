import { useState } from "react";
import { Search, ListMusic, Plus, LogOut, Music2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PlaylistMeta {
  id: string;
  name: string;
}

interface SidebarProps {
  playlists: PlaylistMeta[];
  activeView: string;
  onViewChange: (view: string) => void;
  onCreatePlaylist: (name: string) => void;
}

export default function Sidebar({ playlists, activeView, onViewChange, onCreatePlaylist }: SidebarProps) {
  const { user, signOut } = useAuth();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (newName.trim()) {
      onCreatePlaylist(newName.trim());
      setNewName("");
      setCreating(false);
    }
  };

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-[hsl(var(--sidebar-background))] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 p-5 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Music2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-gradient">SoundFlow</span>
      </div>

      {/* Nav */}
      <nav className="space-y-1 px-3 mt-2">
        <button
          onClick={() => onViewChange("search")}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            activeView === "search" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Search className="h-4 w-4" />
          Buscar
        </button>
      </nav>

      {/* Playlists */}
      <div className="mt-6 flex-1 overflow-y-auto scrollbar-thin px-3">
        <div className="flex items-center justify-between mb-2 px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Suas Playlists
          </span>
          <button
            onClick={() => setCreating(true)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {creating && (
          <div className="mb-2 px-1">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome da playlist"
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              onBlur={() => { if (!newName.trim()) setCreating(false); }}
              autoFocus
              className="h-8 text-sm bg-card border-border"
            />
          </div>
        )}

        <div className="space-y-0.5">
          {playlists.map(pl => (
            <button
              key={pl.id}
              onClick={() => onViewChange(`playlist:${pl.id}`)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeView === `playlist:${pl.id}` ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <ListMusic className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{pl.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
            {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {user?.user_metadata?.name || user?.email?.split("@")[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button onClick={signOut} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

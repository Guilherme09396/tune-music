import { useState } from "react";
import { Search, ListMusic, Plus, LogOut, Music2, Clock, Home, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export interface PlaylistMeta {
  id: string;
  name: string;
}

interface SidebarProps {
  playlists: PlaylistMeta[];
  activeView: string;
  onViewChange: (view: string) => void;
  onCreatePlaylist: (name: string) => void | Promise<string>;
}

export default function Sidebar({ playlists, activeView, onViewChange, onCreatePlaylist }: SidebarProps) {
  const { user, signOut } = useAuth();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [playlistsOpen, setPlaylistsOpen] = useState(true);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreatePlaylist(newName.trim());
      setNewName("");
      setCreating(false);
    }
  };

  const navItems = [
    { id: "home", icon: Home, label: "Início" },
    { id: "search", icon: Search, label: "Buscar" },
    { id: "history", icon: Clock, label: "Histórico" },
  ];

  return (
    <aside className="flex w-[280px] flex-col bg-[hsl(var(--sidebar-background))] flex-shrink-0 border-r border-border/50">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary glow-primary-sm">
          <Music2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-gradient tracking-tight">SoundFlow</span>
      </div>

      {/* Nav */}
      <nav className="space-y-1 px-3 mt-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              activeView === item.id
                ? "bg-primary/10 text-primary glow-primary-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Separator */}
      <div className="mx-6 my-4 h-px bg-border/50" />

      {/* Playlists */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
        <button
          onClick={() => setPlaylistsOpen(!playlistsOpen)}
          className="flex items-center justify-between w-full mb-2 px-4 group"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
            Suas Playlists
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={e => { e.stopPropagation(); setCreating(true); }}
              className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>
            {playlistsOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </button>

        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-2 px-1 overflow-hidden"
            >
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nome da playlist"
                onKeyDown={e => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
                onBlur={() => { if (!newName.trim()) setCreating(false); }}
                autoFocus
                className="h-9 text-sm bg-muted/50 border-border/50 rounded-xl focus:ring-primary/30"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {playlistsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-0.5 overflow-hidden"
            >
              {playlists.length === 0 && (
                <p className="text-xs text-muted-foreground/60 px-4 py-3">Nenhuma playlist ainda</p>
              )}
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => onViewChange(`playlist:${pl.id}`)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${
                    activeView === `playlist:${pl.id}`
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <ListMusic className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{pl.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground/50">♫</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-sm font-bold text-primary ring-2 ring-primary/20">
            {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {user?.user_metadata?.name || user?.email?.split("@")[0]}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

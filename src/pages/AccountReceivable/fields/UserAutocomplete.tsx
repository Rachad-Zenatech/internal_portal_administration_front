import React, { useState, useRef, useEffect, useMemo } from "react";
import { useUsersList } from "@/hooks/usePurchasing";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, ChevronDown, Check, X, Search } from "lucide-react";

export interface UserOption {
  id: string;
  name?: string;
  full_name?: string;
  email?: string;
  department?: string;
  job_title?: string;
  role?: string;
  is_active?: boolean;
  [key: string]: any;
}

interface UserAutocompleteProps {
  value?: string | null;
  onChange: (value: string, user?: UserOption) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  roleHint?: string;
}

export function UserAutocomplete({
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "Select user...",
  roleHint,
}: UserAutocompleteProps) {
  const { data: users = [], isLoading } = useUsersList();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Find currently selected user
  const selectedUser = useMemo(() => {
    if (!value) return null;
    const valLower = value.trim().toLowerCase();
    return users.find((u: UserOption) => {
      const uName = (u.full_name || u.name || "").toLowerCase();
      const uEmail = (u.email || "").toLowerCase();
      return uName === valLower || uEmail === valLower || (u.id && u.id.toLowerCase() === valLower);
    }) || null;
  }, [value, users]);

  // Filtered options
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase().trim();
    return users.filter((u: UserOption) => {
      const name = (u.full_name || u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const dept = (u.department || "").toLowerCase();
      const title = (u.job_title || "").toLowerCase();
      return name.includes(q) || email.includes(q) || dept.includes(q) || title.includes(q);
    });
  }, [users, search]);

  const handleSelect = (user: UserOption) => {
    const displayName = user.full_name || user.name || user.email || "";
    onChange(displayName, user);
    setSearch("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredUsers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredUsers.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredUsers[highlightedIndex]) {
        handleSelect(filteredUsers[highlightedIndex]);
      } else if (filteredUsers.length === 1) {
        handleSelect(filteredUsers[0]);
      } else if (search.trim()) {
        // Custom name input allowed
        onChange(search.trim());
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const getUserInitials = (user: UserOption | null, fallbackText?: string | null) => {
    const name = user ? (user.full_name || user.name || user.email || "") : (fallbackText || "");
    if (!name) return "US";
    const parts = name.trim().split(/[\s._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger display */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between h-8 px-2.5 rounded-md border text-xs transition-colors cursor-pointer bg-background ${
          isOpen
            ? "border-primary ring-1 ring-primary/30"
            : "border-input hover:border-slate-400 dark:hover:border-zinc-600"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-muted" : ""}`}
      >
        {selectedUser ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">
              {getUserInitials(selectedUser)}
            </div>
            <span className="font-semibold text-foreground truncate text-xs">
              {selectedUser.full_name || selectedUser.name}
            </span>
            {selectedUser.department && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0 border-border text-muted-foreground hidden sm:inline-flex">
                {selectedUser.department}
              </Badge>
            )}
          </div>
        ) : value ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center text-[10px] font-bold shrink-0">
              {getUserInitials(null, value)}
            </div>
            <span className="font-semibold text-foreground truncate text-xs">
              {value}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{placeholder}</span>
          </span>
        )}

        <div className="flex items-center gap-1 ml-1.5 shrink-0 text-muted-foreground">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 hover:text-foreground rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? "transform rotate-180 text-primary" : ""
            }`}
          />
        </div>
      </div>

      {/* Popover list */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
          style={{ minWidth: "260px" }}
        >
          {/* Search box */}
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder="Search user name, email, department..."
                className="h-8 pl-8 pr-3 text-xs bg-background"
              />
            </div>
            {roleHint && (
              <div className="text-[10px] text-muted-foreground mt-1 px-1">
                Role hint: {roleHint}
              </div>
            )}
          </div>

          {/* User Options list */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-border/40 text-xs">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground text-xs">
                Loading users...
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user: UserOption, index: number) => {
                const isSelected = selectedUser?.id === user.id || (user.full_name || user.name) === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={user.id || user.email || index}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className={`w-full text-left p-2 rounded-md flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                      isHighlighted
                        ? "bg-accent text-accent-foreground"
                        : isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/70 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 flex items-center justify-center text-xs font-bold shrink-0 border border-border">
                        {getUserInitials(user)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate">
                          {user.full_name || user.name || user.email}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {user.email}
                          {user.job_title && ` • ${user.job_title}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {user.department && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border">
                          {user.department}
                        </Badge>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-primary ml-1" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center space-y-1">
                <div className="text-muted-foreground text-xs">No matching users found.</div>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(search.trim());
                      setIsOpen(false);
                    }}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    Use custom name "{search.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Leaf, User as UserIcon, LogOut, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, isOwner, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Chai<span className="text-primary">List</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {user ? (
            <>
              {isOwner && (
                <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              )}
              <Button asChild size="sm" variant="default" className="gap-1.5">
                <Link to="/shops/new">
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Add shop</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-xs">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isOwner && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">My shops</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface UserProfile {
  name: string;
  email: string;
  password?: string;
  orgName?: string;
  location?: string;
  teamSize?: string;
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (orgName: string, location: string, teamSize: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load active session on mount
    const activeSession = localStorage.getItem("wedora_active_session");

    if (activeSession) {
      setUser(JSON.parse(activeSession));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Try to login with Supabase Auth if configured
      if (isSupabaseConfigured()) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!authError && authData?.user) {
          // Attempt to fetch profile from public.users table
          const { data: profileData } = await supabase
            .from("users")
            .select("*, organizations(*)")
            .eq("email", email)
            .single();

          const loggedUser: UserProfile = {
            name: profileData?.full_name || authData.user.user_metadata?.full_name || email.split("@")[0],
            email: email,
            orgName: profileData?.organizations?.name || undefined,
            onboardingCompleted: !!profileData?.org_id,
          };

          localStorage.setItem("wedora_active_session", JSON.stringify(loggedUser));
          setUser(loggedUser);
          setIsLoading(false);
          return { success: true };
        }
      }

      // Always allow yoki@amara-wo.com / admin123 as an instant local demo user
      if (
        email.toLowerCase() === "yoki@amara-wo.com" &&
        password === "admin123"
      ) {
        const demoUser: UserProfile = {
          name: "Yoki Valianda",
          email: "yoki@amara-wo.com",
          password: "admin123",
          orgName: "Amara Wedding Organizer",
          location: "Palembang",
          teamSize: "1-5",
          onboardingCompleted: true,
        };
        localStorage.setItem("wedora_active_session", JSON.stringify(demoUser));
        setUser(demoUser);
        setIsLoading(false);
        return { success: true };
      }


      // 2. Fallback to localStorage registered users
      const usersRaw = localStorage.getItem("wedora_users");
      const users: UserProfile[] = usersRaw ? JSON.parse(usersRaw) : [];

      const foundUser = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (foundUser) {
        localStorage.setItem("wedora_active_session", JSON.stringify(foundUser));
        setUser(foundUser);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: "Email atau kata sandi tidak cocok." };
      }
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: "Terjadi kesalahan saat masuk." };
    }
  };


  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Try to register with Supabase Auth if configured
      if (isSupabaseConfigured()) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (authError) {
          setIsLoading(false);
          return { success: false, error: authError.message };
        }

        // Try to insert profile to public.users table (might fail if RLS policies are strict, so we wrap in try-catch)
        try {
          await supabase.from("users").insert({
            email,
            full_name: name,
            role: "owner",
          });
        } catch (e) {
          console.warn("Failed to insert into public.users table, continuing with auth user: ", e);
        }
      }

      // 2. Persist locally to localStorage as well
      const usersRaw = localStorage.getItem("wedora_users");
      const users: UserProfile[] = usersRaw ? JSON.parse(usersRaw) : [];

      const alreadyExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (alreadyExists && !isSupabaseConfigured()) {
        setIsLoading(false);
        return { success: false, error: "Email sudah terdaftar." };
      }

      const newUser: UserProfile = {
        name,
        email,
        password,
        onboardingCompleted: false,
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem("wedora_users", JSON.stringify(updatedUsers));
      localStorage.setItem("wedora_active_session", JSON.stringify(newUser));
      setUser(newUser);
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: "Gagal membuat akun." };
    }
  };

  const completeOnboarding = async (orgName: string, location: string, teamSize: string) => {
    if (!user) return;

    // 1. Try to insert organization and update user profile in Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: orgName,
            slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            plan: "professional",
          })
          .select()
          .single();

        if (orgData && !orgError) {
          // Update public.users table with the new org_id
          await supabase
            .from("users")
            .update({
              org_id: orgData.id,
            })
            .eq("email", user.email);
        }
      } catch (err) {
        console.warn("Supabase onboarding update failed, continuing with local persistence: ", err);
      }
    }

    const updatedUser = {
      ...user,
      orgName,
      location,
      teamSize,
      onboardingCompleted: true,
    };

    // Update active session
    localStorage.setItem("wedora_active_session", JSON.stringify(updatedUser));
    setUser(updatedUser);

    // Update in users list
    const usersRaw = localStorage.getItem("wedora_users");
    if (usersRaw) {
      const users: UserProfile[] = JSON.parse(usersRaw);
      const updatedUsers = users.map((u) =>
        u.email.toLowerCase() === user.email.toLowerCase() ? updatedUser : u
      );
      localStorage.setItem("wedora_users", JSON.stringify(updatedUsers));
    }
  };

  const logout = () => {
    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(console.error);
    }
    localStorage.removeItem("wedora_active_session");
    setUser(null);
    router.push("/login");
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return;

    // 1. Try to update user profile in Supabase
    if (isSupabaseConfigured()) {
      try {
        if (updated.name) {
          await supabase
            .from("users")
            .update({
              full_name: updated.name,
            })
            .eq("email", user.email);
        }

        if (updated.orgName) {
          // Fetch user's org_id first
          const { data: userData } = await supabase
            .from("users")
            .select("org_id")
            .eq("email", user.email)
            .single();

          if (userData?.org_id) {
            await supabase
              .from("organizations")
              .update({
                name: updated.orgName,
              })
              .eq("id", userData.org_id);
          }
        }
      } catch (err) {
        console.warn("Supabase profile update failed: ", err);
      }
    }

    const updatedUser = {
      ...user,
      ...updated,
    };

    // Update active session
    localStorage.setItem("wedora_active_session", JSON.stringify(updatedUser));
    setUser(updatedUser);

    // Update in users list
    const usersRaw = localStorage.getItem("wedora_users");
    if (usersRaw) {
      const users: UserProfile[] = JSON.parse(usersRaw);
      const updatedUsers = users.map((u) =>
        u.email.toLowerCase() === user.email.toLowerCase() ? updatedUser : u
      );
      localStorage.setItem("wedora_users", JSON.stringify(updatedUsers));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        completeOnboarding,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

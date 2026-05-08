"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface UserProfile {
  name: string;
  email: string;
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

// Simple localStorage credential store (email -> password) for fallback auth
const CREDENTIALS_KEY = "wedora_credentials";
const getCredentials = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(CREDENTIALS_KEY);
  return raw ? JSON.parse(raw) : {};
};
const saveCredential = (email: string, password: string) => {
  const creds = getCredentials();
  creds[email.toLowerCase()] = password;
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load active session on mount
    const activeSession = localStorage.getItem("wedora_active_session");

    if (activeSession) {
      try {
        setUser(JSON.parse(activeSession));
      } catch (e) {
        console.warn("Session data corrupt, clearing session:", e);
        localStorage.removeItem("wedora_active_session");
      }
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

      // Allow configurable demo user via env vars (never hardcode credentials in source)
      const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
      const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
      if (
        demoEmail &&
        demoPassword &&
        email.toLowerCase() === demoEmail.toLowerCase() &&
        password === demoPassword
      ) {
        const demoUser: UserProfile = {
          name: "Yoki Valianda",
          email: demoEmail,
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
      const creds = getCredentials();

      const foundUser = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && creds[email.toLowerCase()] === password
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
        onboardingCompleted: false,
      };
      saveCredential(email, password);

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
    setIsLoading(true);

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

    setIsLoading(false);
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

        if (updated.email) {
          await supabase
            .from("users")
            .update({
              email: updated.email,
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

    // Capture original email before mutation for correct localStorage lookup
    const originalEmail = user.email.toLowerCase();

    // Update active session
    localStorage.setItem("wedora_active_session", JSON.stringify(updatedUser));
    setUser(updatedUser);

    // Update in users list
    const usersRaw = localStorage.getItem("wedora_users");
    if (usersRaw) {
      const users: UserProfile[] = JSON.parse(usersRaw);
      const updatedUsers = users.map((u) =>
        u.email.toLowerCase() === originalEmail ? updatedUser : u
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

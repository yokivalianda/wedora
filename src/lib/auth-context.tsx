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
  plan?: "trial" | "starter" | "professional" | "agency";
  trialEndsAt?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  trialDaysLeft: number | null;
  isTrialExpired: boolean;
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

  // Compute trial days left from user profile
  const trialDaysLeft: number | null = (() => {
    if (!user?.trialEndsAt || user.plan !== "trial") return null;
    const diff = new Date(user.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const isTrialExpired: boolean =
    user?.plan === "trial" && trialDaysLeft !== null && trialDaysLeft <= 0;

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

          // Also check localStorage for onboarding status as fallback
          const usersRaw = localStorage.getItem("wedora_users");
          const localUsers: UserProfile[] = usersRaw ? JSON.parse(usersRaw) : [];
          const localUser = localUsers.find(
            (u) => u.email.toLowerCase() === email.toLowerCase()
          );

          const supabaseOnboarded = !!profileData?.org_id;
          const localOnboarded = !!localUser?.onboardingCompleted;

          const loggedUser: UserProfile = {
            name: profileData?.full_name || authData.user.user_metadata?.full_name || localUser?.name || email.split("@")[0],
            email: email,
            orgName: profileData?.organizations?.name || localUser?.orgName || undefined,
            location: localUser?.location || undefined,
            teamSize: localUser?.teamSize || undefined,
            onboardingCompleted: supabaseOnboarded || localOnboarded,
            plan: (profileData?.organizations?.plan as UserProfile["plan"]) ?? localUser?.plan ?? "trial",
            trialEndsAt: profileData?.organizations?.trial_ends_at ?? localUser?.trialEndsAt ?? null,
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
          name: "Demo",
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

        // After signUp, ensure we have an active session.
        // If Supabase auto-confirms email (no email verification), session is immediate.
        // If not, we sign in immediately after signup to get a session.
        if (authData?.user && !authData.session) {
          // No session = email confirmation might be required, try signing in
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            console.warn("Auto sign-in after register failed (email confirmation may be required):", signInError.message);
          }
        }

        // Insert profile to public.users table with auth.uid() as id so RLS policies work correctly
        const userId = authData?.user?.id;
        if (userId) {
          try {
            const { error: insertError } = await supabase.from("users").insert({
              id: userId,
              email,
              full_name: name,
              role: "owner",
            });
            if (insertError) {
              console.warn("Failed to insert into public.users table:", insertError.message);
              // If insert fails due to RLS, try upsert approach or log for debugging
              console.warn("User ID used:", userId);
            } else {
              console.log("[register] Successfully inserted user with id:", userId);
            }
          } catch (e) {
            console.warn("Failed to insert into public.users table, continuing with auth user: ", e);
          }
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

      // Set trial 14 hari dari sekarang
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const newUser: UserProfile = {
        name,
        email,
        onboardingCompleted: false,
        plan: "trial",
        trialEndsAt,
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
        // Get current auth user to use correct id
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          console.warn("[completeOnboarding] No authenticated user found in Supabase");
        }
        
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: orgName,
            slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            plan: "trial",
            trial_ends_at: trialEndsAt,
          })
          .select()
          .single();

        if (orgData && !orgError && authUser) {
          // First ensure the user row exists (it might not if register insert failed)
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("id", authUser.id)
            .single();

          if (!existingUser) {
            // User row doesn't exist yet, create it with org_id
            const { error: insertErr } = await supabase.from("users").insert({
              id: authUser.id,
              email: user.email,
              full_name: user.name,
              role: "owner",
              org_id: orgData.id,
            });
            if (insertErr) {
              console.warn("Failed to insert user during onboarding:", insertErr.message);
            } else {
              console.log("[completeOnboarding] Created user with org_id:", orgData.id);
            }
          } else {
            // User row exists, update org_id
            const { error: updateError } = await supabase
              .from("users")
              .update({
                org_id: orgData.id,
              })
              .eq("id", authUser.id);
            
            if (updateError) {
              console.warn("Failed to update user org_id:", updateError.message);
            } else {
              console.log("[completeOnboarding] Updated user org_id to:", orgData.id);
            }
          }
        } else if (orgError) {
          console.warn("Failed to create organization:", orgError.message);
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
      plan: user.plan ?? ("trial" as const),
      trialEndsAt: user.trialEndsAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Update active session
    localStorage.setItem("wedora_active_session", JSON.stringify(updatedUser));
    setUser(updatedUser);

    // Update in users list (add user if not already present)
    const usersRaw = localStorage.getItem("wedora_users");
    const users: UserProfile[] = usersRaw ? JSON.parse(usersRaw) : [];
    const existingIndex = users.findIndex(
      (u) => u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (existingIndex >= 0) {
      users[existingIndex] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    localStorage.setItem("wedora_users", JSON.stringify(users));

    setIsLoading(false);
  };

  const logout = () => {
    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(console.error);
    }
    localStorage.removeItem("wedora_active_session");
    // Clear wedding data keys to prevent data leaking between accounts
    localStorage.removeItem("wedora_projects");
    localStorage.removeItem("wedora_tasks");
    localStorage.removeItem("wedora_payments");
    localStorage.removeItem("wedora_vendors");
    localStorage.removeItem("wedora_documents");
    localStorage.removeItem("wedora_activities");
    localStorage.removeItem("wedora_timeline");
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
        trialDaysLeft,
        isTrialExpired,
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

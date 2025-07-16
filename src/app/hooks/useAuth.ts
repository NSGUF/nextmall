import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const login = async (email: string, password: string) => {
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        if (res?.error) throw new Error(res.error);
        router.replace("/");
    };

    const logout = () => signOut();

    return {
        session,
        status,
        login,
        logout,
    };
}
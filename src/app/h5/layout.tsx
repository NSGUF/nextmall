import "@/styles/globals.css";
import BottomNav from "./_components/BottomNav";

export default function H5Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <BottomNav />
        </>
    );
} 
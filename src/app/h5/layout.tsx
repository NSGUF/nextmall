import BottomNav from './_components/BottomNav';
import AdminGuard from '@/app/_components/AdminGuard';
import { ROLES } from '@/app/const/status';

export default function H5Layout({ children }: { children: React.ReactNode }) {
    return (
        <AdminGuard allowedRoles={[ROLES.NORMAL, ROLES.SUPERADMIN]}>
            {children}
            <BottomNav />
        </AdminGuard>
    );
}

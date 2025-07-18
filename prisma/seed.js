import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = process.env.FIRST_SUPERUSER;
    const password = process.env.FIRST_SUPERUSER_PASSWORD;
    console.log(email, password)
    if (!email || !password) {
        throw new Error('请在 .env 文件中设置 FIRST_SUPERUSER 和 FIRST_SUPERUSER_PASSWORD');
    }
    const hashed = await bcrypt.hash(password, 10);

    const exists = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
    if (!exists) {
        await prisma.user.create({
            data: {
                email,
                name: '超级管理员',
                password: hashed,
                role: 'SUPERADMIN',
                status: 1,
            },
        });
        console.log('超级管理员已创建:', email);
    } else {
        console.log('已存在超级管理员账号');
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(() => prisma.$disconnect());
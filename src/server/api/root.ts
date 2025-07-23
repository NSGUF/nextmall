import { postRouter } from '@/server/api/routers/post';
import { createCallerFactory, createTRPCRouter } from '@/server/api/trpc';
import { userRouter } from '@/server/api/routers/user';
import { bannerRouter } from '@/server/api/routers/banner';
import { categoryRouter } from '@/server/api/routers/category';
import { productRouter } from '@/server/api/routers/product';
import { collectionRouter } from '@/server/api/routers/collection';
import { courseRouter } from '@/server/api/routers/course';
import { addressRouter } from '@/server/api/routers/address';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    post: postRouter,
    user: userRouter,
    banner: bannerRouter,
    category: categoryRouter,
    product: productRouter,
    collection: collectionRouter,
    course: courseRouter,
    address: addressRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
